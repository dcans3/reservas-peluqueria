// "Cargando…" del panel: se ve al momento al cambiar de página mientras
// llegan los datos de Supabase. Lo usan los loading.tsx.

import { estilos } from "./estilos";

export function Cargando() {
  return (
    <div role="status" aria-live="polite" className={`${estilos.tarjeta} grid gap-3`}>
      <span className="sr-only">Cargando…</span>
      <p aria-hidden className="font-bold text-tinta-suave motion-safe:animate-pulse">
        Cargando…
      </p>
      {/* Renglones vacíos, como una hoja de la libreta antes de escribir. */}
      <div aria-hidden className="grid gap-2">
        <div className="h-4 w-3/4 rounded bg-papel motion-safe:animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-papel motion-safe:animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-papel motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
