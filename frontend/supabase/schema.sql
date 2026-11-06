-- =====================================================================
--  Viviendas · SNRGY  —  esquema de Supabase
--  Pégalo completo en  Supabase > SQL Editor > New query > Run
-- =====================================================================

-- 1) Perfil de cada cuenta: rol y vivienda asignada ---------------------
create table if not exists public.perfiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  usuario   text unique not null,                       -- lo que la persona escribe al entrar
  rol       text not null default 'habitante' check (rol in ('admin','habitante')),
  vivienda  text,                                       -- código, p. ej. 'Vivienda-004' (null para admin)
  creado    timestamptz not null default now(),
  constraint habitante_con_vivienda check (rol = 'admin' or vivienda is not null)
);

-- 2) Datos generales no sensibles (fechas, caídas del sistema) ----------
create table if not exists public.meta (
  id     int primary key default 1 check (id = 1),
  datos  jsonb not null,
  actualizado timestamptz not null default now()
);

-- 3) Datos de cada vivienda (una fila por vivienda) ---------------------
create table if not exists public.vivienda_datos (
  codigo      text primary key,
  datos       jsonb not null,                          -- lat/lon, sensores y series por hora
  actualizado timestamptz not null default now()
);

-- 4) Funciones de ayuda (security definer: evitan recursión en las políticas)
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where user_id = auth.uid() and rol = 'admin');
$$;

create or replace function public.mi_vivienda() returns text
language sql stable security definer set search_path = public as $$
  select vivienda from public.perfiles where user_id = auth.uid();
$$;

-- 5) Seguridad a nivel de fila (RLS) -----------------------------------
alter table public.perfiles       enable row level security;
alter table public.meta           enable row level security;
alter table public.vivienda_datos enable row level security;

drop policy if exists perfil_propio  on public.perfiles;
drop policy if exists meta_lectura   on public.meta;
drop policy if exists datos_lectura  on public.vivienda_datos;

-- Cada persona solo ve su propio perfil; nadie escribe desde la página.
create policy perfil_propio on public.perfiles
  for select to authenticated using (user_id = auth.uid());

-- Cualquier cuenta con sesión puede leer las fechas generales.
create policy meta_lectura on public.meta
  for select to authenticated using (true);

-- El habitante solo lee SU vivienda; el administrador lee todas.
create policy datos_lectura on public.vivienda_datos
  for select to authenticated using (public.es_admin() or codigo = public.mi_vivienda());

-- Sin acceso para usuarios anónimos y sin escritura desde el navegador.
-- (Los scripts cargar_datos.py y crear_usuarios.py usan la service_role key,
--  que se salta RLS y NUNCA debe ponerse en la página.)
revoke all on public.perfiles, public.meta, public.vivienda_datos from anon;
revoke insert, update, delete on public.perfiles, public.meta, public.vivienda_datos from authenticated;
grant select on public.perfiles, public.meta, public.vivienda_datos to authenticated;
