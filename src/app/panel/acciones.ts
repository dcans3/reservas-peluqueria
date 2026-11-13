"use server";

// Server Actions del panel.
// Cada acción que lea o cambie datos debe empezar con: await exigirPersonal();
// porque el proxy NO protege las Server Actions.

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/sesion";

/** Botón "Salir": cierra la sesión y vuelve a /panel/entrar. */
export async function salir() {
  // No hace falta exigirPersonal(): cerrar la propia sesión no lee ni cambia
  // datos de nadie, y si no hay sesión simplemente no hace nada.
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/panel/entrar");
}
