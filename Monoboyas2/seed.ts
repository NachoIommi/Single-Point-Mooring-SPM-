import { PrismaClient, TipoSensor, OrigenMedicion, TipoAlerta, EstadoOperacion } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando datos ficticios masivos...');

  // 1. Plantas
  const plantaNorte = await prisma.planta.create({
    data: { nombre: 'Planta Terminal Norte', ubicacion: 'Bahía Blanca' }
  });
  const plantaSur = await prisma.planta.create({
    data: { nombre: 'Refinería Sur', ubicacion: 'Comodoro Rivadavia' }
  });

  // 2. Monoboyas
  const monoboyas: any[] = [];
  for (let i = 1; i <= 5; i++) {
    const estado = i === 5 ? 'DESHABILITADA' : (i === 1 ? 'OCUPADA' : 'DISPONIBLE');
    monoboyas.push(await prisma.monoboya.create({
      data: { nombre: `Monoboya ${String.fromCharCode(64 + i)}`, estado: estado as any }
    }));
  }

  // 3. Buques
  const buques: any[] = [];
  const nombresBuques = ['Oceanic Explorer', 'Atlantic Voyager', 'Pacific Titan', 'Gulf Navigator', 'Nordic Spirit'];
  for (let i = 0; i < 5; i++) {
    buques.push(await prisma.buque.create({
      data: {
        nroIMO: 9000000 + Math.floor(Math.random() * 900000),
        nombre: nombresBuques[i],
        capacidadMax: 100000 + (i * 20000),
        capacidadActual: Math.floor(Math.random() * 80000)
      }
    }));
  }

  // 4. Usuarios (Operadores y Admin) - Exactamente 4 usuarios
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@spm.com' },
    update: {},
    create: { nombre: 'Laura (Admin)', email: 'admin@spm.com', rol: 'ADMIN', dni: 11111111, contrasena: '1234' }
  });
  const opPlanta = await prisma.usuario.upsert({
    where: { email: 'planta@spm.com' },
    update: {},
    create: { nombre: 'María (Planta)', email: 'planta@spm.com', rol: 'OPERADOR_PLANTA', dni: 22222222, contrasena: '1234', plantaId: plantaNorte.id }
  });
  const opBuque = await prisma.usuario.upsert({
    where: { email: 'buque@spm.com' },
    update: {},
    create: { nombre: 'Capitán Roberts', email: 'buque@spm.com', rol: 'OPERADOR_BUQUE', dni: 33333333, contrasena: '1234', buqueNroIMO: buques[0].nroIMO }
  });
  const opLancha = await prisma.usuario.upsert({
    where: { email: 'lancha@spm.com' },
    update: {},
    create: { nombre: 'Carlos (Lancha)', email: 'lancha@spm.com', rol: 'OPERADOR_LANCHA', dni: 44444444, contrasena: '1234' }
  });

  // 5. Sensores
  console.log('Configurando Sensores...');
  const sensores: any[] = [];
  const tiposSensores: TipoSensor[] = ['TENSION', 'PRESION', 'OLEAJE', 'ORIENTACION', 'CORRIENTE', 'VIENTO', 'CAUDAL', 'AMARRE'];

  // Sensores para monoboyas
  for (const m of monoboyas) {
    for (const tipo of tiposSensores) {
      let unidad = '';
      if (tipo === 'TENSION' || tipo === 'AMARRE') unidad = 't';
      else if (tipo === 'PRESION') unidad = 'bar';
      else if (tipo === 'VIENTO') unidad = 'km/h';
      else if (tipo === 'CAUDAL') unidad = 'm3/h';
      else if (tipo === 'CORRIENTE') unidad = 'kn';
      else if (tipo === 'OLEAJE') unidad = 'm';
      else if (tipo === 'ORIENTACION') unidad = '°';

      sensores.push(await prisma.sensor.create({
        data: {
          tipo,
          unidad,
          monoboyaId: m.id
        }
      }));
    }
  }

  // 6. Operaciones
  console.log('Creando historial de operaciones...');
  const operaciones: any[] = [];

  // Operación 1: EN CURSO (Muy activa, alertas recientes)
  operaciones.push(await prisma.operacion.create({
    data: {
      estado: 'ENCURSO',
      tipo: 'DESCARGA',
      buqueNroIMO: buques[0].nroIMO,
      plantaId: plantaNorte.id,
      monoboyaId: monoboyas[0].id,
      operadorBuqueId: opBuque.id,
      operadorPlantaId: opPlanta.id,
      operadorLanchaId: opLancha.id,
    }
  }));

  // Operación 2: PLANIFICADA
  operaciones.push(await prisma.operacion.create({
    data: {
      estado: 'PLANIFICADA',
      tipo: 'CARGA',
      buqueNroIMO: buques[1].nroIMO,
      plantaId: plantaSur.id,
      monoboyaId: monoboyas[1].id,
      operadorBuqueId: opBuque.id,
      operadorPlantaId: opPlanta.id,
    }
  }));

  // Operación 3: FINALIZADA (Historial pasado)
  operaciones.push(await prisma.operacion.create({
    data: {
      estado: 'FINALIZADA',
      tipo: 'DESCARGA',
      buqueNroIMO: buques[2].nroIMO,
      plantaId: plantaNorte.id,
      monoboyaId: monoboyas[2].id,
    }
  }));

  // Operación 4: DETENIDA (Por mal clima)
  operaciones.push(await prisma.operacion.create({
    data: {
      estado: 'DETENIDA',
      tipo: 'CARGA',
      buqueNroIMO: buques[3].nroIMO,
      plantaId: plantaSur.id,
      monoboyaId: monoboyas[3].id,
    }
  }));

  // 7. Mediciones y Alertas para la Operación EN CURSO
  console.log('Simulando miles de mediciones...');
  const opActiva = operaciones[0];
  const sensoresActivos = sensores.filter(s => s.monoboyaId === opActiva.monoboyaId);

  // Vamos a generar unas 100 mediciones hacia atrás en el tiempo
  let medicionPeligrosa = null;

  for (let i = 100; i >= 0; i--) {
    const timestamp = new Date(Date.now() - i * 60000); // Una por minuto

    for (const sensor of sensoresActivos) {
      let valorBase = 50;
      if (sensor.tipo === 'VIENTO') valorBase = 20 + Math.random() * 10;
      if (sensor.tipo === 'TENSION') valorBase = 100 + Math.random() * 50;

      // Generar un pico de tensión peligroso hace 5 minutos
      if (i === 5 && sensor.tipo === 'TENSION') {
        valorBase = 250; // Supera umbral crítico
      }

      const med = await prisma.medicion.create({
        data: {
          sensorId: sensor.id,
          valor: parseFloat(valorBase.toFixed(2)),
          unidad: sensor.unidad,
          tipo: sensor.tipo,
          origen: 'MONOBOYA',
          operacionId: opActiva.id,
          timestamp,
        }
      });

      if (i === 5 && sensor.tipo === 'TENSION') {
        medicionPeligrosa = med;
      }
    }
  }

  // 8. Crear alertas asociadas
  if (medicionPeligrosa) {
    console.log('Generando Alertas Críticas...');
    const alerta = await prisma.alerta.create({
      data: {
        tipoAlerta: 'ROJA',
        mensaje: 'Tensión crítica detectada en el cabo de amarre.',
        doubleMedicion: medicionPeligrosa.valor,
        stringMedicion: `${medicionPeligrosa.valor} kN`,
        operacionId: opActiva.id,
        medicionId: medicionPeligrosa.id,
        timestamp: medicionPeligrosa.timestamp
      }
    });

    // Asignar la alerta a los operadores
    await prisma.usuarioAlerta.createMany({
      data: [
        { alertaId: alerta.id, usuarioId: opPlanta.id, reconocida: false },
        { alertaId: alerta.id, usuarioId: opBuque.id, reconocida: true, reconocidaEn: new Date() }
      ]
    });
  }

  console.log('Base de datos poblada masivamente! Ya puedes revisar tu Dashboard.');
}

main()
  .catch((e) => {
    console.error('Error poblando DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });