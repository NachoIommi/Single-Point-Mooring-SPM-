import { prisma } from "@/persistence/lib/prisma";
import type { RolUsuario } from "@/domain/types/enums";
import { OperadorLancha } from "@/domain/entities/OperadorLancha";
import { OperadorPlanta } from "@/domain/entities/OperadorPlanta";
import { OperadorBuque } from "@/domain/entities/OperadorBuque";
import type { Usuario } from "@/domain/entities/Usuario";

export class UsuarioRepository {
  /**
   * Obtiene un usuario operador disponible por rol.
   * Un operador está "disponible" si no tiene ninguna operación ENCURSO asignada.
   * Por simplificación, buscamos cualquiera que cumpla el rol y retornamos la entidad de dominio correspondiente.
   */
  async obtenerOperadorDisponible(rol: RolUsuario): Promise<Usuario | null> {
    const row = await prisma.usuario.findFirst({
      where: {
        rol: rol as any,
        // En una implementación real, aquí filtraríamos aquellos que no estén asignados
        // a una operación activa. Para simplificar, obtenemos el primero disponible.
      },
    });

    if (!row) return null;

    // TODO: La base de datos no tiene "contrasena" y "dni" en el schema actual de Usuario.
    // Pasamos strings vacíos/0 por el momento para instanciar el dominio que pide (id, nombre, contrasena, dni).
    switch (rol) {
      case "OPERADOR_LANCHA":
        return new OperadorLancha(row.id, row.nombre, "", 0);
      case "OPERADOR_PLANTA":
        return new OperadorPlanta(row.id, row.nombre, "", 0);
      case "OPERADOR_BUQUE":
        return new OperadorBuque(row.id, row.nombre, "", 0);
      default:
        return null;
    }
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    const row = await prisma.usuario.findUnique({ where: { id } });
    if (!row) return null;

    switch (row.rol) {
      case "OPERADOR_LANCHA":
        return new OperadorLancha(row.id, row.nombre, "", 0);
      case "OPERADOR_PLANTA":
        return new OperadorPlanta(row.id, row.nombre, "", 0);
      case "OPERADOR_BUQUE":
        return new OperadorBuque(row.id, row.nombre, "", 0);
      default:
        return null; // Admin u otro no retorna como operador
    }
  }
}
