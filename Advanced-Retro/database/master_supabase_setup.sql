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
-- 1) Snapshots de mercado (eBay/otros) para histórico real de línea
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

-- 2) Filtros guardados admin
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

-- 3) Auditoría admin
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

-- 4) Analytics propios (complemento GA)
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

-- 5) Cola simple de notificaciones
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

-- 6) Gamificación XP / niveles
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

alter table if exists public.product_market_snapshots enable row level security;
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
    ('product_market_snapshots', 'Histórico mercado')
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
