"use client";

// Formulario de ajustes: envía los campos a una Server Action y muestra
// "Guardado" o el error debajo.
//
// Usamos onSubmit + startTransition en vez de <form action={...}> porque
// React vacía el formulario después de una acción, y si hay un error la
// persona perdería lo que acaba de escribir.

import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { SIN_RESULTADO, type Resultado } from "@/lib/ajustes/resultado";
import { estilos } from "./estilos";
import { Mensaje } from "./Mensaje";

type Props = {
  accion: (anterior: Resultado, datos: FormData) => Promise<Resultado>;
  textoBoton?: string;
  /** Vaciar los campos al guardar bien (formularios de "Añadir..."). */
  vaciarAlGuardar?: boolean;
  className?: string;
  children: ReactNode;
};

export function FormularioAjustes({
  accion,
  textoBoton = "Guardar",
  vaciarAlGuardar = false,
  className = "grid gap-4",
  children,
}: Props) {
  const [resultado, ejecutar, enviando] = useActionState(accion, SIN_RESULTADO);
  const formulario = useRef<HTMLFormElement>(null);

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => ejecutar(datos));
  }

  useEffect(() => {
    // "aviso" también es guardado bien (p. ej. un cierre con citas en esas fechas).
    const guardado = resultado.tipo === "ok" || resultado.tipo === "aviso";
    if (vaciarAlGuardar && guardado) formulario.current?.reset();
  }, [resultado, vaciarAlGuardar]);

  return (
    <form ref={formulario} onSubmit={alEnviar} className={className}>
      {children}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enviando} className={estilos.botonPrincipal}>
          {enviando ? "Guardando…" : textoBoton}
        </button>
      </div>

      <Mensaje resultado={resultado} />
    </form>
  );
}
