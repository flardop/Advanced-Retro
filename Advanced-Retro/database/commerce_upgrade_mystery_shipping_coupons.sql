-- =============================================================================
-- COMMERCE UPGRADE: mystery boxes + tickets + coupons + shipping + product parts
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- -----------------------------------------------------------------------------
-- PRODUCTS: metadata para juego completo por componentes y variantes
-- -----------------------------------------------------------------------------
alter table if exists products
  add column if not exists category text,
  add column if not exists component_type text,
  add column if not exists edition text,
  add column if not exists collection_key text,
  add column if not exists platform text,
  add column if not exists is_active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_component_type_check'
  ) then
    alter table products
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
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_edition_check'
  ) then
    alter table products
      add constraint products_edition_check
      check (
        edition is null
        or edition in ('original', 'repro', 'sin-especificar')
      ) not valid;
  end if;
end $$;

create index if not exists idx_products_collection_key on products(collection_key);
create index if not exists idx_products_component_type on products(component_type);
create index if not exists idx_products_platform on products(platform);

-- Relleno inicial por defecto en esquemas legacy
update products
set component_type = coalesce(component_type, 'full_game')
where component_type is null;

update products
set edition = coalesce(edition, 'sin-especificar')
where edition is null;

-- -----------------------------------------------------------------------------
-- ORDERS: envío, cupón aplicado y soporte de mystery tickets
-- -----------------------------------------------------------------------------
alter table if exists orders
  add column if not exists shipping_address jsonb,
  add column if not exists shipping_method text,
  add column if not exists shipping_cost integer not null default 0,
  add column if not exists shipping_tracking_code text,
  add column if not exists shipping_label_generated_at timestamptz,
  add column if not exists coupon_id uuid,
  add column if not exists coupon_code text,
  add column if not exists coupon_discount integer not null default 0,
  add column if not exists mystery_box_id uuid,
  add column if not exists mystery_ticket_units integer not null default 0,
  add column if not exists paid_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- -----------------------------------------------------------------------------
-- COUPONS
-- -----------------------------------------------------------------------------
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'fixed', 'free_order')),
  value integer not null default 0,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  active boolean not null default true,
  user_id uuid references users(id) on delete set null,
  created_by_user_id uuid references users(id) on delete set null,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_coupons_code on coupons(code);
create index if not exists idx_coupons_user_id on coupons(user_id);
create index if not exists idx_coupons_active on coupons(active);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  order_id uuid not null references orders(id) on delete cascade,
  amount_discount integer not null default 0,
  created_at timestamptz default now(),
  unique (coupon_id, order_id)
);

create index if not exists idx_coupon_redemptions_coupon on coupon_redemptions(coupon_id);
create index if not exists idx_coupon_redemptions_order on coupon_redemptions(order_id);

-- FK tardía para no romper tablas legacy con datos previos
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_coupon_id_fkey'
  ) then
    alter table orders
      add constraint orders_coupon_id_fkey
      foreign key (coupon_id) references coupons(id) on delete set null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- MYSTERY BOXES + TICKETS + SPINS
-- -----------------------------------------------------------------------------
create table if not exists mystery_boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  ticket_price integer not null check (ticket_price > 0),
  image text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists mystery_box_prizes (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references mystery_boxes(id) on delete cascade,
  label text not null,
  prize_type text not null check (prize_type in ('physical_product', 'discount_coupon', 'other')),
  probability numeric not null check (probability >= 0),
  stock integer,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_mystery_prizes_box on mystery_box_prizes(box_id);
create index if not exists idx_mystery_prizes_active on mystery_box_prizes(is_active);

create table if not exists mystery_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  box_id uuid not null references mystery_boxes(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  quantity_total integer not null check (quantity_total > 0),
  quantity_used integer not null default 0 check (quantity_used >= 0),
  status text not null default 'active' check (status in ('active', 'used', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_mystery_tickets_user_box on mystery_tickets(user_id, box_id);
create index if not exists idx_mystery_tickets_status on mystery_tickets(status);

create table if not exists mystery_spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  box_id uuid not null references mystery_boxes(id) on delete cascade,
  ticket_id uuid references mystery_tickets(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  prize_id uuid references mystery_box_prizes(id) on delete set null,
  prize_label text not null,
  coupon_id uuid references coupons(id) on delete set null,
  status text not null default 'won' check (status in ('won', 'redeemed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  redeemed_at timestamptz
);

create index if not exists idx_mystery_spins_user on mystery_spins(user_id, created_at desc);
create index if not exists idx_mystery_spins_box on mystery_spins(box_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_mystery_box_id_fkey'
  ) then
    alter table orders
      add constraint orders_mystery_box_id_fkey
      foreign key (mystery_box_id) references mystery_boxes(id) on delete set null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- COMMUNITY POSTS (mini blog dentro de la web)
-- -----------------------------------------------------------------------------
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  content text not null,
  images text[] not null default '{}',
  likes_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_community_posts_created on community_posts(created_at desc);
create index if not exists idx_community_posts_user on community_posts(user_id);

-- -----------------------------------------------------------------------------
-- RLS (solo lectura pública de cajas/premios activos)
-- -----------------------------------------------------------------------------
alter table if exists mystery_boxes enable row level security;
alter table if exists mystery_box_prizes enable row level security;
alter table if exists mystery_tickets enable row level security;
alter table if exists mystery_spins enable row level security;
alter table if exists coupons enable row level security;
alter table if exists coupon_redemptions enable row level security;
alter table if exists community_posts enable row level security;

create policy if not exists "mystery boxes public read"
on mystery_boxes for select
using (is_active = true);

create policy if not exists "mystery prizes public read"
on mystery_box_prizes for select
using (is_active = true);

create policy if not exists "mystery tickets own read"
on mystery_tickets for select
using (auth.uid() = user_id);

create policy if not exists "mystery spins own read"
on mystery_spins for select
using (auth.uid() = user_id);

create policy if not exists "coupons own read"
on coupons for select
using (user_id is null or auth.uid() = user_id);

create policy if not exists "coupon redemptions own read"
on coupon_redemptions for select
using (auth.uid() = user_id);

create policy if not exists "community posts public read"
on community_posts for select
using (true);

create policy if not exists "community posts own insert"
on community_posts for insert
with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- SEED inicial: Mystery Box 5€ con rarezas casi imposibles
-- -----------------------------------------------------------------------------
insert into mystery_boxes (name, slug, description, ticket_price, image, is_active)
values (
  'Mystery Box 5€',
  'mystery-box-5',
  'Tirada de 5€ con premios sorpresa. Rarezas extremas y descuentos especiales.',
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
  select id from mystery_boxes where slug = 'mystery-box-5' limit 1
)
insert into mystery_box_prizes (box_id, label, prize_type, probability, stock, metadata, is_active)
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
  from mystery_box_prizes p
  where p.box_id = box.id and p.label = payload.label
);

-- -----------------------------------------------------------------------------
-- Query de ayuda para detectar duplicados por nombre normalizado
-- -----------------------------------------------------------------------------
create or replace view product_duplicate_candidates as
select
  regexp_replace(lower(unaccent(name)), '[^a-z0-9]+', ' ', 'g') as normalized_name,
  coalesce(category, '') as category_legacy,
  coalesce(component_type, 'full_game') as component_type,
  coalesce(edition, 'sin-especificar') as edition,
  count(*) as duplicates,
  array_agg(id order by created_at asc) as product_ids
from products
group by 1,2,3,4
having count(*) > 1;
