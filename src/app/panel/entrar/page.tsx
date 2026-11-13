// /panel/entrar: login del personal con email y contraseña.
// Sin "He olvidado mi contraseña" de momento: se cambian desde Supabase.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { comprobarAcceso } from "@/lib/supabase/sesion";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = {
  title: "Entrar al panel",
};

export default function PaginaEntrar({ searchParams }: PageProps<"/panel/entrar">) {
  return (
    <main className="flex flex-1 items-start justify-center p-4 sm:items-center sm:p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-renglon bg-hoja">
        <div className="bg-verde px-5 pt-6 pb-5 text-hoja">
          <h1 className="rotulo text-5xl">Panel</h1>
          <p className="mt-1.5 text-[15px] text-verde-claro">
            Entra con tu email y tu contraseña.
          </p>
        </div>

        <div className="grid gap-4 p-5">
          {/* Leer cookies y la URL tiene que ir dentro de <Suspense> (Cache Components). */}
          <Suspense fallback={null}>
            <SiYaHaySesion />
            <Aviso searchParams={searchParams} />
          </Suspense>

          <FormularioEntrar />
        </div>
      </div>
    </main>
  );
}

/** Si ya ha iniciado sesión, no tiene sentido mostrar el login. */
async function SiYaHaySesion() {
  const acceso = await comprobarAcceso();

  if (acceso.estado === "ok") redirect("/panel");
  if (acceso.estado === "sin-acceso") redirect("/panel/salir");

  return null;
}

/** Aviso que llega desde /panel/salir. */
async function Aviso({
  searchParams,
}: {
  searchParams: PageProps<"/panel/entrar">["searchParams"];
}) {
  const { aviso } = await searchParams;
  if (aviso !== "sin-acceso") return null;

  return (
    <p
      role="alert"
      className="rounded-[10px] bg-rojo-claro px-3.5 py-3 font-bold text-rojo"
    >
      Este usuario no tiene acceso al panel
    </p>
  );
}
