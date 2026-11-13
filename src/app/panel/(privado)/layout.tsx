// Layout de la parte privada del panel: /panel, /panel/ajustes...
//
// La carpeta (privado) va entre paréntesis: es un "grupo de rutas" y no
// cambia la dirección (/panel sigue siendo /panel). Sirve para que este
// layout NO se aplique a /panel/entrar; si no, sin sesión se redirigiría
// a sí mismo sin parar.

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { exigirPersonal } from "@/lib/supabase/sesion";
import { salir } from "../acciones";

export const metadata: Metadata = {
  title: "Panel",
};

export default function LayoutPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Cabecera />

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        {/* Leer la sesión tiene que ir dentro de <Suspense> (Cache Components). */}
        <Suspense fallback={<p className="text-tinta-suave">Cargando…</p>}>
          <ConAcceso>{children}</ConAcceso>
        </Suspense>
      </main>
    </div>
  );
}

/**
 * Comprueba sesión + tabla personal antes de mostrar la página.
 * Ojo: al moverse entre páginas del panel el layout no se vuelve a ejecutar,
 * así que cada página llama también a exigirPersonal().
 */
async function ConAcceso({ children }: { children: ReactNode }) {
  await exigirPersonal();
  return children;
}

function Cabecera() {
  const enlace =
    "rounded-lg px-3 py-2 font-bold hover:bg-verde-claro";

  return (
    <header className="border-b border-renglon bg-hoja">
      <nav
        aria-label="Panel"
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6"
      >
        <span className="rotulo mr-auto text-3xl text-verde">Panel</span>

        <Link href="/panel" className={enlace}>
          Agenda
        </Link>
        <Link href="/panel/ajustes" className={enlace}>
          Ajustes
        </Link>

        <form action={salir}>
          <button
            type="submit"
            className="rounded-[10px] border-[1.5px] border-renglon bg-hoja px-3.5 py-2 font-bold"
          >
            Salir
          </button>
        </form>
      </nav>
    </header>
  );
}
