import { TipoSensor } from "../types/enums";
import type { ISensorDataProvider } from "../types/interfaces";

/**
 * Clase abstracta base para todos los sensores.
 *
 * Cada sensor tiene un proveedor de datos (ISensorDataProvider) que puede
 * ser un archivo, una API externa o un mock. El sensor no sabe de dónde
 * vienen los datos — solo los lee y actualiza su estado interno.
 */
export abstract class Sensor {
  public readonly id: number;
  public readonly tipo: TipoSensor;
  public readonly unidad: string;
  public activo: boolean;
  public ultimaMedicion: Date | null;
  public valor: number;

  protected dataProvider: ISensorDataProvider;

  constructor(
    id: number,
    tipo: TipoSensor,
    unidad: string,
    dataProvider: ISensorDataProvider,
  ) {
    this.id = id;
    this.tipo = tipo;
    this.unidad = unidad;
    this.dataProvider = dataProvider;
    this.activo = true;
    this.valor = 0.0;
    this.ultimaMedicion = null;
  }

  /**
   * Solicita un nuevo dato al proveedor y actualiza el estado interno.
   * No genera un objeto Medicion — eso lo hace quien recolecta (Monoboya/Buque).
   */
  async actualizarDato(): Promise<void> {
    if (!this.activo || !this.dataProvider) return;

    try {
      this.valor = await this.dataProvider.obtenerDato();
      this.ultimaMedicion = new Date();
    } catch (error) {
      console.error(
        `[SENSOR] ${this.tipo} (ID=${this.id}) error al leer dato:`,
        error,
      );
      // Mantiene el último valor conocido
    }
  }
}

// ─── Subclases concretas ────────────────────────────────────────────
// Cada una fija el TipoSensor y la unidad correspondiente.

export class SensorDePresion extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.PRESION, "Pa", dataProvider);
  }
}

export class SensorDeAmarre extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.AMARRE, "kN", dataProvider);
  }
}

export class SensorDeOleaje extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.OLEAJE, "m", dataProvider);
  }
}

export class SensorDeTension extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.TENSION, "tf", dataProvider);
  }
}

export class Anemometro extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.VIENTO, "km/h", dataProvider);
  }
}

export class Correntometro extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.CORRIENTE, "m/s", dataProvider);
  }
}

export class Caudalimetro extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.CAUDAL, "l/s", dataProvider);
  }
}

export class Giroscopio extends Sensor {
  constructor(id: number, dataProvider: ISensorDataProvider) {
    super(id, TipoSensor.ORIENTACION, "°", dataProvider);
  }
}

// ─── Factory helper ─────────────────────────────────────────────────
// Equivalente al switch de SensorDAO.construirSensor() en Java.
// La capa de persistencia lo usa para reconstruir objetos de dominio.

export function construirSensor(
  id: number,
  tipo: string,
  dataProvider: ISensorDataProvider,
): Sensor | null {
  switch (tipo) {
    case "PRESION":     return new SensorDePresion(id, dataProvider);
    case "AMARRE":      return new SensorDeAmarre(id, dataProvider);
    case "OLEAJE":      return new SensorDeOleaje(id, dataProvider);
    case "TENSION":     return new SensorDeTension(id, dataProvider);
    case "VIENTO":      return new Anemometro(id, dataProvider);
    case "CAUDAL":      return new Caudalimetro(id, dataProvider);
    case "CORRIENTE":   return new Correntometro(id, dataProvider);
    case "ORIENTACION": return new Giroscopio(id, dataProvider);
    default:            return null;
  }
}
