import type { ISubscriber } from "../types/interfaces";
import type { Medicion } from "../entities/Medicion";
import type { CentralDatos } from "../entities/CentralDatos";
import type { BrokerMQTT } from "./BrokerMQTT";

/**
 * Suscriptor que conecta el BrokerMQTT con CentralDatos.
 *
 * Se auto-registra en el broker al construirse (mismo patrón que
 * el @Component de Spring Boot original).
 */
export class CentralDatosSubscriber implements ISubscriber {
  private centralDatos: CentralDatos;

  constructor(centralDatos: CentralDatos, broker: BrokerMQTT) {
    this.centralDatos = centralDatos;
    broker.suscribir(this);
  }

  recibirMensaje(medicion: Medicion): void {
    // Fire-and-forget: el subscriber no espera el resultado async.
    // Si se necesita manejo de errores, wrappear en try/catch.
    this.centralDatos.procesarTelemetria(medicion).catch((err) => {
      console.error("[CentralDatosSubscriber] Error procesando telemetría:", err);
    });
  }
}
