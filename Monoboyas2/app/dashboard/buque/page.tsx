import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/app/lib/actions';
import { fetchOperacionAsignada } from '@/app/lib/data';
import BuqueDashboard from '@/app/ui/buque/BuqueDashboard';

export default async function BuquePage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/');

  const operacion = await fetchOperacionAsignada(usuario.dni);

  if (!operacion || !['ENCURSO', 'DETENIDA'].includes(operacion.estado)) {
    return (
      <section className="p-8 max-w-lg">
        <h1 className="text-lg font-bold">Hola, {usuario.nombre}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          No tenés ninguna operación activa asignada. Cuando se inicie una operación donde
          estés designado como operador de buque, los controles y la telemetría aparecen acá.
        </p>
      </section>
    );
  }

  return (
    <BuqueDashboard
      operacionId={operacion.id}
      estadoInicial={operacion.estado as 'ENCURSO' | 'DETENIDA'}
      operadorBuqueDni={usuario.dni}
      nombre={usuario.nombre}
    />
  );
}