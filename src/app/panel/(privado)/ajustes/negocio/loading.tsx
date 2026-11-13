// "Cargando…" de esta pestaña. Va en la misma carpeta que su page.tsx para
// que Next.js lo use en cualquier navegación a la pestaña, también al volver
// a entrar en ella. El título "Ajustes" y las pestañas se quedan quietos.

import { Cargando } from "@/components/panel/Cargando";

export default function CargandoPestana() {
  return <Cargando />;
}