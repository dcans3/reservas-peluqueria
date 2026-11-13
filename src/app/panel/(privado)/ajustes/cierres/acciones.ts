"use server";

// Cierres y vacaciones (tabla ausencias): añadir y borrar.

import { refresh } from "next/cache";
import { periodoDeCierre } from "@/lib/ajustes/cierres";
import { mensajeErrorBaseDatos } from "@/lib/ajustes/errores";
import {
  conError,
  GUARDADO,
  NO_SE_HA_PODIDO_GUARDAR,
  SIN_PERMISO,
  type Resultado,
} from "@/lib/ajustes/resultado";
import { esquemaCierre, esquemaSoloId, primerError } from "@/lib/ajustes/validaciones";
import { crearClienteServidor, exigirPersonal } from "@/lib/supabase/sesion";

export async function crearCierre(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaCierre.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const supabase = await crearClienteServidor();

  // Las fechas se escriben en la hora del negocio (Europe/Madrid): se lee de
  // la base de datos, no se escribe en el código.
  const { data: negocio, error: errorNegocio } = await supabase
    .from("negocio")
    .select("zona_horaria")
    .maybeSingle();
  if (errorNegocio) return conError(mensajeErrorBaseDatos(errorNegocio));
  if (!negocio) return NO_SE_HA_PODIDO_GUARDAR;

  const periodo = periodoDeCierre(datos.data, negocio.zona_horaria);
  if (!periodo.ok) return conError(periodo.error);

  const inicio = periodo.inicio.toISOString();
  const fin = periodo.fin.toISOString();
  const { profesional_id, motivo } = datos.data;

  const { data, error } = await supabase
    .from("ausencias")
    .insert({ profesional_id, inicio, fin, motivo })
    .select("id");
  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  refresh();

  // ¿Hay citas confirmadas en ese periodo? Solo se avisa: NO se cancelan.
  // Se solapan si la cita empieza antes del fin del cierre y acaba después de su inicio.
  let consulta = supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("estado", "confirmada")
    .lt("inicio", fin)
    .gt("fin", inicio);
  // Toda la peluquería (null) → citas de todos; si no, solo las de ese profesional.
  if (profesional_id !== null) consulta = consulta.eq("profesional_id", profesional_id);

  const { count, error: errorCitas } = await consulta;
  if (errorCitas) {
    console.error("Error al contar citas del cierre:", errorCitas.code, errorCitas.message);
    return {
      tipo: "aviso",
      mensaje: "Guardado, pero no se han podido revisar las citas de esas fechas: revisa la agenda",
    };
  }

  if (count && count > 0) {
    return {
      tipo: "aviso",
      mensaje: `Guardado. Hay ${count} ${count === 1 ? "cita" : "citas"} en esas fechas: revísalas en la agenda`,
    };
  }

  return GUARDADO;
}

export async function borrarCierre(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaSoloId.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("ausencias")
    .delete()
    .eq("id", datos.data.id)
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  refresh();
  return GUARDADO;
}
