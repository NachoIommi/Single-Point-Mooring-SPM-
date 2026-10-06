'use client';

import { useState, useEffect } from 'react';
import type { Operacion, Alerta, Medicion, Sensor } from '@/app/lib/definitions';
import { useAlertas } from '@/app/ui/alertas/AlertasProvider';

// Tipos de sensor reales del back (Sensor.TipoSensor) que le interesan a la lancha
const TIPOS_LANCHA = ['VIENTO', 'CORRIENTE', 'OLEAJE', 'AMARRE', 'ORIENTACION'] as const;
const LABELS: Record<string, string> = {
  VIENTO: 'Viento',
  CORRIENTE: 'Corriente',
  OLEAJE: 'Oleaje',
  AMARRE: 'Tensión de amarre',
  ORIENTACION: 'Orientación',
};

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function LanchaDashboard({
  operacion, sensores, alertasIniciales, nombreUsuario,
}: {
  operacion: Operacion;
  sensores: Sensor[];
  alertasIniciales: Alerta[];
  nombreUsuario: string;
}) {
  const [mediciones, setMediciones] = useState<Record<number, Medicion>>({});
  const [alertas, setAlertas] = useState<Alerta[]>(alertasIniciales);
  const [hora, setHora] = useState<string | null>(null);
  const { notificar } = useAlertas();

  // Polling de mediciones cada 2s — reusa la ruta que ya funciona en TelemetriaEnVivo
  useEffect(() => {
    let activo = true;
    async function traer() {
      try {
        const res = await fetch(`/api/operaciones/${operacion.id}/mediciones`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: Medicion[] = await res.json();
        if (!activo || !Array.isArray(data)) return;
        setHora(new Date().toLocaleTimeString('es-AR', { hour12: false }));
        // último valor por sensor (las mediciones vienen ASC por timestamp)
        const mapa: Record<number, Medicion> = {};
        data.forEach((m) => { mapa[m.sensorId] = m; });
        setMediciones(mapa);
      } catch { /* mantener último valor */ }
    }
    traer();
    const t = setInterval(traer, 2000);
    return () => { activo = false; clearInterval(t); };
  }, [operacion.id]);

  // Polling de alertas cada 5s — la lancha avisa las CRITICAS
  useEffect(() => {
    let activo = true;
    async function traer() {
      try {
        const res = await fetch(`/api/alertas?operacionId=${operacion.id}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: Alerta[] = await res.json();
        if (!activo || !Array.isArray(data)) return;
        setAlertas((prev) => {
          const idsPrevios = new Set(prev.map((a) => a.id));
          data.forEach((a) => {
            if (!idsPrevios.has(a.id) && a.tipo === 'CRITICA' && a.estado === 'PENDIENTE') {
              notificar({
                nivel: 'rojo',
                sensorLabel: a.sensorId != null ? String(a.sensorId) : 'Sistema',
                valor: a.valorMedicion ?? '—',
                unidad: '',
                mensaje: a.mensaje,
              });
            }
          });
          return data;
        });
      } catch { /* sin cambios */ }
    }
    traer();
    const t = setInterval(traer, 5000);
    return () => { activo = false; clearInterval(t); };
  }, [operacion.id, notificar]);

  // Mapear cada tipo de la lancha a su sensor (de la monoboya) y su última medición
  const lecturas = TIPOS_LANCHA.map((tipo) => {
    const sensor = sensores.find((s) => s.tipo === tipo);
    const medicion = sensor ? mediciones[sensor.id] : undefined;
    return { tipo, label: LABELS[tipo], unidad: sensor?.unidad, medicion };
  });

  const criticasPendientes = alertas.filter((a) => a.tipo === 'CRITICA' && a.estado === 'PENDIENTE');

  return (
    <section className="p-8 max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Panel de Lancha</h1>
          <p className="text-xs text-[var(--color-text-muted)]">{nombreUsuario}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-alerta-verde)] animate-pulse" />
          {hora ?? '--:--:--'}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)]">
            Operación #{operacion.id}
          </span>
          <p className="font-bold mt-0.5">{operacion.tipo} · Monoboya #{operacion.monoboyaId}</p>
          <p className="text-xs font-mono text-[var(--color-text-muted)]">Buque IMO {operacion.buqueNroIMO ?? '—'}</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--color-alerta-verde)' }}>
          {operacion.estado}
        </span>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-bold">Condiciones de maniobra</h2>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {lecturas.map(({ tipo, label, unidad, medicion }) => (
            <div key={tipo} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col items-center text-center gap-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)]">{label}</span>
              <span className="text-4xl font-bold font-mono tabular-nums mt-1">
                {medicion ? medicion.valor.toFixed(1) : '—'}
              </span>
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                {medicion?.unidad ?? unidad ?? ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-bold">Alertas críticas</h2>
          {criticasPendientes.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-alerta-rojo)' }}>
              {criticasPendientes.length} activa{criticasPendientes.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        {criticasPendientes.length === 0 ? (
          <div className="rounded-xl p-5 flex items-center gap-3 border"
            style={{ borderColor: 'var(--color-alerta-verde)', background: 'rgba(34,197,94,0.06)' }}>
            <span className="w-2 h-2 rounded-full bg-[var(--color-alerta-verde)]" />
            <p className="text-sm font-medium" style={{ color: 'var(--color-alerta-verde)' }}>
              Sin alertas críticas activas
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {criticasPendientes.map((a) => (
              <div key={a.id} className="rounded-xl p-5 border"
                style={{ borderColor: 'var(--color-alerta-rojo)', background: 'rgba(239,68,68,0.08)' }}>
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-alerta-rojo)' }}>
                    {a.estado}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-faint)]">{fmtFecha(a.generadaEn)}</span>
                </div>
                <p className="font-bold">{a.mensaje}</p>
                {a.sensorId && (
                  <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1">
                    Sensor: {a.sensorId}{a.valorMedicion != null && ` · ${a.valorMedicion}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}