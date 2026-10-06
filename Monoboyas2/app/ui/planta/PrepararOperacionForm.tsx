'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Operacion, Monoboya } from '@/app/lib/definitions';

export default function PrepararOperacionForm({
  operaciones, monoboyas, operadoresLancha, usuario,
}: {
  operaciones: Operacion[];
  monoboyas: Monoboya[];
  operadoresLancha: { dni: number; nombre: string }[];
  usuario: { dni: number; nombre: string };
}) {
  const router = useRouter();
  const [operacionId, setOperacionId] = useState<number | ''>(operaciones[0]?.id ?? '');
  const [monoboyaId, setMonoboyaId] = useState<number | ''>('');
  const [operadorLanchaDni, setOperadorLanchaDni] = useState<number | ''>('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const submit = async () => {
    setError(null);
    if (!operacionId || !monoboyaId || !operadorLanchaDni) { setError('Completá todos los campos.'); return; }
    setEnviando(true);
    try {
      const res = await fetch(`/api/operaciones/${operacionId}/preparar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monoboyaId,
          operadorPlantaDni: usuario.dni,
          operadorLanchaDni: Number(operadorLanchaDni),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : data?.error?.message ?? 'No se pudo preparar la operación.');
        return;
      }
      router.refresh();
    } catch { setError('Error de conexión.'); }
    finally { setEnviando(false); }
  };

  const labelCls = 'block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)] mb-1.5';
  const fieldCls = 'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]';

  return (
    <section className="p-8 max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Preparar operación</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Hay {operaciones.length} operación{operaciones.length > 1 ? 'es' : ''} planificada{operaciones.length > 1 ? 's' : ''} esperando que asignes monoboya y lancha.
        </p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label className={labelCls}>Operación</label>
          <select className={fieldCls} value={operacionId} onChange={(e) => setOperacionId(Number(e.target.value))}>
            {operaciones.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.id} · {o.tipo} · Buque IMO {o.buqueNroIMO}{o.plantaId == null ? '' : ` · Planta ${o.plantaId}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Monoboya disponible</label>
          <select className={fieldCls} value={monoboyaId} onChange={(e) => setMonoboyaId(Number(e.target.value))}>
            <option value="">Seleccioná una monoboya…</option>
            {monoboyas.map((m) => <option key={m.id} value={m.id}>Monoboya #{m.id}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Operador de lancha</label>
          <select className={fieldCls} value={operadorLanchaDni} onChange={(e) => setOperadorLanchaDni(Number(e.target.value))}>
            <option value="">Seleccioná un operador…</option>
            {operadoresLancha.map((o) => <option key={o.dni} value={o.dni}>{o.nombre} · DNI {o.dni}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Operador de planta (vos)</label>
          <input className={`${fieldCls} opacity-60`} value={`${usuario.nombre} · DNI ${usuario.dni}`} readOnly />
        </div>

        {error && <p className="text-sm" style={{ color: 'var(--color-alerta-rojo)' }}>{error}</p>}

        <button onClick={submit} disabled={enviando}
          className="mt-1 w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--color-primary)' }}>
          {enviando ? 'Preparando…' : 'Preparar operación'}
        </button>
      </div>
    </section>
  );
}