'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Usuario, Monoboya, Buque } from '@/app/lib/definitions';

export default function IniciarOperacion({
  usuario, monoboyas, buques,
}: {
  usuario: Usuario;
  monoboyas: Monoboya[];
  buques: Buque[];
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<'CARGA' | 'DESCARGA'>('DESCARGA');
  const [monoboyaId, setMonoboyaId] = useState<number | ''>('');
  const [buqueNroIMO, setBuqueNroIMO] = useState<number | ''>('');
  const [operadorBuqueDni, setOperadorBuqueDni] = useState('');
  const [operadorPlantaDni, setOperadorPlantaDni] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!monoboyaId || !buqueNroIMO || !operadorBuqueDni || !operadorPlantaDni) {
      setError('Completá todos los campos.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/operaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          monoboyaId,
          buqueNroIMO,
          operadorLanchaDni: usuario.dni,
          operadorBuqueDni: Number(operadorBuqueDni),
          operadorPlantaDni: Number(operadorPlantaDni),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'No se pudo iniciar la operación.');
        setEnviando(false);
        return;
      }
      router.refresh(); // recarga → ahora con operacionId → muestra el monitoreo
    } catch {
      setError('Error de conexión.');
      setEnviando(false);
    }
  };

  const labelCls = 'block text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)] mb-1.5';
  const fieldCls = 'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]';

  return (
    <section className="p-8 max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Iniciar operación</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          No tenés una operación activa. Completá los datos para iniciar la transferencia.
        </p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label className={labelCls}>Tipo de transferencia</label>
          <select className={fieldCls} value={tipo} onChange={(e) => setTipo(e.target.value as 'CARGA' | 'DESCARGA')}>
            <option value="DESCARGA">Descarga (buque → instalación)</option>
            <option value="CARGA">Carga (instalación → buque)</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Monoboya</label>
          <select className={fieldCls} value={monoboyaId} onChange={(e) => setMonoboyaId(Number(e.target.value))}>
            <option value="">Seleccioná una monoboya disponible…</option>
            {monoboyas.map((m) => (
              <option key={m.id} value={m.id}>Monoboya #{m.id} · Planta {m.plantaId}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Buque</label>
          <select className={fieldCls} value={buqueNroIMO} onChange={(e) => setBuqueNroIMO(Number(e.target.value))}>
            <option value="">Seleccioná un buque…</option>
            {buques.map((b) => (
              <option key={b.nroIMO} value={b.nroIMO}>{b.nombre} (IMO {b.nroIMO})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>DNI operador buque</label>
            <input type="number" className={fieldCls} value={operadorBuqueDni}
              onChange={(e) => setOperadorBuqueDni(e.target.value)} placeholder="Ej. 40123456" />
          </div>
          <div>
            <label className={labelCls}>DNI operador planta</label>
            <input type="number" className={fieldCls} value={operadorPlantaDni}
              onChange={(e) => setOperadorPlantaDni(e.target.value)} placeholder="Ej. 38987654" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Operador lancha (vos)</label>
          <input className={`${fieldCls} opacity-60`} value={`${usuario.nombre} · DNI ${usuario.dni}`} readOnly />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-alerta-rojo)' }}>{error}</p>
        )}

        <button
          onClick={submit}
          disabled={enviando}
          className="mt-2 w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--color-primary)' }}
        >
          {enviando ? 'Iniciando…' : 'Iniciar operación'}
        </button>
      </div>
    </section>
  );
}