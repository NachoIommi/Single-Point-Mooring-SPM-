import { RolUsuario } from "../types/enums";
import type { Operacion } from "./Operacion";

/**
 * Clase abstracta base para todos los usuarios del sistema.
 *
 * La propiedad getOperacion() devuelve null por defecto. Las subclases
 * de tipo operador la sobreescriben para devolver la operación asignada.
 * Esto permite filtrar operadores disponibles con getOperacion() === null
 * sin necesidad de instanceof ni casting.
 */
export abstract class Usuario {
  public readonly id: number;
  public readonly nombre: string;
  public readonly contrasena: string;
  public readonly dni: number;
  public abstract readonly rol: RolUsuario;

  constructor(id: number, nombre: string, contrasena: string, dni: number) {
    this.id = id;
    this.nombre = nombre;
    this.contrasena = contrasena;
    this.dni = dni;
  }

  /** Por defecto null. Operadores sobreescriben para su operación activa. */
  getOperacion(): Operacion | null {
    return null;
  }

  getRol(): RolUsuario {
    return this.rol;
  }
}
