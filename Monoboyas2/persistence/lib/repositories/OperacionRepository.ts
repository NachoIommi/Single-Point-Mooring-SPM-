// lib/repositories/OperacionRepository.ts
// Implementa IOperacionRepository del dominio.
// CRUD puro — cero lógica de negocio.

import type { IOperacionRepository, OperacionInfo } from "@/domain/types/interfaces";
import { prisma } from "@/persistence/lib/prisma";

export class OperacionRepository implements IOperacionRepository {
  /**
   * Busca una operación por id y la devuelve como OperacionInfo plano,
   * o null si no existe.
   *
   * Mapeo Prisma → OperacionInfo:
   *   operacion.id               → id
   *   operacion.estado (enum)    → estado (string — el dominio usa EstadoOperacion)
   *   operacion.tipo             → tipo
   *   operacion.buqueNroIMO      → buqueNroIMO
   *   operacion.plantaId         → plantaId
   *   operacion.monoboyaId       → monoboyaId
   *   operacion.operadorBuqueId  → operadorBuqueId
   *   operacion.operadorLanchaId → operadorLanchaId
   *   operacion.operadorPlantaId → operadorPlantaId
   */
  async buscarPorId(id: number): Promise<OperacionInfo | null> {
    const row = await prisma.operacion.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        tipo: true,
        buqueNroIMO: true,
        plantaId: true,
        monoboyaId: true,
        operadorBuqueId: true,
        operadorLanchaId: true,
        operadorPlantaId: true,
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      estado: row.estado as string,
      tipo: row.tipo,
      buqueNroIMO: row.buqueNroIMO,
      plantaId: row.plantaId,
      monoboyaId: row.monoboyaId,
      operadorBuqueId: row.operadorBuqueId,
      operadorLanchaId: row.operadorLanchaId,
      operadorPlantaId: row.operadorPlantaId,
    };
  }

  /**
   * Lista todas las operaciones que tienen el estado indicado.
   * CentralDatos usa esto para obtener las operaciones ENCURSO
   * al reconstruir el cache in-memory al arrancar el scheduler.
   *
   * @param estado - Uno de los 4 valores canónicos de EstadoOperacion
   */
  async listarPorEstado(estado: string): Promise<OperacionInfo[]> {
    const rows = await prisma.operacion.findMany({
      where: { estado: estado as any }, // cast necesario: Prisma espera el enum nativo
      select: {
        id: true,
        estado: true,
        tipo: true,
        buqueNroIMO: true,
        plantaId: true,
        monoboyaId: true,
        operadorBuqueId: true,
        operadorLanchaId: true,
        operadorPlantaId: true,
      },
    });

    return rows.map((row: any) => ({
      id: row.id,
      estado: row.estado as string,
      tipo: row.tipo,
      buqueNroIMO: row.buqueNroIMO,
      plantaId: row.plantaId,
      monoboyaId: row.monoboyaId,
      operadorBuqueId: row.operadorBuqueId,
      operadorLanchaId: row.operadorLanchaId,
      operadorPlantaId: row.operadorPlantaId,
    }));
  }

  /**
   * Crea una nueva operación en estado PLANIFICADA
   */
  async crear(data: Partial<OperacionInfo>): Promise<number> {
    const row = await prisma.operacion.create({
      data: {
        estado: data.estado as any || "PLANIFICADA",
        tipo: data.tipo,
        buqueNroIMO: data.buqueNroIMO,
        plantaId: data.plantaId,
        monoboyaId: data.monoboyaId,
        operadorBuqueId: data.operadorBuqueId,
        operadorLanchaId: data.operadorLanchaId,
        operadorPlantaId: data.operadorPlantaId,
      },
    });
    return row.id;
  }

  /**
   * Actualiza los datos de una operación existente (estado, asignaciones)
   */
  async actualizar(id: number, data: Partial<OperacionInfo>): Promise<void> {
    await prisma.operacion.update({
      where: { id },
      data: {
        estado: data.estado as any,
        tipo: data.tipo,
        buqueNroIMO: data.buqueNroIMO,
        plantaId: data.plantaId,
        monoboyaId: data.monoboyaId,
        operadorBuqueId: data.operadorBuqueId,
        operadorLanchaId: data.operadorLanchaId,
        operadorPlantaId: data.operadorPlantaId,
      },
    });
  }
}
