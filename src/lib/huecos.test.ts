import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  calcularHuecos,
  elegirProfesional,
  huecosConProfesionales,
  type Ausencia,
  type Cita,
  type Horario,
  type Reglas,
} from "./huecos";

// ---------- Datos de prueba (los mismos que supabase/schema.sql) ----------

const ZONA = "Europe/Madrid";
const LAURA = 1;
const MARCOS = 2;

const reglas: Reglas = {
  zona_horaria: ZONA,
  minutos_por_hueco: 15,
  antelacion_minima_min: 120,
  dias_maximos_reserva: 60,
};

/** Martes (2) a sábado (6), de 10:00 a 14:00 y de 16:00 a 20:00. */
function horarioDe(profesional_id: number): Horario[] {
  const filas: Horario[] = [];
  for (let dia_semana = 2; dia_semana <= 6; dia_semana++) {
    filas.push({ profesional_id, dia_semana, hora_inicio: "10:00:00", hora_fin: "14:00:00" });
    filas.push({ profesional_id, dia_semana, hora_inicio: "16:00:00", hora_fin: "20:00:00" });
  }
  return filas;
}

const horarios = [...horarioDe(LAURA), ...horarioDe(MARCOS)];
const horariosLaura = horarioDe(LAURA);

/** "2026-12-01T11:00" en hora de Madrid → Date. */
function madrid(isoLocal: string): Date {
  return DateTime.fromISO(isoLocal, { zone: ZONA }).toJSDate();
}

/** Date → "HH:mm" en hora de Madrid, para comparar fácil. */
function horas(huecos: Date[]): string[] {
  return huecos.map((d) =>
    DateTime.fromJSDate(d, { zone: ZONA }).toFormat("HH:mm")
  );
}

/** Las 14 horas de la tarde para un servicio de 45 min: 16:00 ... 19:15. */
const TARDE_45 = Array.from({ length: 14 }, (_, i) =>
  DateTime.fromObject({ hour: 16 }).plus({ minutes: 15 * i }).toFormat("HH:mm")
);

const citasLaura: Cita[] = [
  // La cita del enunciado: de 11:00 a 11:45.
  { profesional_id: LAURA, inicio: madrid("2026-12-01T11:00"), fin: madrid("2026-12-01T11:45"), estado: "confirmada" },
  // Una cita cancelada: NO debe quitar ningún hueco de la tarde.
  { profesional_id: LAURA, inicio: madrid("2026-12-01T16:00"), fin: madrid("2026-12-01T16:45"), estado: "cancelada" },
];

const AHORA = madrid("2026-11-30T09:00");

// ---------- Casos ----------

describe("calcularHuecos", () => {
  it("1. Laura el 1-dic-2026 con una cita de 11:00 a 11:45, servicio de 45 min", () => {
    const huecos = calcularHuecos({
      fecha: "2026-12-01",
      duracionMin: 45,
      reglas,
      ahora: AHORA,
      horarios: horariosLaura,
      ausencias: [],
      citas: citasLaura,
    });

    expect(horas(huecos)).toEqual([
      "10:00", "10:15", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15",
      ...TARDE_45,
    ]);
    expect(TARDE_45).toHaveLength(14);
    expect(TARDE_45.at(-1)).toBe("19:15");
  });

  it("2. Si ahora es 1-dic-2026 a las 12:10, solo quedan las 14 horas de la tarde", () => {
    const huecos = calcularHuecos({
      fecha: "2026-12-01",
      duracionMin: 45,
      reglas,
      ahora: madrid("2026-12-01T12:10"),
      horarios: horariosLaura,
      ausencias: [],
      citas: citasLaura,
    });

    expect(horas(huecos)).toEqual(TARDE_45);
  });

  it("3. Con la peluquería cerrada todo el 1-dic-2026 no hay huecos", () => {
    const cierre: Ausencia = {
      profesional_id: null,
      inicio: madrid("2026-12-01T00:00"),
      fin: madrid("2026-12-02T00:00"),
    };

    const huecos = calcularHuecos({
      fecha: "2026-12-01",
      duracionMin: 45,
      reglas,
      ahora: AHORA,
      horarios: horariosLaura,
      ausencias: [cierre],
      citas: citasLaura,
    });
    expect(huecos).toEqual([]);

    // El cierre general también se aplica a todos en "sin preferencia".
    const juntos = huecosConProfesionales({
      fecha: "2026-12-01",
      duracionMin: 45,
      reglas,
      ahora: AHORA,
      profesionales: [LAURA, MARCOS],
      horarios,
      ausencias: [cierre],
      citas: citasLaura,
    });
    expect(juntos).toEqual([]);
  });

  it("4. Con un servicio de 90 min, por la mañana solo 11:45, 12:00, 12:15 y 12:30", () => {
    const huecos = calcularHuecos({
      fecha: "2026-12-01",
      duracionMin: 90,
      reglas,
      ahora: AHORA,
      horarios: horariosLaura,
      ausencias: [],
      citas: citasLaura,
    });

    const manana = horas(huecos).filter((h) => h < "14:00");
    expect(manana).toEqual(["11:45", "12:00", "12:15", "12:30"]);
  });

  it("5. Cambio de hora: las 10:00 son 09:00 UTC el 27-mar-2027 y 08:00 UTC el 30-mar-2027", () => {
    const base = {
      duracionMin: 45,
      reglas,
      ahora: madrid("2027-03-01T09:00"),
      horarios: horariosLaura,
      ausencias: [],
      citas: [],
    };

    const sabado = calcularHuecos({ ...base, fecha: "2027-03-27" });
    const martes = calcularHuecos({ ...base, fecha: "2027-03-30" });

    expect(sabado[0].toISOString()).toBe("2027-03-27T09:00:00.000Z");
    expect(martes[0].toISOString()).toBe("2027-03-30T08:00:00.000Z");
  });

  it("7. El lunes 7-dic-2026 no trabajan: no hay huecos", () => {
    const huecos = calcularHuecos({
      fecha: "2026-12-07",
      duracionMin: 45,
      reglas,
      ahora: AHORA,
      horarios: horariosLaura,
      ausencias: [],
      citas: [],
    });

    expect(huecos).toEqual([]);
  });

  it("8. El martes 2-feb-2027 está a más de 60 días: no hay huecos", () => {
    const huecos = calcularHuecos({
      fecha: "2027-02-02",
      duracionMin: 45,
      reglas,
      ahora: AHORA,
      horarios: horariosLaura,
      ausencias: [],
      citas: [],
    });

    expect(huecos).toEqual([]);
  });

  it("9. El último día (ahora + 60 días = 29-ene-2027) cuenta entero; el 30-ene ya no", () => {
    const base = {
      duracionMin: 45,
      reglas,
      ahora: AHORA, // 30-nov-2026 a las 09:00
      horarios: horariosLaura,
      ausencias: [],
      citas: [],
    };

    const ultimoDia = horas(calcularHuecos({ ...base, fecha: "2027-01-29" }));
    // Incluye horas posteriores a las 09:00, hasta la última de la tarde.
    expect(ultimoDia[0]).toBe("10:00");
    expect(ultimoDia.at(-1)).toBe("19:15");

    expect(calcularHuecos({ ...base, fecha: "2027-01-30" })).toEqual([]);
  });
});

describe("sin preferencia", () => {
  it("6. A las 10:00 del 1-dic-2026 están libres los dos, y se elige a Marcos", () => {
    const juntos = huecosConProfesionales({
      fecha: "2026-12-01",
      duracionMin: 30,
      reglas,
      ahora: AHORA,
      profesionales: [LAURA, MARCOS],
      horarios,
      ausencias: [],
      citas: citasLaura,
    });

    const a_las_10 = juntos.find((h) => horas([h.inicio])[0] === "10:00");
    expect(a_las_10?.profesionales).toEqual([LAURA, MARCOS]);

    // Ordenado por hora.
    const instantes = juntos.map((h) => h.inicio.getTime());
    expect(instantes).toEqual([...instantes].sort((a, b) => a - b));

    // Laura tiene 1 cita ese día y Marcos 0 → Marcos.
    expect(elegirProfesional([LAURA, MARCOS], { [LAURA]: 1, [MARCOS]: 0 })).toBe(MARCOS);
  });

  it("elegirProfesional: si empatan, gana el id más bajo; sin candidatos, null", () => {
    expect(elegirProfesional([MARCOS, LAURA], { [LAURA]: 2, [MARCOS]: 2 })).toBe(LAURA);
    expect(elegirProfesional([MARCOS, LAURA], {})).toBe(LAURA);
    expect(elegirProfesional([], {})).toBeNull();
  });
});
