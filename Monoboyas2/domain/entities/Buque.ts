import { OrigenMedicion } from "../types/enums";
import type { IPublisher } from "../types/interfaces";
import type { Sensor } from "./Sensor";
import type { Operacion } from "./Operacion";
import { Medicion } from "./Medicion";

/**
 * Buque (barco) que participa en la transferencia de hidrocarburos.
 *
 * Tiene un único sensor de presión (transmisorPresion) cuyas mediciones
 * publica al broker de la misma forma que la Monoboya.
 *
 * La capacidad se descuenta desde Operacion.descontarCapacidadBuque()
 * (no desde Monoboya, que era la ubicación anterior).
 */
export class Buque {
  public readonly nroIMO: number;
  public readonly nombre: string;
  private capacidad: number;
  private capacidadRestante: number;
  private transmisorPresion: Sensor | null;
  private publisher: IPublisher | null;
  private operacion: Operacion | null;

  constructor(
    nroIMO: number,
    capacidad: number,
    nombre: string,
    transmisorPresion: Sensor | null,
    publisher: IPublisher | null,
    operacion: Operacion | null = null,
  ) {
    this.nroIMO = nroIMO;
    this.capacidad = capacidad;
    this.capacidadRestante = capacidad;
    this.nombre = nombre;
    this.transmisorPresion = transmisorPresion;
    this.publisher = publisher;
    this.operacion = operacion;
  }

  /**
   * Recolecta dato del sensor de presión y lo publica al broker.
   * Invocado por el scheduler junto con monoboya.recolectarYTransmitirDatos().
   */
  async recolectarYTransmitirDatos(): Promise<void> {
    if (!this.transmisorPresion || !this.publisher || !this.operacion) return;

    await this.transmisorPresion.actualizarDato();

    const medicion = new Medicion(
      this.transmisorPresion.id,
      this.transmisorPresion.valor,
      this.transmisorPresion.unidad,
      this.transmisorPresion.tipo,
      OrigenMedicion.BUQUE,
      this.operacion.id,
    );

    this.publisher.publicar(medicion);
  }

  /**
   * Descuenta litros transferidos de la capacidad restante.
   * Llamado por Operacion.descontarCapacidadBuque().
   */
  descontarCapacidad(litrosTransferidos: number): void {
    const litrosEnteros = Math.round(litrosTransferidos);
    this.capacidadRestante -= litrosEnteros;
  }

  finalizoDescarga(): boolean {
    return this.capacidadRestante <= 0;
  }

  // ─── Getters / Setters ────────────────────────────────────────────

  getNroIMO(): number { return this.nroIMO; }

  getCapacidad(): number { return this.capacidad; }

  getCapacidadRestante(): number { return this.capacidadRestante; }

  getOperacion(): Operacion | null { return this.operacion; }

  setOperacion(operacion: Operacion): void { this.operacion = operacion; }

  getTransmisorPresion(): Sensor | null { return this.transmisorPresion; }
}
