// Comprueba la conexión con Supabase y cuenta las filas de algunas tablas.
// Uso: node --env-file=.env.local scripts/probar-supabase.mjs
//
// Usa la clave secreta (SUPABASE_SERVICE_ROLE_KEY), así que este script
// solo debe ejecutarse en vuestro ordenador, nunca desde el navegador.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const claveSecreta = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !claveSecreta) {
  console.error(
    "Faltan variables de entorno. Revisa que .env.local tenga " +
      "NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(url, claveSecreta, {
  auth: { persistSession: false },
});

const tablas = ["servicios", "profesionales"];
let hayErrores = false;

for (const tabla of tablas) {
  // head: true pide solo el número de filas, sin descargar los datos.
  const { count, error } = await supabase
    .from(tabla)
    .select("*", { count: "exact", head: true });

  if (error) {
    hayErrores = true;
    console.error(`❌ ${tabla}: ${error.message}`);
  } else {
    console.log(`✅ ${tabla}: ${count} filas`);
  }
}

process.exit(hayErrores ? 1 : 0);
