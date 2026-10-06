import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const monoboyas = await prisma.monoboya.findMany();
  for (const m of monoboyas) {
    // Check if CAUDAL exists
    const caudal = await prisma.sensor.findFirst({ where: { monoboyaId: m.id, tipo: 'CAUDAL' } });
    if (!caudal) {
      await prisma.sensor.create({ data: { tipo: 'CAUDAL', unidad: 'm3/h', monoboyaId: m.id }});
    }
    const amarre = await prisma.sensor.findFirst({ where: { monoboyaId: m.id, tipo: 'AMARRE' } });
    if (!amarre) {
      await prisma.sensor.create({ data: { tipo: 'AMARRE', unidad: 't', monoboyaId: m.id }});
    }
  }
  console.log("Sensores faltantes agregados!");
}
fix().finally(() => prisma.$disconnect());
