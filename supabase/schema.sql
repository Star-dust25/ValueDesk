-- =============================================================
-- ValueDesk · Esquema Integral ITIL 4 (Supabase PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- Tipos enumerados
create type ticket_status   as enum ('nuevo', 'en_progreso', 'resuelto');
create type ticket_priority as enum ('alta', 'media', 'baja');
create type ticket_type     as enum ('incidente', 'solicitud');
create type asset_status    as enum ('en_uso', 'disponible', 'en_reparacion', 'retirado');
create type change_type     as enum ('estandar', 'normal', 'emergencia');
create type change_risk     as enum ('bajo', 'medio', 'alto');
create type change_status   as enum ('borrador', 'pendiente', 'aprobado', 'implementado', 'rechazado', 'fallido');

-- 1. TABLA DE ACTIVOS (CMDB)
create table public.assets (
  id             text primary key,                       -- AST-101…
  name           text not null,
  type           text not null,                          -- Laptop, Servidor, Red…
  serial         text not null unique,
  assigned_to    text not null default 'Sin asignar',
  status         asset_status not null default 'en_uso',
  location       text not null default '',
  cost           numeric(10, 2) not null default 0,
  warranty_until timestamptz,
  notes          text not null default '',
  created_at     timestamptz not null default now()
);

-- 2. TABLA DE BASE DE CONOCIMIENTO (KB)
create table public.kb_articles (
  id          text primary key,                          -- KB-101…
  title       text not null,
  category    text not null,
  summary     text not null,
  content     text not null,
  author      text not null default 'Equipo TI',
  helpful_yes integer not null default 0,
  helpful_no  integer not null default 0,
  views       integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. TABLA DE TICKETS (MESA DE SERVICIO)
create table public.tickets (
  id           text primary key,                         -- INC-101, REQ-204…
  title        text not null check (char_length(title) between 3 and 140),
  description  text not null default '' check (char_length(description) <= 1000),
  service      text,                                     -- acceso, equipo, red…
  type         ticket_type not null default 'incidente',
  priority     ticket_priority not null default 'media',
  status       ticket_status not null default 'nuevo',
  position     integer not null default 0,
  assignee     text not null default 'Sin asignar',
  asset_id     text references public.assets(id) on delete set null,
  kb_id        text references public.kb_articles(id) on delete set null,
  csat         smallint check (csat between 1 and 5),
  csat_comment text,
  comments     jsonb not null default '[]'::jsonb,       -- bitácora de auditoría
  requester    uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create index tickets_status_position_idx on public.tickets (status, position);

-- 4. TABLA DE HABILITACIÓN DEL CAMBIO (RFC)
create table public.changes (
  id              text primary key,                      -- CHG-101…
  title           text not null,
  type            change_type not null default 'normal',
  risk            change_risk not null default 'medio',
  status          change_status not null default 'pendiente',
  requester       text not null,
  approver        text,
  service         text,
  scheduled_start timestamptz,
  scheduled_end   timestamptz,
  description     text not null,
  backout_plan    text not null,                         -- plan de reversión (garantía)
  created_at      timestamptz not null default now()
);

-- Trigger de resolución para cálculo de MTTR y SLAs
create or replace function public.touch_ticket() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'resuelto' and old.status is distinct from 'resuelto' then
    new.resolved_at := now();
  elsif new.status is distinct from 'resuelto' then
    new.resolved_at := null;
  end if;
  return new;
end $$;

create trigger tickets_touch before update on public.tickets
  for each row execute function public.touch_ticket();

-- Políticas RLS (Row Level Security)
alter table public.assets enable row level security;
alter table public.kb_articles enable row level security;
alter table public.tickets enable row level security;
alter table public.changes enable row level security;

-- Acceso para demo y pruebas locales
create policy "Anon full assets" on public.assets for all to anon using (true) with check (true);
create policy "Anon full kb"     on public.kb_articles for all to anon using (true) with check (true);
create policy "Anon full tickets" on public.tickets for all to anon using (true) with check (true);
create policy "Anon full changes" on public.changes for all to anon using (true) with check (true);
