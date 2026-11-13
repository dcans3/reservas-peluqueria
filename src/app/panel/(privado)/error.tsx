"use client";

// Se muestra si una página del panel falla al cargar (p. ej. Supabase no
// responde). Nunca enseña el error técnico: ese va al registro del servidor.

export default function ErrorPanel({ retry }: { retry: () => void }) {
  return (
    <section className="rounded-2xl border border-renglon bg-hoja p-5 sm:p-8">
      <h1 className="rotulo text-4xl">Algo ha fallado</h1>
      <p className="mt-3 text-tinta-suave">
        No se han podido cargar los datos. Comprueba la conexión y vuelve a intentarlo.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-[10px] bg-verde px-5 py-3 font-bold text-hoja"
      >
        Volver a intentarlo
      </button>
    </section>
  );
}
