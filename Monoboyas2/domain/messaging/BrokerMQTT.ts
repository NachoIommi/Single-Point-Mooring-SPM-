import type { IPublisher, ISubscriber } from "../types/interfaces";
import type { Medicion } from "../entities/Medicion";

/**
 * Emulación in-memory del patrón Publish/Subscribe.
 *
 * En producción se podría reemplazar por MQTT real, Kafka, etc.
 * sin modificar ni Monoboya ni CentralDatos — solo esta clase.
 */
export class BrokerMQTT implements IPublisher {
  private subscribers: ISubscriber[] = [];

  suscribir(subscriber: ISubscriber): void {
    this.subscribers.push(subscriber);
  }

  publicar(medicion: Medicion): void {
    for (const subscriber of this.subscribers) {
      subscriber.recibirMensaje(medicion);
    }
  }
}
