import { apiFetch } from './api-client';
import type {
  Monoboya, Buque, Sensor, Operacion,
  Medicion, Alerta, Umbral, Planta,
  Paginated
} from './definitions';

// PLANTAS 
export async function fetchPlantas(): Promise<Planta[]> {
  return apiFetch<Planta[]>('/plantas');
}

export async function fetchPlanta(id: number): Promise<Planta> {
  return apiFetch<Planta>(`/plantas/${id}`);
}

//| MONOBOYAS 
export async function fetchMonoboyas(filtros?: {
  plantaId?: number;
  estado?: string;
}): Promise<Monoboya[]> {
  const params = new URLSearchParams();
  if (filtros?.plantaId) params.set('plantaId', String(filtros.plantaId));
  if (filtros?.estado)   params.set('estado', filtros.estado);
  const qs = params.size > 0 ? `?${params}` : '';
  return apiFetch<Monoboya[]>(`/monoboyas${qs}`);
}

export async function fetchMonoboya(id: number): Promise<Monoboya> {
  return apiFetch<Monoboya>(`/monoboyas/${id}`);
}

export async function fetchOperacionAsignada(dni: number): Promise<Operacion | null> {
  const lista = await apiFetch<Operacion[]>(`/operaciones/mis-operaciones?dni=${dni}`);
  return lista[0] ?? null;
}

//  BUQUES
export async function fetchBuques(): Promise<Buque[]> {
  return apiFetch<Buque[]>('/buques');
}

export async function fetchBuque(nroIMO: number): Promise<Buque> {
  return apiFetch<Buque>(`/buques/${nroIMO}`);
}

// SENSORES 
export async function fetchSensores(filtros?: {
  monoboyaId?: number;
  activo?: boolean;
}): Promise<Sensor[]> {
  const params = new URLSearchParams();
  if (filtros?.monoboyaId !== undefined) params.set('monoboyaId', String(filtros.monoboyaId));
  if (filtros?.activo !== undefined)     params.set('activo', String(filtros.activo));
  const qs = params.size > 0 ? `?${params}` : '';
  return apiFetch<Sensor[]>(`/sensores${qs}`);
}

// OPERACIONES
export async function fetchOperaciones(filtros?: {
  estado?: string;
  monoboyaId?: number;
  page?: number;
}): Promise<Paginated<Operacion>> {
  const params = new URLSearchParams();
  if (filtros?.estado)     params.set('estado', filtros.estado);
  if (filtros?.monoboyaId) params.set('monoboyaId', String(filtros.monoboyaId));
  if (filtros?.page)       params.set('page', String(filtros.page));
  const qs = params.size > 0 ? `?${params}` : '';
  return apiFetch<Paginated<Operacion>>(`/operaciones${qs}`);
}



export async function fetchOperacion(id: number): Promise<Operacion> {
  return apiFetch<Operacion>(`/operaciones/${id}`);
}

export async function fetchMedicionesDeOperacion(
  operacionId: number,
  filtros?: { sensorId?: string; desde?: string; hasta?: string; page?: number }
): Promise<Paginated<Medicion>> {
  const params = new URLSearchParams();
  if (filtros?.sensorId) params.set('sensorId', filtros.sensorId);
  if (filtros?.desde)    params.set('desde', filtros.desde);
  if (filtros?.hasta)    params.set('hasta', filtros.hasta);
  if (filtros?.page)     params.set('page', String(filtros.page));
  const qs = params.size > 0 ? `?${params}` : '';
  return apiFetch<Paginated<Medicion>>(`/operaciones/${operacionId}/mediciones${qs}`);
}

export async function fetchAlertasDeOperacion(operacionId: number): Promise<Alerta[]> {
  const res = await fetchAlertas({ operacionId }) as any;
  return Array.isArray(res) ? res : res?.data ?? [];
}

export async function fetchOpcionesPlanificacion(): Promise<{
  buques: { nroIMO: number; nombre: string; capacidad: number }[];
  plantas: { id: number; nombre: string }[];
  operadoresBuque: { dni: number; nombre: string }[];
  operadoresLancha: { dni: number; nombre: string }[];
}> {
  return apiFetch('/operaciones/opciones-planificacion');
}

// MEDICIONES 
export async function fetchMediciones(filtros?: {
  sensorId?: string;
  operacionId?: number;
  desde?: string;
  hasta?: string;
  page?: number;
}): Promise<Paginated<Medicion>> {
  const params = new URLSearchParams();
  if (filtros?.sensorId)    params.set('sensorId', filtros.sensorId);
  if (filtros?.operacionId) params.set('operacionId', String(filtros.operacionId));
  if (filtros?.desde)       params.set('desde', filtros.desde);
  if (filtros?.hasta)       params.set('hasta', filtros.hasta);
  if (filtros?.page)        params.set('page', String(filtros.page));
  const qs = params.size > 0 ? `?${params}` : '';
  return apiFetch<Paginated<Medicion>>(`/mediciones${qs}`);
}

// ALERTAS 
export async function fetchAlertas(filtros?: {
  tipo?: string;
  estado?: string;
  operacionId?: number;
  page?: number;
}): Promise<Paginated<Alerta>> {
  const params = new URLSearchParams();
  if (filtros?.tipo)        params.set('tipo', filtros.tipo);
  if (filtros?.estado)      params.set('estado', filtros.estado);
  if (filtros?.operacionId) params.set('operacionId', String(filtros.operacionId));
  if (filtros?.page)        params.set('page', String(filtros.page));
  const qs = params.size > 0 ? `?${params}` : '';
  return apiFetch<Paginated<Alerta>>(`/alertas${qs}`);
}

export async function fetchAlerta(id: number): Promise<Alerta> {
  return apiFetch<Alerta>(`/alertas/${id}`);
}

// UMBRALES 
export async function fetchUmbrales(tipoSensor?: string): Promise<Umbral[]> {
  const qs = tipoSensor ? `?tipoSensor=${tipoSensor}` : '';
  return apiFetch<Umbral[]>(`/configuracion/umbrales${qs}`);
}