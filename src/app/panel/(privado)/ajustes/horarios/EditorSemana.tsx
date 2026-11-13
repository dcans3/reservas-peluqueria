"use client";

// Editor de la semana de un profesional. Los cambios se hacen en el navegador
// (añadir, quitar, copiar un día a otros) y se guardan todos juntos con
// "Guardar semana". El servidor vuelve a validar todo con zod.

import { startTransition, useActionState, useRef, useState } from "react";
import { estilos } from "@/components/panel/estilos";
import { Mensaje } from "@/components/panel/Mensaje";
import { SIN_RESULTADO } from "@/lib/ajustes/resultado";
import { NOMBRES_DIAS, type Tramo } from "@/lib/ajustes/validaciones";
import { guardarSemana } from "./acciones";

type TramoEditable = Tramo & { clave: number }; // clave: solo para React (key)

const DIAS = [1, 2, 3, 4, 5, 6, 7];

type Props = {
  profesionalId: number;
  nombre: string;
  tramosIniciales: Tramo[];
};

export function EditorSemana({ profesionalId, nombre, tramosIniciales }: Props) {
  const [tramos, setTramos] = useState<TramoEditable[]>(() =>
    tramosIniciales.map((t, i) => ({ ...t, clave: i }))
  );
  const siguienteClave = useRef(tramosIniciales.length);
  const [resultado, guardar, guardando] = useActionState(guardarSemana, SIN_RESULTADO);

  function nuevaClave() {
    siguienteClave.current += 1;
    return siguienteClave.current;
  }

  function anadirTramo(dia: number) {
    setTramos((actual) => [
      ...actual,
      { dia_semana: dia, hora_inicio: "", hora_fin: "", clave: nuevaClave() },
    ]);
  }

  function quitarTramo(clave: number) {
    setTramos((actual) => actual.filter((t) => t.clave !== clave));
  }

  function cambiarHora(clave: number, campo: "hora_inicio" | "hora_fin", valor: string) {
    setTramos((actual) => actual.map((t) => (t.clave === clave ? { ...t, [campo]: valor } : t)));
  }

  /** Sustituye los tramos de los días elegidos por una copia de los del día origen. */
  function copiarDia(origen: number, destinos: number[]) {
    setTramos((actual) => {
      const copiados = actual.filter((t) => t.dia_semana === origen);
      const sinDestinos = actual.filter((t) => !destinos.includes(t.dia_semana));
      const nuevos = destinos.flatMap((dia) =>
        copiados.map((t) => ({ ...t, dia_semana: dia, clave: nuevaClave() }))
      );
      return [...sinDestinos, ...nuevos];
    });
  }

  function guardarTodo() {
    const semana = {
      profesional_id: profesionalId,
      tramos: tramos.map(({ dia_semana, hora_inicio, hora_fin }) => ({ dia_semana, hora_inicio, hora_fin })),
    };
    startTransition(() => guardar(semana));
  }

  return (
    <section className="grid gap-3">
      <h2 className="rotulo text-3xl">Semana de {nombre}</h2>

      <div className="grid gap-3 md:grid-cols-2">
        {DIAS.map((dia) => (
          <Dia
            key={dia}
            dia={dia}
            // En el orden en que se añadieron (no por hora: si se reordenaran
            // mientras escribes, el tramo cambiaría de sitio y perderías el foco).
            tramos={tramos.filter((t) => t.dia_semana === dia)}
            onAnadir={() => anadirTramo(dia)}
            onQuitar={quitarTramo}
            onCambiar={cambiarHora}
            onCopiar={(destinos) => copiarDia(dia, destinos)}
          />
        ))}
      </div>

      {/* Barra fija abajo: el botón siempre a mano en el móvil. */}
      <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-renglon bg-papel/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <Mensaje resultado={resultado} />
        <button type="button" onClick={guardarTodo} disabled={guardando} className={estilos.botonPrincipal}>
          {guardando ? "Guardando…" : "Guardar semana"}
        </button>
      </div>
    </section>
  );
}

type PropsDia = {
  dia: number;
  tramos: TramoEditable[];
  onAnadir: () => void;
  onQuitar: (clave: number) => void;
  onCambiar: (clave: number, campo: "hora_inicio" | "hora_fin", valor: string) => void;
  onCopiar: (destinos: number[]) => void;
};

function Dia({ dia, tramos, onAnadir, onQuitar, onCambiar, onCopiar }: PropsDia) {
  const [copiando, setCopiando] = useState(false);
  const [destinos, setDestinos] = useState<number[]>([]);
  const nombreDia = NOMBRES_DIAS[dia - 1];

  function alternarDestino(otro: number) {
    setDestinos((actual) =>
      actual.includes(otro) ? actual.filter((d) => d !== otro) : [...actual, otro]
    );
  }

  function copiar() {
    onCopiar(destinos);
    setDestinos([]);
    setCopiando(false);
  }

  return (
    <article className={estilos.tarjeta}>
      <h3 className="mb-3 text-lg font-bold">{nombreDia}</h3>

      {tramos.length === 0 ? (
        <p className="mb-3 rounded-[10px] bg-papel px-3.5 py-2.5 text-tinta-suave">Cerrado</p>
      ) : (
        <ul className="mb-3 grid gap-2">
          {tramos.map((t, i) => (
            <li key={t.clave} className="flex items-center gap-2">
              <input
                type="time"
                aria-label={`${nombreDia}, tramo ${i + 1}: inicio`}
                value={t.hora_inicio}
                onChange={(e) => onCambiar(t.clave, "hora_inicio", e.target.value)}
                className={estilos.campo}
              />
              <span aria-hidden>–</span>
              <input
                type="time"
                aria-label={`${nombreDia}, tramo ${i + 1}: fin`}
                value={t.hora_fin}
                onChange={(e) => onCambiar(t.clave, "hora_fin", e.target.value)}
                className={estilos.campo}
              />
              <button
                type="button"
                onClick={() => onQuitar(t.clave)}
                aria-label={`Quitar el tramo ${i + 1} del ${nombreDia.toLowerCase()}`}
                title="Quitar tramo"
                className={`${estilos.botonIcono} shrink-0 text-rojo`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAnadir} className={estilos.botonSecundario}>
          + Añadir tramo
        </button>
        <button
          type="button"
          onClick={() => setCopiando((v) => !v)}
          aria-expanded={copiando}
          className={estilos.botonSecundario}
        >
          Copiar este día a…
        </button>
      </div>

      {copiando && (
        <fieldset className="mt-3 grid gap-2 rounded-[10px] border-[1.5px] border-dashed border-laton p-3">
          <legend className="px-1 text-sm font-bold">
            Copiar el {nombreDia.toLowerCase()} a (sustituye sus tramos):
          </legend>
          <div className="flex flex-wrap gap-2">
            {DIAS.filter((otro) => otro !== dia).map((otro) => (
              <label key={otro} className="flex items-center gap-2 rounded-lg bg-papel px-3 py-2">
                <input
                  type="checkbox"
                  checked={destinos.includes(otro)}
                  onChange={() => alternarDestino(otro)}
                  className="size-5 accent-verde"
                />
                {NOMBRES_DIAS[otro - 1]}
              </label>
            ))}
          </div>
          <div>
            <button
              type="button"
              onClick={copiar}
              disabled={destinos.length === 0}
              className={estilos.botonSecundario}
            >
              Copiar
            </button>
          </div>
        </fieldset>
      )}
    </article>
  );
}
