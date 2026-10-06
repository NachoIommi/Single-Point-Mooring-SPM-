import { Usuario } from "./Usuario";
import type { Alerta } from "./Alerta";
import type { Operacion } from "./Operacion";

/**
 * Clase abstracta intermedia para los tres tipos de operador.
 * Agrega la referencia a operación activa y la recepción de alertas.
 */
export abstract class UsuarioOperador extends Usuario {
  protected alertasRecibidas: Alerta[] = [];
  protected operacion: Operacion | null = null;

  override getOperacion(): Operacion | null {
    return this.operacion;
  }

  asignarOperacion(operacion: Operacion): void {
    this.operacion = operacion;
  }

  recibirAlerta(alerta: Alerta): void {
    this.alertasRecibidas.push(alerta);
  }

  abstract reconocerAlerta(): void;
}
