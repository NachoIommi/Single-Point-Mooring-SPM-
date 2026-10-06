import { ISensorDataProvider } from "@/domain/types/interfaces";

export class ApiDataProvider implements ISensorDataProvider {
  private url: string;
  private tipo: string;
  private static cache: Record<string, { value: number, expiresAt: number }> = {};

  constructor(tipoSensor: string) {
    this.tipo = tipoSensor;
    if (tipoSensor === "VIENTO") {
      this.url = "https://api.open-meteo.com/v1/forecast?latitude=-38.71&longitude=-62.28&current_weather=true&timezone=auto";
    } else if (tipoSensor === "OLEAJE") {
      this.url = "https://marine-api.open-meteo.com/v1/marine?latitude=-38.71&longitude=-62.28&hourly=wave_height&timezone=auto";
    } else if (tipoSensor === "CORRIENTE") {
      this.url = "https://marine-api.open-meteo.com/v1/marine?latitude=-38.71&longitude=-62.28&hourly=ocean_current_velocity&timezone=auto";
    } else {
      throw new Error(`ApiDataProvider no soporta el sensor ${tipoSensor}`);
    }
  }

  async obtenerDato(): Promise<number> {
    const now = Date.now();
    // Cache de 5 minutos
    if (ApiDataProvider.cache[this.tipo] && ApiDataProvider.cache[this.tipo].expiresAt > now) {
      const baseValue = ApiDataProvider.cache[this.tipo].value;
      // Añadimos un pequeño ruido aleatorio para que el gráfico se vea "vivo" (± 2%)
      return baseValue + (Math.random() * (baseValue * 0.04) - (baseValue * 0.02));
    }

    try {
      const response = await fetch(this.url);
      const data = await response.json();
      let newValue = 0.0;

      if (this.tipo === "VIENTO") {
        newValue = data.current_weather?.windspeed ?? 0.0;
      } else if (this.tipo === "OLEAJE") {
        const waveHeights = data.hourly?.wave_height;
        if (Array.isArray(waveHeights) && waveHeights.length > 0) {
          newValue = waveHeights[0] ?? 0.0;
        }
      } else if (this.tipo === "CORRIENTE") {
        const currentVelocities = data.hourly?.ocean_current_velocity;
        if (Array.isArray(currentVelocities) && currentVelocities.length > 0) {
          newValue = currentVelocities[0] ?? 0.0;
        }
      }

      ApiDataProvider.cache[this.tipo] = { value: newValue, expiresAt: now + 5 * 60 * 1000 };
      return newValue;
    } catch (error) {
      console.error(`[ApiDataProvider] Error obteniendo datos para ${this.tipo}:`, error);
    }
    
    // Fallback al último valor conocido o 0
    return ApiDataProvider.cache[this.tipo]?.value ?? 0.0;
  }
}
