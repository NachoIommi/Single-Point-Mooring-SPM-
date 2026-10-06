import { CentralDatos } from "@/domain/entities/CentralDatos";
import { BrokerMQTT } from "@/domain/messaging/BrokerMQTT";
import { CentralDatosSubscriber } from "@/domain/messaging/CentralDatosSubscriber";
import { Operacion } from "@/domain/entities/Operacion";
import { Buque } from "@/domain/entities/Buque";
import { Monoboya } from "@/domain/entities/Monoboya";

import { 
  MedicionRepository, 
  AlertaRepository, 
  OperacionRepository, 
  UsuarioAlertaRepository,
  SensorRepository
} from "@/persistence/lib/repositories";
import { prisma } from "@/persistence/lib/prisma";

// Instanciación de puertos de persistencia
const medicionRepo = new MedicionRepository();
const alertaRepo = new AlertaRepository();
const operacionRepo = new OperacionRepository();
const usuarioAlertaRepo = new UsuarioAlertaRepository();
const sensorRepo = new SensorRepository();

// Instanciación del dominio core
const centralDatos = new CentralDatos(medicionRepo, alertaRepo, operacionRepo, usuarioAlertaRepo);
const broker = new BrokerMQTT();

// El subscriber se auto-registra en el broker y despacha a centralDatos
new CentralDatosSubscriber(centralDatos, broker);

async function tick() {
  try {
    // 1. Obtener operaciones activas desde la BD (fuente de verdad)
    // Esto resuelve la desincronización si la API levanta una operación en otro proceso
    const activasInfo = await operacionRepo.listarPorEstado("ENCURSO");

    for (const opInfo of activasInfo) {
      // 2. Reconstruir Buque
      const bRow = await prisma.buque.findUnique({ where: { nroIMO: opInfo.buqueNroIMO! } });
      if (!bRow) continue;
      
      const sensoresBuque = await sensorRepo.obtenerPorBuque(bRow.nroIMO);
      const transmisorPresion = sensoresBuque.find(s => s.tipo === "PRESION") || null;
      
      const buque = new Buque(bRow.nroIMO, bRow.capacidadMax, bRow.nombre, transmisorPresion, broker);
      buque.descontarCapacidad(0); // Forzar que no descuente en el constructor, se actualizará despues.
      
      // 3. Reconstruir Operacion base
      const operacion = new Operacion(opInfo.id, buque, null, null);
      buque.setOperacion(operacion);

      // 4. Reconstruir Monoboya
      if (opInfo.monoboyaId) {
        const mRow = await prisma.monoboya.findUnique({ where: { id: opInfo.monoboyaId } });
        if (mRow) {
          // El 8 es un valor maximo de sensores asumido por defecto
          const monoboya = new Monoboya(mRow.id, 8, operacion, broker);
          const sensoresMono = await sensorRepo.obtenerPorMonoboya(mRow.id);
          for (const s of sensoresMono) monoboya.agregarSensor(s);
          
          operacion.asignarMonoboya(monoboya);
        }
      }

      // IMPORTANTE: En memoria, CentralDatos no necesita que iniciemos la operacion explicitly si
      // solo estamos usando las entidades para que disparen telemetría. CentralDatos usa el opInfo de la BD.

      // 5. Emitir telemetría de esta iteración (cada iteración = 1 "tick" de simulación)
      // Esto publicará al broker -> CentralDatosSubscriber -> CentralDatos.procesarTelemetria
      if (operacion.getMonoboya()) await operacion.getMonoboya()!.recolectarYTransmitirDatos();
      await operacion.getBuque().recolectarYTransmitirDatos();

      // 6. Simular descuento de capacidad (Regla de negocio asignada a Operacion)
      // Descontamos un valor de caudal fijo para simular el paso de 1 segundo
      // (En la realidad esto se ataría al valor del sensor CAUDAL)
      operacion.descontarCapacidadBuque(1600); // 1600 litros / s 
    }
    
    // Imprimir un puntito en la consola para saber que está vivo
    if (activasInfo.length > 0) {
      process.stdout.write('🟢 ');
    } else {
      process.stdout.write('⚪ ');
    }
    
  } catch (error) {
    console.error("[Scheduler] Error en el ciclo de telemetría:", error);
  }
}

console.log("Iniciando Worker de Scheduler de Telemetría (1 seg)...");
setInterval(tick, 1000);
