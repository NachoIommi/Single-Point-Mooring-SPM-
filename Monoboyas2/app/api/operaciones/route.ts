import { NextResponse } from "next/server";
import { operacionService } from "@/services";
import { prisma } from "@/persistence/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const page = Number(searchParams.get('page')) || 1;
    const limit = 10;

    const where = estado ? { estado: estado as any } : {};
    
    const [data, total] = await Promise.all([
      prisma.operacion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' }
      }),
      prisma.operacion.count({ where })
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.buqueNroIMO || !body.plantaId || !body.tipo) {
      return NextResponse.json({ error: "Faltan datos requeridos (buqueNroIMO, plantaId, tipo)" }, { status: 400 });
    }

    const newOpId = await operacionService.planificarOperacion(body.buqueNroIMO, body.plantaId, body.tipo);
    
    return NextResponse.json({ success: true, id: newOpId, estado: "PLANIFICADA" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
