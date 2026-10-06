import type { Rol } from '@/app/lib/definitions';

// A qué ruta va cada rol al iniciar sesión
export const RUTA_INICIAL: Record<Rol, string> = {
  ADMIN:           '/dashboard/admin',
  OPERADOR_PLANTA: '/dashboard/planta',
  OPERADOR_BUQUE:  '/dashboard/buque',
  OPERADOR_LANCHA: '/dashboard/lancha',
};

// Qué roles pueden entrar a cada zona del dashboard
export const ACCESO_ZONA: Record<string, Rol[]> = {
  '/dashboard/admin':  ['ADMIN'],
  '/dashboard/planta': ['ADMIN', 'OPERADOR_PLANTA'],
  '/dashboard/buque':  ['OPERADOR_BUQUE'],
  '/dashboard/lancha': ['OPERADOR_LANCHA'],
};