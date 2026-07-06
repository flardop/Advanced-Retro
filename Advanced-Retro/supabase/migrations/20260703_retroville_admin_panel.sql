create extension if not exists pgcrypto;

create table if not exists public.retroville_admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create unique index if not exists idx_retroville_admin_users_email_lower
  on public.retroville_admin_users (lower(email));

create table if not exists public.retroville_admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.retroville_admin_users(id) on delete cascade,
  token_hash text not null,
  ip_hash text,
  ip_address text,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists idx_retroville_admin_sessions_token_hash
  on public.retroville_admin_sessions (token_hash);

create index if not exists idx_retroville_admin_sessions_user_created
  on public.retroville_admin_sessions (user_id, created_at desc);

create index if not exists idx_retroville_admin_sessions_expires
  on public.retroville_admin_sessions (expires_at desc);

create table if not exists public.retroville_admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text,
  ip_hash text not null,
  ip_address text,
  user_agent text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_retroville_admin_login_attempts_ip_time
  on public.retroville_admin_login_attempts (ip_hash, attempted_at desc);

create index if not exists idx_retroville_admin_login_attempts_success_time
  on public.retroville_admin_login_attempts (success, attempted_at desc);

create table if not exists public.retroville_admin_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.retroville_admin_users(id) on delete set null,
  session_id uuid references public.retroville_admin_sessions(id) on delete set null,
  email text,
  ip_hash text,
  ip_address text,
  user_agent text,
  event_type text not null check (event_type in ('login', 'logout', 'password_change', 'access')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_retroville_admin_access_logs_time
  on public.retroville_admin_access_logs (created_at desc);

create index if not exists idx_retroville_admin_access_logs_user_time
  on public.retroville_admin_access_logs (user_id, created_at desc);

create table if not exists public.retroville_seo_audits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  title text,
  meta_description text,
  canonical text,
  lighthouse_seo_score integer check (lighthouse_seo_score between 0 and 100),
  structured_data_types text[] not null default '{}'::text[],
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_retroville_seo_audits_path_time
  on public.retroville_seo_audits (path, created_at desc);

create table if not exists public.retroville_crawler_logs (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  user_agent text not null,
  path text not null,
  method text not null default 'GET',
  ip_hash text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_retroville_crawler_logs_path_time
  on public.retroville_crawler_logs (path, created_at desc);

create index if not exists idx_retroville_crawler_logs_bot_time
  on public.retroville_crawler_logs (bot_name, created_at desc);

alter table if exists public.retroville_waitlist
  add column if not exists status text not null default 'active';

alter table if exists public.retroville_waitlist
  add column if not exists page_path text;

alter table if exists public.retroville_waitlist
  add column if not exists page_title text;

alter table if exists public.retroville_waitlist
  add column if not exists session_id text;

alter table if exists public.retroville_waitlist
  add column if not exists device_type text;

alter table if exists public.retroville_waitlist
  add column if not exists browser text;

alter table if exists public.retroville_waitlist
  add column if not exists os text;

alter table if exists public.retroville_waitlist
  add column if not exists referrer text;

alter table if exists public.retroville_waitlist
  add column if not exists country text;

alter table if exists public.retroville_waitlist
  add column if not exists city text;

alter table if exists public.retroville_waitlist
  add column if not exists last_seen_at timestamptz;

alter table if exists public.retroville_waitlist
  add column if not exists visits_count integer not null default 1;

alter table if exists public.retroville_waitlist
  add column if not exists unsubscribed_at timestamptz;

create index if not exists idx_retroville_waitlist_created_status
  on public.retroville_waitlist (created_at desc, status);

create index if not exists idx_retroville_waitlist_session
  on public.retroville_waitlist (session_id);

create index if not exists idx_retroville_waitlist_role
  on public.retroville_waitlist (role_label);

alter table if exists public.error_logs
  add column if not exists status text not null default 'new';

alter table if exists public.error_logs
  add column if not exists occurrence_key text;

alter table if exists public.error_logs
  add column if not exists browser text;

alter table if exists public.error_logs
  add column if not exists device_type text;

alter table if exists public.error_logs
  add column if not exists user_agent text;

update public.error_logs
set status = 'resolved'
where resolved = true
  and status <> 'resolved';

create index if not exists idx_error_logs_status_time
  on public.error_logs (status, created_at desc);

create index if not exists idx_error_logs_occurrence
  on public.error_logs (occurrence_key, created_at desc);

alter table if exists public.retroville_admin_users enable row level security;
alter table if exists public.retroville_admin_sessions enable row level security;
alter table if exists public.retroville_admin_login_attempts enable row level security;
alter table if exists public.retroville_admin_access_logs enable row level security;
alter table if exists public.retroville_seo_audits enable row level security;
alter table if exists public.retroville_crawler_logs enable row level security;

revoke all on public.retroville_admin_users from anon, authenticated;
revoke all on public.retroville_admin_sessions from anon, authenticated;
revoke all on public.retroville_admin_login_attempts from anon, authenticated;
revoke all on public.retroville_admin_access_logs from anon, authenticated;
revoke all on public.retroville_seo_audits from anon, authenticated;
revoke all on public.retroville_crawler_logs from anon, authenticated;

insert into public.admin_settings (key, value, description)
values
  ('retroville_contact_email', 'retr0ovllee@gmail.com', 'Email visible y usado para solicitar materiales privados de Retroville'),
  ('retroville_hero_tagline', 'Every forgotten game ends up somewhere.', 'Tagline principal del hero de Retroville'),
  ('retroville_buyer_brief_copy', 'El siguiente paso ya no depende de adivinar qué material hay o a qué correo escribir.', 'Copy editable del bloque buyer brief de Retroville'),
  ('retroville_event_description', 'El 10 de noviembre llega la primera señal publica de Retroville: activamos el primer reveal, abrimos el siguiente drop y avisamos primero a quienes ya reciben La Señal.', 'Descripción editable del evento principal de Retroville'),
  ('retroville_waitlist_open', 'true', 'Permite o bloquea nuevas altas en la waitlist de Retroville'),
  ('retroville_maintenance_mode', 'false', 'Activa una pantalla de mantenimiento para la parte pública de Retroville'),
  ('retroville_launch_date', '2026-11-10T00:00:00.000Z', 'Fecha del reveal público de Retroville')
on conflict (key) do update
set description = excluded.description;

insert into public.retroville_admin_users (email, password_hash, display_name, is_active)
values (
  'flardop44@gmail.com',
  '$2b$12$CVI9Ij9OYlkUhQqaKGp2OOEpxCuQLz70c..G.xSu5rzzNQHIZRdBK',
  'Retroville Creator',
  true
)
on conflict (email) do update
set password_hash = excluded.password_hash,
    display_name = coalesce(public.retroville_admin_users.display_name, excluded.display_name),
    is_active = true,
    updated_at = now();
