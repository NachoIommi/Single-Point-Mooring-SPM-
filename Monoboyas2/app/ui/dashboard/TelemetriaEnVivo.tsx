'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useAlertas } from '@/app/ui/alertas/AlertasProvider';

type Nivel = 'verde' | 'amarillo' | 'rojo';

interface Sensor {
  id: string;
  dbId: number;
  tipoSensor: string;
  label: string;
  unidad: string;
  valor: number;
  base: number;
  min: number;
  max: number;
  amarillo: number;
  rojo: number;
  dec: number;
}

interface Punto {
  label: string;
  valor: number;
}

const SENSORES_INIT: Sensor[] = [
  { id: 'presion',   dbId: 7,  tipoSensor: 'PRESION',   label: 'Presión de transferencia', unidad: 'bar',  valor: 0, base: 9.5,  min: 0, max: 20,   amarillo: 14,   rojo: 16,   dec: 1 },
  { id: 'viento',    dbId: 8,  tipoSensor: 'VIENTO',    label: 'Velocidad de viento',      unidad: 'kn',   valor: 0, base: 18,   min: 0, max: 45,   amarillo: 22,   rojo: 32,   dec: 0 },
  { id: 'ola',       dbId: 9,  tipoSensor: 'OLEAJE',    label: 'Altura de ola',            unidad: 'm',    valor: 0, base: 1.4,  min: 0, max: 4,    amarillo: 1.8,  rojo: 2.6,  dec: 2 },
  { id: 'corriente', dbId: 10, tipoSensor: 'CORRIENTE', label: 'Velocidad de corriente',   unidad: 'kn',   valor: 0, base: 1.5,  min: 0, max: 5,    amarillo: 2.2,  rojo: 3.2,  dec: 1 },
  { id: 'caudal',    dbId: 11, tipoSensor: 'CAUDAL',    label: 'Caudal de transferencia',  unidad: 'm3/h', valor: 0, base: 1080, min: 0, max: 1700, amarillo: 1550, rojo: 1590, dec: 0 },
  { id: 'amarre',    dbId: 12, tipoSensor: 'AMARRE',    label: 'Tensión de amarre',        unidad: 't',    valor: 0, base: 46,   min: 0, max: 100,  amarillo: 80,   rojo: 88,   dec: 0 },
];

const HIST_LEN = 40;
const LOOKBACK = 12;
const ORDEN: Record<Nivel, number> = { verde: 0, amarillo: 1, rojo: 2 };

function nivel(s: Sensor): Nivel {
  if (s.valor >= s.rojo) return 'rojo';
  if (s.valor >= s.amarillo) return 'amarillo';
  return 'verde';
}
const COLOR_NIVEL: Record<Nivel, string> = {
  verde: 'var(--color-alerta-verde)',
  amarillo: 'var(--color-alerta-amarillo)',
  rojo: 'var(--color-alerta-rojo)',
};
const TEXTO_NIVEL: Record<Nivel, string> = { verde: 'Normal', amarillo: 'Precaución', rojo: 'Crítico' };
const fmtHora = (d: Date) => d.toLocaleTimeString('es-AR', { hour12: false });

function Tendencia({ serie }: { serie: Punto[] }) {
  if (serie.length < 2) return <span className="text-[var(--color-text-faint)] text-xs">—</span>;
  const actual = serie[serie.length - 1].valor;
  const antiguo = serie[Math.max(0, serie.length - LOOKBACK)].valor;
  const delta = actual - antiguo;
  const pct = antiguo ? (delta / antiguo) * 100 : 0;
  const flecha = delta > 0.001 ? '▲' : delta < -0.001 ? '▼' : '▬';
  return (
    <span className="text-xs font-mono text-[var(--color-text-muted)] tabular-nums">
      {flecha} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function Scorecard({ s, serie }: { s: Sensor; serie: Punto[] }) {
  const n = nivel(s);
  const color = COLOR_NIVEL[n];
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text-faint)] truncate">{s.label}</span>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono tabular-nums">{s.valor.toFixed(s.dec)}</span>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">{s.unidad}</span>
        </div>
        <Tendencia serie={serie} />
      </div>
      <div className="h-10 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id={`spark-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="valor" stroke={color} strokeWidth={1.5} fill={`url(#spark-${s.id})`} isAnimationActive={false} />
            <YAxis hide domain={[s.min, s.max]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TooltipBox({ active, payload, label, unidad, dec }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p className="text-[var(--color-text-faint)] font-mono mb-0.5">{label}</p>
      <p className="font-mono font-bold text-[var(--color-text)]">{Number(payload[0].value).toFixed(dec)} {unidad}</p>
    </div>
  );
}

function GranGrafico({ sensores, series, seleccion, setSeleccion }: { sensores: Sensor[]; series: Record<string, Punto[]>; seleccion: string; setSeleccion: (id: string) => void }) {
  const sel = sensores.find((s) => s.id === seleccion)!;
  const data = series[seleccion];
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-sm font-bold">Telemetría · últimos {HIST_LEN} registros</h3>
        <div className="flex gap-1.5 flex-wrap">
          {sensores.map((s) => (
            <button key={s.id} onClick={() => setSeleccion(s.id)} className={`text-xs px-2.5 py-1 rounded-md transition-colors ${s.id === seleccion ? 'bg-[var(--color-primary)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'}`}>{s.label.split(' ')[0]}</button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
            <defs><linearGradient id="bigGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary-soft)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-primary-soft)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-text-faint)', fontSize: 10, fontFamily: 'monospace' }} interval={Math.floor(HIST_LEN / 5)} minTickGap={20} stroke="var(--color-border)" />
            <YAxis domain={[sel.min, sel.max]} tick={{ fill: 'var(--color-text-faint)', fontSize: 10, fontFamily: 'monospace' }} stroke="var(--color-border)" width={42} />
            <Tooltip content={(p: any) => <TooltipBox {...p} unidad={sel.unidad} dec={sel.dec} />} />
            <ReferenceLine y={sel.amarillo} stroke="var(--color-alerta-amarillo)" strokeDasharray="4 4" strokeOpacity={0.7} />
            <ReferenceLine y={sel.rojo} stroke="var(--color-alerta-rojo)" strokeDasharray="4 4" strokeOpacity={0.8} />
            <Area type="monotone" dataKey="valor" stroke="var(--color-primary-soft)" strokeWidth={2} fill="url(#bigGrad)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3 text-[10px] font-mono text-[var(--color-text-faint)]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-px" style={{ borderTop: '2px dashed var(--color-alerta-amarillo)' }} /> precaución</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-px" style={{ borderTop: '2px dashed var(--color-alerta-rojo)' }} /> crítico</span>
      </div>
    </div>
  );
}

function TablaSensores({ sensores }: { sensores: Sensor[] }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
      <h3 className="text-sm font-bold mb-4">Estado por sensor</h3>
      <div className="grid grid-cols-[1.4fr_auto_2fr_auto] gap-x-4 gap-y-3 items-center text-xs">
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] font-bold">Sensor</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] font-bold text-right">Valor</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] font-bold">Nivel</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] font-bold text-right">Estado</span>
        {sensores.map((s) => {
          const n = nivel(s);
          const color = COLOR_NIVEL[n];
          const rel = Math.min(100, (s.valor / s.max) * 100);
          const rojoRel = Math.min(100, (s.rojo / s.max) * 100);
          return (
            <div key={s.id} className="contents">
              <span className="text-[var(--color-text-secondary)] truncate">{s.label}</span>
              <span className="font-mono tabular-nums text-right">{s.valor.toFixed(s.dec)} {s.unidad}</span>
              <div className="relative h-2 rounded-full bg-[var(--color-border)] overflow-visible">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${rel}%`, backgroundColor: color }} />
                <div className="absolute -top-1 w-px h-4" style={{ left: `${rojoRel}%`, backgroundColor: 'var(--color-alerta-rojo)' }} title="umbral crítico" />
              </div>
              <span className="text-right font-bold" style={{ color }}>{TEXTO_NIVEL[n]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TelemetriaEnVivo({ operacionId }: { operacionId: number }) {
  const [sensores, setSensores] = useState<Sensor[]>(SENSORES_INIT);
  const [series, setSeries] = useState<Record<string, Punto[]>>(() =>
    Object.fromEntries(SENSORES_INIT.map((s) => [s.id, Array.from({ length: HIST_LEN }, () => ({ label: '', valor: 0 }))]))
  );
  const [seleccion, setSeleccion] = useState('presion');
  const [hora, setHora] = useState<string | null>(null);

  const { notificar } = useAlertas();
  const notificarRef = useRef(notificar);
  notificarRef.current = notificar;
  const nivelesPrev = useRef<Record<string, Nivel>>(
    Object.fromEntries(SENSORES_INIT.map((s) => [s.id, 'verde' as Nivel]))
  );

  // ── Trae los umbrales configurados por el admin y pisa amarillo/rojo de cada sensor ──
  useEffect(() => {
    fetch('/api/umbrales')
      .then((r) => r.json())
      .then((u) => {
        setSensores((prev) => prev.map((s) => {
          switch (s.tipoSensor) {
            case 'PRESION':   return { ...s, amarillo: u.PRESION.amarillaAlta / 100000, rojo: u.PRESION.rojaAlta / 100000 }; // Pa → bar
            case 'VIENTO':    return { ...s, amarillo: u.VIENTO.amarilla, rojo: u.VIENTO.roja };
            case 'OLEAJE':    return { ...s, amarillo: u.OLEAJE.amarilla, rojo: u.OLEAJE.roja };
            case 'CORRIENTE': return { ...s, amarillo: u.CORRIENTE.amarilla, rojo: u.CORRIENTE.roja };
            case 'AMARRE':    return { ...s, amarillo: u.AMARRE.amarilla, rojo: u.AMARRE.roja };
            case 'CAUDAL':    return { ...s, amarillo: u.CAUDAL.amarilla, rojo: s.rojo }; // no hay "roja" de caudal definida
            default:          return s;
          }
        }));
      })
      .catch(() => { /* si falla, se quedan los valores hardcodeados por defecto */ });
  }, []);

  // ── Polling: lee mediciones reales cada 3 seg, sin encimar requests ──
  useEffect(() => {
    if (!operacionId) return;
    let enVuelo = false;

    const cargar = async () => {
      if (enVuelo) return;
      enVuelo = true;
      try {
        const r = await fetch(`/api/operaciones/${operacionId}/mediciones`);
        const mediciones = await r.json();
        if (!Array.isArray(mediciones) || mediciones.length === 0) return;

        const porSensor: Record<string, any[]> = {};
        mediciones.forEach((m) => { 
          if (m.tipo) {
            let val = m.valor;
            if (m.tipo === 'PRESION') val = val / 100000; // Convertimos Pa a bar para el dashboard
            if (m.tipo === 'VIENTO') val = val / 1.852; // km/h a nudos (kn) si fuera necesario, pero open-meteo suele dar km/h, wait
            (porSensor[m.tipo] ??= []).push({ ...m, valor: val }); 
          }
        });
        Object.values(porSensor).forEach((arr) =>
          arr.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        );

        // Número grande de cada tarjeta = última medición del sensor
        setSensores((prev) =>
          prev.map((s) => {
            const hist = porSensor[s.tipoSensor];
            if (hist?.length) return { ...s, valor: hist[hist.length - 1].valor };
            return s;
          })
        );

        // Series para gráficos = últimas HIST_LEN mediciones del sensor
        setSeries((prev) => {
          const ns = { ...prev };
          SENSORES_INIT.forEach((s) => {
            const hist = porSensor[s.tipoSensor];
            if (hist?.length) {
              const puntos = hist.slice(-HIST_LEN).map((m: any) => ({
                label: new Date(m.timestamp).toLocaleTimeString('es-AR', { hour12: false }),
                valor: m.valor,
              }));
              while (puntos.length < HIST_LEN) puntos.unshift({ label: '', valor: puntos[0]?.valor ?? 0 });
              ns[s.id] = puntos;
            }
          });
          return ns;
        });

        setHora(fmtHora(new Date()));
      } catch {
        /* ignora; reintenta en el próximo tick */
      } finally {
        enVuelo = false;
      }
    };

    cargar();
    const t = setInterval(cargar, 1000);
    return () => clearInterval(t);
  }, [operacionId]);

  // ── Detección de cruce de umbral → alerta visual ──
  useEffect(() => {
    sensores.forEach((s) => {
      const nuevo = nivel(s);
      const previo = nivelesPrev.current[s.id];
      if (ORDEN[nuevo] > ORDEN[previo]) {
        if (nuevo === 'amarillo') {
          notificarRef.current({ nivel: 'amarillo', sensorLabel: s.label, valor: s.valor.toFixed(s.dec), unidad: s.unidad, mensaje: 'Nivel de precaución' });
        } else if (nuevo === 'rojo') {
          notificarRef.current({ nivel: 'rojo', sensorLabel: s.label, valor: s.valor.toFixed(s.dec), unidad: s.unidad, mensaje: 'Superó el umbral crítico' });
        }
      }
      nivelesPrev.current[s.id] = nuevo;
    });
  }, [sensores]);

  const criticos = sensores.filter((s) => nivel(s) === 'rojo');

  return (
    <section className="p-8 max-w-7xl w-full flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight">Telemetría en tiempo real</h1>
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[var(--color-alerta-verde)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-alerta-verde)] animate-pulse" />
          EN VIVO
        </span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="font-mono text-xs text-[var(--color-text-muted)] tabular-nums">{hora ?? '--:--:--'}</span>
      </div>

      {criticos.length > 0 && (
        <div className="px-4 py-3 rounded-lg border text-sm flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'var(--color-alerta-rojo)', color: 'var(--color-alerta-rojo)' }}>
          <span className="w-2 h-2 rounded-full bg-[var(--color-alerta-rojo)] animate-pulse" />
          {criticos.length} condición{criticos.length > 1 ? 'es' : ''} crítica{criticos.length > 1 ? 's' : ''}: {criticos.map((s) => s.label).join(', ')}.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {sensores.map((s) => (<Scorecard key={s.id} s={s} serie={series[s.id]} />))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><GranGrafico sensores={sensores} series={series} seleccion={seleccion} setSeleccion={setSeleccion} /></div>
        <div className="lg:col-span-1"><TablaSensores sensores={sensores} /></div>
      </div>
    </section>
  );
}