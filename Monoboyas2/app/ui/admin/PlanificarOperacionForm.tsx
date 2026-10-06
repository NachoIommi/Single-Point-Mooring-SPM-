'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Buque = { nroIMO: number; nombre: string; capacidad: number };
type PlantaOpt = { id: number; nombre: string };

export default function PlanificarOperacionForm({ buques, plantas }: { buques: Buque[]; plantas: PlantaOpt[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<'CARGA' | 'DESCARGA'>('DESCARGA');
  const [buqueNroIMO, setBuqueNroIMO] = useState<number | ''>('');
  const [plantaId, setPlantaId] = useState<number | ''>('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<number | null>(null);

  const submit = async () => {
    setError(null); setOk(null);
    if (!buqueNroIMO || !plantaId) { setError('Elegí buque y planta.'); return; }
    setEnviando(true);
    try {
      const res = await fetch('/api/operaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, buqueNroIMO, plantaId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : data?.error?.message ?? 'No se pudo planificar.');
        return;
      }
      setOk(data.id);
      router.refresh();
    } catch { setError('Error de conexión.'); }
    finally { setEnviando(false); }
  };

  const labelCls = 'block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)] mb-1.5';
  const fieldCls = 'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-4">
      <h2 className="text-sm font-bold">Planificar nueva operación</h2>
      <div>
        <label className={labelCls}>Tipo</label>
        <select className={fieldCls} value={tipo} onChange={(e) => setTipo(e.target.value as 'CARGA' | 'DESCARGA')}>
          <option value="DESCARGA">Descarga (buque → planta)</option>
          <option value="CARGA">Carga (planta → buque)</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Buque que llega</label>
        <select className={fieldCls} value={buqueNroIMO} onChange={(e) => setBuqueNroIMO(Number(e.target.value))}>
          <option value="">Seleccioná un buque…</option>
          {buques.map((b) => <option key={b.nroIMO} value={b.nroIMO}>{b.nombre} (IMO {b.nroIMO})</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Planta destino</label>
        <select className={fieldCls} value={plantaId} onChange={(e) => setPlantaId(Number(e.target.value))}>
          <option value="">Seleccioná una planta…</option>
          {plantas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      {error && <p className="text-sm" style={{ color: 'var(--color-alerta-rojo)' }}>{error}</p>}
      {ok && <p className="text-sm" style={{ color: 'var(--color-alerta-verde)' }}>Operación #{ok} planificada. Queda esperando que la planta la prepare.</p>}
      <button type="button" onClick={submit} disabled={enviando}
        className="mt-1 w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50"
        style={{ background: 'var(--color-primary)' }}>
        {enviando ? 'Planificando…' : 'Planificar operación'}
      </button>
    </div>
  );
}