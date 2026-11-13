"use server";

// Servicios: añadir, editar, cambiar el orden y activar/desactivar.
// No se borran: las citas antiguas los usan. Desactivado = oculto en la web.

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
  esquemaEditarServicio,
  esquemaMover,
  esquemaServicio,
  primerError,
} from "@/lib/ajustes/validaciones";
import { crearClienteServidor, exigirPersonal } from "@/lib/supabase/sesion";

export async function crearServicio(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaServicio.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const supabase = await crearClienteServidor();

  // El nuevo va el último: orden = el mayor + 1.
  const { data: ultimo, error: errorOrden } = await supabase
    .from("servicios")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (errorOrden) return conError(mensajeErrorBaseDatos(errorOrden));

  const { data, error } = await supabase
    .from("servicios")
    .insert({ ...datos.data, orden: (ultimo?.orden ?? 0) + 1 })
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  refresh();
  return GUARDADO;
}

export async function editarServicio(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaEditarServicio.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const { id, ...cambios } = datos.data;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("servicios")
    .update(cambios)
    .eq("id", id)
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  refresh();
  return GUARDADO;
}

/**
 * Sube o baja un servicio un puesto. Vuelve a numerar todos (1, 2, 3...)
 * porque varios podrían tener el mismo "orden" y un simple intercambio no
 * haría nada.
 */
export async function moverServicio(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaMover.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const supabase = await crearClienteServidor();
  const { data: lista, error: errorLista } = await supabase
    .from("servicios")
    .select("id, orden")
    .order("orden")
    .order("id");
  if (errorLista) return conError(mensajeErrorBaseDatos(errorLista));

  const posicion = lista.findIndex((s) => s.id === datos.data.id);
  const destino = datos.data.direccion === "subir" ? posicion - 1 : posicion + 1;
  if (posicion === -1 || destino < 0 || destino >= lista.length) {
    return NO_SE_HA_PODIDO_GUARDAR;
  }

  // Intercambiar en la lista y guardar solo los que cambian de número.
  [lista[posicion], lista[destino]] = [lista[destino], lista[posicion]];

  for (const [indice, servicio] of lista.entries()) {
    const nuevoOrden = indice + 1;
    if (servicio.orden === nuevoOrden) continue;

    const { data, error } = await supabase
      .from("servicios")
      .update({ orden: nuevoOrden })
      .eq("id", servicio.id)
      .select("id");
    if (error) return conError(mensajeErrorBaseDatos(error));
    if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;
  }

  refresh();
  return GUARDADO;
}

export async function cambiarActivoServicio(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  const datos = esquemaActivar.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("servicios")
    .update({ activo: datos.data.activo })
    .eq("id", datos.data.id)
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  refresh();
  return GUARDADO;
}
