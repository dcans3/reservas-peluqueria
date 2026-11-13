// Cliente de Supabase para el SERVIDOR, con la sesión guardada en cookies,
// y las comprobaciones de acceso al panel.
//
// - Usa la clave PÚBLICA. Así la seguridad por filas (es_personal) se aplica
//   siempre. En el panel nunca se usa la clave secreta.
// - La sesión se comprueba con getClaims(), que verifica la firma del token.
//   Nunca con getSession(): lee la cookie sin verificarla y se puede falsificar.
//
// "server-only" hace que la compilación falle si algún componente del
// navegador importa este archivo por error.

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { clavesPublicasSupabase } from "./claves";

export async function crearClienteServidor() {
  const almacen = await cookies();
  const { url, clavePublica } = clavesPublicasSupabase();

  return createServerClient(url, clavePublica, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesNuevas) {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacen.set(name, value, options);
          }
        } catch {
          // Mientras se dibuja una página no se pueden escribir cookies.
          // No pasa nada: el proxy (src/proxy.ts) ya renueva la sesión.
          // En Server Actions y en route.ts sí se escriben.
        }
      },
    },
  });
}

export type Persona = {
  userId: string;
  nombre: string;
  rol: string;
};

export type Acceso =
  | { estado: "sin-sesion" }
  | { estado: "sin-acceso" } // tiene sesión, pero no está en la tabla personal
  | { estado: "ok"; persona: Persona };

/**
 * Mira quién ha iniciado sesión y si está en la tabla personal.
 * cache() hace que, al dibujar una página, la comprobación se haga una sola
 * vez aunque la llamen el layout y la página. En Server Actions y en route.ts
 * cache() no guarda nada: se comprueba de nuevo en cada llamada.
 */
export const comprobarAcceso = cache(async (): Promise<Acceso> => {
  // Le dice a Next.js que esto depende de la petición y no se puede preparar
  // por adelantado. Sin esto, Supabase mira la hora (Date.now(), para ver si
  // la sesión ha caducado) y Next.js avisa con "blocking-prerender-current-time".
  await connection();

  const supabase = await crearClienteServidor();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { estado: "sin-sesion" };

  // La política "ver mi ficha" solo deja leer la fila propia.
  const { data: fila, error } = await supabase
    .from("personal")
    .select("nombre, rol")
    .eq("user_id", userId)
    .maybeSingle();

  // Un fallo de la base de datos NO es "sin acceso": no cerramos la sesión
  // de nadie por un corte de conexión. Se muestra la página de error.
  if (error) {
    throw new Error(`No se ha podido comprobar el acceso: ${error.message}`);
  }
  if (!fila) return { estado: "sin-acceso" };

  return { estado: "ok", persona: { userId, nombre: fila.nombre, rol: fila.rol } };
});

/**
 * Úsalo al principio de cada página, layout y Server Action del panel.
 * Devuelve la persona o redirige:
 * - sin sesión → /panel/entrar
 * - con sesión pero fuera de personal → /panel/salir (cierra la sesión y avisa)
 */
export async function exigirPersonal(): Promise<Persona> {
  const acceso = await comprobarAcceso();

  if (acceso.estado === "sin-sesion") redirect("/panel/entrar");
  if (acceso.estado === "sin-acceso") redirect("/panel/salir");

  return acceso.persona;
}

/**
 * Para las PÁGINAS de ajustes: como exigirPersonal(), pero además exige el
 * rol 'admin'. Un 'profesional' vuelve a /panel.
 * En las Server Actions no se usa: allí se comprueba persona.rol y se
 * devuelve un mensaje ("No tienes permiso..."), en vez de cambiar de página.
 */
export async function exigirAdmin(): Promise<Persona> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") redirect("/panel");
  return persona;
}
