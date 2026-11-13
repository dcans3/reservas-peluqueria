// /panel: de momento, la bienvenida. Aquí irá la agenda.

import { crearClienteServidor, exigirPersonal } from "@/lib/supabase/sesion";

export default async function PaginaAgenda() {
  const persona = await exigirPersonal();

  // Cliente con la sesión de la persona: la tabla negocio solo se puede leer
  // porque es del personal (política "solo personal").
  const supabase = await crearClienteServidor();
  const { data: negocio, error } = await supabase
    .from("negocio")
    .select("nombre")
    .maybeSingle();

  if (error) {
    throw new Error(`No se ha podido leer el negocio: ${error.message}`);
  }

  return (
    <section className="rounded-2xl border border-renglon bg-hoja p-5 sm:p-8">
      <p className="text-sm font-bold tracking-wide text-laton uppercase">
        {negocio?.nombre ?? "Negocio sin nombre"}
      </p>
      <h1 className="rotulo mt-2 text-5xl sm:text-6xl">
        Hola, {persona.nombre}
      </h1>
      <p className="mt-4 text-tinta-suave">Aquí verás la agenda del día.</p>
    </section>
  );
}
