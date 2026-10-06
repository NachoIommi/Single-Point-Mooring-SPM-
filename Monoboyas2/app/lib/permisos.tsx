import type { Rol } from '@/app/lib/definitions';

export type Permiso =
  | 'ver_dashboard_completo'
  | 'gestionar_usuarios'
  | 'gestionar_entidades'
  | 'configurar_umbrales'
  | 'gestionar_operaciones'
  | 'reconocer_alertas'
  | 'recibir_alertas'
  | 'recibir_alertas_criticas'
  | 'ver_operacion';

const PERMISOS: Record<Rol, Permiso[]> = {
  ADMIN: [
    'ver_dashboard_completo',
    'gestionar_usuarios',
    'gestionar_entidades',
    'configurar_umbrales',
    'gestionar_operaciones',
    'reconocer_alertas',
  ],
  OPERADOR_PLANTA: [
    'ver_dashboard_completo',
    'gestionar_operaciones',
    'reconocer_alertas',
    'recibir_alertas',
  ],
  OPERADOR_BUQUE: [
    'ver_operacion',
    'recibir_alertas',
    'reconocer_alertas',
  ],
  OPERADOR_LANCHA: [
    'recibir_alertas_criticas',
  ],
};

export function puede(rol: Rol, permiso: Permiso): boolean {
  return PERMISOS[rol]?.includes(permiso) ?? false;
}