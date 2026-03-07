-- =========================================================
-- PROFILE CUSTOMIZATION UPGRADE
-- Ejecutar en Supabase SQL Editor
-- =========================================================

alter table users add column if not exists banner_url text;
alter table users add column if not exists tagline text;
alter table users add column if not exists favorite_console text;
alter table users add column if not exists profile_theme text not null default 'neon-grid';
alter table users add column if not exists badges text[] not null default '{}';

create index if not exists idx_users_profile_theme on users(profile_theme);
