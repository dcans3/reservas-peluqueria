"use client";

// Pestañas de Ajustes. Cada una es una dirección propia, así funciona el
// botón "Atrás" del navegador. En el móvil se desplazan en horizontal.

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/panel/ajustes/negocio", texto: "Negocio" },
  { href: "/panel/ajustes/servicios", texto: "Servicios" },
  { href: "/panel/ajustes/profesionales", texto: "Profesionales" },
  { href: "/panel/ajustes/horarios", texto: "Horarios" },
  { href: "/panel/ajustes/cierres", texto: "Cierres y vacaciones" },
];

export function Pestanas() {
  const ruta = usePathname();

  return (
    <nav aria-label="Ajustes" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1.5 rounded-xl bg-hoja p-1.5 ring-1 ring-renglon">
        {PESTANAS.map((p) => {
          const activa = ruta.startsWith(p.href);
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={activa ? "page" : undefined}
                className={`block whitespace-nowrap rounded-lg px-3.5 py-2 font-bold ${
                  activa ? "bg-verde text-hoja" : "hover:bg-verde-claro"
                }`}
              >
                {p.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
