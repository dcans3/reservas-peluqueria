"use server";

// Profesionales: añadir, editar (nombre, color y servicios que hace) y
// activar/desactivar. No se borran: las citas antiguas los usan.

import { refresh } from "next/cache";
import { mensajeErrorBaseDatos } from "@/lib/ajustes/errores";
import {
  conError,
  GUARDADO,
  NO_SE_HA_PODIDO_GUARDAR,
  SIN_PERMISO,
  type Resultado,
} from "@/lib/ajustes/resultado";
import {
  esquemaActivar,
  esquemaEditarProfesional,
  esquemaProfesional,
  primerError,
} from "@/lib/ajustes/validaciones";
import { crearClienteServidor, exigirPersonal } from "@/lib/supabase/sesion";

type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

/** El formulario como objeto. Las casillas "servicios" pueden ser varias. */
function leerFormulario(formData: FormData) {
  return { ...Object.fromEntries(formData), servicios: formData.getAll("servicios") };
}

export async function crearProfesional(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaProfesional.safeParse(leerFormulario(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const { servicios, ...profesional } = datos.data;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("profesionales")
    .insert(profesional)
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  const problema = await guardarServiciosDe(supabase, data[0].id, servicios);
  refresh();
  return problema ?? GUARDADO;
}

export async function editarProfesional(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaEditarProfesional.safeParse(leerFormulario(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const { id, servicios, ...cambios } = datos.data;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("profesionales")
    .update(cambios)
    .eq("id", id)
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  const problema = await guardarServiciosDe(supabase, id, servicios);
  refresh();
  return problema ?? GUARDADO;
}

export async function cambiarActivoProfesional(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaActivar.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("profesionales")
    .update({ activo: datos.data.activo })
    .eq("id", datos.data.id)
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  refresh();
  return GUARDADO;
}

/**
 * Deja en profesional_servicios exactamente los servicios marcados:
 * añade los nuevos y quita los desmarcados (sin tocar los que no cambian).
 * Devuelve un Resultado de error, o null si todo ha ido bien.
 */
async function guardarServiciosDe(
  supabase: ClienteSupabase,
  profesionalId: number,
  marcados: number[]
): Promise<Resultado | null> {
  const { data: actuales, error } = await supabase
    .from("profesional_servicios")
    .select("servicio_id")
    .eq("profesional_id", profesionalId);
  if (error) return conError(mensajeErrorBaseDatos(error));

  const idsActuales = actuales.map((fila) => fila.servicio_id as number);
  const anadir = marcados.filter((id) => !idsActuales.includes(id));
  const quitar = idsActuales.filter((id) => !marcados.includes(id));

  if (anadir.length > 0) {
    const { data, error } = await supabase
      .from("profesional_servicios")
      .insert(anadir.map((servicio_id) => ({ profesional_id: profesionalId, servicio_id })))
      .select("servicio_id");
    if (error) return conError(mensajeErrorBaseDatos(error));
    if (data?.length !== anadir.length) return NO_SE_HA_PODIDO_GUARDAR;
  }

  if (quitar.length > 0) {
    const { data, error } = await supabase
      .from("profesional_servicios")
      .delete()
      .eq("profesional_id", profesionalId)
      .in("servicio_id", quitar)
      .select("servicio_id");
    if (error) return conError(mensajeErrorBaseDatos(error));
    if (data?.length !== quitar.length) return NO_SE_HA_PODIDO_GUARDAR;
  }

  return null;
}
