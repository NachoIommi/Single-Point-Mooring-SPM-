import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Usuario, Rol } from '@/app/lib/definitions';
import { RUTA_INICIAL, ACCESO_ZONA } from '@/app/lib/roles';

function leerRol(request: NextRequest): Rol | null {
  const raw = request.cookies.get('user_data')?.value;
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as Usuario).rol;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const estaEnLogin     = pathname === '/';
  const estaEnDashboard = pathname.startsWith('/dashboard');

  // 1) Sin token en el dashboard → login
  if (estaEnDashboard && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2) Logueado y parado en el login → a su zona
  if (estaEnLogin && token) {
    const rol = leerRol(request);
    if (rol) {
      return NextResponse.redirect(new URL(RUTA_INICIAL[rol], request.url));
    }
    // token pero sin user_data válido: lo dejamos en el login para re-loguear
    return NextResponse.next();
  }

  // 3) Logueado dentro del dashboard → validar rol vs zona
  if (estaEnDashboard && token) {
    const rol = leerRol(request);
    if (!rol) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // /dashboard exacto → repartir a la zona del rol
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL(RUTA_INICIAL[rol], request.url));
    }

    // En una zona que no le corresponde → mandarlo a la suya
    const zona = Object.keys(ACCESO_ZONA).find((z) => pathname.startsWith(z));
    if (zona && !ACCESO_ZONA[zona].includes(rol)) {
      return NextResponse.redirect(new URL(RUTA_INICIAL[rol], request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};