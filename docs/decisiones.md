# Decisiones del proyecto

Actualizado: 12-nov-2026. Plan detallado de la fase 1: https://claude.ai/artifact/EYxzq6NNpFWvAucseDYcTP

## Contexto
- Equipo: 2 personas, en su tiempo libre. El plazo no preocupa.
- Coste de desarrollo: 0 €. Solo se gasta cuando haya un negocio cliente, y ese coste entra en el precio.
- Objetivo: presentarlo a una peluquería y vendérselo.

## Enfoque elegido: opción C, por fases
1. Fase 1: web informativa + reserva online por calendario + panel de agenda + emails.
2. Fase 2: chatbot web sobre la misma API (IA con 4 herramientas: ver servicios, ver huecos, crear cita, cancelar cita).
3. Fase 3: el mismo bot en WhatsApp.

## Stack
- TypeScript + Next.js (App Router, src/, Tailwind CSS), alojado en Vercel Hobby. Repositorio público en GitHub, para que los dos podamos desplegar gratis.
- Supabase (PostgreSQL + login), plan Free.
- Emails: Gmail con contraseña de aplicación en desarrollo; Resend con el dominio del cliente al vender.
- Fase 2: Gemini API, nivel gratuito, solo con datos inventados.
- Fase 3: número de prueba de WhatsApp Cloud API (máximo 5 destinatarios).

## Reglas de diseño
- Un negocio por instalación, pero nada del negocio escrito en el código (tabla `negocio`). Pasar a varias peluquerías = añadir `negocio_id` a cada tabla.
- La regla contra la doble reserva está en la base de datos (`citas_sin_solapes`).
- La web pública no accede a la base de datos desde el navegador: todo pasa por la API del servidor.
- Fuera de la fase 1: cobros y facturas (Verifactu), varios servicios en una cita (se usan packs) y app nativa.
- Esquema SQL probado: `supabase/schema.sql`.

## Pendiente
- Hablar con el negocio objetivo antes del hito 1.
- Confirmar las tarifas de WhatsApp antes de la fase 3.
- Al vender: coste mínimo de unos 45 $/mes (Vercel Pro + Supabase Pro) más el dominio.
