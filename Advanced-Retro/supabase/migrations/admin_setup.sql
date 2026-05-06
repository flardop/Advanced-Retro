-- =============================================================================
-- ADVANCEDRETRO ADMIN PANEL SETUP
-- Archivo único para Supabase SQL Editor
-- Crea todas las tablas, funciones, triggers y políticas necesarias para el
-- panel de administración, tracking, email, retroville y creador de tiendas.
-- Diseño: aditivo, sin romper el schema actual de la tienda.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- HELPERS
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_admin_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_role text;
  legacy_role text;
begin
  if to_regclass('public.profiles') is not null then
    execute 'select role from public.profiles where id = auth.uid()'
      into profile_role;
  end if;

  if profile_role is not null then
    return profile_role;
  end if;

  if to_regclass('public.users') is not null then
    execute 'select role from public.users where id = auth.uid()'
      into legacy_role;
  end if;

  return coalesce(legacy_role, 'user');
end;
$$;

create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() = 'admin'
$$;

comment on function public.current_admin_role() is 'Devuelve el rol efectivo del usuario autenticado usando profiles y fallback a users.';
comment on function public.is_current_admin() is 'Permite reutilizar políticas RLS para admins.';

-- -----------------------------------------------------------------------------
-- PROFILES (additive, auth-compatible)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles add column if not exists email text;
alter table if exists public.profiles add column if not exists full_name text;
alter table if exists public.profiles add column if not exists avatar_url text;
alter table if exists public.profiles add column if not exists role text;
alter table if exists public.profiles add column if not exists notes text;
alter table if exists public.profiles add column if not exists created_at timestamptz;
alter table if exists public.profiles add column if not exists updated_at timestamptz;

update public.profiles
set
  role = case when coalesce(role, 'user') in ('user', 'admin', 'banned') then coalesce(role, 'user') else 'user' end,
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where true;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'banned'));

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

comment on table public.profiles is 'Perfiles administrativos y de usuario asociados a auth.users.';
comment on column public.profiles.notes is 'Notas internas visibles solo para admins.';

create or replace function public.handle_admin_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    'user',
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
  after insert or update on auth.users
  for each row execute procedure public.handle_admin_profile_sync();

insert into public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
select
  au.id,
  au.email,
  coalesce(nullif(trim(au.raw_user_meta_data ->> 'full_name'), ''), nullif(trim(au.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(au.email, ''), '@', 1)),
  nullif(trim(au.raw_user_meta_data ->> 'avatar_url'), ''),
  'user',
  now(),
  now()
from auth.users au
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  updated_at = now();

update public.profiles
set role = 'admin', updated_at = now()
where lower(coalesce(email, '')) = 'flardop44@gmail.com';

update public.users
set role = 'admin', updated_at = now()
where lower(coalesce(email, '')) = 'flardop44@gmail.com';

-- -----------------------------------------------------------------------------
-- TRACKING TABLES
-- -----------------------------------------------------------------------------
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  page_title text,
  user_id uuid references public.profiles(id) on delete set null,
  ip_hash text,
  session_id text,
  referrer text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  duration_seconds integer not null default 0,
  timestamp timestamptz not null default now()
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text not null unique,
  current_page text,
  device_type text,
  browser text,
  os text,
  ip_hash text,
  country text,
  city text,
  last_heartbeat timestamptz not null default now(),
  started_at timestamptz not null default now()
);

comment on table public.page_views is 'Analítica granular de páginas visitadas en la tienda pública.';
comment on table public.user_sessions is 'Sesiones activas y latidos de navegación para monitorización en tiempo real.';

create index if not exists idx_page_views_timestamp on public.page_views(timestamp desc);
create index if not exists idx_page_views_url on public.page_views(url);
create index if not exists idx_page_views_user on public.page_views(user_id, timestamp desc);
create index if not exists idx_page_views_session on public.page_views(session_id);
create index if not exists idx_page_views_device on public.page_views(device_type);
create index if not exists idx_user_sessions_user on public.user_sessions(user_id, last_heartbeat desc);
create index if not exists idx_user_sessions_heartbeat on public.user_sessions(last_heartbeat desc);
create index if not exists idx_user_sessions_current_page on public.user_sessions(current_page);

-- -----------------------------------------------------------------------------
-- LOGIN ACTIVITY (extra table needed by admin UI)
-- -----------------------------------------------------------------------------
create table if not exists public.login_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  event_type text not null default 'login',
  success boolean not null default true,
  ip_hash text,
  device_type text,
  browser text,
  os text,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_activity_logs_user on public.login_activity_logs(user_id, created_at desc);
create index if not exists idx_login_activity_logs_email on public.login_activity_logs(email, created_at desc);
create index if not exists idx_login_activity_logs_event on public.login_activity_logs(event_type, created_at desc);

-- -----------------------------------------------------------------------------
-- ERROR LOGGING
-- -----------------------------------------------------------------------------
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  stack_trace text,
  url text,
  user_id uuid references public.profiles(id) on delete set null,
  severity text not null default 'error',
  extra_data jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_error_logs_severity on public.error_logs(severity, created_at desc);
create index if not exists idx_error_logs_resolved on public.error_logs(resolved, created_at desc);
create index if not exists idx_error_logs_user on public.error_logs(user_id, created_at desc);

comment on table public.error_logs is 'Errores operativos y críticos del storefront y del panel admin.';

-- -----------------------------------------------------------------------------
-- EMAIL MANAGEMENT
-- -----------------------------------------------------------------------------
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  subject text not null,
  html_body text not null,
  variables jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  template_id uuid references public.email_templates(id) on delete set null,
  status text not null default 'pending',
  error_message text,
  sent_at timestamptz not null default now()
);

create table if not exists public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.email_templates(id) on delete set null,
  recipient_scope text not null,
  recipient_payload jsonb not null default '{}'::jsonb,
  subject text not null,
  html_body text not null,
  status text not null default 'pending',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_logs_sent_at on public.email_logs(sent_at desc);
create index if not exists idx_email_logs_status on public.email_logs(status, sent_at desc);
create index if not exists idx_scheduled_emails_status on public.scheduled_emails(status, scheduled_for asc);
create index if not exists idx_scheduled_emails_created_by on public.scheduled_emails(created_by, created_at desc);

-- -----------------------------------------------------------------------------
-- SETTINGS
-- -----------------------------------------------------------------------------
create table if not exists public.admin_settings (
  key text primary key,
  value text,
  description text,
  updated_at timestamptz not null default now()
);

comment on table public.admin_settings is 'Configuración operativa editable desde el panel de administración.';

-- -----------------------------------------------------------------------------
-- LEAD CAPTURE PAGES
-- -----------------------------------------------------------------------------
create table if not exists public.retroville_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.store_creator_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  business_type text,
  plan_interest text,
  created_at timestamptz not null default now()
);

create index if not exists idx_retroville_waitlist_created_at on public.retroville_waitlist(created_at desc);
create index if not exists idx_store_creator_leads_created_at on public.store_creator_leads(created_at desc);

-- -----------------------------------------------------------------------------
-- ADMIN META TABLES (extra, additive)
-- -----------------------------------------------------------------------------
create table if not exists public.admin_product_meta (
  product_id uuid primary key references public.products(id) on delete cascade,
  compare_at_price_cents integer,
  sku text,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  seo_handle text,
  image_paths text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_order_meta (
  order_id uuid primary key references public.orders(id) on delete cascade,
  shipping_company text,
  tracking_url text,
  estimated_delivery_date date,
  internal_notes text,
  payment_status text not null default 'pending',
  fulfillment_status text not null default 'pending',
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_message_reviews (
  ticket_id uuid primary key references public.support_tickets(id) on delete cascade,
  review_status text not null default 'pending_review',
  review_reason text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_product_meta_sku on public.admin_product_meta(sku);
create index if not exists idx_admin_order_meta_fulfillment on public.admin_order_meta(fulfillment_status, updated_at desc);
create index if not exists idx_admin_order_meta_payment on public.admin_order_meta(payment_status, updated_at desc);
create index if not exists idx_admin_order_status_events_order on public.admin_order_status_events(order_id, created_at asc);
create index if not exists idx_admin_message_reviews_status on public.admin_message_reviews(review_status, updated_at desc);

comment on table public.admin_product_meta is 'Metadata editorial del catálogo usada exclusivamente por el panel admin.';
comment on table public.admin_order_meta is 'Estado logístico y notas internas de pedidos sin modificar el schema legacy.';
comment on table public.admin_order_status_events is 'Timeline de cambios de estado de pedidos.';
comment on table public.admin_message_reviews is 'Moderación administrativa de tickets/mensajes del marketplace.';

update public.admin_order_meta
set
  payment_status = case when payment_status in ('pending','paid','failed','refunded') then payment_status else 'pending' end,
  fulfillment_status = case when fulfillment_status in ('pending','processing','shipped','delivered','cancelled','refunded') then fulfillment_status else 'pending' end,
  updated_at = coalesce(updated_at, now())
where true;

update public.admin_message_reviews
set
  review_status = case when review_status in ('pending_review','approved','rejected') then review_status else 'pending_review' end,
  updated_at = coalesce(updated_at, now())
where true;

alter table public.page_views
  drop constraint if exists page_views_device_type_check;
alter table public.page_views
  add constraint page_views_device_type_check
  check (device_type is null or device_type in ('mobile', 'desktop', 'tablet'));

alter table public.user_sessions
  drop constraint if exists user_sessions_device_type_check;
alter table public.user_sessions
  add constraint user_sessions_device_type_check
  check (device_type is null or device_type in ('mobile', 'desktop', 'tablet'));

alter table public.login_activity_logs
  drop constraint if exists login_activity_logs_device_type_check;
alter table public.login_activity_logs
  add constraint login_activity_logs_device_type_check
  check (device_type is null or device_type in ('mobile', 'desktop', 'tablet'));

alter table public.error_logs
  drop constraint if exists error_logs_severity_check;
alter table public.error_logs
  add constraint error_logs_severity_check
  check (severity in ('info', 'warning', 'error', 'critical'));

alter table public.email_logs
  drop constraint if exists email_logs_status_check;
alter table public.email_logs
  add constraint email_logs_status_check
  check (status in ('sent', 'failed', 'pending'));

alter table public.scheduled_emails
  drop constraint if exists scheduled_emails_scope_check;
alter table public.scheduled_emails
  add constraint scheduled_emails_scope_check
  check (recipient_scope in ('all_users', 'buyers', 'selected_users', 'custom_email'));

alter table public.scheduled_emails
  drop constraint if exists scheduled_emails_status_check;
alter table public.scheduled_emails
  add constraint scheduled_emails_status_check
  check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled'));

alter table public.login_activity_logs
  drop constraint if exists login_activity_logs_event_type_check;
alter table public.login_activity_logs
  add constraint login_activity_logs_event_type_check
  check (event_type in ('login', 'logout', 'signup'));

alter table public.admin_order_meta
  drop constraint if exists admin_order_meta_payment_status_check;
alter table public.admin_order_meta
  add constraint admin_order_meta_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded'));

alter table public.admin_order_meta
  drop constraint if exists admin_order_meta_fulfillment_status_check;
alter table public.admin_order_meta
  add constraint admin_order_meta_fulfillment_status_check
  check (fulfillment_status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

alter table public.admin_order_status_events
  drop constraint if exists admin_order_status_events_status_check;
alter table public.admin_order_status_events
  add constraint admin_order_status_events_status_check
  check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

alter table public.admin_message_reviews
  drop constraint if exists admin_message_reviews_status_check;
alter table public.admin_message_reviews
  add constraint admin_message_reviews_status_check
  check (review_status in ('pending_review', 'approved', 'rejected'));

-- -----------------------------------------------------------------------------
-- DEFAULT SETTINGS / SEEDS
-- -----------------------------------------------------------------------------
insert into public.admin_settings (key, value, description)
values
  ('store_name', 'AdvancedRetro', 'Store display name'),
  ('contact_email', 'flardop44@gmail.com', 'Main contact email'),
  ('currency', 'EUR', 'Default currency'),
  ('timezone', 'Europe/Madrid', 'Default timezone'),
  ('ebay_api_key', '', 'eBay API key for price chart'),
  ('resend_api_key', '', 'Resend API key for emails'),
  ('admin_alert_email', 'flardop44@gmail.com', 'Email to receive critical alerts'),
  ('retroville_launch_date', to_char(now() + interval '6 months', 'YYYY-MM-DD"T"HH24:MI:SSOF'), 'Launch date for the Retroville countdown'),
  ('resend_from_email', 'AdvancedRetro <onboarding@resend.dev>', 'From name/email for Resend transactional email'),
  ('notify_new_order', 'true', 'Notify admin by email when a new order is created'),
  ('notify_new_user', 'true', 'Notify admin by email when a new user signs up'),
  ('notify_critical_error', 'true', 'Notify admin by email when a critical error is logged'),
  ('notify_low_stock', 'true', 'Notify admin by email when stock drops below threshold'),
  ('low_stock_threshold', '3', 'Low stock warning threshold'),
  ('notify_new_message', 'true', 'Notify admin by email when a new marketplace/support message arrives')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

insert into public.email_templates (name, subject, html_body, variables)
values
  (
    'order_confirmation',
    'Tu pedido {{order_id}} ya está confirmado',
    '<h1>Gracias por tu compra, {{name}}</h1><p>Hemos confirmado tu pedido <strong>{{order_id}}</strong>.</p><p>Total: {{total}}</p><p>Puedes responder a este email si necesitas ayuda.</p>',
    '["{{name}}", "{{order_id}}", "{{total}}"]'::jsonb
  ),
  (
    'shipping_notification',
    'Tu pedido {{order_id}} ya está en camino',
    '<h1>Tu pedido sale hoy</h1><p>Hola {{name}}, tu pedido <strong>{{order_id}}</strong> ha sido enviado.</p><p>Transportista: {{carrier}}</p><p>Tracking: {{tracking_number}}</p><p><a href="{{tracking_url}}">Seguir envío</a></p>',
    '["{{name}}", "{{order_id}}", "{{carrier}}", "{{tracking_number}}", "{{tracking_url}}"]'::jsonb
  ),
  (
    'delivery_confirmation',
    'Tu pedido {{order_id}} aparece como entregado',
    '<h1>Entrega completada</h1><p>Hola {{name}}, vemos tu pedido <strong>{{order_id}}</strong> como entregado.</p><p>Esperamos que lo disfrutes.</p>',
    '["{{name}}", "{{order_id}}"]'::jsonb
  ),
  (
    'password_reset',
    'Restablece tu contraseña en AdvancedRetro',
    '<h1>Restablecer contraseña</h1><p>Hola {{name}}, utiliza este enlace para cambiar tu contraseña:</p><p><a href="{{reset_link}}">Restablecer contraseña</a></p>',
    '["{{name}}", "{{reset_link}}"]'::jsonb
  ),
  (
    'welcome_email',
    'Bienvenido a AdvancedRetro',
    '<h1>Bienvenido, {{name}}</h1><p>Tu cuenta ya está lista. Explora el catálogo y guarda tus favoritos.</p>',
    '["{{name}}"]'::jsonb
  ),
  (
    'custom_announcement',
    '{{subject}}',
    '<h1>{{headline}}</h1><p>{{body}}</p>',
    '["{{subject}}", "{{headline}}", "{{body}}"]'::jsonb
  )
on conflict (name) do update set
  subject = excluded.subject,
  html_body = excluded.html_body,
  variables = excluded.variables,
  updated_at = now();

insert into public.admin_product_meta (product_id, seo_handle, image_paths, updated_at)
select p.id, coalesce(p.slug, regexp_replace(lower(coalesce(p.name, 'producto')), '[^a-z0-9]+', '-', 'g')), coalesce(p.images, case when p.image is not null then array[p.image] else '{}'::text[] end), now()
from public.products p
on conflict (product_id) do update set
  seo_handle = coalesce(public.admin_product_meta.seo_handle, excluded.seo_handle),
  image_paths = case
    when cardinality(public.admin_product_meta.image_paths) > 0 then public.admin_product_meta.image_paths
    else excluded.image_paths
  end,
  updated_at = now();

insert into public.admin_order_meta (order_id, payment_status, fulfillment_status, updated_at)
select
  o.id,
  case when o.status = 'paid' then 'paid' when o.status = 'cancelled' then 'failed' else 'pending' end,
  case
    when o.status in ('pending','processing','shipped','delivered','cancelled') then o.status
    when o.status = 'paid' then 'processing'
    else 'pending'
  end,
  now()
from public.orders o
on conflict (order_id) do nothing;

insert into public.admin_order_status_events (order_id, status, note, created_at)
select o.id,
  case
    when o.status in ('pending','processing','shipped','delivered','cancelled') then o.status
    when o.status = 'paid' then 'processing'
    else 'pending'
  end,
  'Estado inicial sincronizado desde orders',
  coalesce(o.updated_at, o.created_at, now())
from public.orders o
where not exists (
  select 1 from public.admin_order_status_events e where e.order_id = o.id
);

insert into public.admin_message_reviews (ticket_id, review_status, updated_at)
select t.id, 'pending_review', now()
from public.support_tickets t
where not exists (
  select 1 from public.admin_message_reviews r where r.ticket_id = t.id
);

-- -----------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- -----------------------------------------------------------------------------
drop trigger if exists trg_admin_profiles_updated_at on public.profiles;
create trigger trg_admin_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.admin_set_updated_at();

drop trigger if exists trg_admin_email_templates_updated_at on public.email_templates;
create trigger trg_admin_email_templates_updated_at
  before update on public.email_templates
  for each row execute procedure public.admin_set_updated_at();

drop trigger if exists trg_admin_settings_updated_at on public.admin_settings;
create trigger trg_admin_settings_updated_at
  before update on public.admin_settings
  for each row execute procedure public.admin_set_updated_at();

drop trigger if exists trg_admin_scheduled_emails_updated_at on public.scheduled_emails;
create trigger trg_admin_scheduled_emails_updated_at
  before update on public.scheduled_emails
  for each row execute procedure public.admin_set_updated_at();

drop trigger if exists trg_admin_product_meta_updated_at on public.admin_product_meta;
create trigger trg_admin_product_meta_updated_at
  before update on public.admin_product_meta
  for each row execute procedure public.admin_set_updated_at();

drop trigger if exists trg_admin_order_meta_updated_at on public.admin_order_meta;
create trigger trg_admin_order_meta_updated_at
  before update on public.admin_order_meta
  for each row execute procedure public.admin_set_updated_at();

drop trigger if exists trg_admin_message_reviews_updated_at on public.admin_message_reviews;
create trigger trg_admin_message_reviews_updated_at
  before update on public.admin_message_reviews
  for each row execute procedure public.admin_set_updated_at();

-- -----------------------------------------------------------------------------
-- CRITICAL ERROR NOTIFY
-- -----------------------------------------------------------------------------
create or replace function public.notify_critical_error_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.severity = 'critical' then
    perform pg_notify(
      'critical_error',
      json_build_object(
        'id', new.id,
        'message', new.message,
        'url', new.url,
        'severity', new.severity,
        'user_id', new.user_id,
        'created_at', new.created_at
      )::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_critical_error_event on public.error_logs;
create trigger trg_notify_critical_error_event
  after insert on public.error_logs
  for each row execute procedure public.notify_critical_error_event();

comment on function public.notify_critical_error_event() is 'Emite pg_notify("critical_error", payload) al insertar errores críticos.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table if exists public.profiles enable row level security;
alter table if exists public.page_views enable row level security;
alter table if exists public.user_sessions enable row level security;
alter table if exists public.login_activity_logs enable row level security;
alter table if exists public.error_logs enable row level security;
alter table if exists public.email_templates enable row level security;
alter table if exists public.email_logs enable row level security;
alter table if exists public.scheduled_emails enable row level security;
alter table if exists public.admin_settings enable row level security;
alter table if exists public.retroville_waitlist enable row level security;
alter table if exists public.store_creator_leads enable row level security;
alter table if exists public.admin_product_meta enable row level security;
alter table if exists public.admin_order_meta enable row level security;
alter table if exists public.admin_order_status_events enable row level security;
alter table if exists public.admin_message_reviews enable row level security;

-- profiles

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
for select
using (auth.uid() = id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- page views

drop policy if exists page_views_admin_all on public.page_views;
create policy page_views_admin_all on public.page_views
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists page_views_self_read on public.page_views;
create policy page_views_self_read on public.page_views
for select
using (auth.uid() = user_id);

-- sessions

drop policy if exists user_sessions_admin_all on public.user_sessions;
create policy user_sessions_admin_all on public.user_sessions
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists user_sessions_self_read on public.user_sessions;
create policy user_sessions_self_read on public.user_sessions
for select
using (auth.uid() = user_id);

-- login activity

drop policy if exists login_activity_logs_admin_all on public.login_activity_logs;
create policy login_activity_logs_admin_all on public.login_activity_logs
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists login_activity_logs_self_read on public.login_activity_logs;
create policy login_activity_logs_self_read on public.login_activity_logs
for select
using (auth.uid() = user_id);

-- error logs

drop policy if exists error_logs_admin_all on public.error_logs;
create policy error_logs_admin_all on public.error_logs
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists error_logs_self_read on public.error_logs;
create policy error_logs_self_read on public.error_logs
for select
using (auth.uid() = user_id);

-- templates / email logs / scheduled

drop policy if exists email_templates_admin_all on public.email_templates;
create policy email_templates_admin_all on public.email_templates
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists email_logs_admin_all on public.email_logs;
create policy email_logs_admin_all on public.email_logs
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists email_logs_self_read on public.email_logs;
create policy email_logs_self_read on public.email_logs
for select
using (auth.uid() = recipient_user_id);

drop policy if exists scheduled_emails_admin_all on public.scheduled_emails;
create policy scheduled_emails_admin_all on public.scheduled_emails
for all
using (public.is_current_admin())
with check (public.is_current_admin());

-- settings

drop policy if exists admin_settings_admin_all on public.admin_settings;
create policy admin_settings_admin_all on public.admin_settings
for all
using (public.is_current_admin())
with check (public.is_current_admin());

-- lead capture

drop policy if exists retroville_waitlist_admin_all on public.retroville_waitlist;
create policy retroville_waitlist_admin_all on public.retroville_waitlist
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists store_creator_leads_admin_all on public.store_creator_leads;
create policy store_creator_leads_admin_all on public.store_creator_leads
for all
using (public.is_current_admin())
with check (public.is_current_admin());

-- meta tables

drop policy if exists admin_product_meta_admin_all on public.admin_product_meta;
create policy admin_product_meta_admin_all on public.admin_product_meta
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists admin_order_meta_admin_all on public.admin_order_meta;
create policy admin_order_meta_admin_all on public.admin_order_meta
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists admin_order_status_events_admin_all on public.admin_order_status_events;
create policy admin_order_status_events_admin_all on public.admin_order_status_events
for all
using (public.is_current_admin())
with check (public.is_current_admin());

drop policy if exists admin_message_reviews_admin_all on public.admin_message_reviews;
create policy admin_message_reviews_admin_all on public.admin_message_reviews
for all
using (public.is_current_admin())
with check (public.is_current_admin());

notify pgrst, 'reload schema';

-- =============================================================================
-- FIN
-- =============================================================================
