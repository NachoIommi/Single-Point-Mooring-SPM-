import { RolUsuario } from "../types/enums";
import { UsuarioOperador } from "./UsuarioOperador";

export class OperadorBuque extends UsuarioOperador {
  public readonly rol = RolUsuario.OPERADOR_BUQUE;

  constructor(id: number, nombre: string, contrasena: string, dni: number) {
    super(id, nombre, contrasena, dni);
  }

  reconocerAlerta(): void {
    // El reconocimiento real se persiste en usuario_alerta.
    // Este método es para lógica in-memory si se necesita.
  }
}
