import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/app/lib/actions';
import { RUTA_INICIAL } from '@/app/lib/roles';

export default async function DashboardPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/');
  redirect(RUTA_INICIAL[usuario.rol]); // te manda a tu zona
}
