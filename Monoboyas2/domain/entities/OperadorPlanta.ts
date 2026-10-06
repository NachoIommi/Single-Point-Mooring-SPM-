import { RolUsuario } from "../types/enums";
import { UsuarioOperador } from "./UsuarioOperador";

export class OperadorPlanta extends UsuarioOperador {
  public readonly rol = RolUsuario.OPERADOR_PLANTA;

  constructor(id: number, nombre: string, contrasena: string, dni: number) {
    super(id, nombre, contrasena, dni);
  }

  reconocerAlerta(): void {
    // El reconocimiento real se persiste en usuario_alerta.
  }
}
