-- =============================================================================
-- 404 SNAKE LEADERBOARD
-- Ejecuta este script en Supabase SQL Editor.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.snake_404_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,
  display_name text not null,
  best_score integer not null default 0 check (best_score >= 0),
  last_score integer not null default 0 check (last_score >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_snake_404_scores_best
  on public.snake_404_scores(best_score desc, updated_at asc);

create index if not exists idx_snake_404_scores_user
  on public.snake_404_scores(user_id);

-- Opcional: RLS activado (API usa service role internamente)
alter table public.snake_404_scores enable row level security;

drop policy if exists snake_scores_public_read on public.snake_404_scores;
create policy snake_scores_public_read
  on public.snake_404_scores
  for select
  using (true);

drop policy if exists snake_scores_owner_upsert on public.snake_404_scores;
create policy snake_scores_owner_upsert
  on public.snake_404_scores
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';

