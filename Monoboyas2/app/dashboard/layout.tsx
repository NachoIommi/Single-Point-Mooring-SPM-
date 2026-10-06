import { getUsuarioActual } from '@/app/lib/actions';
import Sidebar from '@/app/ui/dashboard/Sidebar';
import AlertasProvider from '@/app/ui/alertas/AlertasProvider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioActual();
  const nombreUsuario = usuario?.nombre ?? 'Usuario';
  const rolUsuario = usuario?.rol ?? '';

  return (
    <div className="relative flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <Sidebar usuario={usuario} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-[var(--color-border)] flex items-center px-8 justify-between bg-[var(--color-bg)]">
          <h2 className="text-[var(--color-text-muted)] text-sm font-medium uppercase tracking-widest">
            Sistema de Monitoreo
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">{nombreUsuario}</p>
              <p className="text-xs text-[var(--color-text-faint)]">{rolUsuario.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </header>
        <AlertasProvider>
          {children}
        </AlertasProvider>
      </main>
    </div>
  );
}