// Motor de huecos libres.
//
// Funciones puras: no leen la base de datos ni hacen fetch. Reciben los datos
// ya cargados (con los mismos nombres de columna que las tablas de Supabase)
// y devuelven las horas libres. Así se pueden probar con tests sin conexión.
//
// IMPORTANTE: estas funciones NO miran la tabla profesional_servicios.
// Quien las llame debe pasar solo los profesionales que hacen el servicio
// pedido. Ejemplo: para "Color raíz" solo se pasa a Laura, porque Marcos
// no lo hace.

import { DateTime } from "luxon";

// ---------- Tipos (copian las columnas de supabase/schema.sql) ----------

/** Reglas de la tabla negocio que afectan a los huecos. */
export type Reglas = {
  zona_horaria: string; // p. ej. "Europe/Madrid"
  minutos_por_hueco: number; // cada cuánto se ofrecen horas: 10:00, 10:15...
  antelacion_minima_min: number; // no se puede reservar con menos antelación
  dias_maximos_reserva: number; // no se puede reservar más allá de estos días
};

/** Fila de la tabla horarios. Las horas son hora local de la peluquería. */
export type Horario = {
  profesional_id: number;
  dia_semana: number; // 1 = lunes ... 7 = domingo
  hora_inicio: string; // "10:00" o "10:00:00"
  hora_fin: string;
};

/** Fila de la tabla ausencias. profesional_id null = cierra toda la peluquería. */
export type Ausencia = {
  profesional_id: number | null;
  inicio: string | Date;
  fin: string | Date;
};

/** Fila de la tabla citas (solo los campos que hacen falta aquí). */
export type Cita = {
  profesional_id: number;
  inicio: string | Date;
  fin: string | Date;
  estado: string; // 'confirmada' | 'cancelada' | 'completada' | 'no_vino'
};

export type DatosHuecos = {
  fecha: string; // "AAAA-MM-DD", día en la zona horaria del negocio
  duracionMin: number; // duración del servicio
  reglas: Reglas;
  ahora: Date;
  horarios: Horario[];
  ausencias: Ausencia[];
  citas: Cita[];
};

export type HuecoConProfesionales = {
  inicio: Date;
  profesionales: number[]; // ids de los profesionales libres a esa hora
};

// ---------- 1) Huecos de UN profesional ----------

/**
 * Devuelve las horas de inicio libres de un profesional en un día.
 * Hay que pasarle solo SUS horarios y citas, y sus ausencias más las de
 * toda la peluquería (huecosConProfesionales ya lo hace así).
 */
export function calcularHuecos(datos: DatosHuecos): Date[] {
  const { fecha, duracionMin, reglas, ahora, horarios, ausencias, citas } =
    datos;
  const zona = reglas.zona_horaria;

  // Valores imposibles: con minutos_por_hueco = 0 el bucle de abajo no
  // terminaría nunca y colgaría el servidor. Mejor fallar con un error claro.
  if (reglas.minutos_por_hueco <= 0) {
    throw new Error(
      `minutos_por_hueco debe ser mayor que 0 (vale ${reglas.minutos_por_hueco})`
    );
  }
  if (duracionMin <= 0) {
    throw new Error(`duracionMin debe ser mayor que 0 (vale ${duracionMin})`);
  }

  const dia = DateTime.fromISO(fecha, { zone: zona });
  if (!dia.isValid) {
    throw new Error(`Fecha no válida: ${fecha}`);
  }

  const MINUTO = 60_000;
  const duracionMs = duracionMin * MINUTO;

  // Lo antes que se puede reservar: ahora + antelación mínima.
  const primerInicioPermitido =
    ahora.getTime() + reglas.antelacion_minima_min * MINUTO;

  // Lo más tarde que se puede reservar: el límite cuenta el DÍA COMPLETO.
  // Si ahora es 30-nov a las 09:00 y el máximo son 60 días, el último día
  // admitido es el 29-ene entero (hasta las 23:59 de la zona del negocio),
  // no solo hasta las 09:00. Así el cliente ve ese día igual que los demás.
  const ultimoInicioPermitido = DateTime.fromJSDate(ahora, { zone: zona })
    .plus({ days: reglas.dias_maximos_reserva })
    .endOf("day")
    .toMillis();

  // Intervalos ocupados [inicio, fin): ausencias y citas no canceladas.
  const ocupados = [
    ...ausencias,
    ...citas.filter((cita) => cita.estado !== "cancelada"),
  ].map((o) => ({
    inicio: new Date(o.inicio).getTime(),
    fin: new Date(o.fin).getTime(),
  }));

  const huecos = new Set<number>(); // en milisegundos, sin repetidos

  // dia.weekday de Luxon también usa 1 = lunes ... 7 = domingo.
  const tramosDelDia = horarios.filter((h) => h.dia_semana === dia.weekday);

  for (const tramo of tramosDelDia) {
    // Luxon convierte la hora local a instante real, también los días de
    // cambio de hora (10:00 en Madrid es 09:00 UTC en invierno y 08:00 en verano).
    const inicioTramo = aHoraLocal(dia, tramo.hora_inicio).toMillis();
    const finTramo = aHoraLocal(dia, tramo.hora_fin).toMillis();

    for (
      let inicio = inicioTramo;
      inicio + duracionMs <= finTramo; // el servicio entero cabe en el tramo
      inicio += reglas.minutos_por_hueco * MINUTO
    ) {
      const fin = inicio + duracionMs;

      if (inicio < primerInicioPermitido) continue;
      if (inicio > ultimoInicioPermitido) continue;

      // Dos intervalos [a, b) y [c, d) se solapan si a < d y c < b.
      // Una cita que acaba a las 11:45 NO choca con un hueco que empieza a las 11:45.
      const chocaConAlgo = ocupados.some(
        (o) => inicio < o.fin && o.inicio < fin
      );
      if (chocaConAlgo) continue;

      huecos.add(inicio);
    }
  }

  return [...huecos].sort((a, b) => a - b).map((ms) => new Date(ms));
}

// ---------- 2) "Sin preferencia": juntar varios profesionales ----------

/**
 * Calcula los huecos de varios profesionales y los junta por hora.
 * horarios, ausencias y citas pueden venir mezclados de todos: aquí se
 * separan por profesional_id. Las ausencias sin profesional (cierre de
 * toda la peluquería) se aplican a todos.
 */
export function huecosConProfesionales(
  datos: DatosHuecos & { profesionales: number[] }
): HuecoConProfesionales[] {
  const libresPorHora = new Map<number, number[]>();

  for (const id of datos.profesionales) {
    const huecos = calcularHuecos({
      ...datos,
      horarios: datos.horarios.filter((h) => h.profesional_id === id),
      ausencias: datos.ausencias.filter(
        (a) => a.profesional_id === null || a.profesional_id === id
      ),
      citas: datos.citas.filter((c) => c.profesional_id === id),
    });

    for (const hueco of huecos) {
      const ms = hueco.getTime();
      const libres = libresPorHora.get(ms) ?? [];
      libres.push(id);
      libresPorHora.set(ms, libres);
    }
  }

  return [...libresPorHora.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ms, ids]) => ({
      inicio: new Date(ms),
      profesionales: ids.sort((a, b) => a - b),
    }));
}

// ---------- 3) A quién se le da la cita ----------

/**
 * Elige al profesional con menos citas ese día. Si empatan, el de id más bajo.
 * citasDelDiaPorProfesional: { 1: 3, 2: 1 } → Laura 3 citas, Marcos 1.
 * Si un profesional no aparece, cuenta como 0 citas.
 * Devuelve null si no hay candidatos.
 */
export function elegirProfesional(
  candidatos: number[],
  citasDelDiaPorProfesional: Record<number, number>
): number | null {
  if (candidatos.length === 0) return null;

  const citasDe = (id: number) => citasDelDiaPorProfesional[id] ?? 0;

  return [...candidatos].sort(
    (a, b) => citasDe(a) - citasDe(b) || a - b
  )[0];
}

// ---------- Ayudas internas ----------

/** Junta un día y una hora "HH:MM" o "HH:MM:SS" en la zona del día. */
function aHoraLocal(dia: DateTime, hora: string): DateTime {
  const [horas, minutos] = hora.split(":").map(Number);
  return dia.set({ hour: horas, minute: minutos, second: 0, millisecond: 0 });
}
