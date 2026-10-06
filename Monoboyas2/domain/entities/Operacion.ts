import { EstadoOperacion } from "../types/enums";
import type { Monoboya } from "./Monoboya";
import type { Buque } from "./Buque";
import type { Planta } from "./Planta";
import type { OperadorBuque } from "./OperadorBuque";
import type { OperadorLancha } from "./OperadorLancha";
import type { OperadorPlanta } from "./OperadorPlanta";
import type { Alerta } from "./Alerta";

/**
 * Entidad central del sistema. Una Operacion vincula un buque, una monoboya,
 * una planta y tres operadores durante una transferencia de hidrocarburos.
 *
 * Máquina de estados: PLANIFICADA → ENCURSO → DETENIDA ↔ ENCURSO → FINALIZADA
 *
 * Reglas de negocio alojadas aquí:
 *  - Guardas de transición de estado
 *  - Descuento de capacidad del buque (lógica de caudal transferido)
 *  - Distribución de alertas a operadores asignados
 */
export class Operacion {
  private _id: number;
  private monoboya: Monoboya | null = null;
  private buque: Buque;
  private planta: Planta | null;
  private operadorBuque: OperadorBuque | null;
  private operadorLancha: OperadorLancha | null = null;
  private operadorPlanta: OperadorPlanta | null = null;
  private estado: EstadoOperacion;

  constructor(
    id: number,
    buque: Buque,
    operadorBuque: OperadorBuque | null,
    planta: Planta | null,
  ) {
    this._id = id;
    this.buque = buque;
    this.planta = planta;
    this.operadorBuque = operadorBuque;
    this.estado = EstadoOperacion.PLANIFICADA;
  }

  // ─── Transiciones de estado ─────────────────────────────────────────

  /**
   * PLANIFICADA → ENCURSO.
   * Requiere buque y monoboya asignados.
   */
  iniciar(): void {
    this.requireEstado(EstadoOperacion.PLANIFICADA, "iniciar");
    if (!this.buque || !this.monoboya) {
      throw new Error(
        `[Operación ${this._id}] No se puede iniciar: falta buque o monoboya.`,
      );
    }
    this.estado = EstadoOperacion.ENCURSO;
  }

  /**
   * ENCURSO → DETENIDA.
   */
  detener(): void {
    this.requireEstado(EstadoOperacion.ENCURSO, "detener");
    this.estado = EstadoOperacion.DETENIDA;
  }

  /**
   * DETENIDA → ENCURSO.
   */
  reanudar(): void {
    this.requireEstado(EstadoOperacion.DETENIDA, "reanudar");
    this.estado = EstadoOperacion.ENCURSO;
  }

  /**
   * ENCURSO | DETENIDA → FINALIZADA.
   */
  finalizar(): void {
    if (this.estado === EstadoOperacion.FINALIZADA) {
      throw new Error(
        `La operación ${this._id} ya está FINALIZADA y no puede modificarse.`,
      );
    }
    if (
      this.estado !== EstadoOperacion.ENCURSO &&
      this.estado !== EstadoOperacion.DETENIDA
    ) {
      throw new Error(
        `Solo se puede finalizar una operación ENCURSO o DETENIDA. ` +
        `Estado actual: ${this.estado}`,
      );
    }
    this.estado = EstadoOperacion.FINALIZADA;
  }

  // ─── Regla de negocio: descuento de capacidad ──────────────────────

  /**
   * Descuenta litros transferidos del buque.
   * Antes vivía en Monoboya.recolectarYTransmitirDatos(); ahora la lógica
   * de negocio de caudal vive en la Operacion como corresponde.
   */
  descontarCapacidadBuque(litrosTransferidos: number): void {
    if (!this.buque) return;
    this.buque.descontarCapacidad(litrosTransferidos);
  }

  // ─── Distribución de alertas a operadores asignados ────────────────

  enviarAlertaOperadorBuque(alerta: Alerta): void {
    this.operadorBuque?.recibirAlerta(alerta);
  }

  enviarAlertaOperadorLancha(alerta: Alerta): void {
    this.operadorLancha?.recibirAlerta(alerta);
  }

  enviarAlertaOperadorPlanta(alerta: Alerta): void {
    this.operadorPlanta?.recibirAlerta(alerta);
  }

  // ─── Asignaciones (llamadas por Planta al preparar) ────────────────

  asignarMonoboya(monoboya: Monoboya): void {
    this.monoboya = monoboya;
  }

  asignarOperadorLancha(operador: OperadorLancha): void {
    this.operadorLancha = operador;
  }

  asignarOperadorPlanta(operador: OperadorPlanta): void {
    this.operadorPlanta = operador;
  }

  asignarOperadorBuque(operador: OperadorBuque): void {
    this.operadorBuque = operador;
  }

  asignarBuque(buque: Buque): void {
    this.buque = buque;
  }

  // ─── Getters ───────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  getEstado(): EstadoOperacion { return this.estado; }
  isActiva(): boolean { return this.estado === EstadoOperacion.ENCURSO; }
  getMonoboya(): Monoboya | null { return this.monoboya; }
  getBuque(): Buque { return this.buque; }
  getPlanta(): Planta | null { return this.planta; }
  getOperadorBuque(): OperadorBuque | null { return this.operadorBuque; }
  getOperadorLancha(): OperadorLancha | null { return this.operadorLancha; }
  getOperadorPlanta(): OperadorPlanta | null { return this.operadorPlanta; }

  // ─── Helpers privados ──────────────────────────────────────────────

  private requireEstado(requerido: EstadoOperacion, accion: string): void {
    if (this.estado === EstadoOperacion.FINALIZADA) {
      throw new Error(
        `La operación ${this._id} ya está FINALIZADA y no puede modificarse.`,
      );
    }
    if (this.estado !== requerido) {
      throw new Error(
        `No se puede ${accion} la operación ${this._id}: ` +
        `estado actual ${this.estado}, se requiere ${requerido}.`,
      );
    }
  }
}
