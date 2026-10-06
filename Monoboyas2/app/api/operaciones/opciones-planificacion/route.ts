import { NextResponse } from "next/server";
import { prisma } from "@/persistence/lib/prisma";

export async function GET() {
  try {
    const [buques, plantas, operadores] = await Promise.all([
      prisma.buque.findMany(),
      prisma.planta.findMany(),
      prisma.usuario.findMany({
        where: { rol: { in: ['OPERADOR_BUQUE', 'OPERADOR_LANCHA'] } }
      })
    ]);

    return NextResponse.json({
      buques: buques.map(b => ({ nroIMO: b.nroIMO, nombre: b.nombre, capacidad: b.capacidadMax })),
      plantas: plantas.map(p => ({ id: p.id, nombre: p.nombre })),
      operadoresBuque: operadores.filter(o => o.rol === 'OPERADOR_BUQUE').map(o => ({ dni: o.dni, nombre: o.nombre })),
      operadoresLancha: operadores.filter(o => o.rol === 'OPERADOR_LANCHA').map(o => ({ dni: o.dni, nombre: o.nombre }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
