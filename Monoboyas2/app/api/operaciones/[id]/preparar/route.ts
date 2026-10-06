import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/persistence/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.monoboyaId || !body.operadorLanchaDni) {
      return NextResponse.json({ error: 'Falta monoboyaId o operadorLanchaDni' }, { status: 400 });
    }

    // Buscamos al operador de lancha por su DNI para obtener su ID
    const lanchaUser = await prisma.usuario.findUnique({
      where: { dni: Number(body.operadorLanchaDni) }
    });

    if (!lanchaUser) {
      return NextResponse.json({ error: 'Operador de lancha no encontrado.' }, { status: 404 });
    }

    // Buscamos al operador de planta que está logueado para asignárselo a la operación
    const cookieStore = await cookies();
    const rawUser = cookieStore.get('user_data')?.value;
    const user = rawUser ? JSON.parse(rawUser) : null;
    const operadorPlantaId = user?.id || null;

    // Actualizamos la operación en Prisma
    const operacionActualizada = await prisma.operacion.update({
      where: { id: Number(id) },
      data: {
        monoboyaId: Number(body.monoboyaId),
        operadorLanchaId: lanchaUser.id,
        operadorPlantaId: operadorPlantaId,
        estado: 'ENCURSO'
      }
    });

    // Marcamos la monoboya como OCUPADA
    await prisma.monoboya.update({
      where: { id: Number(body.monoboyaId) },
      data: { estado: 'OCUPADA' }
    });

    return NextResponse.json(operacionActualizada);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}