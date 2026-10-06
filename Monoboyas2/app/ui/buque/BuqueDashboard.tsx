'use client';

import { useState } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';
import TelemetriaEnVivo from '@/app/ui/dashboard/TelemetriaEnVivo';

type Estado = 'ENCURSO' | 'DETENIDA';

export default function BuqueDashboard({
  operacionId, estadoInicial, operadorBuqueDni, nombre,
}: {
  operacionId: number; estadoInicial: Estado; operadorBuqueDni: number; nombre: string;
}) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutar = async (accion: 'detener' | 'reanudar') => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/operaciones/${operacionId}/${accion}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operadorBuqueDni }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? `No se pudo ${accion} la operación (HTTP ${res.status}).`);
        return;
      }
      setEstado(accion === 'detener' ? 'DETENIDA' : 'ENCURSO');
    } catch {
      setError('Error de red. Reintentá en unos segundos.');
    } finally {
      setCargando(false);
    }
  };

  const activa = estado === 'ENCURSO';

  return (
    <>
      <div className="px-8 pt-8 max-w-7xl w-full">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Control de operación · Buque</h1>
              <p className="text-xs text-[var(--color-text-muted)]">{nombre} · Operación #{operacionId}</p>
            </div>
            <span
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full"
              style={{
                color: activa ? 'var(--color-alerta-verde)' : 'var(--color-alerta-amarillo)',
                backgroundColor: activa ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
              }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${activa ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: activa ? 'var(--color-alerta-verde)' : 'var(--color-alerta-amarillo)' }}
              />
              {activa ? 'EN CURSO' : 'PAUSADA'}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => ejecutar('detener')}
              disabled={cargando || !activa}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ backgroundColor: 'var(--color-alerta-rojo)' }}
            >
              <PauseIcon className="w-5 h-5" /> Detener
            </button>
            <button
              onClick={() => ejecutar('reanudar')}
              disabled={cargando || activa}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ backgroundColor: 'var(--color-alerta-verde)' }}
            >
              <PlayIcon className="w-5 h-5" /> Reanudar
            </button>
          </div>
        </div>

        {error && (
          <div
            className="mt-4 px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'var(--color-alerta-rojo)', color: 'var(--color-alerta-rojo)' }}
          >
            {error}
          </div>
        )}
      </div>

      {activa ? (
        <TelemetriaEnVivo operacionId={operacionId} />
      ) : (
        <div className="px-8 mt-8 max-w-7xl w-full">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-10 text-center flex flex-col items-center justify-center">
            <PauseIcon className="w-12 h-12 text-[var(--color-alerta-amarillo)] mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Operación detenida</h2>
            <p className="text-[var(--color-text-muted)] max-w-md">
              La telemetría en vivo y los controles de alerta no se muestran mientras la operación está pausada.
              Reanudá la operación para volver a ver los datos en tiempo real.
            </p>
          </div>
        </div>
      )}
    </>
  );
}