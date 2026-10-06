import { RolUsuario } from "../types/enums";
import { Usuario } from "./Usuario";
import type { Buque } from "./Buque";
import type { Planta } from "./Planta";
import type { OperadorBuque } from "./OperadorBuque";
import { Operacion } from "./Operacion";

/**
 * El Administrador planifica operaciones de transferencia.
 *
 * planificarOperacion() recibe un operadorBuque ya resuelto (decisión de
 * diseño: la búsqueda de operador disponible la hace la capa de servicio,
 * no el dominio, para evitar acoplar el dominio con la persistencia).
 */
export class Administrador extends Usuario {
  public readonly rol = RolUsuario.ADMIN;
  protected planta: Planta | null;

  constructor(
    id: number,
    nombre: string,
    contrasena: string,
    dni: number,
    planta: Planta | null,
  ) {
    super(id, nombre, contrasena, dni);
    this.planta = planta;
  }

  /**
   * Crea una operación en estado PLANIFICADA vinculando buque y operador.
   * Devuelve la Operacion creada para que la capa de servicio la persista.
   */
  planificarOperacion(
    buque: Buque,
    operadorBuque: OperadorBuque,
    planta: Planta,
  ): Operacion {
    const operacion = new Operacion(0, buque, operadorBuque, planta);
    buque.setOperacion(operacion);
    operadorBuque.asignarOperacion(operacion);
    return operacion;
  }

  getPlanta(): Planta | null {
    return this.planta;
  }
}
