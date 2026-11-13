// Lo que devuelve cada Server Action de ajustes, para mostrar el mensaje
// debajo del formulario.

export type Resultado = {
  tipo: "nada" | "ok" | "aviso" | "error";
  mensaje: string;
};

export const SIN_RESULTADO: Resultado = { tipo: "nada", mensaje: "" };
export const GUARDADO: Resultado = { tipo: "ok", mensaje: "Guardado" };

export const SIN_PERMISO: Resultado = {
  tipo: "error",
  mensaje: "No tienes permiso para cambiar los ajustes",
};

/** La seguridad por filas no da error: simplemente no cambia ninguna fila. */
export const NO_SE_HA_PODIDO_GUARDAR: Resultado = {
  tipo: "error",
  mensaje: "No se ha podido guardar",
};

export function conError(mensaje: string): Resultado {
  return { tipo: "error", mensaje };
}
