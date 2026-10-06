import { ISensorDataProvider } from "@/domain/types/interfaces";

export class MockDataProvider implements ISensorDataProvider {
  private base: number;
  private oscilacion: number;

  constructor(tipoSensor: string) {
    switch (tipoSensor) {
      case "PRESION": this.base = 1450000; this.oscilacion = 200000; break;
      case "VIENTO": this.base = 50; this.oscilacion = 30; break;
      case "OLEAJE": this.base = 2.0; this.oscilacion = 1.6; break;
      case "CORRIENTE": this.base = 1.2; this.oscilacion = 1.2; break;
      case "CAUDAL": this.base = 1400; this.oscilacion = 300; break;
      case "AMARRE": this.base = 600; this.oscilacion = 350; break;
      case "TENSION": this.base = 9.5; this.oscilacion = 3.5; break;
      case "ORIENTACION": this.base = 10; this.oscilacion = 18; break;
      default: this.base = 10; this.oscilacion = 2; break;
    }
  }

  async obtenerDato(): Promise<number> {
    return this.base + (Math.random() * this.oscilacion * 2 - this.oscilacion);
  }
}
