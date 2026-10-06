import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/persistence/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dni = Number(body.dni);
    const password = body.password?.toString() || '';

    if (!dni || isNaN(dni)) {
      return NextResponse.json({ error: { message: 'DNI inválido.' } }, { status: 400 });
    }

    const usuarioDb = await prisma.usuario.findUnique({
      where: { dni }
    });

    if (!usuarioDb) {
      return NextResponse.json({ error: { message: 'Usuario no encontrado.' } }, { status: 404 });
    }

    if (usuarioDb.contrasena !== password) {
      return NextResponse.json({ error: { message: 'Contraseña incorrecta.' } }, { status: 401 });
    }

    const data = {
      token: 'jwt-falso-para-testear-nextjs',
      usuario: {
        id: usuarioDb.id,
        dni: usuarioDb.dni,
        nombre: usuarioDb.nombre,
        rol: usuarioDb.rol,
        plantaId: usuarioDb.plantaId,
        buqueNroIMO: usuarioDb.buqueNroIMO,
        creadoEn: new Date().toISOString()
      }
    };

    // Setear las cookies que el resto del front espera
    const cookieStore = await cookies();
    cookieStore.set('auth_token', data.token, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    });
    cookieStore.set('user_data', JSON.stringify(data.usuario), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: { message: error.message || 'Error interno del servidor.' } }, { status: 500 });
  }
}