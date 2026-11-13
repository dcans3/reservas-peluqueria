// /panel/ajustes/horarios?profesional=ID: eliges un profesional y editas su semana.

import Link from "next/link";
import { estilos } from "@/components/panel/estilos";
import { crearClienteServidor, exigirAdmin } from "@/lib/supabase/sesion";
import { EditorSemana } from "./EditorSemana";

export default async function PaginaHorarios({
  searchParams,
}: PageProps<"/panel/ajustes/horarios">) {
  await exigirAdmin();
  const { profesional } = await searchParams;

  const supabase = await crearClienteServidor();
  const { data: profesionales, error } = await supabase
    .from("profesionales")
    .select("id, nombre, color, activo")
    .order("id");
  if (error) throw new Error(`No se han podido leer los profesionales: ${error.message}`);

  if (profesionales.length === 0) {
    return <p className={estilos.tarjeta}>Primero añade un profesional en la pestaña Profesionales.</p>;
  }

  // El de la dirección (?profesional=2), o el primero activo.
  const elegido =
    profesionales.find((p) => String(p.id) === profesional) ??
    profesionales.find((p) => p.activo) ??
    profesionales[0];

  const { data: horarios, error: errorHorarios } = await supabase
    .from("horarios")
    .select("dia_semana, hora_inicio, hora_fin")
    .eq("profesional_id", elegido.id)
    .order("dia_semana")
    .order("hora_inicio");
  if (errorHorarios) throw new Error(`No se han podido leer los horarios: ${errorHorarios.message}`);

  return (
    <div className="grid gap-4">
      <nav aria-label="Profesional" className="flex flex-wrap gap-2">
        {profesionales.map((p) => {
          const activo = p.id === elegido.id;
          return (
            <Link
              key={p.id}
              href={`/panel/ajustes/horarios?profesional=${p.id}`}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-2 rounded-full border-[1.5px] px-4 py-2 ${
                activo ? "border-verde bg-verde font-bold text-hoja" : "border-renglon bg-hoja"
              } ${p.activo ? "" : "opacity-60"}`}
            >
              <span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: p.color }} />
              {p.nombre}
            </Link>
          );
        })}
      </nav>

      <EditorSemana
        // key: al cambiar de profesional, el editor empieza de cero.
        key={elegido.id}
        profesionalId={elegido.id}
        nombre={elegido.nombre}
        tramosIniciales={horarios.map((h) => ({
          dia_semana: h.dia_semana,
          // La base de datos devuelve "10:00:00"; el campo de hora usa "10:00".
          hora_inicio: String(h.hora_inicio).slice(0, 5),
          hora_fin: String(h.hora_fin).slice(0, 5),
        }))}
      />
    </div>
  );
}
