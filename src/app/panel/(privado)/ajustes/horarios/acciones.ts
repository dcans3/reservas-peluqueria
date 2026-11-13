"use server";

import { refresh } from "next/cache";
import { mensajeErrorBaseDatos } from "@/lib/ajustes/errores";
import {
  conError,
  GUARDADO,
  NO_SE_HA_PODIDO_GUARDAR,
  SIN_PERMISO,
  type Resultado,
} from "@/lib/ajustes/resultado";
import { esquemaSemana, primerError } from "@/lib/ajustes/validaciones";
import { crearClienteServidor, exigirPersonal } from "@/lib/supabase/sesion";

/**
 * Guarda la semana completa de un profesional.
 * Recibe { profesional_id, tramos: [{ dia_semana, hora_inicio, hora_fin }] }
 * desde el editor (no es un FormData: el editor llama a la acción con un objeto).
 *
 * Orden: primero se insertan los tramos nuevos y después se borran los antiguos.
 * Si algo falla a medias, el profesional se queda con su horario antiguo (o con
 * los dos), pero nunca sin horario.
 */
export async function guardarSemana(_anterior: Resultado, semana: unknown): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaSemana.safeParse(semana);
  if (!datos.success) return conError(primerError(datos.error));

  const { profesional_id, tramos } = datos.data;
  const supabase = await crearClienteServidor();

  const { data: antiguos, error: errorLectura } = await supabase
    .from("horarios")
    .select("id")
    .eq("profesional_id", profesional_id);
  if (errorLectura) return conError(mensajeErrorBaseDatos(errorLectura));

  // 1) Insertar los nuevos
  if (tramos.length > 0) {
    const { data, error } = await supabase
      .from("horarios")
      .insert(tramos.map((t) => ({ profesional_id, ...t })))
      .select("id");
    if (error) return conError(mensajeErrorBaseDatos(error));
    if (data?.length !== tramos.length) return NO_SE_HA_PODIDO_GUARDAR;
  }

  // 2) Borrar los antiguos
  if (antiguos.length > 0) {
    const { data, error } = await supabase
      .from("horarios")
      .delete()
      .in("id", antiguos.map((fila) => fila.id))
      .select("id");
    if (error) return conError(mensajeErrorBaseDatos(error));
    if (data?.length !== antiguos.length) return NO_SE_HA_PODIDO_GUARDAR;
  }

  refresh();
  return GUARDADO;
}
