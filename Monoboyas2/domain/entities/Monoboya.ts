import { EstadoMonoboya, OrigenMedicion } from "../types/enums";
import type { IPublisher } from "../types/interfaces";
import type { Sensor } from "./Sensor";
import type { Operacion } from "./Operacion";
import { Medicion } from "./Medicion";

/**
 * Punto de amarre (Single Point Mooring). Concentra los sensores y publica
 * las mediciones hacia la CentralDatos a través del broker.
 *
 * recolectarYTransmitirDatos() es invocado por el TelemetriaScheduler
 * cada 0.5–1 segundo mientras la operación está activa.
 *
 * La lógica de descuento de capacidad (sensor CAUDAL) ya NO vive aquí.
 * Ahora la maneja Operacion.descontarCapacidadBuque().
 */
export class Monoboya {
  public readonly id: number;
  private sensores: (Sensor | null)[];
  private contadorSensores: number;
  private operacion: Operacion | null;
  private publisher: IPublisher | null;
  private estado: EstadoMonoboya;

  constructor(
    id: number,
    capacidadMaxima: number,
    operacion: Operacion | null,
    publisher: IPublisher | null,
  ) {
    this.id = id;
    this.sensores = new Array(capacidadMaxima).fill(null);
    this.contadorSensores = 0;
    this.operacion = operacion;
    this.publisher = publisher;
    this.estado = EstadoMonoboya.DISPONIBLE;
  }

  /**
   * Itera cada sensor, le pide actualizarDato(), crea un Medicion
   * y lo publica al broker. El scheduler invoca esto periódicamente.
   */
  async recolectarYTransmitirDatos(): Promise<void> {
    if (!this.operacion || !this.publisher) return;

    await Promise.all(
      this.sensores
        .filter((s): s is Sensor => s !== null)
        .map((s) => s.actualizarDato())
    );

    for (const sensor of this.sensores) {
      if (sensor === null) continue;

      const medicion = new Medicion(
        sensor.id,
        sensor.valor,
        sensor.unidad,
        sensor.tipo,
        OrigenMedicion.MONOBOYA,
        this.operacion.id,
      );

      this.publisher.publicar(medicion);
    }
  }

  agregarSensor(sensor: Sensor): void {
    if (this.contadorSensores >= this.sensores.length) {
      console.error(
        `No hay más espacio para sensores en la monoboya ${this.id}`,
      );
      return;
    }
    this.sensores[this.contadorSensores] = sensor;
    this.contadorSensores++;
  }

  asignarOperacion(operacion: Operacion): void {
    this.operacion = operacion;
  }

  // ─── Getters / Estado ─────────────────────────────────────────────

  getEstado(): EstadoMonoboya { return this.estado; }

  setEstado(estado: EstadoMonoboya): void { this.estado = estado; }

  getSensores(): (Sensor | null)[] { return this.sensores; }

  getCantidadSensores(): number { return this.contadorSensores; }

  getOperacion(): Operacion | null { return this.operacion; }
}
