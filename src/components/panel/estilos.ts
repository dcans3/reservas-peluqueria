// Clases de Tailwind repetidas en el panel, con el estilo de la demo
// (docs/referencia/demo-reservas.html). Así todos los formularios se ven igual.

export const estilos = {
  /** Tarjeta blanca con borde (la "hoja" de la libreta). */
  tarjeta: "rounded-2xl border border-renglon bg-hoja p-4 sm:p-6",

  /** Etiqueta encima de un campo. */
  etiqueta: "font-bold text-[15px]",

  /** Texto de ayuda pequeño debajo de un campo. */
  ayuda: "text-sm text-tinta-suave",

  /** Campo de texto, número, fecha, hora o selector. text-base evita el zoom en iPhone. */
  campo:
    "w-full rounded-lg border-[1.5px] border-renglon bg-hoja px-3 py-2.5 text-base disabled:bg-papel disabled:text-tinta-suave",

  /** Botón principal (verde). */
  botonPrincipal:
    "rounded-[10px] bg-verde px-5 py-3 font-bold text-hoja disabled:cursor-not-allowed disabled:bg-renglon disabled:text-tinta-suave",

  /** Botón secundario (borde). */
  botonSecundario:
    "rounded-[10px] border-[1.5px] border-renglon bg-hoja px-3.5 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50",

  /** Botón pequeño cuadrado (flechas, quitar). */
  botonIcono:
    "grid size-10 place-items-center rounded-lg border-[1.5px] border-renglon bg-hoja text-lg disabled:cursor-not-allowed disabled:opacity-40",

  /** Botón peligroso (borrar). */
  botonPeligro:
    "rounded-[10px] border-[1.5px] border-rojo bg-hoja px-3.5 py-2 font-bold text-rojo disabled:opacity-50",
};
