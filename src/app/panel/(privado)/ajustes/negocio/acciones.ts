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
import { esquemaNegocio, primerError } from "@/lib/ajustes/validaciones";
import { crearClienteServidor, exigirPersonal } from "@/lib/supabase/sesion";

/** Guarda los datos y las reglas del negocio (la única fila de la tabla negocio). */
export async function guardarNegocio(_anterior: Resultado, formData: FormData): Promise<Resultado> {
  // 1) Quién es: el proxy NO protege las Server Actions.
  const persona = await exigirPersonal();
  if (persona.rol !== "admin") return SIN_PERMISO;

  // 2) Validar lo que llega (nunca fiarse del formulario).
  const datos = esquemaNegocio.safeParse(Object.fromEntries(formData));
  if (!datos.success) return conError(primerError(datos.error));

  // 3) Guardar con el cliente con sesión: la seguridad por filas se aplica.
  //    zona_horaria no se envía: no se puede editar.
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("negocio")
    .update(datos.data)
    .eq("id", 1)
    .select("id");

  if (error) return conError(mensajeErrorBaseDatos(error));
  // La seguridad por filas no da error: simplemente no cambia nada.
  if (!data?.length) return NO_SE_HA_PODIDO_GUARDAR;

  refresh(); // vuelve a leer la página con los datos nuevos
  return GUARDADO;
}
