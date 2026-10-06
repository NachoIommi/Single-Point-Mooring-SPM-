// ─── Estados ────────────────────────────────────────────────────────

export enum EstadoOperacion {
  PLANIFICADA = "PLANIFICADA",
  ENCURSO     = "ENCURSO",
  DETENIDA    = "DETENIDA",
  FINALIZADA  = "FINALIZADA",
}

export enum EstadoMonoboya {
  OCUPADA      = "OCUPADA",
  DISPONIBLE   = "DISPONIBLE",
  DESHABILITADA = "DESHABILITADA",
}

// ─── Sensores ───────────────────────────────────────────────────────

export enum TipoSensor {
  TENSION     = "TENSION",
  PRESION     = "PRESION",
  OLEAJE      = "OLEAJE",
  ORIENTACION = "ORIENTACION",
  CORRIENTE   = "CORRIENTE",
  CAUDAL      = "CAUDAL",
  VIENTO      = "VIENTO",
  AMARRE      = "AMARRE",
}

export enum OrigenMedicion {
  MONOBOYA = "MONOBOYA",
  BUQUE    = "BUQUE",
}

// ─── Alertas ────────────────────────────────────────────────────────

export enum TipoAlerta {
  VERDE    = "VERDE",
  AMARILLA = "AMARILLA",
  ROJA     = "ROJA",
}

// ─── Usuarios ───────────────────────────────────────────────────────

export enum RolUsuario {
  ADMIN           = "ADMIN",
  OPERADOR_BUQUE  = "OPERADOR_BUQUE",
  OPERADOR_LANCHA = "OPERADOR_LANCHA",
  OPERADOR_PLANTA = "OPERADOR_PLANTA",
}
