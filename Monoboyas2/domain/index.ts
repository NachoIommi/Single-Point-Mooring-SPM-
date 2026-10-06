// ─── Enums ──────────────────────────────────────────────────────────
export {
  EstadoOperacion,
  EstadoMonoboya,
  TipoSensor,
  TipoAlerta,
  OrigenMedicion,
  RolUsuario,
} from "./types/enums";

// ─── Interfaces / Types ─────────────────────────────────────────────
export type {
  ISensorDataProvider,
  IPublisher,
  ISubscriber,
  OperacionInfo,
  AlertaInfo,
  TelemetriaResultado,
  IMedicionRepository,
  IAlertaRepository,
  IOperacionRepository,
  IUsuarioAlertaRepository,
} from "./types/interfaces";

// ─── Entities ───────────────────────────────────────────────────────
export { Medicion } from "./entities/Medicion";
export { Alerta } from "./entities/Alerta";
export {
  Sensor,
  SensorDePresion,
  SensorDeAmarre,
  SensorDeOleaje,
  SensorDeTension,
  Anemometro,
  Correntometro,
  Caudalimetro,
  Giroscopio,
  construirSensor,
} from "./entities/Sensor";
export { Usuario } from "./entities/Usuario";
export { UsuarioOperador } from "./entities/UsuarioOperador";
export { Administrador } from "./entities/Administrador";
export { OperadorBuque } from "./entities/OperadorBuque";
export { OperadorLancha } from "./entities/OperadorLancha";
export { OperadorPlanta } from "./entities/OperadorPlanta";
export { Operacion } from "./entities/Operacion";
export { Monoboya } from "./entities/Monoboya";
export { Buque } from "./entities/Buque";
export { Planta } from "./entities/Planta";
export { CentralDatos } from "./entities/CentralDatos";

// ─── Messaging ──────────────────────────────────────────────────────
export { BrokerMQTT } from "./messaging/BrokerMQTT";
export { CentralDatosSubscriber } from "./messaging/CentralDatosSubscriber";
