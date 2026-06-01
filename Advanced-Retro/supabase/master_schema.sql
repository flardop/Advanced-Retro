-- =============================================================================
-- ADVANCEDRETRO MASTER SCHEMA v2.0
-- Archivo maestro único para Supabase SQL Editor.
-- Recomendación de ejecución en Supabase Dashboard: usar "Run without RLS"
-- para evitar que el editor inserte ALTER TABLE automáticos dentro de bloques
-- PL/pgSQL. El propio script ya activa RLS y crea sus policies.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_stat_statements;

-- =============================================================================
-- BASE STORE BUNDLE
-- =============================================================================

-- =============================================================================
-- ADVANCED RETRO - SUPABASE FULL BUNDLE (MASTER + EXTRAS)
-- Fecha de generación: 2026-03-04
--
-- RECOMENDACION:
-- - En producción real, mejor ejecutar por bloques (ver docs/SUPABASE_SQL_BLOQUES.md)
-- - Este archivo es idempotente en su mayor parte, pero incluye seeds de contenido.
-- =============================================================================

-- =============================================================================
-- ADVANCED RETRO - MASTER SUPABASE SETUP (IDEMPOTENTE)
-- Fecha: 2026-03-01
--
-- Qué hace:
-- 1) Unifica schema actual + migraciones necesarias para esta app.
-- 2) Corrige incompatibilidades de esquemas legacy (OAuth, social likes, etc.).
-- 3) Aplica RLS base y políticas mínimas seguras para cliente.
-- 4) Añade mejoras futuras (vistas admin, snapshots mercado, auditoría, analytics).
--
-- Cómo usar:
-- - Ejecuta TODO el archivo en Supabase SQL Editor.
-- - Es seguro ejecutarlo varias veces.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONES
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- -----------------------------------------------------------------------------
-- HELPERS
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

-- -----------------------------------------------------------------------------
-- USERS (compat OAuth + perfil)
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  name text,
  password_hash text,
  role text not null default 'user',
  avatar_url text,
  banner_url text,
  bio text,
  tagline text,
  favorite_console text,
  profile_theme text not null default 'neon-grid',
  favorites_visibility text not null default 'public',
  badges text[] not null default '{}',
  shipping_address jsonb,
  is_verified_seller boolean not null default false,
  phone text,
  address text,
  city text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.users add column if not exists email text;
alter table if exists public.users add column if not exists name text;
alter table if exists public.users add column if not exists password_hash text;
alter table if exists public.users add column if not exists role text;
alter table if exists public.users add column if not exists avatar_url text;
alter table if exists public.users add column if not exists banner_url text;
alter table if exists public.users add column if not exists bio text;
alter table if exists public.users add column if not exists tagline text;
alter table if exists public.users add column if not exists favorite_console text;
alter table if exists public.users add column if not exists profile_theme text;
alter table if exists public.users add column if not exists favorites_visibility text default 'public';
alter table if exists public.users add column if not exists badges text[];
alter table if exists public.users add column if not exists shipping_address jsonb;
alter table if exists public.users add column if not exists is_verified_seller boolean;
alter table if exists public.users add column if not exists xp_total integer;
alter table if exists public.users add column if not exists level integer;
alter table if exists public.users add column if not exists xp_updated_at timestamptz;
alter table if exists public.users add column if not exists phone text;
alter table if exists public.users add column if not exists address text;
alter table if exists public.users add column if not exists city text;
alter table if exists public.users add column if not exists country text;
alter table if exists public.users add column if not exists created_at timestamptz;
alter table if exists public.users add column if not exists updated_at timestamptz;

update public.users set role = coalesce(nullif(role, ''), 'user') where true;
update public.users set name = coalesce(nullif(trim(name), ''), split_part(email, '@', 1), 'Coleccionista') where true;
update public.users set profile_theme = coalesce(nullif(profile_theme, ''), 'neon-grid') where true;
update public.users set favorites_visibility = case when lower(coalesce(favorites_visibility, 'public')) in ('public','members','private') then lower(coalesce(favorites_visibility, 'public')) else 'public' end where true;
update public.users set badges = coalesce(badges, '{}') where badges is null;
update public.users set is_verified_seller = coalesce(is_verified_seller, false) where is_verified_seller is null;
update public.users set xp_total = coalesce(xp_total, 0) where true;
update public.users set level = greatest(1, coalesce(level, 1)) where true;
update public.users set xp_updated_at = coalesce(xp_updated_at, now()) where xp_updated_at is null;
update public.users set created_at = coalesce(created_at, now()) where created_at is null;
update public.users set updated_at = coalesce(updated_at, now()) where updated_at is null;

-- Compatibilidad con esquemas antiguos que exigían password_hash/name NOT NULL
-- (rompe login social). Lo dejamos nullable.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'password_hash'
  ) then
    execute 'alter table public.users alter column password_hash drop not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'name'
  ) then
    execute 'alter table public.users alter column name drop not null';
  end if;
end $$;

-- Normaliza check de role
 do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'users'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role%'
  loop
    execute format('alter table public.users drop constraint if exists %I', r.conname);
  end loop;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='users') then
    execute $sql$
      alter table public.users
      add constraint users_role_check
      check (role in ('user','admin')) not valid
    $sql$;
  end if;
end $$;

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_verified_seller on public.users(is_verified_seller);
create index if not exists idx_users_profile_theme on public.users(profile_theme);
create index if not exists idx_users_xp_total on public.users(xp_total desc);
create index if not exists idx_users_level on public.users(level desc);

-- Trigger alta usuario auth -> profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_name text;
begin
  safe_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Coleccionista'
  );

  insert into public.users (
    id, email, role, name, avatar_url, created_at, updated_at
  ) values (
    new.id,
    coalesce(new.email, new.id::text || '@local.invalid'),
    'user',
    safe_name,
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    now(),
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(nullif(excluded.name, ''), public.users.name, 'Coleccionista'),
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill perfiles para usuarios auth existentes
insert into public.users (id, email, role, name, created_at, updated_at)
select
  au.id,
  coalesce(au.email, au.id::text || '@local.invalid') as email,
  'user' as role,
  coalesce(
    nullif(trim(au.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(au.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(au.email, ''), '@', 1),
    'Coleccionista'
  ) as name,
  now(),
  now()
from auth.users au
where not exists (
  select 1 from public.users u where u.id = au.id
)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- CATEGORIES
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- PRODUCTS
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  description text,
  long_description text,
  curiosities text[] not null default '{}',
  tips text[] not null default '{}',
  price integer not null default 0,
  stock integer not null default 0,
  image text,
  images text[] not null default '{}',
  category text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'new',
  component_type text,
  edition text,
  collection_key text,
  platform text,
  trailer_url text,
  is_mystery_box boolean not null default false,
  is_active boolean not null default true,
  ebay_query text,
  ebay_marketplace_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.products add column if not exists slug text;
alter table if exists public.products add column if not exists description text;
alter table if exists public.products add column if not exists long_description text;
alter table if exists public.products add column if not exists curiosities text[];
alter table if exists public.products add column if not exists tips text[];
alter table if exists public.products add column if not exists image text;
alter table if exists public.products add column if not exists images text[];
alter table if exists public.products add column if not exists category text;
alter table if exists public.products add column if not exists category_id uuid;
alter table if exists public.products add column if not exists status text;
alter table if exists public.products add column if not exists component_type text;
alter table if exists public.products add column if not exists edition text;
alter table if exists public.products add column if not exists collection_key text;
alter table if exists public.products add column if not exists platform text;
alter table if exists public.products add column if not exists trailer_url text;
alter table if exists public.products add column if not exists is_mystery_box boolean;
alter table if exists public.products add column if not exists is_active boolean;
alter table if exists public.products add column if not exists ebay_query text;
alter table if exists public.products add column if not exists ebay_marketplace_id text;
alter table if exists public.products add column if not exists created_at timestamptz;
alter table if exists public.products add column if not exists updated_at timestamptz;

update public.products set images = coalesce(images, '{}') where images is null;
update public.products set curiosities = coalesce(curiosities, '{}') where curiosities is null;
update public.products set tips = coalesce(tips, '{}') where tips is null;
update public.products set status = coalesce(nullif(status, ''), 'new') where true;
update public.products set is_active = coalesce(is_active, true) where is_active is null;
update public.products set is_mystery_box = coalesce(is_mystery_box, false) where is_mystery_box is null;
update public.products set component_type = coalesce(component_type, 'full_game') where component_type is null;
update public.products set edition = coalesce(edition, 'sin-especificar') where edition is null;
update public.products set created_at = coalesce(created_at, now()) where created_at is null;
update public.products set updated_at = coalesce(updated_at, now()) where updated_at is null;

-- slug nullable para compatibilidad con inserciones legacy
 do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='products' and column_name='slug'
  ) then
    execute 'alter table public.products alter column slug drop not null';
  end if;
end $$;

-- Normaliza constraints de products
 do $$
declare r record;
begin
  -- elimina checks antiguos de category/component/edition
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'products'
      and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ilike '%category%'
        or pg_get_constraintdef(c.oid) ilike '%component_type%'
        or pg_get_constraintdef(c.oid) ilike '%edition%'
      )
  loop
    execute format('alter table public.products drop constraint if exists %I', r.conname);
  end loop;

  execute $sql$
    alter table public.products
      add constraint products_category_check
      check (
        category is null
        or category in (
          'juegos-gameboy',
          'juegos-gameboy-color',
          'juegos-gameboy-advance',
          'juegos-super-nintendo',
          'juegos-gamecube',
          'cajas-gameboy',
          'cajas-gameboy-color',
          'cajas-gameboy-advance',
          'cajas-super-nintendo',
          'cajas-gamecube',
          'manuales',
          'consolas-retro',
          'cajas-misteriosas',
          'accesorios'
        )
      ) not valid
  $sql$;

  execute $sql$
    alter table public.products
      add constraint products_component_type_check
      check (
        component_type is null
        or component_type in (
          'full_game',
          'cartucho',
          'manual',
          'caja',
          'insert',
          'protector_juego',
          'protector_caja',
          'otro'
        )
      ) not valid
  $sql$;

  execute $sql$
    alter table public.products
      add constraint products_edition_check
      check (
        edition is null
        or edition in ('original', 'repro', 'sin-especificar')
      ) not valid
  $sql$;
end $$;

create index if not exists idx_products_slug
  on public.products(slug);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_component_type on public.products(component_type);
create index if not exists idx_products_collection_key on public.products(collection_key);
create index if not exists idx_products_platform on public.products(platform);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_products_ebay_marketplace_id on public.products(ebay_marketplace_id);

-- -----------------------------------------------------------------------------
-- ORDERS + ORDER_ITEMS
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  total integer not null default 0,
  status text not null default 'pending',
  items jsonb,
  stripe_session_id text,
  mystery_box_prize jsonb,
  shipping_address jsonb,
  shipping_method text,
  shipping_cost integer not null default 0,
  shipping_tracking_code text,
  shipping_label_generated_at timestamptz,
  coupon_id uuid,
  coupon_code text,
  coupon_discount integer not null default 0,
  mystery_box_id uuid,
  mystery_ticket_units integer not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.orders add column if not exists items jsonb;
alter table if exists public.orders add column if not exists stripe_session_id text;
alter table if exists public.orders add column if not exists mystery_box_prize jsonb;
alter table if exists public.orders add column if not exists shipping_address jsonb;
alter table if exists public.orders add column if not exists shipping_method text;
alter table if exists public.orders add column if not exists shipping_cost integer;
alter table if exists public.orders add column if not exists shipping_tracking_code text;
alter table if exists public.orders add column if not exists shipping_label_generated_at timestamptz;
alter table if exists public.orders add column if not exists coupon_id uuid;
alter table if exists public.orders add column if not exists coupon_code text;
alter table if exists public.orders add column if not exists coupon_discount integer;
alter table if exists public.orders add column if not exists mystery_box_id uuid;
alter table if exists public.orders add column if not exists mystery_ticket_units integer;
alter table if exists public.orders add column if not exists paid_at timestamptz;
alter table if exists public.orders add column if not exists updated_at timestamptz;

update public.orders set shipping_cost = coalesce(shipping_cost, 0) where shipping_cost is null;
update public.orders set coupon_discount = coalesce(coupon_discount, 0) where coupon_discount is null;
update public.orders set mystery_ticket_units = coalesce(mystery_ticket_units, 0) where mystery_ticket_units is null;
update public.orders set updated_at = coalesce(updated_at, now()) where updated_at is null;

-- Normaliza check de status orders (incluye processing)
do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'orders'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.orders drop constraint if exists %I', r.conname);
  end loop;

  execute $sql$
    alter table public.orders
      add constraint orders_status_check
      check (status in ('pending','processing','paid','shipped','delivered','cancelled')) not valid
  $sql$;
end $$;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- -----------------------------------------------------------------------------
-- LEGACY ROULETTE CONFIG (compat)
-- -----------------------------------------------------------------------------
create table if not exists public.roulette_config (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  type text not null check (type in ('discount', 'product', 'cashback')),
  value numeric not null,
  probability numeric not null check (probability >= 0 and probability <= 100),
  is_rare boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- COUPONS
-- -----------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent','fixed','free_order')),
  value integer not null default 0,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  active boolean not null default true,
  user_id uuid references public.users(id) on delete set null,
  created_by_user_id uuid references public.users(id) on delete set null,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  order_id uuid not null references public.orders(id) on delete cascade,
  amount_discount integer not null default 0,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

create index if not exists idx_coupons_code on public.coupons(code);
create index if not exists idx_coupons_user_id on public.coupons(user_id);
create index if not exists idx_coupons_active on public.coupons(active);
create index if not exists idx_coupon_redemptions_coupon on public.coupon_redemptions(coupon_id);
create index if not exists idx_coupon_redemptions_order on public.coupon_redemptions(order_id);

-- FK tardías en orders
 do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_coupon_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_coupon_id_fkey
      foreign key (coupon_id) references public.coupons(id) on delete set null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- MYSTERY BOXES + PRIZES + TICKETS + SPINS
-- -----------------------------------------------------------------------------
create table if not exists public.mystery_boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  ticket_price integer not null check (ticket_price > 0),
  image text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mystery_box_prizes (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.mystery_boxes(id) on delete cascade,
  label text not null,
  prize_type text not null check (prize_type in ('physical_product','discount_coupon','other')),
  probability numeric not null check (probability >= 0),
  stock integer,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mystery_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  box_id uuid not null references public.mystery_boxes(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  quantity_total integer not null check (quantity_total > 0),
  quantity_used integer not null default 0 check (quantity_used >= 0),
  status text not null default 'active' check (status in ('active','used','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mystery_spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  box_id uuid not null references public.mystery_boxes(id) on delete cascade,
  ticket_id uuid references public.mystery_tickets(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  prize_id uuid references public.mystery_box_prizes(id) on delete set null,
  prize_label text not null,
  coupon_id uuid references public.coupons(id) on delete set null,
  status text not null default 'won' check (status in ('won','redeemed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create index if not exists idx_mystery_prizes_box on public.mystery_box_prizes(box_id);
create index if not exists idx_mystery_prizes_active on public.mystery_box_prizes(is_active);
create index if not exists idx_mystery_tickets_user_box on public.mystery_tickets(user_id, box_id);
create index if not exists idx_mystery_tickets_status on public.mystery_tickets(status);
create index if not exists idx_mystery_spins_user on public.mystery_spins(user_id, created_at desc);
create index if not exists idx_mystery_spins_box on public.mystery_spins(box_id, created_at desc);

 do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_mystery_box_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_mystery_box_id_fkey
      foreign key (mystery_box_id) references public.mystery_boxes(id) on delete set null;
  end if;
end $$;

-- Seed base ruleta 5€
insert into public.mystery_boxes (name, slug, description, ticket_price, image, is_active)
values (
  'Mystery Box 5€',
  'mystery-box-5',
  'Tirada de 5€ con premios sorpresa, incluyendo cupones y premios ultra raros.',
  500,
  '/images/mystery-box-5.png',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  ticket_price = excluded.ticket_price,
  is_active = excluded.is_active,
  updated_at = now();

with box as (
  select id from public.mystery_boxes where slug = 'mystery-box-5' limit 1
)
insert into public.mystery_box_prizes (box_id, label, prize_type, probability, stock, metadata, is_active)
select
  box.id,
  payload.label,
  payload.prize_type,
  payload.probability,
  payload.stock,
  payload.metadata::jsonb,
  true
from box
join (
  values
    ('MacBook Pro 16"', 'physical_product', 0.0001::numeric, 1, '{"rarity":"ultra-rare","shipping_required":true}'),
    ('Meta Quest 3', 'physical_product', 0.0001::numeric, 2, '{"rarity":"ultra-rare","shipping_required":true}'),
    ('Auriculares gaming', 'physical_product', 18::numeric, 300, '{"source":"aliexpress"}'),
    ('Ratón gaming', 'physical_product', 22::numeric, 350, '{"source":"aliexpress"}'),
    ('Cupón 50% descuento', 'discount_coupon', 12::numeric, null, '{"coupon_type":"percent","coupon_value":50}'),
    ('Cupón 100% descuento', 'discount_coupon', 0.2::numeric, null, '{"coupon_type":"percent","coupon_value":100}'),
    ('Premio sorpresa básico', 'other', 47.7998::numeric, null, '{"note":"premio base"}')
) as payload(label, prize_type, probability, stock, metadata)
on true
where not exists (
  select 1
  from public.mystery_box_prizes p
  where p.box_id = box.id and p.label = payload.label
);

-- -----------------------------------------------------------------------------
-- PRODUCT LIKES (auth)
-- -----------------------------------------------------------------------------
create table if not exists public.product_likes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists idx_product_likes_product_id on public.product_likes(product_id);
create index if not exists idx_product_likes_user_id on public.product_likes(user_id);

-- -----------------------------------------------------------------------------
-- SOPORTE (tickets + mensajes)
-- -----------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  is_admin boolean not null default false,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user on public.support_tickets(user_id);
create index if not exists idx_support_tickets_order on public.support_tickets(order_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_messages_ticket on public.support_messages(ticket_id, created_at desc);

-- -----------------------------------------------------------------------------
-- COMUNIDAD MARKETPLACE (anuncios)
-- -----------------------------------------------------------------------------
create table if not exists public.user_product_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  price integer not null check (price > 0),
  category text not null default 'juegos-gameboy',
  condition text not null default 'used',
  originality_status text not null check (originality_status in ('original_verificado','original_sin_verificar','repro_1_1','mixto')),
  originality_notes text,
  images text[] not null default '{}',
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
  admin_notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  listing_fee_cents integer not null default 0,
  commission_rate numeric(5,2) not null default 10.00,
  commission_cents integer not null default 0,
  approved_at timestamptz,
  buyer_email text,
  delivery_status text not null default 'pending' check (delivery_status in ('pending','processing','shipped','delivered','cancelled')),
  shipping_carrier text,
  shipping_tracking_code text,
  shipping_notes text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_product_listings_user on public.user_product_listings(user_id);
create index if not exists idx_user_product_listings_status on public.user_product_listings(status);
create index if not exists idx_user_product_listings_delivery_status on public.user_product_listings(delivery_status);
create index if not exists idx_user_product_listings_buyer_email on public.user_product_listings(buyer_email);
create index if not exists idx_user_product_listings_created_at on public.user_product_listings(created_at desc);

update public.user_product_listings
set
  listing_fee_cents = coalesce(listing_fee_cents, 0),
  commission_rate = coalesce(commission_rate, 10.00),
  commission_cents = coalesce(commission_cents, round(price * (coalesce(commission_rate, 10.00) / 100.0))::integer),
  delivery_status = coalesce(nullif(delivery_status, ''), 'pending'),
  updated_at = coalesce(updated_at, now())
where true;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  images text[] not null default '{}',
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_community_posts_created on public.community_posts(created_at desc);
create index if not exists idx_community_posts_user on public.community_posts(user_id);

-- -----------------------------------------------------------------------------
-- WALLET INTERNO + RETIRADAS
-- -----------------------------------------------------------------------------
create table if not exists public.user_wallet_accounts (
  user_id uuid primary key references public.users(id) on delete cascade,
  balance_cents integer not null default 0 check (balance_cents >= 0),
  pending_cents integer not null default 0 check (pending_cents >= 0),
  total_earned_cents integer not null default 0 check (total_earned_cents >= 0),
  total_withdrawn_cents integer not null default 0 check (total_withdrawn_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  direction text not null check (direction in ('credit','debit')),
  status text not null check (status in ('pending','available','spent','cancelled')),
  kind text not null check (
    kind in (
      'manual_adjustment',
      'community_sale_credit',
      'commission_reward',
      'withdrawal_request',
      'wallet_spend',
      'reversal'
    )
  ),
  description text,
  reference_type text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_wallet_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','paid','cancelled')),
  payout_method text not null default 'manual_transfer',
  payout_details jsonb not null default '{}'::jsonb,
  note text,
  admin_note text,
  wallet_transaction_id uuid references public.user_wallet_transactions(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_user_created
  on public.user_wallet_transactions(user_id, created_at desc);
create index if not exists idx_wallet_transactions_kind
  on public.user_wallet_transactions(kind);
create unique index if not exists idx_wallet_tx_reference_unique
  on public.user_wallet_transactions(user_id, kind, reference_type, reference_id)
  where reference_type is not null and reference_id is not null;

create index if not exists idx_wallet_withdrawals_user_created
  on public.user_wallet_withdrawal_requests(user_id, created_at desc);
create index if not exists idx_wallet_withdrawals_status
  on public.user_wallet_withdrawal_requests(status, created_at desc);
create index if not exists idx_wallet_withdrawals_tx
  on public.user_wallet_withdrawal_requests(wallet_transaction_id);

-- inicializa cartera para usuarios existentes
insert into public.user_wallet_accounts (user_id)
select u.id
from public.users u
where not exists (
  select 1 from public.user_wallet_accounts w where w.user_id = u.id
);

-- -----------------------------------------------------------------------------
-- MEJORAS FUTURAS (NO ROMPEN NADA)
-- -----------------------------------------------------------------------------
-- 1) Resumen social por producto (evita lecturas masivas de storage por request)
create table if not exists public.product_social_summary (
  product_id uuid primary key references public.products(id) on delete cascade,
  visits integer not null default 0,
  likes_count integer not null default 0,
  reviews_count integer not null default 0,
  rating_average numeric(4,2) not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_social_summary_visits
  on public.product_social_summary(visits desc);
create index if not exists idx_product_social_summary_likes
  on public.product_social_summary(likes_count desc);
create index if not exists idx_product_social_summary_updated
  on public.product_social_summary(updated_at desc);

create table if not exists public.product_social_visits (
  product_id uuid not null references public.products(id) on delete cascade,
  visitor_key text not null,
  visits_count integer not null default 0,
  last_visit_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, visitor_key)
);

create index if not exists idx_product_social_visits_product
  on public.product_social_visits(product_id);
create index if not exists idx_product_social_visits_last
  on public.product_social_visits(last_visit_at desc);

create table if not exists public.product_social_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  visitor_key text not null,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, visitor_key, rating, comment)
);

create index if not exists idx_product_social_reviews_product_time
  on public.product_social_reviews(product_id, created_at desc);
create index if not exists idx_product_social_reviews_user
  on public.product_social_reviews(user_id, created_at desc);

-- 2) Snapshots de mercado (eBay/otros) para histórico real de línea
create table if not exists public.product_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  provider text not null check (provider in ('ebay','pricecharting','manual')),
  marketplace_id text,
  query text,
  currency text,
  sample_size integer not null default 0,
  total_results integer not null default 0,
  min_price_cents integer,
  median_price_cents integer,
  average_price_cents integer,
  max_price_cents integer,
  payload jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now()
);

create index if not exists idx_market_snapshots_product_time
  on public.product_market_snapshots(product_id, collected_at desc);
create index if not exists idx_market_snapshots_provider
  on public.product_market_snapshots(provider, collected_at desc);

-- 2b) Eventos de rendimiento API para dashboard admin (latencias/cache-hit)
create table if not exists public.api_performance_events (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  method text not null,
  status_code integer not null check (status_code between 100 and 599),
  duration_ms integer not null check (duration_ms >= 0),
  cache_hit boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_perf_created
  on public.api_performance_events(created_at desc);
create index if not exists idx_api_perf_endpoint_method
  on public.api_performance_events(endpoint, method, created_at desc);
create index if not exists idx_api_perf_status
  on public.api_performance_events(status_code, created_at desc);
create index if not exists idx_api_perf_cache
  on public.api_performance_events(cache_hit, created_at desc);

-- 3) Filtros guardados admin
create table if not exists public.admin_saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  area text not null,
  name text not null,
  filter jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, area, name)
);

create index if not exists idx_admin_saved_filters_user_area
  on public.admin_saved_filters(user_id, area);

-- 4) Auditoría admin
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created
  on public.admin_audit_logs(created_at desc);

-- 5) Analytics propios (complemento GA)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  user_id uuid references public.users(id) on delete set null,
  session_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_name_time
  on public.analytics_events(event_name, created_at desc);
create index if not exists idx_analytics_events_path_time
  on public.analytics_events(path, created_at desc);

-- 6) Cola simple de notificaciones
create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  channel text not null check (channel in ('email','in_app','webhook')),
  status text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  subject text,
  body text,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_queue_status_time
  on public.notification_queue(status, created_at desc);

-- 7) Gamificación XP / niveles
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

create table if not exists public.user_login_streaks (
  user_id uuid primary key references public.users(id) on delete cascade,
  streak_count integer not null default 0,
  longest_streak integer not null default 0,
  last_login_on date,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_login_streaks_last_login
  on public.user_login_streaks(last_login_on desc nulls last);

create table if not exists public.user_level_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reward_key text not null,
  reward_label text not null,
  reward_type text not null,
  level_required integer not null,
  metadata jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default now(),
  unique(user_id, reward_key)
);

create index if not exists idx_user_level_rewards_user_unlocked
  on public.user_level_rewards(user_id, unlocked_at desc);
create index if not exists idx_user_level_rewards_level
  on public.user_level_rewards(level_required desc);

-- -----------------------------------------------------------------------------
-- RLS + POLÍTICAS
-- -----------------------------------------------------------------------------
alter table if exists public.users enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.roulette_config enable row level security;

alter table if exists public.coupons enable row level security;
alter table if exists public.coupon_redemptions enable row level security;

alter table if exists public.mystery_boxes enable row level security;
alter table if exists public.mystery_box_prizes enable row level security;
alter table if exists public.mystery_tickets enable row level security;
alter table if exists public.mystery_spins enable row level security;

alter table if exists public.support_tickets enable row level security;
alter table if exists public.support_messages enable row level security;
alter table if exists public.user_product_listings enable row level security;
alter table if exists public.community_posts enable row level security;
alter table if exists public.product_likes enable row level security;

alter table if exists public.user_wallet_accounts enable row level security;
alter table if exists public.user_wallet_transactions enable row level security;
alter table if exists public.user_wallet_withdrawal_requests enable row level security;

alter table if exists public.product_social_summary enable row level security;
alter table if exists public.product_social_visits enable row level security;
alter table if exists public.product_social_reviews enable row level security;
alter table if exists public.product_market_snapshots enable row level security;
alter table if exists public.api_performance_events enable row level security;
alter table if exists public.admin_saved_filters enable row level security;
alter table if exists public.admin_audit_logs enable row level security;
alter table if exists public.analytics_events enable row level security;
alter table if exists public.notification_queue enable row level security;
alter table if exists public.user_xp_events enable row level security;
alter table if exists public.user_login_streaks enable row level security;
alter table if exists public.user_level_rewards enable row level security;

-- USERS
 drop policy if exists "users own read" on public.users;
create policy "users own read"
on public.users for select
using (auth.uid() = id);

 drop policy if exists "users own insert" on public.users;
create policy "users own insert"
on public.users for insert
with check (auth.uid() = id);

-- GAMIFICATION
drop policy if exists "user_xp_events own read" on public.user_xp_events;
create policy "user_xp_events own read"
on public.user_xp_events for select
using (auth.uid() = user_id);

drop policy if exists "user_login_streaks own read" on public.user_login_streaks;
create policy "user_login_streaks own read"
on public.user_login_streaks for select
using (auth.uid() = user_id);

drop policy if exists "user_level_rewards own read" on public.user_level_rewards;
create policy "user_level_rewards own read"
on public.user_level_rewards for select
using (auth.uid() = user_id);

 drop policy if exists "users own update" on public.users;
create policy "users own update"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- CATEGORIES / PRODUCTS
 drop policy if exists "categories public read" on public.categories;
create policy "categories public read"
on public.categories for select
using (true);

 drop policy if exists "products public read" on public.products;
create policy "products public read"
on public.products for select
using (coalesce(is_active, true) = true);

-- ORDERS + ORDER ITEMS
 drop policy if exists "orders own read" on public.orders;
create policy "orders own read"
on public.orders for select
using (auth.uid() = user_id);

 drop policy if exists "orders own insert" on public.orders;
create policy "orders own insert"
on public.orders for insert
with check (auth.uid() = user_id);

 drop policy if exists "orders own update" on public.orders;
create policy "orders own update"
on public.orders for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

 drop policy if exists "order_items own read" on public.order_items;
create policy "order_items own read"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

-- legacy roulette config
 drop policy if exists "roulette config public read" on public.roulette_config;
create policy "roulette config public read"
on public.roulette_config for select
using (true);

-- COUPONS
 drop policy if exists "coupons own read" on public.coupons;
create policy "coupons own read"
on public.coupons for select
using (user_id is null or auth.uid() = user_id);

 drop policy if exists "coupon redemptions own read" on public.coupon_redemptions;
create policy "coupon redemptions own read"
on public.coupon_redemptions for select
using (auth.uid() = user_id);

-- MYSTERY
 drop policy if exists "mystery boxes public read" on public.mystery_boxes;
create policy "mystery boxes public read"
on public.mystery_boxes for select
using (coalesce(is_active, true) = true);

 drop policy if exists "mystery prizes public read" on public.mystery_box_prizes;
create policy "mystery prizes public read"
on public.mystery_box_prizes for select
using (coalesce(is_active, true) = true);

 drop policy if exists "mystery tickets own read" on public.mystery_tickets;
create policy "mystery tickets own read"
on public.mystery_tickets for select
using (auth.uid() = user_id);

 drop policy if exists "mystery spins own read" on public.mystery_spins;
create policy "mystery spins own read"
on public.mystery_spins for select
using (auth.uid() = user_id);

-- SUPPORT
 drop policy if exists "tickets own read" on public.support_tickets;
create policy "tickets own read"
on public.support_tickets for select
using (auth.uid() = user_id);

 drop policy if exists "tickets own insert" on public.support_tickets;
create policy "tickets own insert"
on public.support_tickets for insert
with check (auth.uid() = user_id);

 drop policy if exists "tickets own update" on public.support_tickets;
create policy "tickets own update"
on public.support_tickets for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

 drop policy if exists "messages own read" on public.support_messages;
create policy "messages own read"
on public.support_messages for select
using (
  exists (
    select 1
    from public.support_tickets t
    where t.id = support_messages.ticket_id
      and t.user_id = auth.uid()
  )
);

 drop policy if exists "messages own insert" on public.support_messages;
create policy "messages own insert"
on public.support_messages for insert
with check (
  exists (
    select 1
    from public.support_tickets t
    where t.id = support_messages.ticket_id
      and t.user_id = auth.uid()
  )
);

-- COMUNIDAD ANUNCIOS
 drop policy if exists "listings own read" on public.user_product_listings;
create policy "listings own read"
on public.user_product_listings for select
using (auth.uid() = user_id);

 drop policy if exists "listings public approved read" on public.user_product_listings;
create policy "listings public approved read"
on public.user_product_listings for select
using (status = 'approved');

 drop policy if exists "listings own insert" on public.user_product_listings;
create policy "listings own insert"
on public.user_product_listings for insert
with check (auth.uid() = user_id);

 drop policy if exists "listings own update" on public.user_product_listings;
create policy "listings own update"
on public.user_product_listings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- COMMUNITY POSTS
 drop policy if exists "community posts public read" on public.community_posts;
create policy "community posts public read"
on public.community_posts for select
using (true);

 drop policy if exists "community posts own insert" on public.community_posts;
create policy "community posts own insert"
on public.community_posts for insert
with check (auth.uid() = user_id);

 drop policy if exists "community posts own update" on public.community_posts;
create policy "community posts own update"
on public.community_posts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

 drop policy if exists "community posts own delete" on public.community_posts;
create policy "community posts own delete"
on public.community_posts for delete
using (auth.uid() = user_id);

-- PRODUCT LIKES
 drop policy if exists "product_likes_select_all" on public.product_likes;
create policy "product_likes_select_all"
on public.product_likes for select
using (true);

 drop policy if exists "product_likes_insert_own" on public.product_likes;
create policy "product_likes_insert_own"
on public.product_likes for insert
with check (auth.uid() = user_id);

 drop policy if exists "product_likes_delete_own" on public.product_likes;
create policy "product_likes_delete_own"
on public.product_likes for delete
using (auth.uid() = user_id);

drop policy if exists "product_social_summary_public_read" on public.product_social_summary;
create policy "product_social_summary_public_read"
on public.product_social_summary for select
using (true);

drop policy if exists "product_social_reviews_public_read" on public.product_social_reviews;
create policy "product_social_reviews_public_read"
on public.product_social_reviews for select
using (true);

-- WALLET
 drop policy if exists "wallet account own read" on public.user_wallet_accounts;
create policy "wallet account own read"
on public.user_wallet_accounts for select
using (auth.uid() = user_id);

 drop policy if exists "wallet tx own read" on public.user_wallet_transactions;
create policy "wallet tx own read"
on public.user_wallet_transactions for select
using (auth.uid() = user_id);

 drop policy if exists "wallet withdrawals own read" on public.user_wallet_withdrawal_requests;
create policy "wallet withdrawals own read"
on public.user_wallet_withdrawal_requests for select
using (auth.uid() = user_id);

 drop policy if exists "wallet withdrawals own insert" on public.user_wallet_withdrawal_requests;
create policy "wallet withdrawals own insert"
on public.user_wallet_withdrawal_requests for insert
with check (auth.uid() = user_id);

 drop policy if exists "wallet withdrawals own update" on public.user_wallet_withdrawal_requests;
create policy "wallet withdrawals own update"
on public.user_wallet_withdrawal_requests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- FUTURE TABLES (read own/admin service role via backend)
 drop policy if exists "market snapshots public read" on public.product_market_snapshots;
create policy "market snapshots public read"
on public.product_market_snapshots for select
using (true);

 drop policy if exists "admin saved filters own all" on public.admin_saved_filters;
create policy "admin saved filters own all"
on public.admin_saved_filters for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

 drop policy if exists "analytics events own read" on public.analytics_events;
create policy "analytics events own read"
on public.analytics_events for select
using (auth.uid() = user_id);

 drop policy if exists "notification queue own read" on public.notification_queue;
create policy "notification queue own read"
on public.notification_queue for select
using (auth.uid() = user_id);

-- admin_audit_logs solo service role (sin policy para cliente anon/auth)

-- -----------------------------------------------------------------------------
-- TRIGGERS updated_at
-- -----------------------------------------------------------------------------
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'users',
    'categories',
    'products',
    'orders',
    'coupons',
    'mystery_boxes',
    'mystery_box_prizes',
    'mystery_tickets',
    'support_tickets',
    'user_product_listings',
    'community_posts',
    'user_wallet_accounts',
    'user_wallet_withdrawal_requests',
    'admin_saved_filters',
    'notification_queue'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = tbl
        and column_name = 'updated_at'
    ) then
      if not exists (
        select 1
        from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = tbl
          and t.tgname = ('trg_set_updated_at_' || tbl)
      ) then
        execute format(
          'create trigger %I before update on public.%I for each row execute procedure public.set_updated_at()',
          'trg_set_updated_at_' || tbl,
          tbl
        );
      end if;
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- VISTAS ADMIN (futuro / productividad)
-- -----------------------------------------------------------------------------
create or replace view public.v_admin_pending_orders as
select
  o.id,
  o.user_id,
  o.status,
  o.total,
  o.created_at,
  o.updated_at,
  o.shipping_tracking_code,
  case
    when o.status in ('paid', 'processing') and coalesce(nullif(trim(o.shipping_tracking_code), ''), '') = '' then true
    else false
  end as needs_shipping
from public.orders o
where o.status in ('paid', 'processing', 'shipped');

create or replace view public.v_admin_pending_tickets as
select
  t.id,
  t.user_id,
  t.order_id,
  t.subject,
  t.status,
  t.created_at,
  t.updated_at
from public.support_tickets t
where t.status in ('open', 'in_progress');

create or replace view public.v_admin_pending_withdrawals as
select
  w.id,
  w.user_id,
  w.amount_cents,
  w.status,
  w.created_at,
  w.updated_at
from public.user_wallet_withdrawal_requests w
where w.status in ('pending', 'approved');

create or replace view public.v_admin_pending_listings as
select
  l.id,
  l.user_id,
  l.title,
  l.price,
  l.status,
  l.created_at,
  l.updated_at
from public.user_product_listings l
where l.status = 'pending_review';

create or replace view public.v_admin_work_queue as
select 'order_shipping'::text as item_type, id::text as item_id, user_id, created_at, updated_at, status, total::bigint as amount_cents, null::text as title
from public.v_admin_pending_orders
where needs_shipping = true
union all
select 'ticket'::text as item_type, id::text as item_id, user_id, created_at, updated_at, status, null::bigint as amount_cents, subject as title
from public.v_admin_pending_tickets
union all
select 'withdrawal'::text as item_type, id::text as item_id, user_id, created_at, updated_at, status, amount_cents::bigint as amount_cents, null::text as title
from public.v_admin_pending_withdrawals
union all
select 'listing_review'::text as item_type, id::text as item_id, user_id, created_at, updated_at, status, price::bigint as amount_cents, title
from public.v_admin_pending_listings;

-- Vista rápida de salud de setup
create or replace view public.v_setup_health as
select
  t.table_name,
  (to_regclass('public.' || t.table_name) is not null) as exists,
  t.description
from (
  values
    ('users', 'Perfiles de usuario'),
    ('products', 'Catálogo productos'),
    ('orders', 'Pedidos'),
    ('order_items', 'Líneas de pedido'),
    ('product_likes', 'Likes por usuario'),
    ('support_tickets', 'Tickets soporte'),
    ('support_messages', 'Mensajes tickets'),
    ('user_product_listings', 'Marketplace comunidad'),
    ('community_posts', 'Blog/comunidad'),
    ('mystery_boxes', 'Cajas mystery'),
    ('mystery_box_prizes', 'Premios mystery'),
    ('mystery_tickets', 'Tickets mystery'),
    ('mystery_spins', 'Tiradas mystery'),
    ('coupons', 'Cupones'),
    ('coupon_redemptions', 'Canjes cupón'),
    ('user_wallet_accounts', 'Cartera interna'),
    ('user_wallet_transactions', 'Movimientos cartera'),
    ('user_wallet_withdrawal_requests', 'Retiradas cartera'),
    ('product_social_summary', 'Resumen social por producto'),
    ('product_social_visits', 'Visitas social por producto'),
    ('product_social_reviews', 'Reseñas social por producto'),
    ('product_market_snapshots', 'Histórico mercado'),
    ('api_performance_events', 'Eventos rendimiento API')
) as t(table_name, description)
order by t.table_name;

-- -----------------------------------------------------------------------------
-- FIN
-- -----------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- =============================================================================
-- QUICK CHECKS (ejecuta manualmente si quieres validar)
--
-- select * from public.v_setup_health;
-- select * from public.v_admin_work_queue order by updated_at desc limit 50;
-- select count(*) from public.product_likes;
-- =============================================================================


-- =============================================================================
-- EXTRA MODULE: stripe_commissions_upgrade.sql
-- =============================================================================

-- =============================================================================
-- STRIPE COMMISSIONS UPGRADE
-- Aplica trazabilidad de comisiones por pedido pagado en Stripe.
-- Idempotente: seguro ejecutar múltiples veces.
-- =============================================================================

alter table if exists public.orders
  add column if not exists commission_source text,
  add column if not exists commission_rate numeric default 0,
  add column if not exists commission_base_cents integer default 0,
  add column if not exists commission_amount_cents integer default 0,
  add column if not exists gross_amount_cents integer default 0,
  add column if not exists net_amount_cents integer default 0,
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists stripe_currency text;

update public.orders
set
  commission_source = coalesce(nullif(trim(commission_source), ''), 'catalog'),
  commission_rate = coalesce(commission_rate, 0),
  commission_base_cents = coalesce(commission_base_cents, greatest(0, total)),
  commission_amount_cents = coalesce(commission_amount_cents, 0),
  gross_amount_cents = coalesce(gross_amount_cents, greatest(0, total)),
  net_amount_cents = coalesce(net_amount_cents, greatest(0, total))
where true;

alter table if exists public.orders
  alter column commission_source set default 'catalog',
  alter column commission_rate set default 0,
  alter column commission_base_cents set default 0,
  alter column commission_amount_cents set default 0,
  alter column gross_amount_cents set default 0,
  alter column net_amount_cents set default 0,
  alter column stripe_currency set default 'eur';

create index if not exists idx_orders_commission_source on public.orders(commission_source);
create index if not exists idx_orders_commission_amount on public.orders(commission_amount_cents desc);
create index if not exists idx_orders_stripe_session on public.orders(stripe_session_id);
create index if not exists idx_orders_stripe_intent on public.orders(stripe_payment_intent_id);
create index if not exists idx_orders_stripe_charge on public.orders(stripe_charge_id);

-- Validaciones suaves (NOT VALID para no romper datos legacy).
do $$
begin
  if exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='orders'
  ) then
    begin
      alter table public.orders
        add constraint orders_commission_source_check
        check (commission_source in ('catalog', 'mystery', 'community')) not valid;
    exception
      when duplicate_object then null;
    end;

    begin
      alter table public.orders
        add constraint orders_commission_non_negative_check
        check (
          commission_rate >= 0
          and commission_base_cents >= 0
          and commission_amount_cents >= 0
          and gross_amount_cents >= 0
          and net_amount_cents >= 0
        ) not valid;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Extra profile preferences for redesigned /perfil
-- -----------------------------------------------------------------------------
alter table if exists public.users
  add column if not exists username text,
  add column if not exists birthdate date,
  add column if not exists notification_preferences jsonb not null default '{"orders":true,"shipping":true,"offers":false,"newsletter":false,"messages":true}'::jsonb,
  add column if not exists preferred_currency text not null default 'EUR',
  add column if not exists theme_preference text not null default 'system';

update public.users
set
  notification_preferences = coalesce(notification_preferences, '{"orders":true,"shipping":true,"offers":false,"newsletter":false,"messages":true}'::jsonb),
  preferred_currency = case
    when upper(coalesce(preferred_currency, 'EUR')) in ('EUR','USD','GBP') then upper(coalesce(preferred_currency, 'EUR'))
    else 'EUR'
  end,
  theme_preference = case
    when lower(coalesce(theme_preference, 'system')) in ('light','dark','system') then lower(coalesce(theme_preference, 'system'))
    else 'system'
  end
where true;

alter table if exists public.users drop constraint if exists users_preferred_currency_check;
alter table if exists public.users add constraint users_preferred_currency_check
  check (preferred_currency in ('EUR','USD','GBP'));

alter table if exists public.users drop constraint if exists users_theme_preference_check;
alter table if exists public.users add constraint users_theme_preference_check
  check (theme_preference in ('light','dark','system'));

create index if not exists idx_users_username on public.users(username);
create index if not exists idx_users_preferred_currency on public.users(preferred_currency);
create index if not exists idx_users_theme_preference on public.users(theme_preference);

alter table if exists public.profiles
  add column if not exists username text,
  add column if not exists birthdate date,
  add column if not exists notification_preferences jsonb not null default '{"orders":true,"shipping":true,"offers":false,"newsletter":false,"messages":true}'::jsonb,
  add column if not exists preferred_currency text not null default 'EUR',
  add column if not exists theme_preference text not null default 'system';

update public.profiles
set
  notification_preferences = coalesce(notification_preferences, '{"orders":true,"shipping":true,"offers":false,"newsletter":false,"messages":true}'::jsonb),
  preferred_currency = case
    when upper(coalesce(preferred_currency, 'EUR')) in ('EUR','USD','GBP') then upper(coalesce(preferred_currency, 'EUR'))
    else 'EUR'
  end,
  theme_preference = case
    when lower(coalesce(theme_preference, 'system')) in ('light','dark','system') then lower(coalesce(theme_preference, 'system'))
    else 'system'
  end
where true;

alter table if exists public.profiles drop constraint if exists profiles_preferred_currency_check;
alter table if exists public.profiles add constraint profiles_preferred_currency_check
  check (preferred_currency in ('EUR','USD','GBP'));

alter table if exists public.profiles drop constraint if exists profiles_theme_preference_check;
alter table if exists public.profiles add constraint profiles_theme_preference_check
  check (theme_preference in ('light','dark','system'));

notify pgrst, 'reload schema';



-- =============================================================================
-- EXTRA MODULE: community_publish_listing_extras.sql
-- =============================================================================

-- =============================================================================
-- COMMUNITY PUBLISH UPGRADE
-- Añade campos de publicación estilo marketplace (destacado / vitrina / ficha)
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================

alter table if exists public.user_product_listings
  add column if not exists pegi_rating text not null default 'none',
  add column if not exists genre text,
  add column if not exists package_size text not null default 'medium',
  add column if not exists item_color text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_days integer not null default 0,
  add column if not exists featured_fee_cents integer not null default 0,
  add column if not exists featured_until timestamptz,
  add column if not exists is_showcase boolean not null default false,
  add column if not exists showcase_days integer not null default 0,
  add column if not exists showcase_fee_cents integer not null default 0,
  add column if not exists showcase_until timestamptz;

-- Ajuste de comisión al 5%
alter table if exists public.user_product_listings
  alter column commission_rate set default 5.00;

-- Validaciones suaves (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'upl_pegi_rating_check'
  ) then
    alter table public.user_product_listings
      add constraint upl_pegi_rating_check
      check (pegi_rating in ('none','3','7','12','16','18'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'upl_package_size_check'
  ) then
    alter table public.user_product_listings
      add constraint upl_package_size_check
      check (package_size in ('small','medium','large','oversize'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'upl_featured_days_check'
  ) then
    alter table public.user_product_listings
      add constraint upl_featured_days_check
      check (featured_days >= 0 and featured_days <= 365);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'upl_showcase_days_check'
  ) then
    alter table public.user_product_listings
      add constraint upl_showcase_days_check
      check (showcase_days >= 0 and showcase_days <= 365);
  end if;
end $$;

update public.user_product_listings
set
  pegi_rating = case when pegi_rating in ('none','3','7','12','16','18') then pegi_rating else 'none' end,
  package_size = case when package_size in ('small','medium','large','oversize') then package_size else 'medium' end,
  featured_days = greatest(0, coalesce(featured_days, 0)),
  showcase_days = greatest(0, coalesce(showcase_days, 0)),
  featured_fee_cents = greatest(0, coalesce(featured_fee_cents, 0)),
  showcase_fee_cents = greatest(0, coalesce(showcase_fee_cents, 0)),
  is_featured = coalesce(is_featured, false),
  is_showcase = coalesce(is_showcase, false),
  commission_rate = coalesce(nullif(commission_rate, 0), 5.00),
  commission_cents = round(price * (coalesce(nullif(commission_rate, 0), 5.00) / 100.0))::integer,
  listing_fee_cents = greatest(
    coalesce(listing_fee_cents, 0),
    coalesce(featured_fee_cents, 0) + coalesce(showcase_fee_cents, 0)
  ),
  updated_at = now();

create index if not exists idx_upl_featured on public.user_product_listings(is_featured, featured_until);
create index if not exists idx_upl_showcase on public.user_product_listings(is_showcase, showcase_until);
create index if not exists idx_upl_pegi on public.user_product_listings(pegi_rating);
create index if not exists idx_upl_package_size on public.user_product_listings(package_size);

notify pgrst, 'reload schema';


-- =============================================================================
-- EXTRA MODULE: hype_future_launches.sql
-- =============================================================================

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



-- =============================================================================
-- EXTRA MODULE: snake_404_leaderboard.sql
-- =============================================================================

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



-- =============================================================================
-- EXTRA MODULE: ebay_product_market_overrides.sql
-- =============================================================================

-- =============================================================================
-- eBay product-level overrides (optional)
-- =============================================================================
-- Add fields to let each product store:
-- - ebay_query: custom query text sent to eBay Browse API
-- - ebay_marketplace_id: preferred marketplace per product (EBAY_ES, EBAY_GB, etc.)
--
-- Safe to run multiple times.
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ebay_query TEXT;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ebay_marketplace_id TEXT;

CREATE INDEX IF NOT EXISTS idx_products_ebay_marketplace_id
  ON products (ebay_marketplace_id);

COMMENT ON COLUMN products.ebay_query IS
  'Optional custom query override used by eBay market comparison.';

COMMENT ON COLUMN products.ebay_marketplace_id IS
  'Optional eBay marketplace override (e.g. EBAY_ES, EBAY_GB, EBAY_US).';

-- Optional examples:
-- UPDATE products
--   SET ebay_query = 'pokemon yellow game boy color pal',
--       ebay_marketplace_id = 'EBAY_ES'
-- WHERE name = 'Pokémon Amarillo';



-- =============================================================================
-- EXTRA MODULE: seed_consolas_real_images.sql
-- =============================================================================

-- =============================================================================
-- SEED CONSOLAS + HARDWARE (IMAGEN REAL LOCAL)
-- Ejecuta este script en Supabase SQL Editor.
-- Usa imágenes servidas desde /public/images/products.
-- =============================================================================

alter table if exists public.products add column if not exists category text;
alter table if exists public.products add column if not exists image text;
alter table if exists public.products add column if not exists images text[];
alter table if exists public.products add column if not exists component_type text;
alter table if exists public.products add column if not exists edition text;
alter table if exists public.products add column if not exists platform text;

with payload(name, description, price, image, category, stock, component_type, edition, platform) as (
  values
    (
      'Consola Game Boy DMG-01',
      'Consola clásica revisada y lista para colección.',
      11999,
      '/images/products/console-gb-dmg.jpg',
      'consolas-retro',
      4,
      'full_game',
      'original',
      'game-boy'
    ),
    (
      'Consola Game Boy Color',
      'Consola Game Boy Color funcional y revisada.',
      12999,
      '/images/products/console-gbc.jpg',
      'consolas-retro',
      3,
      'full_game',
      'original',
      'game-boy-color'
    ),
    (
      'Consola Game Boy Advance',
      'Consola Game Boy Advance en buen estado.',
      13999,
      '/images/products/console-gba.jpg',
      'consolas-retro',
      3,
      'full_game',
      'original',
      'game-boy-advance'
    ),
    (
      'Consola Super Nintendo PAL',
      'Consola Super Nintendo PAL con test de funcionamiento.',
      14999,
      '/images/products/console-snes-pal.jpg',
      'consolas-retro',
      2,
      'full_game',
      'original',
      'super-nintendo'
    ),
    (
      'Consola Nintendo GameCube',
      'Nintendo GameCube revisada para uso y coleccionismo.',
      15999,
      '/images/products/console-gamecube.jpg',
      'consolas-retro',
      2,
      'full_game',
      'original',
      'gamecube'
    ),
    (
      'Caja consola Game Boy original',
      'Caja suelta de consola Game Boy.',
      3999,
      '/images/components/gameboy-caja.svg',
      'consolas-retro',
      5,
      'caja',
      'sin-especificar',
      'game-boy'
    ),
    (
      'Manual consola Game Boy',
      'Manual de instrucciones de consola Game Boy.',
      1999,
      '/images/components/gameboy-manual.svg',
      'manuales',
      10,
      'manual',
      'sin-especificar',
      'game-boy'
    ),
    (
      'Protector consola Game Boy (universal)',
      'Protector universal de caja para productos Game Boy.',
      350,
      '/images/components/gameboy-protector-caja.svg',
      'accesorios',
      60,
      'protector_caja',
      'sin-especificar',
      'game-boy'
    ),
    (
      'Insert consola Game Boy (universal)',
      'Insert interior universal para juegos/cajas Game Boy.',
      250,
      '/images/components/gameboy-insert.svg',
      'accesorios',
      60,
      'insert',
      'sin-especificar',
      'game-boy'
    )
)
update public.products p
set
  description = x.description,
  price = x.price,
  image = x.image,
  images = array[x.image],
  category = x.category,
  stock = x.stock,
  component_type = x.component_type,
  edition = x.edition,
  platform = x.platform,
  updated_at = now()
from payload x
where lower(p.name) = lower(x.name);

with payload(name, description, price, image, category, stock, component_type, edition, platform) as (
  values
    ('Consola Game Boy DMG-01', 'Consola clásica revisada y lista para colección.', 11999, '/images/products/console-gb-dmg.jpg', 'consolas-retro', 4, 'full_game', 'original', 'game-boy'),
    ('Consola Game Boy Color', 'Consola Game Boy Color funcional y revisada.', 12999, '/images/products/console-gbc.jpg', 'consolas-retro', 3, 'full_game', 'original', 'game-boy-color'),
    ('Consola Game Boy Advance', 'Consola Game Boy Advance en buen estado.', 13999, '/images/products/console-gba.jpg', 'consolas-retro', 3, 'full_game', 'original', 'game-boy-advance'),
    ('Consola Super Nintendo PAL', 'Consola Super Nintendo PAL con test de funcionamiento.', 14999, '/images/products/console-snes-pal.jpg', 'consolas-retro', 2, 'full_game', 'original', 'super-nintendo'),
    ('Consola Nintendo GameCube', 'Nintendo GameCube revisada para uso y coleccionismo.', 15999, '/images/products/console-gamecube.jpg', 'consolas-retro', 2, 'full_game', 'original', 'gamecube'),
    ('Caja consola Game Boy original', 'Caja suelta de consola Game Boy.', 3999, '/images/components/gameboy-caja.svg', 'consolas-retro', 5, 'caja', 'sin-especificar', 'game-boy'),
    ('Manual consola Game Boy', 'Manual de instrucciones de consola Game Boy.', 1999, '/images/components/gameboy-manual.svg', 'manuales', 10, 'manual', 'sin-especificar', 'game-boy'),
    ('Protector consola Game Boy (universal)', 'Protector universal de caja para productos Game Boy.', 350, '/images/components/gameboy-protector-caja.svg', 'accesorios', 60, 'protector_caja', 'sin-especificar', 'game-boy'),
    ('Insert consola Game Boy (universal)', 'Insert interior universal para juegos/cajas Game Boy.', 250, '/images/components/gameboy-insert.svg', 'accesorios', 60, 'insert', 'sin-especificar', 'game-boy')
)
insert into public.products (
  name,
  description,
  price,
  image,
  images,
  category,
  stock,
  component_type,
  edition,
  platform,
  created_at,
  updated_at
)
select
  x.name,
  x.description,
  x.price,
  x.image,
  array[x.image],
  x.category,
  x.stock,
  x.component_type,
  x.edition,
  x.platform,
  now(),
  now()
from payload x
where not exists (
  select 1
  from public.products p
  where lower(p.name) = lower(x.name)
);

-- Asegura imagen real para cualquier producto ya existente en categoría consolas sin imagen.
update public.products
set
  image = '/images/products/console-gb-dmg.jpg',
  images = array['/images/products/console-gb-dmg.jpg'],
  updated_at = now()
where coalesce(image, '') = ''
  and lower(coalesce(category, '')) = 'consolas-retro';



-- =============================================================================
-- EXTRA MODULE: seed_consolas_ediciones_especiales.sql
-- =============================================================================

-- =============================================================================
-- SEED: EDICIONES ESPECIALES DE CONSOLAS (solo plataformas ya usadas en tienda)
-- Game Boy, Game Boy Color, Game Boy Advance, Super Nintendo, GameCube.
-- Requiere imágenes reales locales en /public/images/products/special-editions.
-- =============================================================================

alter table if exists public.products add column if not exists category text;
alter table if exists public.products add column if not exists image text;
alter table if exists public.products add column if not exists images text[];
alter table if exists public.products add column if not exists status text;
alter table if exists public.products add column if not exists component_type text;
alter table if exists public.products add column if not exists edition text;
alter table if exists public.products add column if not exists collection_key text;
alter table if exists public.products add column if not exists platform text;
alter table if exists public.products add column if not exists long_description text;
alter table if exists public.products add column if not exists ebay_query text;
alter table if exists public.products add column if not exists ebay_marketplace_id text;
alter table if exists public.products add column if not exists is_active boolean;
alter table if exists public.products add column if not exists created_at timestamptz;
alter table if exists public.products add column if not exists updated_at timestamptz;

with payload(name, description, long_description, price, image, category, stock, component_type, edition, collection_key, platform, ebay_query, ebay_marketplace_id) as (
  values
    (
      'Consola Game Boy Light Gold (Edición especial JP)',
      'Game Boy Light japonesa con retroiluminación integrada. Modelo raro para coleccionismo.',
      'Edición especial lanzada en Japón. Muy buscada por coleccionistas de hardware portátil clásico.',
      38999,
      '/images/products/special-editions/console-special-gameboy-light.png',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'game-boy',
      'game boy light gold japan',
      'EBAY_ES'
    ),
    (
      'Consola Game Boy Color Pikachu (Edición especial)',
      'Game Boy Color con diseño Pikachu. Variante especial de colección.',
      'Edición especial de Game Boy Color con temática Pikachu. Pieza destacada para vitrina retro.',
      32999,
      '/images/products/special-editions/console-special-gbc-pikachu.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'game-boy-color',
      'game boy color pikachu special edition',
      'EBAY_ES'
    ),
    (
      'Consola Game Boy Advance SP NES Classic (Edición especial)',
      'Game Boy Advance SP NES Classic Edition. Variante limitada de colección.',
      'Modelo SP inspirado en NES Classic. Acabado especial y tirada limitada según mercado.',
      34999,
      '/images/products/special-editions/console-special-gba-sp-nes.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'game-boy-advance',
      'game boy advance sp nes classic edition',
      'EBAY_ES'
    ),
    (
      'Consola Super Famicom Jr (Edición especial Japón)',
      'Revisión compacta de SNES/Super Famicom. Modelo difícil de conseguir fuera de Japón.',
      'Super Famicom Jr es una revisión de hardware muy buscada por coleccionistas de Super Nintendo.',
      35999,
      '/images/products/special-editions/console-special-snes-jr.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'super-nintendo',
      'super famicom jr console special',
      'EBAY_ES'
    ),
    (
      'Consola Panasonic Q (Edición especial GameCube)',
      'Variante Panasonic Q compatible con GameCube/DVD. Hardware premium de colección.',
      'Panasonic Q es una de las variantes más raras dentro del ecosistema GameCube.',
      129999,
      '/images/products/special-editions/console-special-panasonic-q.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'gamecube',
      'panasonic q gamecube console',
      'EBAY_ES'
    )
)
update public.products p
set
  description = x.description,
  long_description = x.long_description,
  price = x.price,
  image = x.image,
  images = array[x.image],
  category = x.category,
  stock = x.stock,
  status = 'new',
  component_type = x.component_type,
  edition = x.edition,
  collection_key = x.collection_key,
  platform = x.platform,
  ebay_query = x.ebay_query,
  ebay_marketplace_id = x.ebay_marketplace_id,
  is_active = true,
  updated_at = now()
from payload x
where lower(coalesce(p.name, '')) = lower(x.name);

with payload(name, description, long_description, price, image, category, stock, component_type, edition, collection_key, platform, ebay_query, ebay_marketplace_id) as (
  values
    ('Consola Game Boy Light Gold (Edición especial JP)', 'Game Boy Light japonesa con retroiluminación integrada. Modelo raro para coleccionismo.', 'Edición especial lanzada en Japón. Muy buscada por coleccionistas de hardware portátil clásico.', 38999, '/images/products/special-editions/console-special-gameboy-light.png', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'game-boy', 'game boy light gold japan', 'EBAY_ES'),
    ('Consola Game Boy Color Pikachu (Edición especial)', 'Game Boy Color con diseño Pikachu. Variante especial de colección.', 'Edición especial de Game Boy Color con temática Pikachu. Pieza destacada para vitrina retro.', 32999, '/images/products/special-editions/console-special-gbc-pikachu.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'game-boy-color', 'game boy color pikachu special edition', 'EBAY_ES'),
    ('Consola Game Boy Advance SP NES Classic (Edición especial)', 'Game Boy Advance SP NES Classic Edition. Variante limitada de colección.', 'Modelo SP inspirado en NES Classic. Acabado especial y tirada limitada según mercado.', 34999, '/images/products/special-editions/console-special-gba-sp-nes.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'game-boy-advance', 'game boy advance sp nes classic edition', 'EBAY_ES'),
    ('Consola Super Famicom Jr (Edición especial Japón)', 'Revisión compacta de SNES/Super Famicom. Modelo difícil de conseguir fuera de Japón.', 'Super Famicom Jr es una revisión de hardware muy buscada por coleccionistas de Super Nintendo.', 35999, '/images/products/special-editions/console-special-snes-jr.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'super-nintendo', 'super famicom jr console special', 'EBAY_ES'),
    ('Consola Panasonic Q (Edición especial GameCube)', 'Variante Panasonic Q compatible con GameCube/DVD. Hardware premium de colección.', 'Panasonic Q es una de las variantes más raras dentro del ecosistema GameCube.', 129999, '/images/products/special-editions/console-special-panasonic-q.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'gamecube', 'panasonic q gamecube console', 'EBAY_ES')
)
insert into public.products (
  name,
  description,
  long_description,
  price,
  image,
  images,
  category,
  stock,
  status,
  component_type,
  edition,
  collection_key,
  platform,
  ebay_query,
  ebay_marketplace_id,
  is_active,
  created_at,
  updated_at
)
select
  x.name,
  x.description,
  x.long_description,
  x.price,
  x.image,
  array[x.image],
  x.category,
  x.stock,
  'new',
  x.component_type,
  x.edition,
  x.collection_key,
  x.platform,
  x.ebay_query,
  x.ebay_marketplace_id,
  true,
  now(),
  now()
from payload x
where not exists (
  select 1 from public.products p where lower(coalesce(p.name, '')) = lower(x.name)
);

notify pgrst, 'reload schema';


-- =============================================================================
-- EXTRA MODULE: seed_social_activity_starter.sql
-- NOTA: crea actividad social/usuarios seed.
-- =============================================================================

-- =============================================================================
-- Seed inicial de actividad social (usuarios + reseñas + métricas)
-- -----------------------------------------------------------------------------
-- Uso recomendado:
-- 1) Ejecutar en Supabase SQL Editor.
-- 2) Después recargar la web.
--
-- Nota:
-- - Este seed crea actividad inicial para evitar "tienda vacía".
-- - Está pensado como arranque de comunidad, no como sustituto de actividad real.
-- =============================================================================

create extension if not exists pgcrypto;

alter table if exists public.users add column if not exists level integer default 1;
alter table if exists public.users add column if not exists xp_total integer default 0;
alter table if exists public.users add column if not exists xp_updated_at timestamptz default now();
alter table if exists public.users add column if not exists profile_theme text default 'neon-grid';
alter table if exists public.users add column if not exists favorites_visibility text default 'public';
alter table if exists public.users add column if not exists is_verified_seller boolean default false;

-- -----------------------------------------------------------------------------
-- 1) Perfiles semilla (avatares + banners)
-- -----------------------------------------------------------------------------
with seed_profiles as (
  select *
  from (
    values
      ('seed.alex@advancedretro.es', 'Alex Molina', 'Colecciono portátiles clásicas y ediciones PAL.', 'Siempre cazando joyas ocultas', 'Game Boy', 'https://randomuser.me/api/portraits/men/11.jpg', 'https://picsum.photos/seed/ar-banner-01/1400/420'),
      ('seed.marta@advancedretro.es', 'Marta Rivas', 'Me centro en cajas originales y manuales en muy buen estado.', 'Fan del cartón bien cuidado', 'Game Boy Color', 'https://randomuser.me/api/portraits/women/12.jpg', 'https://picsum.photos/seed/ar-banner-02/1400/420'),
      ('seed.saul@advancedretro.es', 'Saúl Romero', 'Busco completos y protectores premium para vitrina.', 'Completo o nada', 'GameCube', 'https://randomuser.me/api/portraits/men/13.jpg', 'https://picsum.photos/seed/ar-banner-03/1400/420'),
      ('seed.ines@advancedretro.es', 'Inés Beltrán', 'Colección temática Nintendo portátil desde hace años.', 'Portátiles retro forever', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/14.jpg', 'https://picsum.photos/seed/ar-banner-04/1400/420'),
      ('seed.erik@advancedretro.es', 'Erik Sanz', 'Comparo estado, serigrafía y calidad de impresión.', 'Detalles por encima de todo', 'Super Nintendo', 'https://randomuser.me/api/portraits/men/15.jpg', 'https://picsum.photos/seed/ar-banner-05/1400/420'),
      ('seed.laura@advancedretro.es', 'Laura Peña', 'Mi prioridad: juegos clásicos listos para jugar.', 'Retro para jugar, no solo mirar', 'Game Boy', 'https://randomuser.me/api/portraits/women/16.jpg', 'https://picsum.photos/seed/ar-banner-06/1400/420'),
      ('seed.dani@advancedretro.es', 'Dani Cortés', 'Valoro mucho el estado del manual y el insert.', 'Manual + insert = felicidad', 'Game Boy Color', 'https://randomuser.me/api/portraits/men/17.jpg', 'https://picsum.photos/seed/ar-banner-07/1400/420'),
      ('seed.noa@advancedretro.es', 'Noa Campos', 'Compro para colección y también para regalo.', 'Regalos retro con historia', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/18.jpg', 'https://picsum.photos/seed/ar-banner-08/1400/420'),
      ('seed.raul@advancedretro.es', 'Raúl Navarro', 'Me gustan las ediciones especiales y packs completos.', 'Cazador de ediciones raras', 'GameCube', 'https://randomuser.me/api/portraits/men/19.jpg', 'https://picsum.photos/seed/ar-banner-09/1400/420'),
      ('seed.sara@advancedretro.es', 'Sara Vidal', 'Sigo de cerca precios y cambios de mercado.', 'Seguimiento diario de precios', 'Super Nintendo', 'https://randomuser.me/api/portraits/women/20.jpg', 'https://picsum.photos/seed/ar-banner-10/1400/420'),
      ('seed.oscar@advancedretro.es', 'Óscar Gil', 'Coleccionista de RPG y catálogo clásico de Nintendo.', 'RPG retro en vitrina', 'Game Boy', 'https://randomuser.me/api/portraits/men/21.jpg', 'https://picsum.photos/seed/ar-banner-11/1400/420'),
      ('seed.clara@advancedretro.es', 'Clara Nieto', 'Me fijo en conservación real y transparencia del vendedor.', 'Estado real primero', 'Game Boy Color', 'https://randomuser.me/api/portraits/women/22.jpg', 'https://picsum.photos/seed/ar-banner-12/1400/420'),
      ('seed.jorge@advancedretro.es', 'Jorge Peralta', 'Juego y colecciono, equilibrio entre valor y disfrute.', 'Retro práctico', 'GameCube', 'https://randomuser.me/api/portraits/men/23.jpg', 'https://picsum.photos/seed/ar-banner-13/1400/420'),
      ('seed.alba@advancedretro.es', 'Alba Serrano', 'Me interesan cajas repro para completar sets incompletos.', 'Completar colección sin drama', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/24.jpg', 'https://picsum.photos/seed/ar-banner-14/1400/420'),
      ('seed.miguel@advancedretro.es', 'Miguel Reyes', 'Suelo comprar lotes de clásicos para restauración ligera.', 'Restauración y mimo', 'Super Nintendo', 'https://randomuser.me/api/portraits/men/25.jpg', 'https://picsum.photos/seed/ar-banner-15/1400/420'),
      ('seed.irene@advancedretro.es', 'Irene Lozano', 'Me encantan las portadas en estado impecable.', 'Portadas y arte original', 'Game Boy', 'https://randomuser.me/api/portraits/women/26.jpg', 'https://picsum.photos/seed/ar-banner-16/1400/420'),
      ('seed.hugo@advancedretro.es', 'Hugo León', 'Veo esta tienda como punto fijo para retro serio.', 'Calidad estable', 'Game Boy Color', 'https://randomuser.me/api/portraits/men/27.jpg', 'https://picsum.photos/seed/ar-banner-17/1400/420'),
      ('seed.vera@advancedretro.es', 'Vera Salas', 'Busco producto probado y envío rápido.', 'Rapidez + cuidado', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/28.jpg', 'https://picsum.photos/seed/ar-banner-18/1400/420')
  ) as t(email, name, bio, tagline, favorite_console, avatar_url, banner_url)
),
upserted_users as (
  insert into public.users (
    id,
    email,
    name,
    role,
    avatar_url,
    banner_url,
    bio,
    tagline,
    favorite_console,
    is_verified_seller,
    profile_theme,
    level,
    xp_total,
    xp_updated_at,
    created_at,
    updated_at
  )
  select
    coalesce((select u.id from public.users u where u.email = p.email), gen_random_uuid()),
    p.email,
    p.name,
    'user',
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.tagline,
    p.favorite_console,
    true,
    'neon-grid',
    2 + (row_number() over (order by p.email) % 7),
    180 + (row_number() over (order by p.email) * 35),
    now(),
    now() - make_interval(days => (30 + (row_number() over (order by p.email) % 40))::int),
    now()
  from seed_profiles p
  on conflict (email) do update
  set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    banner_url = excluded.banner_url,
    bio = excluded.bio,
    tagline = excluded.tagline,
    favorite_console = excluded.favorite_console,
    is_verified_seller = true,
    updated_at = now()
  returning id, email, name
),
target_products as (
  select
    p.id as product_id,
    p.name as product_name,
    coalesce(p.is_mystery_box, false) as is_mystery_box,
    row_number() over (order by p.updated_at desc nulls last, p.created_at desc nulls last, p.id) as rn
  from public.products p
  where coalesce(p.stock, 0) > 0
    and p.category in (
      'juegos-gameboy',
      'juegos-gameboy-color',
      'juegos-gameboy-advance',
      'juegos-super-nintendo',
      'juegos-gamecube',
      'cajas-misteriosas'
    )
  limit 24
),
review_templates as (
  select *
  from (
    values
      (1, 5, 'Muy buen estado general. Llegó bien protegido y coincide con la descripción.'),
      (2, 5, 'Compra fácil y envío rápido. Para colección queda perfecto.'),
      (3, 4, 'Producto correcto y buena comunicación. Repetiría compra sin problema.'),
      (4, 5, 'Sorprende el cuidado en los detalles, especialmente caja/manual.'),
      (5, 4, 'Relación calidad-precio bastante buena para como está el mercado.'),
      (6, 5, 'Se nota revisión previa. Todo funcionando y limpio.'),
      (7, 3, 'Tardó un poco más de lo esperado, pero el artículo llegó bien.'),
      (8, 4, 'Buena opción para completar colección sin complicaciones.'),
      (9, 5, 'Muy satisfecho con la compra, estado mejor de lo que esperaba.'),
      (10, 4, 'Descripción honesta y fotos útiles, eso se agradece mucho.')
  ) as t(idx, rating, comment)
),
user_pool as (
  select
    u.id as user_id,
    u.name as author_name,
    row_number() over (order by u.email) as rn
  from upserted_users u
),
review_rows as (
  select
    tp.product_id,
    up.user_id,
    ('seed-review-' || tp.rn || '-' || up.rn || '-' || rt.idx) as visitor_key,
    up.author_name,
    rt.rating,
    rt.comment,
    now() - make_interval(
      days => ((tp.rn * 3 + up.rn + rt.idx) % 50)::int,
      hours => ((rt.idx * 2 + up.rn) % 20)::int
    ) as created_at
  from target_products tp
  join user_pool up
    on ((tp.rn + up.rn) % 5) = 0
  join review_templates rt
    on ((rt.idx + tp.rn + up.rn) % 3) = 0
  where
    (tp.is_mystery_box and rt.idx <= 6)
    or (not tp.is_mystery_box and rt.idx <= 8)
),
ins_reviews as (
  insert into public.product_social_reviews (
    product_id,
    user_id,
    visitor_key,
    author_name,
    rating,
    comment,
    photos,
    created_at,
    updated_at
  )
  select
    r.product_id,
    r.user_id,
    r.visitor_key,
    r.author_name,
    r.rating,
    r.comment,
    '{}'::text[],
    r.created_at,
    r.created_at
  from review_rows r
  on conflict (product_id, visitor_key, rating, comment) do nothing
  returning product_id
),
visit_seed as (
  select
    tp.product_id,
    ('seed-visit-' || tp.rn || '-' || gs.n) as visitor_key,
    (2 + ((tp.rn + gs.n) % 5)) as visits_count,
    now() - make_interval(days => ((tp.rn + gs.n) % 35)::int) as visit_at
  from target_products tp
  cross join lateral generate_series(1, 16) as gs(n)
),
ins_visits as (
  insert into public.product_social_visits (
    product_id,
    visitor_key,
    visits_count,
    last_visit_at,
    created_at,
    updated_at
  )
  select
    v.product_id,
    v.visitor_key,
    v.visits_count,
    v.visit_at,
    v.visit_at,
    now()
  from visit_seed v
  on conflict (product_id, visitor_key) do update
  set
    visits_count = greatest(public.product_social_visits.visits_count, excluded.visits_count),
    last_visit_at = greatest(public.product_social_visits.last_visit_at, excluded.last_visit_at),
    updated_at = now()
  returning product_id
),
touched_products as (
  select distinct product_id from target_products
),
review_agg as (
  select
    r.product_id,
    count(*)::int as reviews_count,
    round(avg(r.rating)::numeric, 2) as rating_average
  from public.product_social_reviews r
  where r.product_id in (select product_id from touched_products)
  group by r.product_id
),
visit_agg as (
  select
    v.product_id,
    coalesce(sum(v.visits_count), 0)::int as visits_count
  from public.product_social_visits v
  where v.product_id in (select product_id from touched_products)
  group by v.product_id
),
summary_payload as (
  select
    tp.product_id,
    coalesce(va.visits_count, 0) as visits,
    greatest(0, round(coalesce(ra.reviews_count, 0) * 0.65)::int) as likes_count,
    coalesce(ra.reviews_count, 0) as reviews_count,
    coalesce(ra.rating_average, 0)::numeric(4,2) as rating_average
  from touched_products tp
  left join review_agg ra on ra.product_id = tp.product_id
  left join visit_agg va on va.product_id = tp.product_id
),
upsert_summary as (
  insert into public.product_social_summary (
    product_id,
    visits,
    likes_count,
    reviews_count,
    rating_average,
    updated_at
  )
  select
    sp.product_id,
    sp.visits,
    sp.likes_count,
    sp.reviews_count,
    sp.rating_average,
    now()
  from summary_payload sp
  on conflict (product_id) do update
  set
    visits = greatest(public.product_social_summary.visits, excluded.visits),
    likes_count = greatest(public.product_social_summary.likes_count, excluded.likes_count),
    reviews_count = greatest(public.product_social_summary.reviews_count, excluded.reviews_count),
    rating_average = case
      when excluded.reviews_count >= public.product_social_summary.reviews_count then excluded.rating_average
      else public.product_social_summary.rating_average
    end,
    updated_at = now()
  returning product_id
)
select json_build_object(
  'seed_users', (select count(*) from upserted_users),
  'target_products', (select count(*) from touched_products),
  'inserted_reviews', (select count(*) from ins_reviews),
  'seeded_visits', (select count(*) from ins_visits),
  'updated_summary_rows', (select count(*) from upsert_summary)
) as seed_result;



-- =============================================================================
-- END OF BUNDLE
-- =============================================================================


-- =============================================================================
-- ADMIN PANEL BUNDLE
-- =============================================================================

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


-- =============================================================================
-- PROFILE USAGE METRICS
-- =============================================================================

-- =========================================================
-- PROFILE USAGE METRICS (tiempo de uso por usuario)
-- Ejecutar en Supabase SQL Editor
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists user_usage_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  heartbeat_count integer not null default 0 check (heartbeat_count >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  last_path text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, session_id)
);

create index if not exists idx_user_usage_sessions_user_last_seen
  on user_usage_sessions(user_id, last_seen_at desc);

create index if not exists idx_user_usage_sessions_user_started
  on user_usage_sessions(user_id, started_at desc);

create table if not exists user_usage_daily_stats (
  user_id uuid not null references users(id) on delete cascade,
  usage_date date not null,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  sessions_count integer not null default 0 check (sessions_count >= 0),
  heartbeats_count integer not null default 0 check (heartbeats_count >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists idx_user_usage_daily_stats_user_date
  on user_usage_daily_stats(user_id, usage_date desc);

alter table user_usage_sessions enable row level security;
alter table user_usage_daily_stats enable row level security;

drop policy if exists user_usage_sessions_select_own on user_usage_sessions;
create policy user_usage_sessions_select_own
  on user_usage_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists user_usage_daily_stats_select_own on user_usage_daily_stats;
create policy user_usage_daily_stats_select_own
  on user_usage_daily_stats
  for select
  using (auth.uid() = user_id);

create or replace function public.track_user_usage_heartbeat(
  p_user_id uuid,
  p_session_id text,
  p_path text default null,
  p_active_seconds integer default 0,
  p_mark_ended boolean default false,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_delta integer := greatest(0, least(coalesce(p_active_seconds, 0), 900));
  v_session user_usage_sessions%rowtype;
  v_is_new boolean := false;
  v_path text := nullif(trim(coalesce(p_path, '')), '');
  v_page_view_inc integer := 0;
  v_usage_date date := (v_now at time zone 'UTC')::date;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;
  if nullif(trim(coalesce(p_session_id, '')), '') is null then
    raise exception 'p_session_id is required';
  end if;

  insert into user_usage_sessions (
    user_id,
    session_id,
    started_at,
    last_seen_at,
    active_seconds,
    heartbeat_count,
    page_views,
    last_path,
    user_agent,
    created_at,
    updated_at
  ) values (
    p_user_id,
    trim(p_session_id),
    v_now,
    v_now,
    0,
    0,
    case when v_path is not null then 1 else 0 end,
    v_path,
    nullif(left(coalesce(p_user_agent, ''), 350), ''),
    v_now,
    v_now
  )
  on conflict (user_id, session_id) do nothing;

  select *
  into v_session
  from user_usage_sessions
  where user_id = p_user_id and session_id = trim(p_session_id)
  for update;

  if not found then
    raise exception 'unable to load usage session';
  end if;

  v_is_new := v_session.heartbeat_count = 0;

  if v_path is not null and coalesce(v_session.last_path, '') <> v_path then
    v_page_view_inc := 1;
  end if;

  update user_usage_sessions
  set
    last_seen_at = v_now,
    ended_at = case when p_mark_ended then v_now else ended_at end,
    active_seconds = active_seconds + v_delta,
    heartbeat_count = heartbeat_count + 1,
    page_views = page_views + v_page_view_inc,
    last_path = coalesce(v_path, last_path),
    user_agent = coalesce(nullif(left(coalesce(p_user_agent, ''), 350), ''), user_agent),
    updated_at = v_now
  where user_id = p_user_id and session_id = trim(p_session_id);

  insert into user_usage_daily_stats (
    user_id,
    usage_date,
    active_seconds,
    sessions_count,
    heartbeats_count,
    page_views,
    updated_at
  ) values (
    p_user_id,
    v_usage_date,
    v_delta,
    case when v_is_new then 1 else 0 end,
    1,
    v_page_view_inc,
    v_now
  )
  on conflict (user_id, usage_date)
  do update set
    active_seconds = user_usage_daily_stats.active_seconds + excluded.active_seconds,
    sessions_count = user_usage_daily_stats.sessions_count + excluded.sessions_count,
    heartbeats_count = user_usage_daily_stats.heartbeats_count + excluded.heartbeats_count,
    page_views = user_usage_daily_stats.page_views + excluded.page_views,
    updated_at = v_now;

  return jsonb_build_object(
    'ok', true,
    'active_seconds_added', v_delta,
    'page_view_incremented', v_page_view_inc,
    'session_started', v_is_new
  );
end;
$$;

create or replace function public.get_user_usage_summary(
  p_user_id uuid
) returns jsonb
language sql
security definer
set search_path = public
as $$
with sessions as (
  select
    coalesce(sum(active_seconds), 0)::bigint as total_active_seconds,
    count(*)::bigint as total_sessions,
    coalesce(sum(page_views), 0)::bigint as total_page_views,
    max(last_seen_at) as last_seen_at
  from user_usage_sessions
  where user_id = p_user_id
),
today as (
  select
    coalesce(sum(active_seconds), 0)::bigint as active_seconds,
    coalesce(sum(sessions_count), 0)::bigint as sessions_count,
    coalesce(sum(page_views), 0)::bigint as page_views
  from user_usage_daily_stats
  where user_id = p_user_id
    and usage_date = (now() at time zone 'UTC')::date
),
last7 as (
  select
    coalesce(sum(active_seconds), 0)::bigint as active_seconds,
    coalesce(sum(sessions_count), 0)::bigint as sessions_count,
    coalesce(sum(page_views), 0)::bigint as page_views
  from user_usage_daily_stats
  where user_id = p_user_id
    and usage_date >= ((now() at time zone 'UTC')::date - interval '6 days')
),
last30 as (
  select
    coalesce(sum(active_seconds), 0)::bigint as active_seconds,
    coalesce(sum(sessions_count), 0)::bigint as sessions_count,
    coalesce(sum(page_views), 0)::bigint as page_views
  from user_usage_daily_stats
  where user_id = p_user_id
    and usage_date >= ((now() at time zone 'UTC')::date - interval '29 days')
),
daily as (
  select
    usage_date,
    active_seconds,
    sessions_count,
    heartbeats_count,
    page_views
  from user_usage_daily_stats
  where user_id = p_user_id
  order by usage_date desc
  limit 30
),
latest_session as (
  select
    session_id,
    started_at,
    last_seen_at,
    ended_at,
    active_seconds,
    heartbeat_count,
    page_views,
    last_path
  from user_usage_sessions
  where user_id = p_user_id
  order by coalesce(last_seen_at, started_at) desc
  limit 1
)
select jsonb_build_object(
  'totals', jsonb_build_object(
    'active_seconds', sessions.total_active_seconds,
    'sessions_count', sessions.total_sessions,
    'page_views', sessions.total_page_views,
    'last_seen_at', sessions.last_seen_at,
    'avg_session_seconds',
      case
        when sessions.total_sessions > 0 then floor(sessions.total_active_seconds::numeric / sessions.total_sessions)::bigint
        else 0
      end
  ),
  'today', jsonb_build_object(
    'active_seconds', today.active_seconds,
    'sessions_count', today.sessions_count,
    'page_views', today.page_views
  ),
  'last_7d', jsonb_build_object(
    'active_seconds', last7.active_seconds,
    'sessions_count', last7.sessions_count,
    'page_views', last7.page_views
  ),
  'last_30d', jsonb_build_object(
    'active_seconds', last30.active_seconds,
    'sessions_count', last30.sessions_count,
    'page_views', last30.page_views
  ),
  'daily', coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'usage_date', daily.usage_date,
          'active_seconds', daily.active_seconds,
          'sessions_count', daily.sessions_count,
          'heartbeats_count', daily.heartbeats_count,
          'page_views', daily.page_views
        )
        order by daily.usage_date desc
      )
      from daily
    ),
    '[]'::jsonb
  ),
  'latest_session', (
    select row_to_json(latest_session) from latest_session
  )
)
from sessions, today, last7, last30;
$$;

grant execute on function public.track_user_usage_heartbeat(uuid, text, text, integer, boolean, text)
  to authenticated, service_role;
grant execute on function public.get_user_usage_summary(uuid)
  to authenticated, service_role;


-- =============================================================================
-- RETRO STORAGE AUCTIONS
-- =============================================================================

-- Retro Storage Auctions
-- Base SQL para mover el MVP de storage JSON a tablas PostgreSQL/Supabase.

create extension if not exists pgcrypto;

create table if not exists public.retro_storage_auctions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  teaser text not null default '',
  category text not null,
  warehouse_code text not null unique,
  rarity_label text not null default 'Curado',
  image_url text not null,
  preview_mode text not null check (preview_mode in ('blur', 'partial', 'clear')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'closed', 'revealed', 'cancelled')),
  transparency_note text not null default '',
  legal_note text not null default '',
  guaranteed_minimum text not null default '',
  minimum_estimated_value_cents integer not null default 0,
  starting_bid_cents integer not null default 0,
  current_bid_cents integer not null default 0,
  min_increment_cents integer not null default 100,
  extension_window_seconds integer not null default 120,
  extension_by_seconds integer not null default 90,
  rent_fee_cents_per_month integer,
  rent_grace_days integer,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  extended_until timestamptz,
  revealed_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  current_winner_user_id uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auctions_status_idx
  on public.retro_storage_auctions(status, starts_at, ends_at);

create table if not exists public.retro_storage_auction_hints (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  detail text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_hints_auction_idx
  on public.retro_storage_auction_hints(auction_id, sort_order);

create table if not exists public.retro_storage_auction_contents (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  label text not null,
  item_type text not null check (item_type in ('console', 'game', 'accessory', 'collectible', 'document')),
  condition_label text not null default 'Bueno',
  estimated_value_cents integer not null default 0,
  verified boolean not null default false,
  marketplace_ready boolean not null default false,
  is_guaranteed boolean not null default false,
  is_hidden_until_reveal boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_contents_auction_idx
  on public.retro_storage_auction_contents(auction_id, is_hidden_until_reveal);

create table if not exists public.retro_storage_auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'accepted' check (status in ('accepted', 'rejected', 'cancelled')),
  source text not null default 'web',
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_bids_auction_idx
  on public.retro_storage_auction_bids(auction_id, amount_cents desc, created_at desc);

create index if not exists retro_storage_auction_bids_user_idx
  on public.retro_storage_auction_bids(user_id, created_at desc);

create table if not exists public.retro_storage_auction_chat_messages (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  kind text not null default 'message' check (kind in ('message', 'reaction')),
  moderation_state text not null default 'visible' check (moderation_state in ('visible', 'hidden', 'flagged')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_chat_messages_auction_idx
  on public.retro_storage_auction_chat_messages(auction_id, created_at desc);

create table if not exists public.retro_storage_auction_reminders (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  channel text not null default 'onsite' check (channel in ('onsite', 'email', 'push')),
  last_notified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (auction_id, user_id, channel)
);

create index if not exists retro_storage_auction_reminders_user_idx
  on public.retro_storage_auction_reminders(user_id, created_at desc);

create table if not exists public.retro_storage_auction_interest (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('buy', 'rent')),
  state text not null default 'requested' check (state in ('requested', 'reviewing', 'approved', 'rejected', 'converted')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (auction_id, user_id, action)
);

create index if not exists retro_storage_auction_interest_auction_idx
  on public.retro_storage_auction_interest(auction_id, action, created_at desc);

create table if not exists public.retro_storage_auction_reports (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  chat_message_id uuid not null references public.retro_storage_auction_chat_messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  state text not null default 'open' check (state in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create index if not exists retro_storage_auction_reports_state_idx
  on public.retro_storage_auction_reports(state, created_at desc);

create table if not exists public.retro_storage_storage_contracts (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid references public.retro_storage_auctions(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  award_id uuid,
  monthly_fee_cents integer not null default 0,
  grace_days integer not null default 0,
  status text not null default 'active' check (status in ('active', 'grace', 'expired', 'transferred', 'cancelled')),
  started_at timestamptz not null default timezone('utc', now()),
  next_billing_at timestamptz,
  expires_at timestamptz,
  transferred_to_advanced_retro_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_storage_contracts_user_idx
  on public.retro_storage_storage_contracts(user_id, status, next_billing_at);

create table if not exists public.retro_storage_awards (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  winner_user_id uuid not null references public.users(id) on delete cascade,
  winning_bid_id uuid references public.retro_storage_auction_bids(id) on delete set null,
  total_paid_cents integer not null default 0,
  assignment_state text not null default 'pending' check (assignment_state in ('pending', 'assigned', 'listed', 'stored', 'cancelled')),
  assigned_to_profile_at timestamptz,
  converted_to_marketplace_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists retro_storage_awards_auction_unique
  on public.retro_storage_awards(auction_id);

alter table public.retro_storage_auctions enable row level security;
alter table public.retro_storage_auction_hints enable row level security;
alter table public.retro_storage_auction_contents enable row level security;
alter table public.retro_storage_auction_bids enable row level security;
alter table public.retro_storage_auction_chat_messages enable row level security;
alter table public.retro_storage_auction_reminders enable row level security;
alter table public.retro_storage_auction_interest enable row level security;
alter table public.retro_storage_auction_reports enable row level security;
alter table public.retro_storage_storage_contracts enable row level security;
alter table public.retro_storage_awards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auctions' and policyname = 'retro_storage_auctions_public_read'
  ) then
    create policy retro_storage_auctions_public_read
      on public.retro_storage_auctions
      for select
      using (status in ('scheduled', 'live', 'closed', 'revealed'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_hints' and policyname = 'retro_storage_auction_hints_public_read'
  ) then
    create policy retro_storage_auction_hints_public_read
      on public.retro_storage_auction_hints
      for select
      using (
        exists (
          select 1
          from public.retro_storage_auctions rsa
          where rsa.id = auction_id
            and rsa.status in ('scheduled', 'live', 'closed', 'revealed')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_contents' and policyname = 'retro_storage_auction_contents_public_read'
  ) then
    create policy retro_storage_auction_contents_public_read
      on public.retro_storage_auction_contents
      for select
      using (
        exists (
          select 1
          from public.retro_storage_auctions rsa
          where rsa.id = auction_id
            and (
              rsa.status in ('revealed')
              or coalesce(is_hidden_until_reveal, false) = false
            )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_bids' and policyname = 'retro_storage_auction_bids_user_write'
  ) then
    create policy retro_storage_auction_bids_user_write
      on public.retro_storage_auction_bids
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_chat_messages' and policyname = 'retro_storage_auction_chat_user_write'
  ) then
    create policy retro_storage_auction_chat_user_write
      on public.retro_storage_auction_chat_messages
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_chat_messages' and policyname = 'retro_storage_auction_chat_public_read'
  ) then
    create policy retro_storage_auction_chat_public_read
      on public.retro_storage_auction_chat_messages
      for select
      using (
        moderation_state = 'visible'
        and exists (
          select 1
          from public.retro_storage_auctions rsa
          where rsa.id = auction_id
            and rsa.status in ('live', 'closed', 'revealed')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_reminders' and policyname = 'retro_storage_auction_reminders_user_self'
  ) then
    create policy retro_storage_auction_reminders_user_self
      on public.retro_storage_auction_reminders
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_interest' and policyname = 'retro_storage_auction_interest_user_self'
  ) then
    create policy retro_storage_auction_interest_user_self
      on public.retro_storage_auction_interest
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_reports' and policyname = 'retro_storage_auction_reports_user_self'
  ) then
    create policy retro_storage_auction_reports_user_self
      on public.retro_storage_auction_reports
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_awards' and policyname = 'retro_storage_awards_user_read'
  ) then
    create policy retro_storage_awards_user_read
      on public.retro_storage_awards
      for select
      to authenticated
      using (auth.uid() = winner_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_storage_contracts' and policyname = 'retro_storage_storage_contracts_user_read'
  ) then
    create policy retro_storage_storage_contracts_user_read
      on public.retro_storage_storage_contracts
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

-- =============================================================================
-- MASTER COMPATIBILITY PATCHES
-- =============================================================================

create or replace function public.hash_ip(ip text)
returns text
language sql
immutable
as $$
  select encode(digest(coalesce(ip, ''), 'sha256'), 'hex')
$$;

comment on function public.hash_ip(text) is 'Devuelve el SHA-256 hexadecimal de una IP para analítica anonimizada.';

-- -----------------------------------------------------------------------------
-- PROFILES: idioma + privacidad favoritos
-- -----------------------------------------------------------------------------
alter table if exists public.profiles
  add column if not exists preferred_language text not null default 'es',
  add column if not exists favorites_visibility text not null default 'public';

update public.profiles
set
  preferred_language = case
    when lower(coalesce(preferred_language, 'es')) in ('auto','es','en','fr','de','it','pt') then lower(coalesce(preferred_language, 'es'))
    else 'es'
  end,
  favorites_visibility = case
    when lower(coalesce(favorites_visibility, 'public')) in ('public','members','private') then lower(coalesce(favorites_visibility, 'public'))
    else 'public'
  end,
  updated_at = coalesce(updated_at, now())
where true;

alter table if exists public.profiles drop constraint if exists profiles_preferred_language_check;
alter table if exists public.profiles add constraint profiles_preferred_language_check
  check (preferred_language in ('auto','es','en','fr','de','it','pt'));

alter table if exists public.profiles drop constraint if exists profiles_favorites_visibility_check;
alter table if exists public.profiles add constraint profiles_favorites_visibility_check
  check (favorites_visibility in ('public','members','private'));

create index if not exists idx_profiles_preferred_language on public.profiles(preferred_language);
create index if not exists idx_profiles_favorites_visibility on public.profiles(favorites_visibility);

insert into public.profiles (id, email, role, full_name, created_at, updated_at)
select au.id, au.email, 'admin', coalesce(nullif(trim(au.raw_user_meta_data ->> 'full_name'), ''), 'Administrador'), now(), now()
from auth.users au
where lower(coalesce(au.email, '')) = 'flardop44@gmail.com'
on conflict (id) do update
set role = 'admin',
    updated_at = now();

-- -----------------------------------------------------------------------------
-- USERS legacy compatibility: idioma + helper metrics
-- -----------------------------------------------------------------------------
alter table if exists public.users
  add column if not exists favorites_visibility text default 'public',
  add column if not exists helper_completed_count integer not null default 0,
  add column if not exists helper_active_count integer not null default 0,
  add column if not exists helper_reputation integer not null default 0,
  add column if not exists preferred_language text not null default 'es';

update public.users
set
  favorites_visibility = case
    when lower(coalesce(favorites_visibility, 'public')) in ('public','members','private') then lower(coalesce(favorites_visibility, 'public'))
    else 'public'
  end,
  helper_completed_count = greatest(0, coalesce(helper_completed_count, 0)),
  helper_active_count = greatest(0, coalesce(helper_active_count, 0)),
  helper_reputation = greatest(0, coalesce(helper_reputation, 0)),
  preferred_language = case
    when lower(coalesce(preferred_language, 'es')) in ('auto','es','en','fr','de','it','pt') then lower(coalesce(preferred_language, 'es'))
    else 'es'
  end,
  updated_at = coalesce(updated_at, now())
where true;

alter table if exists public.users drop constraint if exists users_helper_completed_count_nonnegative;
alter table if exists public.users add constraint users_helper_completed_count_nonnegative
  check (helper_completed_count >= 0);

alter table if exists public.users drop constraint if exists users_helper_active_count_nonnegative;
alter table if exists public.users add constraint users_helper_active_count_nonnegative
  check (helper_active_count >= 0);

alter table if exists public.users drop constraint if exists users_helper_reputation_nonnegative;
alter table if exists public.users add constraint users_helper_reputation_nonnegative
  check (helper_reputation >= 0);

alter table if exists public.users drop constraint if exists users_preferred_language_check;
alter table if exists public.users add constraint users_preferred_language_check
  check (preferred_language in ('auto','es','en','fr','de','it','pt'));

create index if not exists idx_users_helper_completed_count on public.users(helper_completed_count desc);
create index if not exists idx_users_helper_reputation_desc on public.users(helper_reputation desc);
create index if not exists idx_users_preferred_language on public.users(preferred_language);

-- -----------------------------------------------------------------------------
-- USER USAGE METRICS: admin visibility
-- -----------------------------------------------------------------------------
drop policy if exists user_usage_sessions_admin_all on public.user_usage_sessions;
create policy user_usage_sessions_admin_all
  on public.user_usage_sessions
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists user_usage_daily_stats_admin_all on public.user_usage_daily_stats;
create policy user_usage_daily_stats_admin_all
  on public.user_usage_daily_stats
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

-- -----------------------------------------------------------------------------
-- ADMIN SETTINGS extras
-- -----------------------------------------------------------------------------
insert into public.admin_settings (key, value, description)
values
  ('retroville_launch_date', to_char((now() + interval '180 days')::date, 'YYYY-MM-DD'), 'Fecha editorial de lanzamiento de Retroville'),
  ('bing_site_verification', '', 'Meta tag de verificación para Bing Webmaster Tools'),
  ('brave_search_submission_url', 'https://search.brave.com/', 'Referencia rápida para alta en Brave Search')
on conflict (key) do update
set description = excluded.description,
    value = case when coalesce(public.admin_settings.value, '') = '' then excluded.value else public.admin_settings.value end,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- ORDERS: columnas modernas + history
-- -----------------------------------------------------------------------------
alter table if exists public.orders
  add column if not exists payment_status text default 'pending',
  add column if not exists payment_intent_id text,
  add column if not exists subtotal_cents integer default 0,
  add column if not exists shipping_cents integer default 0,
  add column if not exists discount_cents integer default 0,
  add column if not exists tax_cents integer default 0,
  add column if not exists total_cents integer default 0,
  add column if not exists billing_address jsonb,
  add column if not exists shipping_company text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists estimated_delivery timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists notes text;

update public.orders
set
  payment_status = case
    when lower(coalesce(payment_status, 'pending')) in ('pending','paid','failed','refunded') then lower(coalesce(payment_status, 'pending'))
    when lower(coalesce(status, 'pending')) = 'paid' then 'paid'
    else 'pending'
  end,
  subtotal_cents = greatest(0, coalesce(subtotal_cents, total, 0)),
  shipping_cents = greatest(0, coalesce(shipping_cents, shipping_cost, 0)),
  discount_cents = greatest(0, coalesce(discount_cents, coupon_discount, 0)),
  tax_cents = greatest(0, coalesce(tax_cents, 0)),
  total_cents = greatest(0, coalesce(total_cents, total, 0)),
  tracking_number = coalesce(tracking_number, shipping_tracking_code),
  updated_at = coalesce(updated_at, now())
where true;

alter table if exists public.orders drop constraint if exists orders_payment_status_check;
alter table if exists public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending','paid','failed','refunded'));

create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_payment_intent_id on public.orders(payment_intent_id);
create index if not exists idx_orders_tracking_number on public.orders(tracking_number);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order on public.order_status_history(order_id, created_at asc);

alter table if exists public.order_status_history enable row level security;
drop policy if exists order_status_history_admin_all on public.order_status_history;
create policy order_status_history_admin_all
  on public.order_status_history
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists order_status_history_own_read on public.order_status_history;
create policy order_status_history_own_read
  on public.order_status_history
  for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_status_history.order_id
        and o.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- PRODUCT REVIEWS table + visible seed into social reviews
-- -----------------------------------------------------------------------------
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  reviewer_name text not null,
  reviewer_avatar_url text,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null,
  verified_purchase boolean not null default false,
  helpful_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_reviews_product_time on public.product_reviews(product_id, created_at desc);
create index if not exists idx_product_reviews_user_time on public.product_reviews(user_id, created_at desc);

alter table if exists public.product_reviews enable row level security;
drop policy if exists product_reviews_public_read on public.product_reviews;
create policy product_reviews_public_read
  on public.product_reviews
  for select
  using (true);

drop policy if exists product_reviews_insert_authenticated on public.product_reviews;
create policy product_reviews_insert_authenticated
  on public.product_reviews
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists product_reviews_admin_all on public.product_reviews;
create policy product_reviews_admin_all
  on public.product_reviews
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

do $$
declare
  pid uuid;
  reviewer_names text[] := array['Carlos M.','Maria G.','Alejandro R.','Laura S.','Pablo T.','Ana C.','Diego F.','Sofia N.','Marcos V.','Elena B.','Javier L.','Claudia P.'];
  review_titles text[] := array['Muy buena compra','Estado mejor de lo esperado','Perfecto para coleccion','Buen producto retro','Llegó muy bien protegido','Recomendable si coleccionas','Buena pieza para vitrina'];
  review_bodies text[] := array[
    'Se nota que el artículo estaba revisado. Buen estado general y envío muy cuidado.',
    'Lo compré para completar colección y encaja muy bien con el resto del set. Bastante satisfecho.',
    'No es fácil encontrar este tipo de material retro con fotos honestas. La descripción se ajustaba bastante.',
    'Me recordó muchísimo a cuando jugaba en Game Boy y SNES. Pieza muy resultona para exponer.',
    'Llegó protegido, limpio y con sensación de producto tratado con cariño. Repetiría sin problema.',
    'Buen equilibrio entre precio y conservación. Para coleccionismo serio está bastante bien.',
    'Detalles correctos, impresión general positiva y muy buena presencia en mano.'
  ];
  idx integer;
  rating_value integer;
  reviewer_name text;
  review_title text;
  review_body text;
begin
  if to_regclass('public.product_social_reviews') is null then
    return;
  end if;

  for pid in
    select p.id
    from public.products p
    where coalesce(p.is_active, true) = true
    order by p.created_at desc nulls last
    limit 24
  loop
    for idx in 1..5 loop
      reviewer_name := reviewer_names[1 + ((idx + abs(('x' || substr(replace(pid::text, '-', ''), 1, 6))::bit(24)::int)) % array_length(reviewer_names, 1))];
      review_title := review_titles[1 + ((idx + 2) % array_length(review_titles, 1))];
      review_body := review_bodies[1 + ((idx + 3) % array_length(review_bodies, 1))];
      rating_value := case when idx % 5 = 0 then 3 when idx % 2 = 0 then 4 else 5 end;

      insert into public.product_social_reviews (
        product_id,
        user_id,
        visitor_key,
        author_name,
        rating,
        comment,
        photos,
        created_at,
        updated_at
      )
      values (
        pid,
        null,
        concat('master-seed-', pid::text, '-', idx::text),
        reviewer_name,
        rating_value,
        concat(review_title, '. ', review_body),
        '{}'::text[],
        now() - make_interval(days => (idx * 11) % 170),
        now() - make_interval(days => (idx * 11) % 170)
      )
      on conflict (product_id, visitor_key, rating, comment) do nothing;
    end loop;
  end loop;
end $$;

insert into public.product_social_summary (product_id, visits, likes_count, reviews_count, rating_average, updated_at)
select
  r.product_id,
  coalesce(pss.visits, 0),
  greatest(coalesce(pss.likes_count, 0), floor(count(*) * 0.6)::int),
  count(*)::int,
  round(avg(r.rating)::numeric, 2),
  now()
from public.product_social_reviews r
left join public.product_social_summary pss on pss.product_id = r.product_id
group by r.product_id, pss.visits, pss.likes_count
on conflict (product_id) do update
set
  visits = greatest(public.product_social_summary.visits, excluded.visits),
  likes_count = greatest(public.product_social_summary.likes_count, excluded.likes_count),
  reviews_count = greatest(public.product_social_summary.reviews_count, excluded.reviews_count),
  rating_average = excluded.rating_average,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- MYSTERY BOXES: estructura editorial nueva compatible con la existente
-- -----------------------------------------------------------------------------
alter table if exists public.mystery_boxes
  add column if not exists tier text,
  add column if not exists price_cents integer,
  add column if not exists image_url text,
  add column if not exists teaser text,
  add column if not exists contents_revealed jsonb,
  add column if not exists status text,
  add column if not exists items_count integer,
  add column if not exists estimated_value_cents integer,
  add column if not exists updated_at timestamptz,
  add column if not exists created_at timestamptz;

update public.mystery_boxes
set
  price_cents = greatest(0, coalesce(price_cents, ticket_price, 0)),
  image_url = coalesce(nullif(image_url, ''), nullif(image, ''), '/images/mystery/mystery-standard.webp'),
  teaser = coalesce(nullif(teaser, ''), description, ''),
  status = case when coalesce(is_active, true) then 'active' else 'draft' end,
  items_count = greatest(0, coalesce(items_count, 1)),
  estimated_value_cents = greatest(coalesce(price_cents, ticket_price, 0), coalesce(estimated_value_cents, 0)),
  tier = case
    when lower(coalesce(tier, slug, name, '')) like '%vip%' then 'vip'
    when lower(coalesce(tier, slug, name, '')) like '%premium%' then 'premium'
    else coalesce(nullif(tier, ''), 'standard')
  end,
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where true;

alter table if exists public.mystery_boxes drop constraint if exists mystery_boxes_tier_check;
alter table if exists public.mystery_boxes add constraint mystery_boxes_tier_check
  check (tier in ('standard','premium','vip'));

alter table if exists public.mystery_boxes drop constraint if exists mystery_boxes_status_editorial_check;
alter table if exists public.mystery_boxes add constraint mystery_boxes_status_editorial_check
  check (status in ('active','draft'));

create index if not exists idx_mystery_boxes_tier on public.mystery_boxes(tier);
create index if not exists idx_mystery_boxes_status on public.mystery_boxes(status);

insert into public.mystery_boxes (
  slug,
  name,
  description,
  ticket_price,
  price_cents,
  image,
  image_url,
  teaser,
  status,
  items_count,
  estimated_value_cents,
  tier,
  is_active,
  created_at,
  updated_at
)
values
  ('mystery-standard', 'Mystery Box Standard', 'Selección sorpresa de entrada con hardware y juegos retro curados.', 4900, 4900, '/images/mystery/mystery-standard.webp', '/images/mystery/mystery-standard.webp', 'Unboxing de acceso con piezas retro sorpresa.', 'active', 5, 6500, 'standard', true, now(), now()),
  ('mystery-premium', 'Mystery Box Premium', 'Caja premium con selección más rara y mejor ratio de valor.', 9900, 9900, '/images/mystery/mystery-premium.webp', '/images/mystery/mystery-premium.webp', 'Más rareza, más presencia en vitrina y premios curados.', 'active', 7, 14500, 'premium', true, now(), now()),
  ('mystery-vip', 'Mystery Box VIP', 'Experiencia VIP con hardware premium, piezas destacadas y valor de colección.', 19900, 19900, '/images/mystery/mystery-vip.webp', '/images/mystery/mystery-vip.webp', 'La caja editorial más alta, pensada para wow inmediato.', 'active', 9, 30000, 'vip', true, now(), now())
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  ticket_price = excluded.ticket_price,
  price_cents = excluded.price_cents,
  image = excluded.image,
  image_url = excluded.image_url,
  teaser = excluded.teaser,
  status = excluded.status,
  items_count = excluded.items_count,
  estimated_value_cents = excluded.estimated_value_cents,
  tier = excluded.tier,
  is_active = excluded.is_active,
  updated_at = now();

update public.mystery_boxes
set image = '/images/mystery/mystery-standard.webp', image_url = '/images/mystery/mystery-standard.webp', updated_at = now()
where tier = 'standard' or slug = 'mystery-standard';

update public.mystery_boxes
set image = '/images/mystery/mystery-premium.webp', image_url = '/images/mystery/mystery-premium.webp', updated_at = now()
where tier = 'premium' or slug = 'mystery-premium';

update public.mystery_boxes
set image = '/images/mystery/mystery-vip.webp', image_url = '/images/mystery/mystery-vip.webp', updated_at = now()
where tier = 'vip' or slug = 'mystery-vip';

create table if not exists public.mystery_box_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  box_id uuid not null references public.mystery_boxes(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  revealed_at timestamptz,
  revealed_items jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mystery_box_purchases_user on public.mystery_box_purchases(user_id, created_at desc);
create index if not exists idx_mystery_box_purchases_box on public.mystery_box_purchases(box_id, created_at desc);

alter table if exists public.mystery_box_purchases enable row level security;
drop policy if exists mystery_box_purchases_admin_all on public.mystery_box_purchases;
create policy mystery_box_purchases_admin_all
  on public.mystery_box_purchases
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists mystery_box_purchases_own_read on public.mystery_box_purchases;
create policy mystery_box_purchases_own_read
  on public.mystery_box_purchases
  for select
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- SUPPORT / CONCIERGE additive columns
-- -----------------------------------------------------------------------------
alter table if exists public.support_tickets
  add column if not exists ticket_type text default 'support',
  add column if not exists concierge_state text,
  add column if not exists helper_user_id uuid references public.users(id) on delete set null,
  add column if not exists helper_claimed_at timestamptz,
  add column if not exists helper_terms_accepted_at timestamptz,
  add column if not exists helper_inactive_deadline timestamptz,
  add column if not exists blocked_helper_ids uuid[] not null default '{}',
  add column if not exists preferred_helper_id uuid references public.users(id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists resolution_payload jsonb not null default '{}'::jsonb;

update public.support_tickets
set
  ticket_type = coalesce(ticket_type, 'support'),
  concierge_state = case
    when ticket_type = 'concierge' and helper_user_id is not null and status in ('resolved','closed') then 'completed'
    when ticket_type = 'concierge' and helper_user_id is not null then 'claimed'
    when ticket_type = 'concierge' then coalesce(concierge_state, 'open')
    else null
  end,
  blocked_helper_ids = coalesce(blocked_helper_ids, '{}'),
  resolution_payload = coalesce(resolution_payload, '{}'::jsonb),
  updated_at = coalesce(updated_at, now())
where true;

alter table if exists public.support_tickets drop constraint if exists support_tickets_ticket_type_check;
alter table if exists public.support_tickets add constraint support_tickets_ticket_type_check
  check (ticket_type in ('support','concierge'));

alter table if exists public.support_tickets drop constraint if exists support_tickets_concierge_state_check;
alter table if exists public.support_tickets add constraint support_tickets_concierge_state_check
  check (concierge_state is null or concierge_state in ('open','claimed','needs_reassign','completed','cancelled'));

alter table if exists public.support_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists expires_at timestamptz;

create index if not exists idx_support_tickets_ticket_type on public.support_tickets(ticket_type);
create index if not exists idx_support_tickets_concierge_state on public.support_tickets(concierge_state);
create index if not exists idx_support_messages_expires_at on public.support_messages(expires_at);

-- -----------------------------------------------------------------------------
-- PUBLIC / ADMIN RLS additions for core tables
-- -----------------------------------------------------------------------------
drop policy if exists products_admin_all on public.products;
create policy products_admin_all
  on public.products
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all
  on public.orders
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all
  on public.order_items
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists mystery_boxes_admin_all on public.mystery_boxes;
create policy mystery_boxes_admin_all
  on public.mystery_boxes
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists support_tickets_admin_everything on public.support_tickets;
create policy support_tickets_admin_everything
  on public.support_tickets
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists support_messages_admin_everything on public.support_messages;
create policy support_messages_admin_everything
  on public.support_messages
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auctions_admin_all on public.retro_storage_auctions;
create policy retro_storage_auctions_admin_all
  on public.retro_storage_auctions
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auction_hints_admin_all on public.retro_storage_auction_hints;
create policy retro_storage_auction_hints_admin_all
  on public.retro_storage_auction_hints
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auction_contents_admin_all on public.retro_storage_auction_contents;
create policy retro_storage_auction_contents_admin_all
  on public.retro_storage_auction_contents
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auction_bids_admin_all on public.retro_storage_auction_bids;
create policy retro_storage_auction_bids_admin_all
  on public.retro_storage_auction_bids
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auction_chat_messages_admin_all on public.retro_storage_auction_chat_messages;
create policy retro_storage_auction_chat_messages_admin_all
  on public.retro_storage_auction_chat_messages
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auction_reminders_admin_all on public.retro_storage_auction_reminders;
create policy retro_storage_auction_reminders_admin_all
  on public.retro_storage_auction_reminders
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auction_interest_admin_all on public.retro_storage_auction_interest;
create policy retro_storage_auction_interest_admin_all
  on public.retro_storage_auction_interest
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_auction_reports_admin_all on public.retro_storage_auction_reports;
create policy retro_storage_auction_reports_admin_all
  on public.retro_storage_auction_reports
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_storage_contracts_admin_all on public.retro_storage_storage_contracts;
create policy retro_storage_storage_contracts_admin_all
  on public.retro_storage_storage_contracts
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

drop policy if exists retro_storage_awards_admin_all on public.retro_storage_awards;
create policy retro_storage_awards_admin_all
  on public.retro_storage_awards
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

-- -----------------------------------------------------------------------------
-- RETROVILLE WAITLIST v3 + USER FAVORITES
-- -----------------------------------------------------------------------------
alter table if exists public.retroville_waitlist
  add column if not exists role_label text,
  add column if not exists source text not null default 'public';

update public.retroville_waitlist
set
  role_label = nullif(trim(coalesce(role_label, '')), ''),
  source = coalesce(nullif(trim(coalesce(source, '')), ''), 'public')
where true;

create index if not exists idx_retroville_waitlist_source on public.retroville_waitlist(source, created_at desc);

create table if not exists public.user_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists idx_user_favorites_created_at on public.user_favorites(created_at desc);
create index if not exists idx_user_favorites_product_id on public.user_favorites(product_id, created_at desc);

alter table if exists public.user_favorites enable row level security;

drop policy if exists user_favorites_own_all on public.user_favorites;
create policy user_favorites_own_all
  on public.user_favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_favorites_admin_all on public.user_favorites;
create policy user_favorites_admin_all
  on public.user_favorites
  for all
  using (public.is_current_admin())
  with check (public.is_current_admin());

insert into public.user_favorites (user_id, product_id, created_at)
select pl.user_id, pl.product_id, coalesce(pl.created_at, now())
from public.product_likes pl
where not exists (
  select 1
  from public.user_favorites uf
  where uf.user_id = pl.user_id
    and uf.product_id = pl.product_id
)
on conflict do nothing;

create or replace function public.sync_user_favorites_from_product_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.user_favorites (user_id, product_id, created_at)
    values (new.user_id, new.product_id, coalesce(new.created_at, now()))
    on conflict (user_id, product_id) do nothing;
    return new;
  end if;

  if tg_op = 'DELETE' then
    delete from public.user_favorites
    where user_id = old.user_id
      and product_id = old.product_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_user_favorites_from_product_likes on public.product_likes;
create trigger sync_user_favorites_from_product_likes
  after insert or delete on public.product_likes
  for each row execute procedure public.sync_user_favorites_from_product_likes();

comment on table public.future_launches is 'Tabla legacy sin uso actual en frontend público. Se conserva por compatibilidad histórica.';

-- -----------------------------------------------------------------------------
-- Realtime publication
-- -----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.user_sessions;
  exception when duplicate_object then null; when undefined_object then null; end;
  begin
    alter publication supabase_realtime add table public.error_logs;
  exception when duplicate_object then null; when undefined_object then null; end;
  begin
    alter publication supabase_realtime add table public.page_views;
  exception when duplicate_object then null; when undefined_object then null; end;
  begin
    alter publication supabase_realtime add table public.retro_storage_auction_bids;
  exception when duplicate_object then null; when undefined_object then null; end;
  begin
    alter publication supabase_realtime add table public.retro_storage_auction_chat_messages;
  exception when duplicate_object then null; when undefined_object then null; end;
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then null; when undefined_object then null; end;
end $$;

notify pgrst, 'reload schema';
