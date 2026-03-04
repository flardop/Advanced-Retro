-- ============================================================================
-- HYPE ROADMAP (MYSTERY DROP + SUBASTAS BLOQUEADAS)
-- Ejecuta este script en Supabase SQL Editor.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.future_launches (
  id uuid primary key default gen_random_uuid(),
  launch_key text not null unique,
  kind text not null check (kind in ('mystery_drop', 'auction_season')),
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  image_url text not null default '/placeholder.svg',
  lock_until timestamptz not null,
  is_active boolean not null default true,
  pinned boolean not null default false,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_future_launches_active
  on public.future_launches(is_active, priority, lock_until);

create table if not exists public.future_launch_reservations (
  id uuid primary key default gen_random_uuid(),
  launch_key text not null references public.future_launches(launch_key) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (launch_key, user_id)
);

create index if not exists idx_future_launch_reservations_launch
  on public.future_launch_reservations(launch_key, status, created_at desc);

create index if not exists idx_future_launch_reservations_user
  on public.future_launch_reservations(user_id, status, created_at desc);

insert into public.future_launches (
  launch_key,
  kind,
  title,
  subtitle,
  description,
  image_url,
  lock_until,
  is_active,
  pinned,
  priority
) values
(
  'mystery-drop-s1',
  'mystery_drop',
  'Drop bloqueado: Caja Sorpresa Retro',
  'Apertura en 30 días',
  'Caja sorpresa premium con selección oculta de juegos retro. Solo con plaza reservada y cupo limitado.',
  '/images/hype/mystery-drop.svg',
  now() + interval '30 days',
  true,
  true,
  10
),
(
  'auctions-season-1',
  'auction_season',
  'Subastas privadas: Temporada 1',
  'Apertura en 50 días',
  'Puja por piezas de colección y ediciones difíciles. Reserva plaza y entra antes al lanzamiento.',
  '/images/hype/auction-season.svg',
  now() + interval '50 days',
  true,
  true,
  20
)
on conflict (launch_key) do update set
  kind = excluded.kind,
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  image_url = excluded.image_url,
  lock_until = excluded.lock_until,
  is_active = excluded.is_active,
  pinned = excluded.pinned,
  priority = excluded.priority,
  updated_at = now();

notify pgrst, 'reload schema';

