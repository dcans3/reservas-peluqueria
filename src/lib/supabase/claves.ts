// URL y clave PÚBLICA de Supabase, leídas de .env.local.
// Si falta alguna, el error dice exactamente cuál, en vez del mensaje
// genérico de Supabase.
//
// Ojo: Next.js solo mete las variables NEXT_PUBLIC_ en el navegador si se
// escriben tal cual (process.env.NEXT_PUBLIC_...), por eso no se usa un bucle.

export function clavesPublicasSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase llama ahora "publishable key" a la que antes era "anon key".
  const clavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
  }
  if (!clavePublica) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local");
  }

  return { url, clavePublica };
}
