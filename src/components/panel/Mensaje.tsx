// Mensaje bajo un formulario: "Guardado", un aviso o un error.

import type { Resultado } from "@/lib/ajustes/resultado";

const colores: Record<Resultado["tipo"], string> = {
  nada: "",
  ok: "bg-verde-claro text-verde",
  aviso: "bg-[#f4ead6] text-[#6b4d12]", // latón claro
  error: "bg-rojo-claro text-rojo",
};

export function Mensaje({ resultado }: { resultado: Resultado }) {
  if (resultado.tipo === "nada") return null;

  return (
    <p
      // Los errores se anuncian enseguida a los lectores de pantalla.
      role={resultado.tipo === "error" ? "alert" : "status"}
      className={`rounded-[10px] px-3.5 py-2.5 font-bold ${colores[resultado.tipo]}`}
    >
      {resultado.mensaje}
    </p>
  );
}
