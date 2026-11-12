@AGENTS.md

# Reservas peluquería

Sistema de reservas para una peluquería: web informativa con reserva online y panel de agenda para el negocio. Más adelante, chatbot (fase 2) y WhatsApp (fase 3) sobre la misma API.

- Plan de la fase 1: https://claude.ai/artifact/EYxzq6NNpFWvAucseDYcTP
- Decisiones: docs/decisiones.md
- Esquema de la base de datos: supabase/schema.sql

## Cómo trabajar con nosotros
- Responde en español de España.
- Somos 2 personas de nivel principiante-intermedio: explica lo justo, con ejemplos de este proyecto.
- Código simple y legible antes que soluciones ingeniosas. Da el código completo; si cambias solo una parte, di exactamente dónde va.
- Avisa de problemas de seguridad o rendimiento aunque no preguntemos.
- Si algo contradice docs/decisiones.md, avísanos antes de hacerlo.

## Stack
- TypeScript + Next.js (App Router, carpeta src/), Tailwind CSS. Alojado en Vercel (plan Hobby mientras sea prototipo).
- Supabase: PostgreSQL + login del personal.
- Emails: Gmail con contraseña de aplicación (Nodemailer) en desarrollo.
- Tests: Vitest. Fechas: Luxon, zona Europe/Madrid.

## Reglas que no se rompen
- Coste 0 € durante el desarrollo: no añadas servicios de pago.
- El repositorio es público: nunca escribas claves en el código. Van en .env.local, que está en .gitignore.
- La clave secreta de Supabase (SUPABASE_SERVICE_ROLE_KEY) solo se usa en el servidor, nunca en componentes de cliente.
- La web pública no accede a Supabase desde el navegador: todo pasa por las rutas /api.
- La regla contra dobles reservas está en la base de datos (constraint citas_sin_solapes). No la quites: captura su error y muestra "Esa hora se acaba de ocupar, elige otra".
- Nada del negocio escrito en el código: nombre, horarios, servicios y reglas salen de la base de datos.
- Fuera de la fase 1: cobros, facturas, varios servicios por cita (se usan packs) y app nativa.

## Comandos
- `npm run dev`: servidor de desarrollo en http://localhost:3000
- `npm run build`: compilación de producción
- `npm run lint`: revisar el código
- Tests (Vitest): se añaden en el hito 2

## Variables de entorno (.env.local, nunca en GitHub)
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto de Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: clave secreta de Supabase (solo servidor)
