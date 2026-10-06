'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { Operacion } from '@/app/lib/definitions';

export default function ConfirmarInicio({
  operacion, operadorLanchaDni, nombreUsuario,
}: {
  operacion: Operacion;
  operadorLanchaDni: number;
  nombreUsuario: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciar = async () => {
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/operaciones/${operacion.id}/iniciar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operadorLanchaDni }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : data?.error?.message ?? 'No se pudo iniciar la operación.');
        return;
      }
      router.refresh();
    } catch {
      setError('Error de conexión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="p-8 max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Operación lista para iniciar</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{nombreUsuario}</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)]">Operación #{operacion.id}</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary-soft)' }}>
            PREPARADA
          </span>
        </div>
        <p className="font-bold">{operacion.tipo} · Monoboya #{operacion.monoboyaId}</p>
        <p className="text-xs font-mono text-[var(--color-text-muted)]">Buque IMO {operacion.buqueNroIMO}</p>

        {error && <p className="text-sm" style={{ color: 'var(--color-alerta-rojo)' }}>{error}</p>}

        <button
          onClick={iniciar}
          disabled={enviando}
          className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--color-alerta-verde)' }}
        >
          <CheckCircleIcon className="w-5 h-5" />
          {enviando ? 'Iniciando…' : 'Confirmar e iniciar operación'}
        </button>
      </div>
    </section>
  );
}