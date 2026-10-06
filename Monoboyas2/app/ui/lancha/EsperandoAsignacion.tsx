export default function EsperandoAsignacion({ nombreUsuario }: { nombreUsuario: string }) {
  return (
    <section className="p-8 max-w-lg">
      <h1 className="text-lg font-bold">Hola, {nombreUsuario}</h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-2">
        No tenés ninguna operación asignada todavía. Cuando la planta prepare una operación
        y te asigne como operador de lancha, vas a poder confirmarla acá.
      </p>
    </section>
  );
}