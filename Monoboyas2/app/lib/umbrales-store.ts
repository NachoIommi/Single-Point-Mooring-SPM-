import fs from 'fs';
import path from 'path';

export type UmbralesConfig = {
  AMARRE:      { amarilla: number; roja: number };
  TENSION:     { amarilla: number; roja: number };
  PRESION:     { amarillaAlta: number; rojaAlta: number; rojaBaja: number; rojaDiscrepancia: number };
  CAUDAL:      { amarilla: number };
  OLEAJE:      { amarilla: number; roja: number };
  ORIENTACION: { amarilla: number; roja: number };
  CORRIENTE:   { amarilla: number; roja: number };
  VIENTO:      { amarilla: number; roja: number };
};

const ARCHIVO = path.join(process.cwd(), '.umbrales.json');

const DEFAULTS: UmbralesConfig = {
  AMARRE:      { amarilla: 80.0,      roja: 88.0 },
  TENSION:     { amarilla: 7.5,        roja: 8.0 },
  PRESION:     { amarillaAlta: 1_380_000.0, rojaAlta: 1_400_000.0, rojaBaja: 1_300_000.0, rojaDiscrepancia: 200_000.0 },
  CAUDAL:      { amarilla: 1550.0 }, // La "roja" del Caudal la definimos directo en el sensor init
  OLEAJE:      { amarilla: 1.5,        roja: 2.5 },
  ORIENTACION: { amarilla: 13.5,       roja: 14.8 },
  CORRIENTE:   { amarilla: 0.8,        roja: 1.2 },
  VIENTO:      { amarilla: 20.0,       roja: 35.0 },
};

export function getUmbrales(): UmbralesConfig {
  try {
    const raw = fs.readFileSync(ARCHIVO, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function setUmbrales(nuevo: Partial<UmbralesConfig>): UmbralesConfig {
  const actualizado = { ...getUmbrales(), ...nuevo };
  fs.writeFileSync(ARCHIVO, JSON.stringify(actualizado, null, 2));
  return actualizado;
}