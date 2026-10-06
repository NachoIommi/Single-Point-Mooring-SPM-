'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { apiFetch, ApiError } from './api-client';
import type { Usuario } from './definitions';

type LoginResponse = {
  token: string;
  usuario: Usuario;
};

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {

  const dni = Number(formData.get('dni') ?? formData.get('username'));
  const password = formData.get('password')?.toString() ?? '';

  if (!dni || isNaN(dni)) return 'El DNI debe ser un número válido';
  if (!password)          return 'La contraseña es requerida';

  try {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ dni, password }),
    });

    const cookieStore = await cookies();

    cookieStore.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    cookieStore.set('user_data', JSON.stringify(data.usuario), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) return 'DNI o contraseña incorrectos';
      if (err.status === 400) return 'Datos inválidos';
      return `Error del servidor: ${err.message}`;
    }
    return 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.';
  }

  redirect('/dashboard');
}


export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('user_data');
  redirect('/');
}

export async function getUsuarioActual(): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('user_data')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}