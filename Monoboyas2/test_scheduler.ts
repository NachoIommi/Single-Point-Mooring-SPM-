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

const medicionRepo = new MedicionRepository();
const alertaRepo = new AlertaRepository();
const operacionRepo = new OperacionRepository();
const usuarioAlertaRepo = new UsuarioAlertaRepository();
const sensorRepo = new SensorRepository();

const centralDatos = new CentralDatos(medicionRepo, alertaRepo, operacionRepo, usuarioAlertaRepo);
const broker = new BrokerMQTT();
new CentralDatosSubscriber(centralDatos, broker);

async function testTick() {
  try {
    const activasInfo = await operacionRepo.listarPorEstado("ENCURSO");
    console.log("Operaciones activas:", activasInfo.length);

    for (const opInfo of activasInfo) {
      const bRow = await prisma.buque.findUnique({ where: { nroIMO: opInfo.buqueNroIMO! } });
      if (!bRow) {
        console.log("No buque found for", opInfo.buqueNroIMO);
        continue;
      }
      
      const sensoresBuque = await sensorRepo.obtenerPorBuque(bRow.nroIMO);
      const transmisorPresion = sensoresBuque.find(s => s.tipo === "PRESION") || null;
      
      const buque = new Buque(bRow.nroIMO, bRow.capacidadMax, bRow.nombre, transmisorPresion, broker);
      buque.descontarCapacidad(0);
      
      const operacion = new Operacion(opInfo.id, buque, null, null);
      buque.setOperacion(operacion);

      if (opInfo.monoboyaId) {
        const mRow = await prisma.monoboya.findUnique({ where: { id: opInfo.monoboyaId } });
        if (mRow) {
          const monoboya = new Monoboya(mRow.id, 8, operacion, broker);
          const sensoresMono = await sensorRepo.obtenerPorMonoboya(mRow.id);
          for (const s of sensoresMono) monoboya.agregarSensor(s);
          operacion.asignarMonoboya(monoboya);
          console.log("Monoboya asignada. Sensores:", sensoresMono.length);
        }
      } else {
        console.log("NO monoboya ID in opInfo");
      }

      console.log("Recolectando de Monoboya...");
      if (operacion.getMonoboya()) await operacion.getMonoboya()!.recolectarYTransmitirDatos();
      console.log("Recolectando de Buque...");
      await operacion.getBuque().recolectarYTransmitirDatos();

      operacion.descontarCapacidadBuque(1600);
      console.log("Tick completed successfully for operation", opInfo.id);
    }
  } catch (error) {
    console.error("Test tick error:", error);
  } finally {
    process.exit(0);
  }
}

testTick();
