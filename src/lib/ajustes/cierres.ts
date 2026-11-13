// Cierres y vacaciones: convertir lo que se escribe en pantalla (fecha y hora
// LOCALES del negocio) en instantes reales para guardar en la tabla ausencias,
// y al revés para mostrarlos. Funciones puras (se prueban en cierres.test.ts).

import { DateTime } from "luxon";

export type DatosPeriodo = {
  desde_fecha: string; // "2026-12-24"
  desde_hora: string | null; // "14:00", o null = desde el principio del día
  hasta_fecha: string;
  hasta_hora: string | null; // null = hasta el final del día (incluido)
};

export type Periodo =
  | { ok: true; inicio: Date; fin: Date }
  | { ok: false; error: string };

/**
 * Convierte el periodo escrito en la zona horaria del negocio a instantes.
 * Ejemplo (Madrid, invierno): 24-dic-2026 día completo →
 *   inicio 2026-12-23T23:00Z (00:00 del 24 en Madrid)
 *   fin    2026-12-24T23:00Z (00:00 del 25 en Madrid)
 * "Hasta" un día completo incluye ese día entero: termina a las 00:00 del día siguiente.
 */
export function periodoDeCierre(datos: DatosPeriodo, zona: string): Periodo {
  const desdeDia = DateTime.fromISO(datos.desde_fecha, { zone: zona });
  const hastaDia = DateTime.fromISO(datos.hasta_fecha, { zone: zona });

  if (!desdeDia.isValid) return { ok: false, error: "La fecha de inicio no existe" };
  if (!hastaDia.isValid) return { ok: false, error: "La fecha de fin no existe" };

  const inicio = datos.desde_hora
    ? DateTime.fromISO(`${datos.desde_fecha}T${datos.desde_hora}`, { zone: zona })
    : desdeDia.startOf("day");

  const fin = datos.hasta_hora
    ? DateTime.fromISO(`${datos.hasta_fecha}T${datos.hasta_hora}`, { zone: zona })
    : hastaDia.plus({ days: 1 }).startOf("day");

  if (fin <= inicio) {
    return { ok: false, error: "El final del cierre tiene que ser posterior al inicio" };
  }

  return { ok: true, inicio: inicio.toJSDate(), fin: fin.toJSDate() };
}

/**
 * Texto para la lista de cierres, en la zona del negocio. Ejemplos:
 * - "jueves, 24 de diciembre de 2026 · todo el día"
 * - "Del 24 dic 2026 al 6 ene 2027 · días completos"
 * - "24 dic 2026, 14:00 → 26 dic 2026, 20:00"
 */
export function describirPeriodo(
  inicio: string | Date,
  fin: string | Date,
  zona: string
): string {
  const a = DateTime.fromJSDate(new Date(inicio), { zone: zona }).setLocale("es");
  const b = DateTime.fromJSDate(new Date(fin), { zone: zona }).setLocale("es");

  const esMedianoche = (d: DateTime) => d.hour === 0 && d.minute === 0;

  if (esMedianoche(a) && esMedianoche(b)) {
    const ultimoDia = b.minus({ days: 1 });
    if (ultimoDia.hasSame(a, "day")) {
      return `${a.toFormat("cccc, d 'de' LLLL 'de' yyyy")} · todo el día`;
    }
    return `Del ${a.toFormat("d LLL yyyy")} al ${ultimoDia.toFormat("d LLL yyyy")} · días completos`;
  }

  return `${a.toFormat("d LLL yyyy, HH:mm")} → ${b.toFormat("d LLL yyyy, HH:mm")}`;
}
