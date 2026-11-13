// Traduce los errores de la base de datos (PostgreSQL vía Supabase) a
// mensajes en español para la pantalla. El error técnico NUNCA se muestra:
// solo va al registro del servidor (la terminal de npm run dev / logs de Vercel).

type ErrorBaseDatos = { code?: string; message?: string };

/** Checks de schema.sql → mensaje. El nombre lo pone PostgreSQL: tabla_columna_check. */
const MENSAJES_CHECK: Record<string, string> = {
  negocio_minutos_por_hueco_check: "Los minutos por hueco tienen que ser mayores que 0",
  negocio_antelacion_minima_min_check: "La antelación mínima no puede ser negativa",
  negocio_dias_maximos_reserva_check: "Los días máximos de reserva tienen que ser mayores que 0",
  negocio_horas_limite_cancelar_check: "Las horas límite para cancelar no pueden ser negativas",
  servicios_duracion_min_check: "La duración tiene que ser mayor que 0",
  horarios_dia_semana_check: "El día de la semana no es válido",
  horarios_check: "La hora de fin tiene que ser posterior a la de inicio",
  ausencias_check: "El final del cierre tiene que ser posterior al inicio",
};

export function mensajeErrorBaseDatos(error: ErrorBaseDatos): string {
  console.error("Error de base de datos:", error.code, error.message);

  switch (error.code) {
    case "23514": {
      // check violado: el mensaje trae el nombre del check entre comillas
      const nombreCheck = error.message?.match(/constraint "([^"]+)"/)?.[1];
      return (nombreCheck && MENSAJES_CHECK[nombreCheck]) ?? "Algún dato no es válido";
    }
    case "42501": // seguridad por filas: no es admin
      return "No tienes permiso para hacer este cambio";
    case "23505":
      return "Ese dato ya existe";
    case "23503":
      return "Ese dato está relacionado con otros y no se puede guardar así";
    case "22003":
      return "Algún número es demasiado grande";
    default:
      return "No se ha podido guardar. Inténtalo de nuevo";
  }
}
