import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/app/lib/actions';
import { fetchOperacionAsignada, fetchAlertasDeOperacion, fetchSensores } from '@/app/lib/data';
import EsperandoAsignacion from '@/app/ui/lancha/EsperandoAsignacion';
import ConfirmarInicio from '@/app/ui/lancha/ConfirmarInicio';
import LanchaDashboard from '@/app/ui/lancha/LanchaDashboard';

export default async function LanchaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/');

  const operacion = await fetchOperacionAsignada(usuario.dni);

  if (!operacion) {
    return <EsperandoAsignacion nombreUsuario={usuario.nombre} />;
  }

  if (operacion.estado === 'PREPARADA') {
    return <ConfirmarInicio operacion={operacion} operadorLanchaDni={usuario.dni} nombreUsuario={usuario.nombre} />;
  }

  if (operacion.estado === 'ENCURSO' || operacion.estado === 'DETENIDA') {
    const [alertas, sensores] = await Promise.all([
      fetchAlertasDeOperacion(operacion.id),
      fetchSensores({ monoboyaId: operacion.monoboyaId ?? undefined, activo: true }),
    ]);
    return (
      <LanchaDashboard
        operacion={operacion}
        sensores={sensores}
        alertasIniciales={alertas}
        nombreUsuario={usuario.nombre}
      />
    );
  }

  // PLANIFICADA aún sin preparar, o cualquier estado raro
  return <EsperandoAsignacion nombreUsuario={usuario.nombre} />;
}