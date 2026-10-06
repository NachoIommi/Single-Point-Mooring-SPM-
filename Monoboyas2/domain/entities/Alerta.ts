import { TipoAlerta } from "../types/enums";

/**
 * Entidad que representa una alerta generada por una anomalía detectada.
 *
 * Cada anomalía produce TRES instancias de Alerta (una por rol de operador)
 * con severidad potencialmente distinta según el rol.
 *
 * El reconocimiento NO vive aquí: se gestiona per-user en la tabla
 * usuario_alerta (campo reconocida). Este objeto solo contiene los datos
 * de la alerta en sí.
 */
export class Alerta {
  public id: number;
  public readonly tipoAlerta: TipoAlerta;
  public readonly mensaje: string;
  public readonly doubleMedicion: number;
  public readonly stringMedicion: string;
  public readonly timestamp: Date;

  constructor(
    tipoAlerta: TipoAlerta,
    mensaje: string,
    doubleMedicion: number,
    stringMedicion: string,
  ) {
    this.id = 0; // Lo asigna la BD al persistir
    this.tipoAlerta = tipoAlerta;
    this.mensaje = mensaje;
    this.doubleMedicion = doubleMedicion;
    this.stringMedicion = stringMedicion;
    this.timestamp = new Date();
  }
}
