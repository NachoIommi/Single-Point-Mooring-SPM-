// lib/repositories/UsuarioAlertaRepository.ts
// Implementa IUsuarioAlertaRepository del dominio.
// CRUD puro — cero lógica de negocio.

import type { IUsuarioAlertaRepository } from "@/domain/types/interfaces";
import { prisma }                         from "@/persistence/lib/prisma";

export class UsuarioAlertaRepository implements IUsuarioAlertaRepository {
  /**
   * Registra que un usuario recibió una alerta (reconocida = false por defecto).
   * Si la combinación alertaId/usuarioId ya existe (ej. reintento del scheduler),
   * hace upsert silencioso para evitar errores de clave duplicada.
   *
   * Mapeo:
   *   alertaId   → usuario_alerta.alertaId
   *   usuarioId  → usuario_alerta.usuarioId
   *   reconocida → false (valor inicial; el reconocimiento lo hace la capa API)
   */
  async registrarRecepcion(alertaId: number, usuarioId: number): Promise<void> {
    await prisma.usuarioAlerta.upsert({
      where: {
        alertaId_usuarioId: { alertaId, usuarioId },
      },
      create: {
        alertaId,
        usuarioId,
        reconocida: false,
      },
      update: {}, // si ya existe, no tocamos nada
    });
  }
}
