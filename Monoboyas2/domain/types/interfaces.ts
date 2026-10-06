import type { Medicion } from "../entities/Medicion";
import type { Alerta } from "../entities/Alerta";

// ─── Sensores ───────────────────────────────────────────────────────

/** Proveedor de datos para un sensor concreto (archivo, API externa, mock). */
export interface ISensorDataProvider {
  obtenerDato(): Promise<number>;
}

// ─── Pub/Sub (emulación in-memory de MQTT) ──────────────────────────

export interface IPublisher {
  publicar(medicion: Medicion): void;
}

export interface ISubscriber {
  recibirMensaje(medicion: Medicion): void;
}

// ─── Puertos de persistencia (los implementará la capa de Prisma) ───

/** Info plana de una operación tal como viene de la BD. */
export interface OperacionInfo {
  id: number;
  estado: string;
  tipo: string | null;
  buqueNroIMO: number | null;
  plantaId: number | null;
  monoboyaId: number | null;
  operadorBuqueId: number | null;
  operadorLanchaId: number | null;
  operadorPlantaId: number | null;
}

/** Info plana de una alerta persistida. */
export interface AlertaInfo {
  id: number;
  tipoAlerta: string;
  mensaje: string;
  operacionId: number;
  medicionId: number;
  timestamp: Date;
}

/** Resultado devuelto por CentralDatos.procesarTelemetria(). */
export interface TelemetriaResultado {
  medicionId: number;
  alertas: AlertaInfo[];
}

// ─── Repository ports ───────────────────────────────────────────────

export interface IMedicionRepository {
  guardar(medicion: Medicion): Promise<number>;
}

export interface IAlertaRepository {
  guardar(alerta: Alerta, operacionId: number, medicionId: number): Promise<number>;
}

export interface IOperacionRepository {
  buscarPorId(id: number): Promise<OperacionInfo | null>;
  listarPorEstado(estado: string): Promise<OperacionInfo[]>;
  crear(operacion: Partial<OperacionInfo>): Promise<number>;
  actualizar(id: number, data: Partial<OperacionInfo>): Promise<void>;
}

export interface IUsuarioAlertaRepository {
  registrarRecepcion(alertaId: number, usuarioId: number): Promise<void>;
}
