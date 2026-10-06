import CrearUsuarioForm from './CrearUsuarioForm';
import PlanificarOperacionForm from '@/app/ui/admin/PlanificarOperacionForm';
import UmbralesForm from '@/app/ui/admin/UmbralesForm';
import { fetchOpcionesPlanificacion, fetchOperaciones } from '@/app/lib/data';

const ESTADO_COLOR: Record<string, string> = {
  PLANIFICADA: 'var(--color-text-muted)',
  PREPARADA: 'var(--color-primary-soft)',
  ACTIVA: 'var(--color-alerta-verde)',
  PAUSADA: 'var(--color-alerta-amarillo)',
  FINALIZADA: 'var(--color-text-faint)',
};

export default async function AdminPage() {
  const [opciones, { data: operaciones }] = await Promise.all([
    fetchOpcionesPlanificacion(),
    fetchOperaciones(),
  ]);

  return (
    <main className="p-6 flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CrearUsuarioForm />
        <PlanificarOperacionForm buques={opciones.buques} plantas={opciones.plantas} />
        <UmbralesForm />
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-bold mb-4">Todas las operaciones</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] font-bold border-b border-[var(--color-border)]">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Buque</th>
                <th className="py-2 pr-4">Planta</th>
                <th className="py-2 pr-4">Monoboya</th>
                <th className="py-2 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {operaciones.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 pr-4 font-mono">#{o.id}</td>
                  <td className="py-2 pr-4">{o.tipo}</td>
                  <td className="py-2 pr-4 font-mono">{o.buqueNroIMO ?? '—'}</td>
                  <td className="py-2 pr-4 font-mono">{o.plantaId ?? '—'}</td>
                  <td className="py-2 pr-4 font-mono">{o.monoboyaId ?? '—'}</td>
                  <td className="py-2 pr-4 font-bold" style={{ color: ESTADO_COLOR[o.estado] }}>{o.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}