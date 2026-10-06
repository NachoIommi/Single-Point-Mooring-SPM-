import { EstadoMonoboya } from "../types/enums";
import type { CentralDatos } from "./CentralDatos";
import type { Monoboya } from "./Monoboya";
import type { Operacion } from "./Operacion";
import type { OperadorLancha } from "./OperadorLancha";
import type { OperadorPlanta as OperadorPlantaType } from "./OperadorPlanta";

/**
 * Instalación terrestre que gestiona monoboyas y recibe solicitudes de
 * transferencia.
 *
 * recibirSolicitudTransferencia() orquesta la preparación de una operación:
 * asigna monoboya, operadores, y delega a CentralDatos. Los operadores
 * llegan ya resueltos (la búsqueda en BD la hace la capa de servicio).
 *
 * Capacidad máxima: 3 monoboyas.
 */
export class Planta {
  public readonly nombre: string;
  public readonly idPlanta: number;

  private static readonly CAPACIDAD_MAXIMA_MONOBOYAS = 3;
  private monoboyas: (Monoboya | null)[];
  private cantidadActualMonoboyas: number;
  private centralDatos: CentralDatos;

  constructor(nombre: string, idPlanta: number, centralDatos: CentralDatos) {
    this.nombre = nombre;
    this.idPlanta = idPlanta;
    this.centralDatos = centralDatos;
    this.monoboyas = new Array(Planta.CAPACIDAD_MAXIMA_MONOBOYAS).fill(null);
    this.cantidadActualMonoboyas = 0;
  }

  agregarMonoboya(monoboya: Monoboya): void {
    if (this.cantidadActualMonoboyas >= Planta.CAPACIDAD_MAXIMA_MONOBOYAS) {
      return;
    }
    this.monoboyas[this.cantidadActualMonoboyas] = monoboya;
    this.cantidadActualMonoboyas++;
  }

  /**
   * Orquesta la preparación de la operación asignando recursos.
   *
   * Los operadores llegan ya resueltos desde la capa de servicio — la Planta
   * no consulta la BD. Solo asigna y conecta las piezas del dominio.
   */
  recibirSolicitudTransferencia(
    operacion: Operacion,
    operadorLancha: OperadorLancha,
    operadorPlanta: OperadorPlantaType,
  ): void {
    const monoboya = this.obtenerMonoboyaDisponible();
    if (!monoboya) {
      throw new Error(
        `[Planta ${this.nombre}] No hay monoboyas disponibles.`,
      );
    }

    // Asignar monoboya ↔ operación
    operacion.asignarMonoboya(monoboya);
    monoboya.asignarOperacion(operacion);

    // Asignar operadores ↔ operación
    operacion.asignarOperadorPlanta(operadorPlanta);
    operacion.asignarOperadorLancha(operadorLancha);
    operadorLancha.asignarOperacion(operacion);
    operadorPlanta.asignarOperacion(operacion);

    // Registrar en CentralDatos
    this.centralDatos.iniciarOperacion(operacion);
  }

  /**
   * Busca la primera monoboya con estado DISPONIBLE entre las asignadas.
   */
  obtenerMonoboyaDisponible(): Monoboya | null {
    for (let i = 0; i < this.cantidadActualMonoboyas; i++) {
      const m = this.monoboyas[i];
      if (m && m.getEstado() === EstadoMonoboya.DISPONIBLE) {
        return m;
      }
    }
    return null;
  }

  // ─── Getters ───────────────────────────────────────────────────────

  getId(): number { return this.idPlanta; }

  getCentralDatos(): CentralDatos { return this.centralDatos; }
}
