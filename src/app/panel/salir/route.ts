// /panel/salir: aquí llega quien tiene sesión pero NO está en la tabla personal
// (lo manda exigirPersonal). Cierra su sesión y lo lleva a /panel/entrar con
// el aviso "Este usuario no tiene acceso al panel".
//
// Es un route.ts y no una página porque, mientras se dibuja una página, el
// servidor no puede borrar cookies (y cerrar sesión es borrar una cookie).
//
// Comprueba de nuevo el acceso: si quien llega SÍ es del personal, no le
// cierra la sesión. Así otra web no puede echar a nadie del panel con un
// simple enlace a esta dirección.

import { redirect } from "next/navigation";
import { comprobarAcceso, crearClienteServidor } from "@/lib/supabase/sesion";

export async function GET() {
  const acceso = await comprobarAcceso();

  if (acceso.estado === "ok") redirect("/panel");
  if (acceso.estado === "sin-sesion") redirect("/panel/entrar");

  // Tiene sesión pero no está en personal: cerrar sesión y avisar.
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/panel/entrar?aviso=sin-acceso");
}
