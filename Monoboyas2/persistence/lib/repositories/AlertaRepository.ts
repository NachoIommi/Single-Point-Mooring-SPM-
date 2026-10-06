// lib/repositories/AlertaRepository.ts
// Implementa IAlertaRepository del dominio.
// CRUD puro — cero lógica de negocio.

import type { IAlertaRepository } from "@/domain/types/interfaces";
import type { Alerta }            from "@/domain/entities/Alerta";
import { prisma }                 from "@/persistence/lib/prisma";

export class AlertaRepository implements IAlertaRepository {
  /**
   * Persiste una Alerta y devuelve el id asignado por la BD.
   *
   * Mapeo dominio → Prisma:
   *   Alerta.tipoAlerta      → alerta.tipoAlerta  (TipoAlerta enum)
   *   Alerta.mensaje         → alerta.mensaje
   *   Alerta.doubleMedicion  → alerta.doubleMedicion
   *   Alerta.stringMedicion  → alerta.stringMedicion
   *   Alerta.timestamp       → alerta.timestamp
   *   operacionId            → alerta.operacionId  (parámetro explícito)
   *   medicionId             → alerta.medicionId   (parámetro explícito)
   *
   * Los IDs de operación y medición se pasan como parámetros porque la
   * entidad Alerta del dominio no los almacena directamente — los conoce
   * CentralDatos al momento de llamar guardar().
   */
  async guardar(
    alerta:      Alerta,
    operacionId: number,
    medicionId:  number,
  ): Promise<number> {
    const created = await prisma.alerta.create({
      data: {
        tipoAlerta:     alerta.tipoAlerta,
        mensaje:        alerta.mensaje,
        doubleMedicion: alerta.doubleMedicion,
        stringMedicion: alerta.stringMedicion,
        timestamp:      alerta.timestamp,
        operacionId,
        medicionId,
      },
      select: { id: true },
    });

    // Actualizamos el id en la entidad de dominio para que CentralDatos
    // pueda pasarlo luego a IUsuarioAlertaRepository.registrarRecepcion().
    alerta.id = created.id;

    return created.id;
  }
}
