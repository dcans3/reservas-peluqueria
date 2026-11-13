import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Big_Shoulders } from "next/font/google";
import "./globals.css";

// Fuentes de la guía de estilo. next/font las descarga al compilar y las
// sirve desde nuestra web: el navegador no llama a Google.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  axes: ["opsz"], // tamaño óptico: la clase "rotulo" usa la versión Display
  // Next.js no tiene las medidas de esta fuente para ajustar una de reserva,
  // así que la indicamos a mano (la misma que usa la demo).
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "sans-serif"],
});

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

// Título genérico: el nombre del negocio sale de la base de datos.
export const metadata: Metadata = {
  title: "Reservas",
  description: "Reserva tu cita online",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bigShoulders.variable} ${atkinson.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
