import { Operacion } from "@/domain/entities/Operacion";
import { Planta } from "@/domain/entities/Planta";
import { Buque } from "@/domain/entities/Buque";
import { Monoboya } from "@/domain/entities/Monoboya";
import { OperadorBuque } from "@/domain/entities/OperadorBuque";
import { OperadorLancha } from "@/domain/entities/OperadorLancha";
import { OperadorPlanta } from "@/domain/entities/OperadorPlanta";
import { CentralDatos } from "@/domain/entities/CentralDatos";

import { OperacionRepository } from "@/persistence/lib/repositories/OperacionRepository";
import { UsuarioRepository } from "@/persistence/lib/repositories/UsuarioRepository";
import { RolUsuario } from "@/domain/types/enums";
import { prisma } from "@/persistence/lib/prisma"; // Direct access for missing generic repos for simplicity

export class OperacionService {
  private operacionRepo: OperacionRepository;
  private usuarioRepo: UsuarioRepository;
  private centralDatos: CentralDatos;

  constructor(
    operacionRepo: OperacionRepository,
    usuarioRepo: UsuarioRepository,
    centralDatos: CentralDatos
  ) {
    this.operacionRepo = operacionRepo;
    this.usuarioRepo = usuarioRepo;
    this.centralDatos = centralDatos;
  }

  /**
   * Planifica una operación asignando un buque y una planta.
   * La operación se crea en estado PLANIFICADA en la base de datos.
   */
  async planificarOperacion(buqueNroIMO: number, plantaId: number, tipo: string): Promise<number> {
    // 1. Validar que exista el buque y la planta en la BD
    const buqueRow = await prisma.buque.findUnique({ where: { nroIMO: buqueNroIMO } });
    if (!buqueRow) throw new Error("Buque no encontrado");

    const plantaRow = await prisma.planta.findUnique({ where: { id: plantaId } });
    if (!plantaRow) throw new Error("Planta no encontrada");

    // 2. Persistir en estado PLANIFICADA usando el repo
    const opId = await this.operacionRepo.crear({
      buqueNroIMO,
      plantaId,
      tipo,
      estado: "PLANIFICADA",
    });

    return opId;
  }

  /**
   * Prepara la operación asignando monoboya y operadores disponibles.
   * Utiliza la Planta del dominio para orquestar esto.
   */
  async prepararOperacion(operacionId: number): Promise<void> {
    // 1. Recuperar info de la DB
    const opInfo = await this.operacionRepo.buscarPorId(operacionId);
    if (!opInfo) throw new Error("Operacion no encontrada");

    // 2. Buscar operadores disponibles (servicio)
    const opLancha = await this.usuarioRepo.obtenerOperadorDisponible(RolUsuario.OPERADOR_LANCHA);
    const opPlanta = await this.usuarioRepo.obtenerOperadorDisponible(RolUsuario.OPERADOR_PLANTA);
    if (!opLancha || !opPlanta) {
      throw new Error("No hay operadores disponibles para preparar la operacion");
    }

    // 3. Reconstruir entidades mínimas necesarias del dominio
    const buqueRow = await prisma.buque.findUnique({ where: { nroIMO: opInfo.buqueNroIMO! } });
    const buque = new Buque(buqueRow!.nroIMO, buqueRow!.capacidadMax, buqueRow!.nombre, null, null);
    const planta = new Planta("Planta Central", opInfo.plantaId!, this.centralDatos);

    // Reconstruir operador de buque si existe
    let opBuqueEnt: OperadorBuque | null = null;
    if (opInfo.operadorBuqueId) {
      const u = await this.usuarioRepo.obtenerPorId(opInfo.operadorBuqueId);
      opBuqueEnt = u as OperadorBuque;
    }

    const operacion = new Operacion(opInfo.id, buque, opBuqueEnt, planta);
    
    // Cargar monoboyas disponibles a la planta para que ella asigne
    const monoboyasDisponibles = await prisma.monoboya.findMany({ where: { estado: "DISPONIBLE" } });
    for (const mRow of monoboyasDisponibles) {
      planta.agregarMonoboya(new Monoboya(mRow.id, 8, null, null));
    }

    // 4. Delegar al dominio la orquestación
    planta.recibirSolicitudTransferencia(operacion, opLancha as OperadorLancha, opPlanta as OperadorPlanta);

    // 5. Persistir los cambios que hizo el dominio (asignaciones)
    await this.operacionRepo.actualizar(operacionId, {
      monoboyaId: operacion.getMonoboya()?.id,
      operadorLanchaId: operacion.getOperadorLancha()?.id,
      operadorPlantaId: operacion.getOperadorPlanta()?.id,
      // La Planta asienta todo y lo manda a CentralDatos.iniciarOperacion(), 
      // y asume que el estado de la Monoboya cambiará a OCUPADA (esto habría que setearlo)
    });
    
    // Actualizamos monoboya en DB
    if (operacion.getMonoboya()) {
      await prisma.monoboya.update({
        where: { id: operacion.getMonoboya()!.id },
        data: { estado: "OCUPADA" }
      });
    }
  }

  /**
   * Transición PLANIFICADA -> ENCURSO
   */
  async iniciarOperacion(operacionId: number): Promise<void> {
    const opInfo = await this.operacionRepo.buscarPorId(operacionId);
    if (!opInfo) throw new Error("Operacion no encontrada");

    const operacion = await this.reconstruirOperacionDominio(opInfo);
    operacion.iniciar(); // Reglas de negocio

    await this.operacionRepo.actualizar(operacionId, { estado: operacion.getEstado() });
  }

  /**
   * Transición ENCURSO -> DETENIDA
   */
  async detenerOperacion(operacionId: number): Promise<void> {
    const opInfo = await this.operacionRepo.buscarPorId(operacionId);
    if (!opInfo) throw new Error("Operacion no encontrada");

    const operacion = await this.reconstruirOperacionDominio(opInfo);
    operacion.detener();

    await this.operacionRepo.actualizar(operacionId, { estado: operacion.getEstado() });
  }

  /**
   * Transición DETENIDA -> ENCURSO
   */
  async reanudarOperacion(operacionId: number): Promise<void> {
    const opInfo = await this.operacionRepo.buscarPorId(operacionId);
    if (!opInfo) throw new Error("Operacion no encontrada");

    const operacion = await this.reconstruirOperacionDominio(opInfo);
    operacion.reanudar();

    await this.operacionRepo.actualizar(operacionId, { estado: operacion.getEstado() });
  }

  /**
   * Transición * -> FINALIZADA
   */
  async finalizarOperacion(operacionId: number): Promise<void> {
    const opInfo = await this.operacionRepo.buscarPorId(operacionId);
    if (!opInfo) throw new Error("Operacion no encontrada");

    const operacion = await this.reconstruirOperacionDominio(opInfo);
    operacion.finalizar();

    // Actualizamos DB operacion
    await this.operacionRepo.actualizar(operacionId, { estado: operacion.getEstado() });
    
    // Liberar monoboya en la DB
    if (operacion.getMonoboya()) {
      await prisma.monoboya.update({
        where: { id: operacion.getMonoboya()!.id },
        data: { estado: "DISPONIBLE" }
      });
    }
    
    // Sacar del in-memory central de datos
    this.centralDatos.finalizarOperacion(operacionId);
  }

  /**
   * Reconstruye una instancia pura de Operacion del dominio a partir de su ID.
   */
  private async reconstruirOperacionDominio(opInfo: any): Promise<Operacion> {
    // Buque
    const bRow = await prisma.buque.findUnique({ where: { nroIMO: opInfo.buqueNroIMO } });
    const buque = new Buque(bRow!.nroIMO, bRow!.capacidadMax, bRow!.nombre, null, null);
    
    // Planta
    let planta: Planta | null = null;
    if (opInfo.plantaId) {
      planta = new Planta("Planta", opInfo.plantaId, this.centralDatos);
    }

    // OperadorBuque
    let opBuqueEnt: OperadorBuque | null = null;
    if (opInfo.operadorBuqueId) {
      opBuqueEnt = await this.usuarioRepo.obtenerPorId(opInfo.operadorBuqueId) as OperadorBuque;
    }

    const operacion = new Operacion(opInfo.id, buque, opBuqueEnt, planta);
    // Para engañar la restricción en `iniciar` de que requiere monoboya asignada:
    if (opInfo.monoboyaId) {
       const mRow = await prisma.monoboya.findUnique({ where: { id: opInfo.monoboyaId } });
       operacion.asignarMonoboya(new Monoboya(mRow!.id, 8, null, null));
    }
    // Setear el estado privado actual
    (operacion as any).estado = opInfo.estado as any;

    return operacion;
  }
}
