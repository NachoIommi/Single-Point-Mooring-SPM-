import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/persistence/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const monoboyaId = req.nextUrl.searchParams.get('monoboyaId');

    const where: any = {};
    if (monoboyaId) where.monoboyaId = Number(monoboyaId);

    const sensores = await prisma.sensor.findMany({ where });
    return NextResponse.json(sensores);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}