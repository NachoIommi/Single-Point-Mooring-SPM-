'use client';

import { useState, useEffect } from 'react';
import type { UmbralesConfig } from '@/app/lib/umbrales-store';

const CAMPOS: { tipo: keyof UmbralesConfig; label: string; campos: { key: string; label: string }[] }[] = [
  { tipo: 'VIENTO',      label: 'Viento',           campos: [{ key: 'amarilla', label: 'Amarilla' }, { key: 'roja', label: 'Roja' }] },
  { tipo: 'OLEAJE',      label: 'Oleaje',            campos: [{ key: 'amarilla', label: 'Amarilla' }, { key: 'roja', label: 'Roja' }] },
  { tipo: 'CORRIENTE',   label: 'Corriente',         campos: [{ key: 'amarilla', label: 'Amarilla' }, { key: 'roja', label: 'Roja' }] },
  { tipo: 'AMARRE',      label: 'Tensión de amarre', campos: [{ key: 'amarilla', label: 'Amarilla' }, { key: 'roja', label: 'Roja' }] },
  { tipo: 'TENSION',     label: 'Tensión (sensor)',  campos: [{ key: 'amarilla', label: 'Amarilla' }, { key: 'roja', label: 'Roja' }] },
  { tipo: 'ORIENTACION', label: 'Orientación',       campos: [{ key: 'amarilla', label: 'Amarilla' }, { key: 'roja', label: 'Roja' }] },
  { tipo: 'CAUDAL',      label: 'Caudal',            campos: [{ key: 'amarilla', label: 'Amarilla' }] },
  { tipo: 'PRESION',     label: 'Presión',           campos: [
      { key: 'amarillaAlta', label: 'Amarilla (alta)' },
      { key: 'rojaAlta', label: 'Roja (alta)' },
      { key: 'rojaBaja', label: 'Roja (baja)' },
      { key: 'rojaDiscrepancia', label: 'Discrepancia' },
    ] },
];

export default function UmbralesForm() {
  const [umbrales, setUmbralesState] = useState<UmbralesConfig | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/umbrales').then((r) => r.json()).then(setUmbralesState);
  }, []);

  const cambiarCampo = (tipo: keyof UmbralesConfig, campo: string, valor: string) => {
    setUmbralesState((prev) => prev && { ...prev, [tipo]: { ...prev[tipo], [campo]: Number(valor) } });
  };

  const guardar = async () => {
    if (!umbrales) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/umbrales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(umbrales),
      });
      setMensaje(res.ok ? 'Umbrales actualizados (solo afecta el front).' : 'No se pudo guardar.');
    } catch {
      setMensaje('Error de conexión.');
    } finally {
      setGuardando(false);
    }
  };

  if (!umbrales) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 text-sm text-[var(--color-text-muted)]">
        Cargando umbrales…
      </div>
    );
  }

  const labelCls = 'block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)] mb-1';
  const fieldCls = 'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-primary)]';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold">Umbrales de alerta</h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Solo cambia los colores acá en el front. No modifica las alertas reales que genera el backend.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAMPOS.map(({ tipo, label, campos }) => (
          <div key={tipo} className="border border-[var(--color-border)] rounded-lg p-3">
            <p className="text-xs font-bold mb-2">{label}</p>
            <div className="grid grid-cols-2 gap-2">
              {campos.map(({ key, label: campoLabel }) => (
                <div key={key}>
                  <label className={labelCls}>{campoLabel}</label>
                  <input
                    type="number"
                    className={fieldCls}
                    value={(umbrales[tipo] as Record<string, number>)[key]}
                    onChange={(e) => cambiarCampo(tipo, key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {mensaje && <p className="text-sm" style={{ color: 'var(--color-alerta-verde)' }}>{mensaje}</p>}

      <button onClick={guardar} disabled={guardando}
        className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50"
        style={{ background: 'var(--color-primary)' }}>
        {guardando ? 'Guardando…' : 'Guardar umbrales'}
      </button>
    </div>
  );
}