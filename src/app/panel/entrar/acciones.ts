"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/sesion";

export type EstadoEntrar = {
  error: string | null;
  email: string; // para no tener que volver a escribirlo si hay un error
};

/** Inicia sesión con email y contraseña. Si va bien, lleva a /panel. */
export async function entrar(
  _estadoAnterior: EstadoEntrar,
  formData: FormData
): Promise<EstadoEntrar> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu email y tu contraseña", email };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") {
      return { error: "Email o contraseña incorrectos", email };
    }
    if (error.status === 429) {
      return {
        error: "Demasiados intentos seguidos. Espera unos minutos.",
        email,
      };
    }
    // Otro problema (conexión, Supabase caído...). Al registro solo va el
    // mensaje de Supabase, nunca el email ni la contraseña.
    console.error("Error al iniciar sesión:", error.code, error.message);
    return {
      error: "No se ha podido entrar. Inténtalo de nuevo en unos minutos.",
      email,
    };
  }

  // Si la persona no está en la tabla personal, el layout del panel la
  // mandará a /panel/salir, que cierra la sesión y avisa.
  redirect("/panel");
}
