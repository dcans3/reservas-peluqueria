import { describe, expect, it } from "vitest";
import { describirPeriodo, periodoDeCierre } from "./cierres";

const MADRID = "Europe/Madrid";

describe("periodoDeCierre", () => {
  it("24-dic-2026 día completo, toda la peluquería → 23T23:00Z a 24T23:00Z", () => {
    const periodo = periodoDeCierre(
      { desde_fecha: "2026-12-24", desde_hora: null, hasta_fecha: "2026-12-24", hasta_hora: null },
      MADRID
    );

    expect(periodo.ok).toBe(true);
    if (!periodo.ok) return;
    expect(periodo.inicio.toISOString()).toBe("2026-12-23T23:00:00.000Z");
    expect(periodo.fin.toISOString()).toBe("2026-12-24T23:00:00.000Z");
  });

  it("con horas en verano (UTC+2): 1-jul-2027 de 10:00 a 14:00 → 08:00Z a 12:00Z", () => {
    const periodo = periodoDeCierre(
      { desde_fecha: "2027-07-01", desde_hora: "10:00", hasta_fecha: "2027-07-01", hasta_hora: "14:00" },
      MADRID
    );

    expect(periodo.ok).toBe(true);
    if (!periodo.ok) return;
    expect(periodo.inicio.toISOString()).toBe("2027-07-01T08:00:00.000Z");
    expect(periodo.fin.toISOString()).toBe("2027-07-01T12:00:00.000Z");
  });

  it("varios días que cruzan el cambio de hora (27 al 29 de marzo de 2027)", () => {
    const periodo = periodoDeCierre(
      { desde_fecha: "2027-03-27", desde_hora: null, hasta_fecha: "2027-03-29", hasta_hora: null },
      MADRID
    );

    expect(periodo.ok).toBe(true);
    if (!periodo.ok) return;
    expect(periodo.inicio.toISOString()).toBe("2027-03-26T23:00:00.000Z"); // invierno, UTC+1
    expect(periodo.fin.toISOString()).toBe("2027-03-29T22:00:00.000Z"); // verano, UTC+2
  });

  it("rechaza un final anterior al inicio y fechas que no existen", () => {
    expect(
      periodoDeCierre(
        { desde_fecha: "2026-12-24", desde_hora: "14:00", hasta_fecha: "2026-12-24", hasta_hora: "10:00" },
        MADRID
      )
    ).toEqual({ ok: false, error: "El final del cierre tiene que ser posterior al inicio" });

    expect(
      periodoDeCierre(
        { desde_fecha: "2027-02-30", desde_hora: null, hasta_fecha: "2027-03-01", hasta_hora: null },
        MADRID
      )
    ).toEqual({ ok: false, error: "La fecha de inicio no existe" });
  });
});

describe("describirPeriodo", () => {
  it("un día completo, varios días y con horas", () => {
    expect(describirPeriodo("2026-12-23T23:00:00Z", "2026-12-24T23:00:00Z", MADRID)).toBe(
      "jueves, 24 de diciembre de 2026 · todo el día"
    );
    expect(describirPeriodo("2026-12-23T23:00:00Z", "2026-12-26T23:00:00Z", MADRID)).toBe(
      "Del 24 dic 2026 al 26 dic 2026 · días completos"
    );
    expect(describirPeriodo("2027-07-01T08:00:00Z", "2027-07-01T12:00:00Z", MADRID)).toBe(
      "1 jul 2027, 10:00 → 1 jul 2027, 14:00"
    );
  });
});
