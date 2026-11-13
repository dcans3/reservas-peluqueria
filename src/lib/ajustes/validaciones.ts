// Validaciones (zod) de las pantallas de ajustes.
//
// Funciones puras: no tocan la base de datos, así que se prueban con tests
// (validaciones.test.ts). Las Server Actions las usan antes de guardar.
//
// Los formularios envían TEXTO (FormData): por eso los números llegan como
// "15" o "1,5" y aquí se convierten.

import { z } from "zod";

// Mensajes por defecto de zod en español ("Entrada inválida: se esperaba texto...").
z.config(z.locales.es());

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/; // "09:30"
const FECHA = /^\d{4}-\d{2}-\d{2}$/; // "2026-12-24"

/** Opciones del selector "minutos por hueco". */
export const MINUTOS_POR_HUECO = [10, 15, 20, 30];

/** dia_semana 1 = lunes ... 7 = domingo → NOMBRES_DIAS[dia_semana - 1]. */
export const NOMBRES_DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// ---------- Piezas reutilizables ----------

/** Campo numérico obligatorio. Acepta coma decimal ("1,5"). */
function numero(mensaje: string) {
  return z
    .string({ error: mensaje })
    .trim()
    .min(1, { error: mensaje })
    .transform((texto) => Number(texto.replace(",", ".")))
    .refine((n) => Number.isFinite(n), { error: mensaje });
}

/** Número entero entre min y max. */
function entero(mensajeVacio: string, min: number, max: number, mensajeRango: string) {
  return numero(mensajeVacio).refine(
    (n) => Number.isInteger(n) && n >= min && n <= max,
    { error: mensajeRango }
  );
}

/** Texto opcional: vacío se guarda como null. */
function textoOpcional(max: number, campo: string) {
  return z
    .string()
    .trim()
    .max(max, { error: `${campo} es demasiado largo (máximo ${max} caracteres)` })
    .transform((texto) => (texto === "" ? null : texto));
}

function nombre(mensajeVacio: string) {
  return z
    .string()
    .trim()
    .min(1, { error: mensajeVacio })
    .max(100, { error: "El nombre es demasiado largo (máximo 100 caracteres)" });
}

/** id de una fila (llega como texto "3" desde un formulario). */
export const esquemaId = entero("Falta el identificador", 1, Number.MAX_SAFE_INTEGER, "Identificador no válido");

// ---------- 1) Negocio ----------

export const esquemaNegocio = z
  .object({
    nombre: nombre("Escribe el nombre del negocio"),
    direccion: textoOpcional(200, "La dirección"),
    telefono: textoOpcional(30, "El teléfono"),
    email: z
      .string()
      .trim()
      .max(200, { error: "El email es demasiado largo" })
      .refine((texto) => texto === "" || z.email().safeParse(texto).success, {
        error: "El email no es válido",
      })
      .transform((texto) => (texto === "" ? null : texto)),
    minutos_por_hueco: numero("Elige los minutos por hueco").refine(
      (n) => MINUTOS_POR_HUECO.includes(n),
      { error: "Los minutos por hueco tienen que ser 10, 15, 20 o 30" }
    ),
    // En pantalla va en HORAS; en la base de datos se guarda en minutos.
    antelacion_horas: numero("Escribe la antelación mínima en horas")
      .refine((h) => h >= 0 && h <= 720, {
        error: "La antelación mínima tiene que estar entre 0 y 720 horas",
      })
      .refine((h) => Number.isInteger(h * 2), {
        error: "La antelación mínima va de media en media hora (por ejemplo, 1,5)",
      }),
    dias_maximos_reserva: entero(
      "Escribe los días máximos de reserva",
      1,
      365,
      "Los días máximos de reserva tienen que ser un número entero entre 1 y 365"
    ),
    horas_limite_cancelar: entero(
      "Escribe las horas límite para cancelar",
      0,
      720,
      "Las horas límite para cancelar tienen que ser un número entero entre 0 y 720"
    ),
  })
  // Deja los datos con los nombres de las columnas de la tabla negocio.
  .transform(({ antelacion_horas, ...resto }) => ({
    ...resto,
    antelacion_minima_min: Math.round(antelacion_horas * 60),
  }));

// ---------- 2) Servicios ----------

export const esquemaServicio = z.object({
  nombre: nombre("Escribe el nombre del servicio"),
  duracion_min: entero(
    "Escribe la duración en minutos",
    1,
    600,
    "La duración tiene que ser un número entero de minutos entre 1 y 600"
  ),
  // Opcional. numeric(6,2) en la base de datos: hasta 9999,99 €.
  precio: z
    .string()
    .trim()
    .transform((texto) => texto.replace(",", "."))
    .refine((texto) => texto === "" || /^\d{1,4}(\.\d{1,2})?$/.test(texto), {
      error: "El precio tiene que ser un número hasta 9999,99 €, con 2 decimales como mucho",
    })
    .transform((texto) => (texto === "" ? null : Number(texto))),
});

export const esquemaEditarServicio = esquemaServicio.extend({ id: esquemaId });

/** Flechas ↑ ↓ de la lista de servicios. */
export const esquemaMover = z.object({
  id: esquemaId,
  direccion: z.enum(["subir", "bajar"]),
});

/** Botón Activar / Desactivar (servicios y profesionales). */
export const esquemaActivar = z.object({
  id: esquemaId,
  activo: z.enum(["true", "false"]).transform((texto) => texto === "true"),
});

/** Solo un id (p. ej. borrar un cierre). */
export const esquemaSoloId = z.object({ id: esquemaId });

// ---------- 3) Profesionales ----------

export const esquemaProfesional = z.object({
  nombre: nombre("Escribe el nombre del profesional"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, { error: "El color no es válido" })
    .transform((color) => color.toLowerCase()),
  // ids de los servicios marcados (casillas)
  servicios: z.array(esquemaId),
});

export const esquemaEditarProfesional = esquemaProfesional.extend({ id: esquemaId });

// ---------- 4) Horarios ----------

export type Tramo = { dia_semana: number; hora_inicio: string; hora_fin: string };

/**
 * Revisa los tramos de una semana y devuelve los problemas en español:
 * - el fin tiene que ser posterior al inicio
 * - dos tramos del mismo día no se pueden solapar
 *   (10:00-14:00 y 14:00-16:00 SÍ valen: uno acaba cuando empieza el otro)
 */
export function erroresDeTramos(tramos: Tramo[]): string[] {
  const errores: string[] = [];

  for (let dia = 1; dia <= 7; dia++) {
    const nombreDia = NOMBRES_DIAS[dia - 1];
    // "HH:MM" se puede comparar como texto: "09:30" < "10:00".
    const delDia = tramos
      .filter((t) => t.dia_semana === dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    for (const t of delDia) {
      if (t.hora_fin <= t.hora_inicio) {
        errores.push(
          `${nombreDia}: el tramo de ${t.hora_inicio} a ${t.hora_fin} tiene que terminar después de empezar`
        );
      }
    }

    for (let i = 1; i < delDia.length; i++) {
      const anterior = delDia[i - 1];
      const actual = delDia[i];
      if (actual.hora_inicio < anterior.hora_fin) {
        errores.push(
          `${nombreDia}: los tramos ${anterior.hora_inicio}-${anterior.hora_fin} y ${actual.hora_inicio}-${actual.hora_fin} se solapan`
        );
      }
    }
  }

  return errores;
}

const hora = (mensaje: string) => z.string().regex(HORA, { error: mensaje });

export const esquemaSemana = z
  .object({
    profesional_id: z.number().int().positive(),
    tramos: z
      .array(
        z.object({
          dia_semana: z.number().int().min(1).max(7),
          hora_inicio: hora("Escribe todas las horas de inicio (HH:MM)"),
          hora_fin: hora("Escribe todas las horas de fin (HH:MM)"),
        })
      )
      .max(70, { error: "Demasiados tramos" }),
  })
  .superRefine((semana, ctx) => {
    for (const mensaje of erroresDeTramos(semana.tramos)) {
      ctx.addIssue({ code: "custom", message: mensaje });
    }
  });

// ---------- 5) Cierres y vacaciones ----------

/** Hora opcional: vacía = día completo. */
function horaOpcional(mensaje: string) {
  return z
    .string()
    .trim()
    .refine((texto) => texto === "" || HORA.test(texto), { error: mensaje })
    .transform((texto) => (texto === "" ? null : texto));
}

export const esquemaCierre = z.object({
  // "" = toda la peluquería (profesional_id null en la tabla ausencias)
  profesional_id: z
    .string()
    .trim()
    .transform((texto) => (texto === "" ? null : Number(texto)))
    .refine((id) => id === null || (Number.isInteger(id) && id > 0), {
      error: "Elige a quién afecta el cierre",
    }),
  desde_fecha: z.string().regex(FECHA, { error: "Elige la fecha de inicio" }),
  desde_hora: horaOpcional("La hora de inicio no es válida"),
  hasta_fecha: z.string().regex(FECHA, { error: "Elige la fecha de fin" }),
  hasta_hora: horaOpcional("La hora de fin no es válida"),
  motivo: textoOpcional(200, "El motivo"),
});

/** Primer mensaje de error de zod, para mostrarlo en pantalla. */
export function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos";
}
