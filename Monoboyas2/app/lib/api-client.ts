import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// Tipo para los errores que devuelve tu backend
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Función central — todas las llamadas al backend pasan por acá
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Leer el JWT del cookie (solo funciona en Server Components y Server Actions)
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store', // no cachear respuestas dinámicas
  });

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `HTTP ${res.status}`;

    try {
      const body = await res.json();
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // el body no era JSON, dejamos los valores por default
    }

    throw new ApiError(res.status, code, message);
  }

  // 204 No Content: no hay body para parsear
  if (res.status === 204) return undefined as T;

  return res.json();
}