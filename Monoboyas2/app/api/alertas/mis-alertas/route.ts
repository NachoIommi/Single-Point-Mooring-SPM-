import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/persistence/lib/prisma";

export async function GET() {
  try {
    const jar = await cookies();
    const userDataRaw = jar.get("user_data")?.value;
    
    let userId: number | undefined;
    if (userDataRaw) {
      try { userId = JSON.parse(userDataRaw).id; } catch {}
    }
    
    if (!userId) return NextResponse.json([], { status: 401 });

    // Buscamos la operación asignada actualmente al usuario (en curso o detenida)
    const operacionActiva = await prisma.operacion.findFirst({
      where: {
        OR: [
          { operadorPlantaId: userId },
          { operadorBuqueId: userId },
          { operadorLanchaId: userId }
        ],
        estado: { in: ['ENCURSO', 'DETENIDA'] }
      },
      orderBy: { id: 'desc' }
    });

    // Si no tiene operación activa, no mostramos alertas en su historial de operación actual
    if (!operacionActiva) {
      return NextResponse.json([]);
    }

    const alertasUsuario = await prisma.usuarioAlerta.findMany({
      where: { 
        usuarioId: userId,
        alerta: { operacionId: operacionActiva.id }
      },
      include: { 
        alerta: {
          include: { medicion: { include: { sensor: true } } }
        } 
      },
      orderBy: { alerta: { timestamp: 'desc' } }
    });

    const response = alertasUsuario.map(ua => ({
      ...ua.alerta,
      sensorId: ua.alerta.medicion?.sensor?.tipo || 'SISTEMA',
      generadaEn: ua.alerta.timestamp,
      estado: ua.reconocida ? 'RECONOCIDA' : 'PENDIENTE',
      reconocida: ua.reconocida,
      reconocidaEn: ua.reconocidaEn
    }));

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}