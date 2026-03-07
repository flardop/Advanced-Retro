-- =============================================================================
-- GAMIFICATION XP + LEVELS (MVP)
-- Ejecuta este archivo completo en Supabase SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users: columnas de XP / nivel
-- -----------------------------------------------------------------------------
alter table if exists public.users
  add column if not exists xp_total integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists xp_updated_at timestamptz default now();

update public.users set xp_total = coalesce(xp_total, 0) where true;
update public.users set level = greatest(1, coalesce(level, 1)) where true;
update public.users set xp_updated_at = coalesce(xp_updated_at, now()) where xp_updated_at is null;

create index if not exists idx_users_xp_total on public.users(xp_total desc);
create index if not exists idx_users_level on public.users(level desc);

-- -----------------------------------------------------------------------------
-- eventos de XP
-- -----------------------------------------------------------------------------
create table if not exists public.user_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action_key text not null,
  xp_delta integer not null,
  dedupe_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_xp_events_user_created
  on public.user_xp_events(user_id, created_at desc);
create index if not exists idx_user_xp_events_action
  on public.user_xp_events(action_key);

-- -----------------------------------------------------------------------------
-- rachas de login
-- -----------------------------------------------------------------------------
create table if not exists public.user_login_streaks (
  user_id uuid primary key references public.users(id) on delete cascade,
  streak_count integer not null default 0,
  longest_streak integer not null default 0,
  last_login_on date,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_login_streaks_last_login
  on public.user_login_streaks(last_login_on desc nulls last);

-- -----------------------------------------------------------------------------
-- recompensas desbloqueadas por nivel
-- -----------------------------------------------------------------------------
create table if not exists public.user_level_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reward_key text not null,
  reward_label text not null,
  reward_type text not null,
  level_required integer not null,
  metadata jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default now(),
  unique (user_id, reward_key)
);

create index if not exists idx_user_level_rewards_user_unlocked
  on public.user_level_rewards(user_id, unlocked_at desc);
create index if not exists idx_user_level_rewards_level
  on public.user_level_rewards(level_required desc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table if exists public.user_xp_events enable row level security;
alter table if exists public.user_login_streaks enable row level security;
alter table if exists public.user_level_rewards enable row level security;

drop policy if exists "user_xp_events own read" on public.user_xp_events;
create policy "user_xp_events own read"
on public.user_xp_events
for select
using (auth.uid() = user_id);

drop policy if exists "user_login_streaks own read" on public.user_login_streaks;
create policy "user_login_streaks own read"
on public.user_login_streaks
for select
using (auth.uid() = user_id);

drop policy if exists "user_level_rewards own read" on public.user_level_rewards;
create policy "user_level_rewards own read"
on public.user_level_rewards
for select
using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Recarga cache PostgREST
-- -----------------------------------------------------------------------------
notify pgrst, 'reload schema';
