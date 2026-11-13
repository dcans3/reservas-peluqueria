import { describe, expect, it } from "vitest";
import {
  erroresDeTramos,
  esquemaCierre,
  esquemaEditarServicio,
  esquemaNegocio,
  esquemaProfesional,
  esquemaSemana,
  primerError,
  type Tramo,
} from "./validaciones";

/** Devuelve el primer mensaje de error, o "ok" si es válido. */
function mensaje(resultado: { success: boolean; error?: Parameters<typeof primerError>[0] }) {
  return resultado.success ? "ok" : primerError(resultado.error!);
}

// Lo que envía el formulario de Negocio (todo texto).
const negocioValido = {
  nombre: "  Peluquería Demo ",
  direccion: "Calle Mayor 1",
  telefono: "",
  email: "",
  minutos_por_hueco: "15",
  antelacion_horas: "1,5",
  dias_maximos_reserva: "60",
  horas_limite_cancelar: "24",
};

describe("esquemaNegocio", () => {
  it("convierte el formulario a las columnas de la tabla (horas → minutos, vacío → null)", () => {
    const r = esquemaNegocio.safeParse(negocioValido);
    expect(r.success).toBe(true);
    expect(r.data).toEqual({
      nombre: "Peluquería Demo",
      direccion: "Calle Mayor 1",
      telefono: null,
      email: null,
      minutos_por_hueco: 15,
      antelacion_minima_min: 90,
      dias_maximos_reserva: 60,
      horas_limite_cancelar: 24,
    });
  });

  it("rechaza valores imposibles con mensajes en español", () => {
    const con = (cambios: Partial<typeof negocioValido>) =>
      mensaje(esquemaNegocio.safeParse({ ...negocioValido, ...cambios }));

    expect(con({ nombre: "   " })).toBe("Escribe el nombre del negocio");
    expect(con({ email: "no-es-un-email" })).toBe("El email no es válido");
    expect(con({ minutos_por_hueco: "0" })).toBe("Los minutos por hueco tienen que ser 10, 15, 20 o 30");
    expect(con({ minutos_por_hueco: "25" })).toBe("Los minutos por hueco tienen que ser 10, 15, 20 o 30");
    expect(con({ antelacion_horas: "" })).toBe("Escribe la antelación mínima en horas");
    expect(con({ antelacion_horas: "-1" })).toBe("La antelación mínima tiene que estar entre 0 y 720 horas");
    expect(con({ antelacion_horas: "1,3" })).toBe("La antelación mínima va de media en media hora (por ejemplo, 1,5)");
    expect(con({ dias_maximos_reserva: "0" })).toBe("Los días máximos de reserva tienen que ser un número entero entre 1 y 365");
    expect(con({ horas_limite_cancelar: "2.5" })).toBe("Las horas límite para cancelar tienen que ser un número entero entre 0 y 720");
  });
});

describe("esquemaEditarServicio", () => {
  const servicio = { id: "3", nombre: "Corte", duracion_min: "45", precio: "22,50" };

  it("acepta precio con coma y precio vacío (null)", () => {
    expect(esquemaEditarServicio.parse(servicio)).toEqual({
      id: 3,
      nombre: "Corte",
      duracion_min: 45,
      precio: 22.5,
    });
    expect(esquemaEditarServicio.parse({ ...servicio, precio: "" }).precio).toBeNull();
  });

  it("rechaza duración 0 y precios fuera de numeric(6,2)", () => {
    expect(mensaje(esquemaEditarServicio.safeParse({ ...servicio, duracion_min: "0" }))).toBe(
      "La duración tiene que ser un número entero de minutos entre 1 y 600"
    );
    const errorPrecio = "El precio tiene que ser un número hasta 9999,99 €, con 2 decimales como mucho";
    expect(mensaje(esquemaEditarServicio.safeParse({ ...servicio, precio: "10000" }))).toBe(errorPrecio);
    expect(mensaje(esquemaEditarServicio.safeParse({ ...servicio, precio: "12,345" }))).toBe(errorPrecio);
    expect(mensaje(esquemaEditarServicio.safeParse({ ...servicio, precio: "-5" }))).toBe(errorPrecio);
  });
});

describe("esquemaProfesional", () => {
  it("valida el color y convierte los ids de las casillas", () => {
    expect(
      esquemaProfesional.parse({ nombre: "Laura", color: "#E11D48", servicios: ["1", "3"] })
    ).toEqual({ nombre: "Laura", color: "#e11d48", servicios: [1, 3] });

    expect(
      mensaje(esquemaProfesional.safeParse({ nombre: "Laura", color: "rojo", servicios: [] }))
    ).toBe("El color no es válido");
  });
});

describe("horarios: erroresDeTramos y esquemaSemana", () => {
  const t = (dia_semana: number, hora_inicio: string, hora_fin: string): Tramo => ({
    dia_semana,
    hora_inicio,
    hora_fin,
  });

  it("acepta un turno partido y tramos que se tocan (14:00 → 14:00)", () => {
    expect(erroresDeTramos([t(2, "10:00", "14:00"), t(2, "16:00", "20:00")])).toEqual([]);
    expect(erroresDeTramos([t(2, "14:00", "16:00"), t(2, "10:00", "14:00")])).toEqual([]);
  });

  it("rechaza un fin anterior o igual al inicio", () => {
    expect(erroresDeTramos([t(2, "14:00", "10:00")])).toEqual([
      "Martes: el tramo de 14:00 a 10:00 tiene que terminar después de empezar",
    ]);
    expect(erroresDeTramos([t(7, "10:00", "10:00")])).toHaveLength(1);
  });

  it("rechaza tramos solapados el mismo día, pero no en días distintos", () => {
    expect(erroresDeTramos([t(3, "10:00", "14:00"), t(3, "13:00", "16:00")])).toEqual([
      "Miércoles: los tramos 10:00-14:00 y 13:00-16:00 se solapan",
    ]);
    expect(erroresDeTramos([t(3, "10:00", "14:00"), t(4, "13:00", "16:00")])).toEqual([]);
  });

  it("esquemaSemana usa esas comprobaciones y exige el formato HH:MM", () => {
    const semana = (tramos: Tramo[]) => esquemaSemana.safeParse({ profesional_id: 1, tramos });

    expect(semana([t(2, "10:00", "14:00")]).success).toBe(true);
    expect(mensaje(semana([t(2, "10:00", "09:00")]))).toBe(
      "Martes: el tramo de 10:00 a 09:00 tiene que terminar después de empezar"
    );
    expect(mensaje(semana([t(2, "", "14:00")]))).toBe("Escribe todas las horas de inicio (HH:MM)");
  });
});

describe("esquemaCierre", () => {
  it("vacío en 'quién' = toda la peluquería, y hora vacía = día completo", () => {
    expect(
      esquemaCierre.parse({
        profesional_id: "",
        desde_fecha: "2026-12-24",
        desde_hora: "",
        hasta_fecha: "2026-12-24",
        hasta_hora: "",
        motivo: " Nochebuena ",
      })
    ).toEqual({
      profesional_id: null,
      desde_fecha: "2026-12-24",
      desde_hora: null,
      hasta_fecha: "2026-12-24",
      hasta_hora: null,
      motivo: "Nochebuena",
    });
  });

  it("rechaza fechas y horas mal escritas", () => {
    const base = {
      profesional_id: "2",
      desde_fecha: "2026-12-24",
      desde_hora: "",
      hasta_fecha: "2026-12-24",
      hasta_hora: "",
      motivo: "",
    };
    expect(mensaje(esquemaCierre.safeParse({ ...base, desde_fecha: "" }))).toBe("Elige la fecha de inicio");
    expect(mensaje(esquemaCierre.safeParse({ ...base, hasta_hora: "25:00" }))).toBe("La hora de fin no es válida");
  });
});
