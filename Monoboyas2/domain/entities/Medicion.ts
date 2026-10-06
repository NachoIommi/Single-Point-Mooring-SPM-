import { TipoSensor, OrigenMedicion } from "../types/enums";

/**
 * Value object que representa una lectura individual de un sensor.
 * Inmutable: una vez creado, no se modifica.
 */
export class Medicion {
  public readonly idSensor: number;
  public readonly valor: number;
  public readonly unidad: string;
  public readonly tipo: TipoSensor;
  public readonly origen: OrigenMedicion;
  public readonly idOperacion: number;
  public readonly timestamp: Date;

  constructor(
    idSensor: number,
    valor: number,
    unidad: string,
    tipo: TipoSensor,
    origen: OrigenMedicion,
    idOperacion: number,
  ) {
    this.idSensor = idSensor;
    this.valor = valor;
    this.unidad = unidad;
    this.tipo = tipo;
    this.origen = origen;
    this.idOperacion = idOperacion;
    this.timestamp = new Date();
  }
}
