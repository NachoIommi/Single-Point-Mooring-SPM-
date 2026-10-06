import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/persistence/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const operacionId = req.nextUrl.searchParams.get('operacionId');
    const whereClause = operacionId ? { operacionId: Number(operacionId) } : {};
    
    const alertas = await prisma.alerta.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });
    
    return NextResponse.json(alertas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}