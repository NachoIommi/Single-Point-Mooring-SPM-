'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Importamos el enrutador de Next.js
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Ícono para el botón

// Traemos el tipo Alerta de tus definiciones
type Alerta = {
  id: number;
  tipo: 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA';
  mensaje: string;
  operacionId: number;
  sensorId: string | null;
  valorMedicion: number | null;
  estado: 'PENDIENTE' | 'RECONOCIDA' | 'RESUELTA';
  generadaEn: string;
  reconocidaPorDni: number | null;
  reconocidaEn: string | null;
};

export default function AlertasPage() {
  const router = useRouter(); // Inicializamos el enrutador
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtro, setFiltro] = useState<'TODAS' | 'CRITICA' | 'ADVERTENCIA' | 'INFORMATIVA'>('TODAS');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetching de "Mis Alertas"
  const fetchAlertas = async () => {
    try {
      const response = await fetch('/api/alertas/mis-alertas');
      if (response.ok) {
        const data = await response.json();
        setAlertas(data);
      }
    } catch (error) {
      console.error('Error obteniendo alertas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling: Refresca el historial cada 5 segundos
  useEffect(() => {
    fetchAlertas();
    const intervalo = setInterval(fetchAlertas, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // 2. Lógica de Reconocimiento REAL
  const handleReconocer = async (id: number) => {
    try {
      const response = await fetch(`/api/alertas/${id}/reconocer`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchAlertas();
      } else {
        console.error('El backend no pudo procesar el reconocimiento');
      }
    } catch (error) {
      console.error('Error de red al intentar reconocer alerta:', error);
    }
  };

  // Filtrado local
  const alertasFiltradas = alertas.filter(
    (alerta) => filtro === 'TODAS' || alerta.tipo === filtro
  );

  // Función auxiliar para renderizar los badges
  const renderBadgeTipo = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'CRITICA':
        return (
          <span className="px-2 py-1 text-xs font-bold rounded bg-[var(--color-alerta-rojo)] text-white animate-pulse">
            CRÍTICA
          </span>
        );
      case 'ADVERTENCIA':
        return (
          <span className="px-2 py-1 text-xs font-bold rounded bg-[var(--color-alerta-amarillo)] text-black">
            ADVERTENCIA
          </span>
        );
      case 'INFORMATIVA':
        return (
          <span className="px-2 py-1 text-xs font-bold rounded bg-[var(--color-primary)] text-white">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 text-[var(--color-text)]">
      
      {/* Botón Volver + Encabezado */}
      <div className="flex flex-col gap-4">
        {/* Botón de navegación */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 w-fit px-3 py-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md hover:bg-white/[0.02] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary-soft)]">
            Auditoría e Historial de Alertas
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Registro histórico y trazabilidad de eventos del sistema de telemetría de monoboyas.
          </p>
        </div>
      </div>

      {/* Botonera de Filtros */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-4">
        {(['TODAS', 'CRITICA', 'ADVERTENCIA', 'INFORMATIVA'] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltro(tipo)}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              filtro === tipo
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Tabla del Historial */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-black/20 text-xs font-bold uppercase text-[var(--color-text-muted)]">
                <th className="p-4">ID / Nivel</th>
                <th className="p-4">Mensaje de Evento</th>
                <th className="p-4">Origen / Sensor</th>
                <th className="p-4">Generada En</th>
                <th className="p-4">Estado / Auditoría</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">
                    Cargando historial de alertas...
                  </td>
                </tr>
              ) : alertasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text-faint)]">
                    No se registraron alertas con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                alertasFiltradas.map((alerta) => (
                  <tr key={alerta.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Columna ID y Nivel */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-[var(--color-text-faint)] mb-1">
                        #{alerta.id}
                      </div>
                      {renderBadgeTipo(alerta.tipo)}
                    </td>

                    {/* Columna Mensaje */}
                    <td className="p-4 max-w-xs md:max-w-md">
                      <p className="font-medium text-[var(--color-text-secondary)] line-clamp-2">
                        {alerta.mensaje}
                      </p>
                      <span className="text-xs text-[var(--color-text-faint)]">
                        Operación ID: {alerta.operacionId}
                      </span>
                    </td>

                    {/* Columna Origen */}
                    <td className="p-4 font-mono text-xs whitespace-nowrap text-[var(--color-text-secondary)]">
                      {alerta.sensorId ? alerta.sensorId : 'SISTEMA'}
                    </td>

                    {/* Columna Fecha Generación */}
                    <td className="p-4 whitespace-nowrap text-xs text-[var(--color-text-muted)]">
                      {new Date(alerta.generadaEn).toLocaleString('es-AR', { 
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false 
                      })}
                    </td>

                    {/* Columna Estado y Auditoría */}
                    <td className="p-4 whitespace-nowrap">
                      {alerta.estado === 'PENDIENTE' ? (
                        <span className="text-[var(--color-alerta-amarillo)] font-medium text-xs flex items-center gap-1">
                          ● Pendiente de Atención
                        </span>
                      ) : (
                        <div>
                          <span className="text-[var(--color-alerta-verde)] font-medium text-xs block">
                            ✓ {alerta.estado}
                          </span>
                          {alerta.reconocidaEn && (
                            <span className="text-[var(--color-text-faint)] text-xs block mt-0.5">
                              A las: {new Date(alerta.reconocidaEn).toLocaleTimeString('es-AR', { hour12: false })}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Columna Acciones */}
                    <td className="p-4 whitespace-nowrap text-right">
                      {alerta.estado === 'PENDIENTE' ? (
                        <button
                          onClick={() => handleReconocer(alerta.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded bg-[var(--color-surface)] border border-[var(--color-alerta-amarillo)] text-[var(--color-alerta-amarillo)] hover:bg-[var(--color-alerta-amarillo)] hover:text-black transition-all"
                        >
                          Reconocer alerta
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--color-alerta-verde)] font-bold italic">
                          Reconocida ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}