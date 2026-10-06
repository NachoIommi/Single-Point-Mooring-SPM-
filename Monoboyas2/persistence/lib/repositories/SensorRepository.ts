// lib/repositories/SensorRepository.ts
// DAO extra (no tiene interfaz en el dominio) para leer sensores de la BD
// y reconstruir instancias de la jerarquía Sensor del dominio usando
// construirSensor() de domain/entities/Sensor.ts.
//
// Lo usa la futura capa de servicio cuando necesita armar una Monoboya
// o un Buque con sus sensores reales antes de pasarlos al dominio.
// CRUD puro — cero lógica de negocio.

import { construirSensor, type Sensor } from "@/domain/entities/Sensor";
import { prisma }                        from "@/persistence/lib/prisma";
import type { TipoSensor }               from "@/domain/types/enums";
import { MockDataProvider }              from "@/infrastructure/providers/MockDataProvider";
import { ApiDataProvider }               from "@/infrastructure/providers/ApiDataProvider";
import { FileDataProvider }              from "@/infrastructure/providers/FileDataProvider";

export class SensorRepository {
  private getProviderFor(tipo: string) {
    if (["VIENTO", "OLEAJE", "CORRIENTE"].includes(tipo)) {
      return new ApiDataProvider(tipo);
    } else if (["PRESION", "AMARRE", "TENSION", "CAUDAL", "ORIENTACION"].includes(tipo)) {
      return new FileDataProvider(tipo);
    }
    return new MockDataProvider(tipo);
  }

  /**
   * Devuelve todos los sensores que pertenecen a una monoboya dada,
   * ya como instancias concretas de la jerarquía Sensor del dominio.
   *
   * @param monoboyaId - id de la Monoboya en BD
   */
  async obtenerPorMonoboya(monoboyaId: number): Promise<Sensor[]> {
    const rows = await prisma.sensor.findMany({
      where: { monoboyaId },
    });

    return rows.map((row) =>
      construirSensor(row.id, row.tipo as TipoSensor, this.getProviderFor(row.tipo)),
    );
  }

  /**
   * Devuelve todos los sensores que pertenecen a un buque dado,
   * usando nroIMO como clave (igual que el schema).
   *
   * @param buqueNroIMO - número IMO del buque
   */
  async obtenerPorBuque(buqueNroIMO: number): Promise<Sensor[]> {
    const rows = await prisma.sensor.findMany({
      where: { buqueNroIMO },
    });

    return rows.map((row) =>
      construirSensor(row.id, row.tipo as TipoSensor, this.getProviderFor(row.tipo)),
    );
  }

  /**
   * Devuelve todos los sensores de una planta.
   *
   * @param plantaId - id de la Planta en BD
   */
  async obtenerPorPlanta(plantaId: number): Promise<Sensor[]> {
    const rows = await prisma.sensor.findMany({
      where: { plantaId },
    });

    return rows.map((row) =>
      construirSensor(row.id, row.tipo as TipoSensor, this.getProviderFor(row.tipo)),
    );
  }
}
