// /panel/ajustes sin pestaña → la primera, Negocio.
// (El layout de ajustes ya ha comprobado que es admin.)

import { redirect } from "next/navigation";

// Esta página solo redirige: no tiene nada que enseñar al instante. Así
// Next.js no intenta comprobarlo (y no avisa en el registro).
export const instant = false;

export default function PaginaAjustes() {
  redirect("/panel/ajustes/negocio");
}
