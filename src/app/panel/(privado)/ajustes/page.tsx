// /panel/ajustes: vacía por ahora.

import { exigirPersonal } from "@/lib/supabase/sesion";

export default async function PaginaAjustes() {
  await exigirPersonal();

  return (
    <section className="rounded-2xl border border-renglon bg-hoja p-5 sm:p-8">
      <h1 className="rotulo text-5xl sm:text-6xl">Ajustes</h1>
      <p className="mt-4 text-tinta-suave">Próximamente.</p>
    </section>
  );
}
