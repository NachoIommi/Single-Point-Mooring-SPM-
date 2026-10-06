export type Usuario = {
  dni: number;
  nombre: string;
  rol: 'ADMIN' | 'OPERADOR_PLANTA' | 'OPERADOR_BUQUE' | 'OPERADOR_LANCHA';
  plantaId: number | null;
  buqueNroIMO: number | null;
  operacionId: number | null;
  creadoEn: string;
};


export type Monoboya = {
  id: number;
  estado: 'DISPONIBLE' | 'EN_OPERACION' | 'MANTENIMIENTO' | 'FUERA_DE_SERVICIO';
  plantaId: number;
  capacidadMaximaSensores: number;
  cantidadSensoresInstalados: number;
};

export type Buque = {
  nroIMO: number;
  nombre: string;
  capacidad: number;
};

export type Sensor = {
  id: number;
  tipo: 'TENSION' | 'PRESION' | 'OLEAJE' | 'ORIENTACION' | 'CORRIENTE' | 'CAUDAL' | 'VIENTO' | 'AMARRE';
  unidad: string;
  activo: boolean;
  monoboyaId: number ;
};

export type Operacion = {
  id: number;
  estado: 'PLANIFICADA' | 'PREPARADA' | 'ACTIVA' | 'PAUSADA' | 'FINALIZADA';
  tipo: 'CARGA' | 'DESCARGA';
  monoboyaId: number | null;
  buqueNroIMO: number | null;
  operadorLanchaId: number | null;
  operadorBuqueId: number | null;
  operadorPlantaId: number | null;
  plantaId: number | null;
};

export type Medicion = {
  id: number;
  sensorId: number;
  valor: number;
  unidad: string;
  timestamp: string;
  operacionId: number | null;
};

export type Alerta = {
  id: number;
  tipo: 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA';
  mensaje: string;
  operacionId: number;
  sensorId: string | null;
  valorMedicion: number | null;
  estado: 'PENDIENTE' | 'RECONOCIDA' | 'RESUELTA';
  generadaEn: string;
  reconocidaPorDni: number | null;
  reconocidaEn: string | null;
};

export type Umbral = {
  id: number;
  tipoSensor: 'ANEMOMETRO' | 'CAUDALIMETRO' | 'CORRENTOMETRO' | 'GIROSCOPIO'
            | 'SENSOR_DISTANCIA' | 'SENSOR_OLEAJE' | 'SENSOR_PRESION' | 'SENSOR_TENSION';
  valorMinAdvertencia: number;
  valorMaxAdvertencia: number;
  valorMinCritico: number;
  valorMaxCritico: number;
  unidad: string;
  actualizadoEn: string;
  actualizadoPorDni: number;
};

export type Planta = {
  id: number;
  nombrePlanta: string;
};

// ─── Tipos auxiliares ─────────────────────────────────────────────
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  pagination: Pagination;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: string;
  };
};
export type Rol = Usuario['rol'];
