// Proxy (en Next.js 16 sustituye a middleware.ts).
// Va en src/ porque tiene que estar al mismo nivel que la carpeta app.
//
// Se ejecuta antes de cada petición al panel y hace dos cosas:
// 1. Renueva la sesión de Supabase si ha caducado (escribe las cookies nuevas).
// 2. Si alguien entra en /panel/... sin sesión, lo manda a /panel/entrar.
//
// Es solo la primera barrera. NO protege las Server Actions: cada página y
// cada acción del panel vuelve a comprobar con exigirPersonal().

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clavesPublicasSupabase } from "@/lib/supabase/claves";

// Páginas de /panel a las que se puede entrar sin sesión.
const RUTAS_LIBRES = ["/panel/entrar", "/panel/salir"];

export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const { url, clavePublica } = clavesPublicasSupabase();

  const supabase = createServerClient(url, clavePublica, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesNuevas, cabeceras) {
        // Las cookies nuevas van a la petición (para que la página ya las
        // vea) y a la respuesta (para que el navegador las guarde).
        for (const { name, value } of cookiesNuevas) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesNuevas) {
          respuesta.cookies.set(name, value, options);
        }
        // Cabeceras que impiden que una caché guarde la sesión de alguien.
        for (const [clave, valor] of Object.entries(cabeceras)) {
          respuesta.headers.set(clave, valor);
        }
      },
    },
  });

  // No pongas código entre createServerClient y getClaims: getClaims es lo
  // que renueva la sesión.
  const { data } = await supabase.auth.getClaims();
  const haySesion = Boolean(data?.claims);

  const ruta = request.nextUrl.pathname;
  const esLibre = RUTAS_LIBRES.some(
    (libre) => ruta === libre || ruta.startsWith(`${libre}/`)
  );

  if (!haySesion && !esLibre) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/panel/entrar";
    destino.search = "";

    const redireccion = NextResponse.redirect(destino);
    // Conserva las cookies que haya escrito Supabase (p. ej. borrar una sesión caducada).
    for (const cookie of respuesta.cookies.getAll()) {
      redireccion.cookies.set(cookie);
    }
    return redireccion;
  }

  return respuesta;
}

export const config = {
  // Solo el panel: /panel y todo lo que cuelga de él. Así no toca la web
  // pública, /api, los archivos estáticos (/_next/...) ni las imágenes.
  matcher: ["/panel/:path*"],
};
