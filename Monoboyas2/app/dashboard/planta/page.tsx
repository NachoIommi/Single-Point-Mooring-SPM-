import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/app/lib/actions';
import {
  fetchOperacionAsignada,
  fetchOperaciones,
  fetchMonoboyas,
  fetchOpcionesPlanificacion,
} from '@/app/lib/data';
import type { Monoboya } from '@/app/lib/definitions';
import PlantaDashboard from '@/app/ui/planta/PlantaDashboard';
import PrepararOperacionForm from '@/app/ui/planta/PrepararOperacionForm';

export default async function PlantaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/');

  // Buscamos las dos cosas en paralelo: operación en curso Y planificadas pendientes
  const [enCurso, { data: planificadas }] = await Promise.all([
    fetchOperacionAsignada(usuario.dni),
    fetchOperaciones({ estado: 'PLANIFICADA' }),
  ]);

  const operacionActiva =
    enCurso && ['ENCURSO', 'DETENIDA'].includes(enCurso.estado) ? enCurso : null;

  // Filtra por tu planta. Login todavía no manda plantaId real para usuarios sin historial
  // (gap conocido) → si viene null mostramos todas para no dejarte bloqueada/o.
  const pendientes = usuario.plantaId != null
    ? planificadas.filter((o) => o.plantaId === usuario.plantaId)
    : planificadas;

  let monoboyasDisponibles: Monoboya[] = [];
  let operadoresLancha: { dni: number; nombre: string }[] = [];

  if (pendientes.length > 0) {
    const [monoboyas, opciones] = await Promise.all([
      fetchMonoboyas({
        ...(usuario.plantaId != null ? { plantaId: usuario.plantaId } : {}),
        estado: 'DISPONIBLE',
      }),
      fetchOpcionesPlanificacion(),
    ]);
    monoboyasDisponibles = monoboyas;
    operadoresLancha = opciones.operadoresLancha;
  }

  // Nada para mostrar
  if (!operacionActiva && pendientes.length === 0) {
    return (
      <section className="p-8 max-w-lg">
        <h1 className="text-lg font-bold">Hola, {usuario.nombre}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          No tenés ninguna operación activa ni planificada esperando preparación.
          Cuando admin planifique una nueva, aparece acá.
        </p>
      </section>
    );
  }

  // Apila lo que corresponda: telemetría arriba, form de preparar abajo
  return (
    <div className="flex flex-col gap-10 pb-10">
      {operacionActiva && (
        <PlantaDashboard
          operacionId={operacionActiva.id}
          estadoInicial={operacionActiva.estado as 'ACTIVA' | 'PAUSADA'}
          nombre={usuario.nombre}
        />
      )}

      {pendientes.length > 0 && (
        <PrepararOperacionForm
          operaciones={pendientes}
          monoboyas={monoboyasDisponibles}
          operadoresLancha={operadoresLancha}
          usuario={{ dni: usuario.dni, nombre: usuario.nombre }}
        />
      )}
    </div>
  );
}