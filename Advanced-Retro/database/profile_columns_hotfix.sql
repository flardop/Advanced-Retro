-- =============================================================================
-- PROFILE COLUMNS HOTFIX (NO DESTRUCTIVO)
-- Soluciona errores tipo:
--   Could not find the 'avatar_url' column of 'users' in the schema cache
-- =============================================================================

create extension if not exists pgcrypto;

alter table if exists public.users add column if not exists name text;
alter table if exists public.users add column if not exists avatar_url text;
alter table if exists public.users add column if not exists banner_url text;
alter table if exists public.users add column if not exists bio text;
alter table if exists public.users add column if not exists tagline text;
alter table if exists public.users add column if not exists favorite_console text;
alter table if exists public.users add column if not exists profile_theme text default 'neon-grid';
alter table if exists public.users add column if not exists favorites_visibility text default 'public';
alter table if exists public.users add column if not exists badges text[] default '{}';
alter table if exists public.users add column if not exists shipping_address jsonb;
alter table if exists public.users add column if not exists is_verified_seller boolean default false;
alter table if exists public.users add column if not exists xp_total integer default 0;
alter table if exists public.users add column if not exists level integer default 1;
alter table if exists public.users add column if not exists xp_updated_at timestamptz default now();
alter table if exists public.users add column if not exists updated_at timestamptz default now();

update public.users
set
  name = coalesce(nullif(trim(name), ''), split_part(coalesce(email, ''), '@', 1), 'Coleccionista'),
  profile_theme = coalesce(nullif(profile_theme, ''), 'neon-grid'),
  favorites_visibility = case
    when lower(coalesce(favorites_visibility, 'public')) in ('private', 'members', 'public')
      then lower(coalesce(favorites_visibility, 'public'))
    else 'public'
  end,
  badges = coalesce(badges, '{}'),
  is_verified_seller = coalesce(is_verified_seller, false),
  xp_total = coalesce(xp_total, 0),
  level = greatest(1, coalesce(level, 1)),
  xp_updated_at = coalesce(xp_updated_at, now()),
  updated_at = coalesce(updated_at, now())
where true;

create index if not exists idx_users_profile_theme on public.users(profile_theme);
create index if not exists idx_users_verified_seller on public.users(is_verified_seller);

notify pgrst, 'reload schema';
