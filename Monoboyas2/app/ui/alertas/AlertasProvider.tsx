'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type NivelAlerta = 'amarillo' | 'rojo';

export interface AlertaUI {
  id: string;
  nivel: NivelAlerta;
  sensorLabel: string;
  valor: string | number;
  unidad: string;
  mensaje: string;
  timestamp: string;
}

type Entrada = Omit<AlertaUI, 'id' | 'timestamp'>;

const AlertasCtx = createContext<{ notificar: (a: Entrada) => void } | null>(null);

export function useAlertas() {
  const ctx = useContext(AlertasCtx);
  if (!ctx) throw new Error('useAlertas debe usarse dentro de <AlertasProvider>');
  return ctx;
}

// ─── Toast (amarillo) ─────────────────────────────────────────
function ToastCard({ alerta, onClose }: { alerta: AlertaUI; onClose: () => void }) {
  return (
    <div
      className="rounded-xl p-4 shadow-2xl flex gap-3 items-start"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-alerta-amarillo)' }}
    >
      <span className="text-lg leading-none mt-0.5" style={{ color: 'var(--color-alerta-amarillo)' }}>▲</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'var(--color-alerta-amarillo)' }}>Precaución</p>
        <p className="text-sm font-medium text-[var(--color-text)] mt-0.5">{alerta.sensorLabel}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{alerta.valor} {alerta.unidad} · {alerta.timestamp}</p>
      </div>
      <button onClick={onClose} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] text-sm leading-none">✕</button>
    </div>
  );
}

// ─── Modal crítico (rojo) ─────────────────────────────────────
function ModalCritico({ alerta, restantes, onAtender }: { alerta: AlertaUI; restantes: number; onAtender: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(40,5,5,0.85)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: 'var(--color-surface)', border: '2px solid var(--color-alerta-rojo)', boxShadow: '0 0 60px -10px var(--color-alerta-rojo)' }}
      >
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-alerta-rojo)' }}>⚠</div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'var(--color-alerta-rojo)' }}>Condición crítica</p>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">{alerta.sensorLabel}</h2>
        <p className="text-[var(--color-text-muted)] mb-1">{alerta.mensaje}</p>
        <p className="font-mono text-lg font-bold mb-6" style={{ color: 'var(--color-alerta-rojo)' }}>{alerta.valor} {alerta.unidad}</p>
        <button onClick={onAtender} className="w-full py-3.5 rounded-lg font-bold text-white transition-transform hover:scale-[1.02]" style={{ background: 'var(--color-alerta-rojo)' }}>
          ATENDER EMERGENCIA
        </button>
        {restantes > 0 && <p className="text-xs text-[var(--color-text-faint)] mt-3">{restantes} emergencia(s) más en cola</p>}
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────
export default function AlertasProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<AlertaUI[]>([]);
  const [criticas, setCriticas] = useState<AlertaUI[]>([]);

  const notificar = useCallback((a: Entrada) => {
    const alerta: AlertaUI = {
      ...a,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString('es-AR', { hour12: false }),
    };
    // TODO backend: registrar la alerta (POST /alertas) — lo vemos después
    if (alerta.nivel === 'rojo') {
      setCriticas((prev) => [...prev, alerta]);
    } else {
      setToasts((prev) => [...prev, alerta]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== alerta.id)), 6000);
    }
  }, []);

  const cerrarToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const atenderCritica = () => setCriticas((prev) => prev.slice(1));
  const criticaActual = criticas[0] ?? null;

  return (
    <AlertasCtx.Provider value={{ notificar }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)]">
        {toasts.map((t) => <ToastCard key={t.id} alerta={t} onClose={() => cerrarToast(t.id)} />)}
      </div>
      {criticaActual && <ModalCritico alerta={criticaActual} restantes={criticas.length - 1} onAtender={atenderCritica} />}
    </AlertasCtx.Provider>
  );
}