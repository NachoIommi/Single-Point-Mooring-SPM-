import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/persistence/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Obtenemos las últimas mediciones de la operación
    const mediciones = await prisma.medicion.findMany({
      where: { operacionId: Number(id) },
      orderBy: { timestamp: 'desc' },
      take: 600 // Suficiente para llenar los gráficos de 40 puntos x 8 sensores
    });
    
    return NextResponse.json(mediciones);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}