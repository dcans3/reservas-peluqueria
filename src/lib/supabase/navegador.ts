// Cliente de Supabase para el NAVEGADOR (componentes con "use client").
//
// Usa solo la clave pública: lo que puede hacer lo limita la seguridad por
// filas (RLS) de la base de datos. Solo para el panel del negocio: la web
// pública NO accede a Supabase desde el navegador, todo pasa por /api.
//
// De momento no lo usa ningún archivo: el login va por el servidor.

import { createBrowserClient } from "@supabase/ssr";
import { clavesPublicasSupabase } from "./claves";

export function crearClienteNavegador() {
  const { url, clavePublica } = clavesPublicasSupabase();
  return createBrowserClient(url, clavePublica);
}
