'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { authenticate } from '@/app/lib/actions';

export default function Page() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">

      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/fondo_barco.png"
          alt="Fondo Buque"
          fill
          className="object-cover brightness-[0.35]"
          priority
        />
      </div>

      {/* Tarjeta */}
      <div className="z-10 w-full max-w-[400px] rounded-sm bg-[#1a1a1a]/90 p-10 shadow-2xl backdrop-blur-sm flex flex-col">

        <div className="mb-10 text-center">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">
            Iniciar sesión
          </h2>
        </div>

        {/* formAction en lugar de authenticate directo */}
        <form action={formAction} className="space-y-8">
          <div className="group text-left">
            <label className="block text-xs text-gray-500 mb-1 transition-colors group-focus-within:text-blue-500">
              Usuario (DNI)
            </label>
            <input
              type="text"
              name="username"
              required
              className="w-full bg-transparent border-b border-gray-700 py-1 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="group text-left">
            <label className="block text-xs text-gray-500 mb-1 transition-colors group-focus-within:text-blue-500">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-transparent border-b border-gray-700 py-1 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Mensaje de error del backend */}
          {errorMessage && (
            <p className="text-red-400 text-sm text-center">
              {errorMessage}
            </p>
          )}

          <div className="text-right">
            <a href="#" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#0070f3] hover:bg-blue-600 py-3 text-sm font-semibold text-white rounded-sm transition-all duration-300 disabled:opacity-50"
          >
            {isPending ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-10 text-center text-xs">
          <span className="text-gray-500 text-[11px]">¿Nuevo usuario? </span>
          <a href="#" className="text-blue-500 hover:text-blue-400 font-medium ml-1">
            Solicitar acceso
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 right-10 flex gap-6 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
        <a href="#" className="hover:text-white transition-colors">Ayuda y contacto</a>
        <a href="#" className="hover:text-white transition-colors">Términos de uso</a>
        <a href="#" className="hover:text-white transition-colors">Privacidad y cookies</a>
      </div>
    </main>
  );
}