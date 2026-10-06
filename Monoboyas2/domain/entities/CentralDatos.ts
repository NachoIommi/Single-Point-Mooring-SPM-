import { TipoAlerta, TipoSensor } from "../types/enums";
import type {
  IMedicionRepository,
  IAlertaRepository,
  IOperacionRepository,
  IUsuarioAlertaRepository,
  TelemetriaResultado,
  AlertaInfo,
  OperacionInfo,
} from "../types/interfaces";
import { Alerta } from "./Alerta";
import type { Medicion } from "./Medicion";
import type { Operacion } from "./Operacion";

/**
 * Central de Datos: el cerebro analítico del sistema.
 *
 * Responsabilidades:
 *  1. Recibir mediciones de telemetría (vía procesarTelemetria)
 *  2. Persistir cada medición
 *  3. Evaluar umbrales por tipo de sensor
 *  4. Si hay anomalía → generar 3 alertas (una por rol de operador)
 *  5. Persistir alertas y registrar recepción per-user
 *  6. Mantener un mapa in-memory de operaciones activas para el scheduler
 *
 * Depende de interfaces (puertos), no de implementaciones concretas de
 * persistencia. La capa de Prisma inyecta las implementaciones reales.
 */
export class CentralDatos {

  // ─── Puertos de persistencia (inyectados) ─────────────────────────

  private medicionRepo: IMedicionRepository;
  private alertaRepo: IAlertaRepository;
  private operacionRepo: IOperacionRepository;
  private usuarioAlertaRepo: IUsuarioAlertaRepository;

  // ─── Cache in-memory de operaciones activas (para el scheduler) ───

  private operacionesActivas: Map<number, Operacion> = new Map();

  // ─── Umbrales (Ajustados para generar alertas constantes con los archivos de texto) ───

  private static readonly AMARRE_AMARILLA = 80;
  private static readonly AMARRE_ROJA     = 88;

  private static readonly TENSION_AMARILLA = 7.5;
  private static readonly TENSION_ROJA     = 8.0;

  private static readonly PRESION_AMARILLA_ALTA    = 1_380_000;
  private static readonly PRESION_ROJA_ALTA        = 1_400_000;
  private static readonly PRESION_ROJA_BAJA        = 1_300_000;
  private static readonly PRESION_ROJA_DISCREPANCIA = 200_000;

  private static readonly CAUDAL_AMARILLA = 1550;
  private static readonly CAUDAL_ROJA     = 1590; // Agregado para soportar roja en caudal

  private static readonly OLEAJE_AMARILLA = 1.5;
  private static readonly OLEAJE_ROJA     = 2.5;

  private static readonly ORIENTACION_AMARILLA = 13.5;
  private static readonly ORIENTACION_ROJA     = 14.8;

  private static readonly CORRIENTE_AMARILLA = 0.8;
  private static readonly CORRIENTE_ROJA     = 1.2;

  private static readonly VIENTO_AMARILLA = 20;
  private static readonly VIENTO_ROJA     = 35;

  constructor(
    medicionRepo: IMedicionRepository,
    alertaRepo: IAlertaRepository,
    operacionRepo: IOperacionRepository,
    usuarioAlertaRepo: IUsuarioAlertaRepository,
  ) {
    this.medicionRepo = medicionRepo;
    this.alertaRepo = alertaRepo;
    this.operacionRepo = operacionRepo;
    this.usuarioAlertaRepo = usuarioAlertaRepo;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PIPELINE PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Procesa una medición entrante: persiste, evalúa, genera alertas.
   *
   * Recibe SOLO una Medicion. No recibe Operacion — el contexto de la
   * operación se obtiene una única vez al iniciarla (registrarContexto),
   * no en cada ciclo de telemetría.
   */
  async procesarTelemetria(medicion: Medicion): Promise<TelemetriaResultado> {
    // 1. Persistir la medición
    const medicionId = await this.medicionRepo.guardar(medicion);

    // 2. Evaluar umbrales → mapa rol → alerta
    const alertasPorRol = this.evaluarUmbrales(medicion);

    if (alertasPorRol.size === 0) {
      return { medicionId, alertas: [] };
    }

    // 3. Obtener info de la operación para resolver IDs de operadores
    const opInfo = await this.operacionRepo.buscarPorId(medicion.idOperacion);
    if (!opInfo) {
      return { medicionId, alertas: [] };
    }

    // 4. Persistir cada alerta y registrar recepción per-user
    const alertasInfo: AlertaInfo[] = [];

    for (const [rol, alerta] of alertasPorRol) {
      const alertaId = await this.alertaRepo.guardar(
        alerta,
        medicion.idOperacion,
        medicionId,
      );

      const usuarioId = this.resolverUsuarioPorRol(rol, opInfo);
      if (usuarioId) {
        await this.usuarioAlertaRepo.registrarRecepcion(alertaId, usuarioId);
      }

      alertasInfo.push({
        id: alertaId,
        tipoAlerta: alerta.tipoAlerta,
        mensaje: alerta.mensaje,
        operacionId: medicion.idOperacion,
        medicionId,
        timestamp: new Date(),
      });
    }

    return { medicionId, alertas: alertasInfo };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  EVALUACIÓN DE UMBRALES
  // ═══════════════════════════════════════════════════════════════════

  private evaluarUmbrales(medicion: Medicion): Map<string, Alerta> {
    switch (medicion.tipo) {
      case TipoSensor.AMARRE:      return this.verificarUmbralAmarre(medicion.valor, medicion.idOperacion);
      case TipoSensor.TENSION:     return this.verificarUmbralTension(medicion.valor, medicion.idOperacion);
      case TipoSensor.PRESION:     return this.verificarUmbralPresion(medicion);
      case TipoSensor.OLEAJE:      return this.verificarUmbralOleaje(medicion.valor, medicion.idOperacion);
      case TipoSensor.ORIENTACION: return this.verificarUmbralOrientacion(medicion.valor, medicion.idOperacion);
      case TipoSensor.CORRIENTE:   return this.verificarUmbralCorriente(medicion.valor, medicion.idOperacion);
      case TipoSensor.CAUDAL:      return this.verificarUmbralCaudal(medicion.valor, medicion.idOperacion);
      case TipoSensor.VIENTO:      return this.verificarUmbralViento(medicion.valor, medicion.idOperacion);
      default:                     return new Map();
    }
  }

  // ── Amarre ────────────────────────────────────────────────────────

  private verificarUmbralAmarre(valor: number, opId: number): Map<string, Alerta> {
    if (valor >= CentralDatos.AMARRE_ROJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Tensión de amarre ${valor} kN supera umbral rojo (${CentralDatos.AMARRE_ROJA} kN) — Op ${opId}`,
        valor, "kN",
      );
    }
    if (valor >= CentralDatos.AMARRE_AMARILLA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Tensión de amarre ${valor} kN supera umbral amarillo (${CentralDatos.AMARRE_AMARILLA} kN) — Op ${opId}`,
        valor, "kN",
      );
    }
    return new Map();
  }

  // ── Tensión ───────────────────────────────────────────────────────

  private verificarUmbralTension(valor: number, opId: number): Map<string, Alerta> {
    if (valor >= CentralDatos.TENSION_ROJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Tensión de manguera ${valor} tf supera umbral rojo (${CentralDatos.TENSION_ROJA} tf) — Op ${opId}`,
        valor, "tf",
      );
    }
    if (valor >= CentralDatos.TENSION_AMARILLA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Tensión de manguera ${valor} tf supera umbral amarillo (${CentralDatos.TENSION_AMARILLA} tf) — Op ${opId}`,
        valor, "tf",
      );
    }
    return new Map();
  }

  // ── Presión (caso especial: alta, baja y discrepancia) ────────────

  private verificarUmbralPresion(medicion: Medicion): Map<string, Alerta> {
    const valor = medicion.valor;
    const opId = medicion.idOperacion;

    if (valor >= CentralDatos.PRESION_ROJA_ALTA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Presión ${valor} Pa supera umbral rojo alto (${CentralDatos.PRESION_ROJA_ALTA} Pa) — Op ${opId}`,
        valor, "Pa",
      );
    }
    if (valor <= CentralDatos.PRESION_ROJA_BAJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Presión ${valor} Pa por debajo del umbral rojo bajo (${CentralDatos.PRESION_ROJA_BAJA} Pa) — Op ${opId}`,
        valor, "Pa",
      );
    }
    if (valor >= CentralDatos.PRESION_AMARILLA_ALTA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Presión ${valor} Pa supera umbral amarillo (${CentralDatos.PRESION_AMARILLA_ALTA} Pa) — Op ${opId}`,
        valor, "Pa",
      );
    }
    return new Map();
  }

  // ── Oleaje ────────────────────────────────────────────────────────

  private verificarUmbralOleaje(valor: number, opId: number): Map<string, Alerta> {
    if (valor >= CentralDatos.OLEAJE_ROJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Oleaje ${valor} m supera umbral rojo (${CentralDatos.OLEAJE_ROJA} m) — Op ${opId}`,
        valor, "m",
      );
    }
    if (valor >= CentralDatos.OLEAJE_AMARILLA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Oleaje ${valor} m supera umbral amarillo (${CentralDatos.OLEAJE_AMARILLA} m) — Op ${opId}`,
        valor, "m",
      );
    }
    return new Map();
  }

  // ── Orientación (giroscopio) ──────────────────────────────────────

  private verificarUmbralOrientacion(valor: number, opId: number): Map<string, Alerta> {
    if (valor >= CentralDatos.ORIENTACION_ROJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Orientación ${valor}° supera umbral rojo (${CentralDatos.ORIENTACION_ROJA}°) — Op ${opId}`,
        valor, "°",
      );
    }
    if (valor >= CentralDatos.ORIENTACION_AMARILLA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Orientación ${valor}° supera umbral amarillo (${CentralDatos.ORIENTACION_AMARILLA}°) — Op ${opId}`,
        valor, "°",
      );
    }
    return new Map();
  }

  // ── Corriente ─────────────────────────────────────────────────────

  private verificarUmbralCorriente(valor: number, opId: number): Map<string, Alerta> {
    if (valor >= CentralDatos.CORRIENTE_ROJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Corriente ${valor} m/s supera umbral rojo (${CentralDatos.CORRIENTE_ROJA} m/s) — Op ${opId}`,
        valor, "m/s",
      );
    }
    if (valor >= CentralDatos.CORRIENTE_AMARILLA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Corriente ${valor} m/s supera umbral amarillo (${CentralDatos.CORRIENTE_AMARILLA} m/s) — Op ${opId}`,
        valor, "m/s",
      );
    }
    return new Map();
  }

  private verificarUmbralCaudal(valor: number, opId: number): Map<string, Alerta> {
    if (valor >= CentralDatos.CAUDAL_ROJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Caudal ${valor} l/s supera umbral rojo (${CentralDatos.CAUDAL_ROJA} l/s) — Op ${opId}`,
        valor, "l/s",
      );
    }
    if (valor >= CentralDatos.CAUDAL_AMARILLA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Caudal ${valor} l/s supera umbral amarillo (${CentralDatos.CAUDAL_AMARILLA} l/s) — Op ${opId}`,
        valor, "l/s",
      );
    }
    return new Map();
  }

  // ── Viento (anemómetro) ───────────────────────────────────────────

  private verificarUmbralViento(valor: number, opId: number): Map<string, Alerta> {
    if (valor >= CentralDatos.VIENTO_ROJA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.ROJA,
        `[CRITICA] Viento ${valor} km/h supera umbral rojo (${CentralDatos.VIENTO_ROJA} km/h) — Op ${opId}`,
        valor, "km/h",
      );
    }
    if (valor >= CentralDatos.VIENTO_AMARILLA) {
      return this.crearAlertasTresRoles(
        TipoAlerta.AMARILLA,
        `[ADVERTENCIA] Viento ${valor} km/h supera umbral amarillo (${CentralDatos.VIENTO_AMARILLA} km/h) — Op ${opId}`,
        valor, "km/h",
      );
    }
    return new Map();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  GESTIÓN DE OPERACIONES ACTIVAS
  // ═══════════════════════════════════════════════════════════════════

  iniciarOperacion(operacion: Operacion): void {
    this.operacionesActivas.set(operacion.id, operacion);
  }

  finalizarOperacion(operacionId: number): void {
    this.operacionesActivas.delete(operacionId);
  }

  obtenerOperacionesActivas(): Map<number, Operacion> {
    return this.operacionesActivas;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Crea 3 instancias de Alerta (una por rol de operador) con el mismo
   * nivel de severidad. El reconocimiento se gestiona individualmente
   * en usuario_alerta.
   */
  private crearAlertasTresRoles(
    tipo: TipoAlerta,
    mensaje: string,
    valor: number,
    unidad: string,
  ): Map<string, Alerta> {
    const mapa = new Map<string, Alerta>();
    mapa.set("OPERADOR_BUQUE",  new Alerta(tipo, mensaje, valor, unidad));
    mapa.set("OPERADOR_LANCHA", new Alerta(tipo, mensaje, valor, unidad));
    mapa.set("OPERADOR_PLANTA", new Alerta(tipo, mensaje, valor, unidad));
    return mapa;
  }

  /**
   * Dado un rol ("OPERADOR_BUQUE", etc.) y la info de la operación,
   * devuelve el ID del usuario correspondiente.
   */
  private resolverUsuarioPorRol(
    rol: string,
    opInfo: OperacionInfo,
  ): number | null {
    switch (rol) {
      case "OPERADOR_BUQUE":  return opInfo.operadorBuqueId;
      case "OPERADOR_LANCHA": return opInfo.operadorLanchaId;
      case "OPERADOR_PLANTA": return opInfo.operadorPlantaId;
      default:                return null;
    }
  }
}
