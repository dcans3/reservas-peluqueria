"use client";

// Botón suelto que llama a una Server Action (subir, bajar, activar, borrar...).
// Con "confirmar", pide confirmación en el propio botón antes de actuar.

import { startTransition, useActionState, useState } from "react";
import { SIN_RESULTADO, type Resultado } from "@/lib/ajustes/resultado";
import { estilos } from "./estilos";

type Props = {
  accion: (anterior: Resultado, datos: FormData) => Promise<Resultado>;
  /** Datos que se envían a la acción, p. ej. { id: "3", direccion: "subir" }. */
  datos: Record<string, string>;
  texto: string;
  /** Nombre para lectores de pantalla si el texto es un símbolo (↑, ↓...). */
  etiqueta?: string;
  /** Texto del botón de confirmación ("Sí, borrar"). Sin él, actúa directamente. */
  confirmar?: string;
  estilo?: string;
  disabled?: boolean;
};

export function BotonAccion({
  accion,
  datos,
  texto,
  etiqueta,
  confirmar,
  estilo = estilos.botonSecundario,
  disabled = false,
}: Props) {
  const [resultado, ejecutar, enviando] = useActionState(accion, SIN_RESULTADO);
  const [preguntando, setPreguntando] = useState(false);

  function actuar() {
    const formData = new FormData();
    for (const [clave, valor] of Object.entries(datos)) formData.set(clave, valor);
    setPreguntando(false);
    startTransition(() => ejecutar(formData));
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {preguntando ? (
        <>
          <span className="font-bold">¿Seguro?</span>
          <button type="button" onClick={actuar} className={estilos.botonPeligro}>
            {confirmar}
          </button>
          <button type="button" onClick={() => setPreguntando(false)} className={estilos.botonSecundario}>
            Cancelar
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => (confirmar ? setPreguntando(true) : actuar())}
          disabled={disabled || enviando}
          aria-label={etiqueta}
          title={etiqueta}
          className={estilo}
        >
          {enviando ? "…" : texto}
        </button>
      )}

      {resultado.tipo === "error" && (
        <span role="alert" className="text-sm font-bold text-rojo">
          {resultado.mensaje}
        </span>
      )}
    </span>
  );
}
