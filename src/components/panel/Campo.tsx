// Etiqueta + campo + ayuda opcional, siempre con la misma forma.

import type { ReactNode } from "react";
import { estilos } from "./estilos";

type Props = {
  id: string;
  etiqueta: string;
  ayuda?: string;
  children: ReactNode; // el <input> o <select>, con el mismo id
  className?: string;
};

export function Campo({ id, etiqueta, ayuda, children, className = "" }: Props) {
  return (
    <div className={`grid content-start gap-1 ${className}`}>
      <label htmlFor={id} className={estilos.etiqueta}>
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className={estilos.ayuda}>{ayuda}</p>}
    </div>
  );
}
