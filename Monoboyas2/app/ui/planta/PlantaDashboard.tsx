'use client';

import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import TelemetriaEnVivo from '@/app/ui/dashboard/TelemetriaEnVivo';

    type Estado = 'ENCURSO' | 'DETENIDA';

export default function PlantaDashboard({
  operacionId, estadoInicial, nombre,
}: {
  operacionId: number; estadoInicial: Estado; nombre: string;
}) {
  const [finalizada, setFinalizada] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalizar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/operaciones/${operacionId}/finalizar`, { method: 'PATCH' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof body?.error === 'string' ? body.error : body?.error?.message;
        setError(msg ?? `No se pudo finalizar la operación (HTTP ${res.status}).`);
        return;
      }
      setFinalizada(true);
    } catch {
      setError('Error de red. Reintentá en unos segundos.');
    } finally {
      setCargando(false);
      setConfirmando(false);
    }
  };

  if (finalizada) {
    return (
      <section className="p-8 max-w-lg">
        <div className="flex items-center gap-2 text-[var(--color-alerta-verde)]">
          <CheckCircleIcon className="w-6 h-6" />
          <h1 className="text-lg font-bold">Operación #{operacionId} finalizada</h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          La recepción quedó registrada. La monoboya vuelve a estar disponible para una nueva asignación.
        </p>
      </section>
    );
  }

  const activa = estadoInicial === 'ENCURSO';

  return (
    <>
      <div className="px-8 pt-8 max-w-7xl w-full">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Recepción en planta</h1>
            <p className="text-xs text-[var(--color-text-muted)]">{nombre} · Operación #{operacionId}</p>
          </div>

          {!confirmando ? (
            <button
              onClick={() => setConfirmando(true)}
              disabled={cargando || !activa}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-40 hover:brightness-110"
              style={{ backgroundColor: 'var(--color-alerta-verde)' }}
            >
              <CheckCircleIcon className="w-5 h-5" /> Confirmar recepción y finalizar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">¿Seguro? Esta acción no se puede deshacer.</span>
              <button
                onClick={finalizar}
                disabled={cargando}
                className="px-4 py-2 rounded-lg font-bold text-sm text-white disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-alerta-verde)' }}
              >
                {cargando ? 'Finalizando…' : 'Sí, finalizar'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                disabled={cargando}
                className="px-4 py-2 rounded-lg font-bold text-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Cancelar
              </button>
            </div>
          )}
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
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Operación detenida</h2>
            <p className="text-[var(--color-text-muted)] max-w-md">
              La telemetría no se muestra porque la operación fue detenida por el buque.
            </p>
          </div>
        </div>
      )}
    </>
  );
}