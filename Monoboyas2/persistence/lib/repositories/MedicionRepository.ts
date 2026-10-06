// lib/repositories/MedicionRepository.ts
// Implementa IMedicionRepository del dominio.
// CRUD puro — cero lógica de negocio.

import type { IMedicionRepository } from "@/domain/types/interfaces";
import type { Medicion }            from "@/domain/entities/Medicion";
import { prisma }                   from "@/persistence/lib/prisma";

export class MedicionRepository implements IMedicionRepository {
  /**
   * Persiste una Medicion y devuelve el id asignado por la BD.
   *
   * Mapeo dominio → Prisma:
   *   Medicion.idSensor     → medicion.sensorId
   *   Medicion.idOperacion  → medicion.operacionId
   *   Medicion.tipo         → medicion.tipo   (TipoSensor enum)
   *   Medicion.origen       → medicion.origen (OrigenMedicion enum)
   */
  async guardar(medicion: Medicion): Promise<number> {
    const created = await prisma.medicion.create({
      data: {
        sensorId:    medicion.idSensor,
        valor:       medicion.valor,
        unidad:      medicion.unidad,
        tipo:        medicion.tipo,
        origen:      medicion.origen,
        operacionId: medicion.idOperacion,
        timestamp:   medicion.timestamp,
      },
      select: { id: true },
    });

    return created.id;
  }
}
