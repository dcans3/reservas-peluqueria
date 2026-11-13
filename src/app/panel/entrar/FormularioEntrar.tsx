"use client";

import { useActionState } from "react";
import { entrar, type EstadoEntrar } from "./acciones";

const estadoInicial: EstadoEntrar = { error: null, email: "" };

const estiloCampo =
  "w-full rounded-lg border-[1.5px] border-renglon bg-hoja px-3 py-2.5 text-base aria-invalid:border-rojo";

export function FormularioEntrar() {
  const [estado, accion, enviando] = useActionState(entrar, estadoInicial);
  const hayError = Boolean(estado.error);

  return (
    <form action={accion} className="grid gap-4">
      {hayError && (
        <p
          role="alert"
          className="rounded-[10px] bg-rojo-claro px-3.5 py-3 font-bold text-rojo"
        >
          {estado.error}
        </p>
      )}

      <div className="grid gap-1">
        <label htmlFor="email" className="font-bold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={estado.email}
          aria-invalid={hayError}
          className={estiloCampo}
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="password" className="font-bold">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={hayError}
          className={estiloCampo}
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-[10px] bg-verde p-4 text-[17px] font-bold text-hoja disabled:cursor-not-allowed disabled:bg-renglon disabled:text-tinta-suave"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
