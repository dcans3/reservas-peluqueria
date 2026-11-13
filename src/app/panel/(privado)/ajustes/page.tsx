// /panel/ajustes sin pestaña → la primera, Negocio.
// (El layout de ajustes ya ha comprobado que es admin.)

import { redirect } from "next/navigation";

export default function PaginaAjustes() {
  redirect("/panel/ajustes/negocio");
}
