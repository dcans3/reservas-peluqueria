-- =====================================================================
-- Reservas peluquería · Esquema de la fase 1 (pegar en Supabase > SQL Editor)
-- =====================================================================

-- 1) Extensión necesaria para impedir citas solapadas
create extension if not exists btree_gist;

-- 2) Datos y reglas del negocio (una sola fila; nada del negocio va escrito en el código)
create table negocio (
  id smallint primary key default 1 check (id = 1),
  nombre text not null,
  direccion text,
  telefono text,
  email text,
  zona_horaria text not null default 'Europe/Madrid',
  minutos_por_hueco int not null default 15,       -- cada cuánto se ofrecen horas: 10:00, 10:15...
  antelacion_minima_min int not null default 120,  -- no se puede reservar con menos de 2 h
  dias_maximos_reserva int not null default 60,    -- no se puede reservar a más de 60 días
  horas_limite_cancelar int not null default 24,   -- el cliente cancela online hasta 24 h antes
  check (minutos_por_hueco > 0),
  check (antelacion_minima_min >= 0),
  check (dias_maximos_reserva > 0),
  check (horas_limite_cancelar >= 0)
);

create table profesionales (
  id bigint generated always as identity primary key,
  nombre text not null,
  color text not null default '#7c3aed',           -- color en la agenda
  activo boolean not null default true
);

create table servicios (
  id bigint generated always as identity primary key,
  nombre text not null,
  duracion_min int not null check (duracion_min > 0),
  precio numeric(6,2),
  activo boolean not null default true,
  orden int not null default 0
);

-- Qué servicios hace cada profesional
create table profesional_servicios (
  profesional_id bigint references profesionales(id) on delete cascade,
  servicio_id bigint references servicios(id) on delete cascade,
  primary key (profesional_id, servicio_id)
);

-- Horario semanal. Turno partido = dos filas el mismo día
create table horarios (
  id bigint generated always as identity primary key,
  profesional_id bigint not null references profesionales(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 1 and 7),  -- 1 = lunes, 7 = domingo
  hora_inicio time not null,
  hora_fin time not null,
  check (hora_fin > hora_inicio)
);

-- Vacaciones, bajas, festivos. profesional_id vacío = cierra toda la peluquería
create table ausencias (
  id bigint generated always as identity primary key,
  profesional_id bigint references profesionales(id) on delete cascade,
  inicio timestamptz not null,
  fin timestamptz not null,
  motivo text,
  check (fin > inicio)
);

create table clientes (
  id bigint generated always as identity primary key,
  nombre text not null,
  telefono text not null unique,
  email text,
  acepta_privacidad_en timestamptz,                -- cuándo aceptó la política de privacidad
  notas text,
  creado_en timestamptz not null default now()
);

create table citas (
  id bigint generated always as identity primary key,
  profesional_id bigint not null references profesionales(id),
  servicio_id bigint not null references servicios(id),
  cliente_id bigint not null references clientes(id),
  inicio timestamptz not null,
  fin timestamptz not null,
  estado text not null default 'confirmada'
    check (estado in ('confirmada', 'cancelada', 'completada', 'no_vino')),
  origen text not null default 'web'
    check (origen in ('web', 'panel', 'chatbot', 'whatsapp')),
  token_cancelacion uuid not null default gen_random_uuid() unique,  -- para el enlace "cancelar cita" del email
  recordatorio_enviado boolean not null default false,
  notas text,
  creada_en timestamptz not null default now(),
  check (fin > inicio),
  -- LA REGLA CLAVE: un profesional no puede tener dos citas no canceladas a la vez.
  -- [inicio, fin) → una cita que acaba a las 10:30 no choca con otra que empieza a las 10:30.
  constraint citas_sin_solapes exclude using gist (
    profesional_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado <> 'cancelada')
);

create index citas_inicio_idx on citas (inicio);

-- 3) Personal que puede entrar al panel (enlazado a los usuarios de Supabase Auth)
create table personal (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null default 'admin' check (rol in ('admin', 'profesional'))
);

create or replace function es_personal() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.personal where user_id = auth.uid());
$$;

-- 4) Seguridad (RLS): desde el navegador solo entra el personal logueado.
--    La web pública NO toca la base de datos desde el navegador: pasa por el servidor (API).
alter table negocio               enable row level security;
alter table profesionales         enable row level security;
alter table servicios             enable row level security;
alter table profesional_servicios enable row level security;
alter table horarios              enable row level security;
alter table ausencias             enable row level security;
alter table clientes              enable row level security;
alter table citas                 enable row level security;
alter table personal              enable row level security;

create policy "solo personal" on negocio               for all to authenticated using (es_personal()) with check (es_personal());
create policy "solo personal" on profesionales         for all to authenticated using (es_personal()) with check (es_personal());
create policy "solo personal" on servicios             for all to authenticated using (es_personal()) with check (es_personal());
create policy "solo personal" on profesional_servicios for all to authenticated using (es_personal()) with check (es_personal());
create policy "solo personal" on horarios              for all to authenticated using (es_personal()) with check (es_personal());
create policy "solo personal" on ausencias             for all to authenticated using (es_personal()) with check (es_personal());
create policy "solo personal" on clientes              for all to authenticated using (es_personal()) with check (es_personal());
create policy "solo personal" on citas                 for all to authenticated using (es_personal()) with check (es_personal());
create policy "ver mi ficha"  on personal              for select to authenticated using (user_id = auth.uid());

-- 5) Datos de ejemplo para desarrollar (borradlos antes de la demo y poned los reales)
insert into negocio (nombre, direccion, telefono, email)
values ('Peluquería Demo', 'Calle Mayor 1, Madrid', '600000000', 'demo@example.com');

insert into profesionales (nombre, color) values ('Laura', '#e11d48'), ('Marcos', '#2563eb');

insert into servicios (nombre, duracion_min, precio, orden) values
  ('Corte mujer', 45, 22, 1),
  ('Corte hombre', 30, 14, 2),
  ('Color raíz', 90, 38, 3),
  ('Peinado', 30, 18, 4);

-- Laura hace todos los servicios; Marcos, corte hombre y peinado
insert into profesional_servicios (profesional_id, servicio_id)
select p.id, s.id from profesionales p, servicios s
where p.nombre = 'Laura'
   or (p.nombre = 'Marcos' and s.nombre in ('Corte hombre', 'Peinado'));

-- Martes a sábado, de 10:00 a 14:00 y de 16:00 a 20:00
insert into horarios (profesional_id, dia_semana, hora_inicio, hora_fin)
select p.id, d, t.ini, t.fin
from profesionales p,
     generate_series(2, 6) as d,
     (values ('10:00'::time, '14:00'::time), ('16:00'::time, '20:00'::time)) as t(ini, fin);
