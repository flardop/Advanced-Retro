-- =============================================================================
-- MYSTERY ROULETTE BOOTSTRAP (mínimo)
-- Ejecuta este archivo completo en Supabase SQL Editor.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Ajustes de orders para tickets mystery y cupones
-- -----------------------------------------------------------------------------
alter table if exists orders
  add column if not exists coupon_id uuid,
  add column if not exists coupon_code text,
  add column if not exists coupon_discount integer not null default 0,
  add column if not exists mystery_box_id uuid,
  add column if not exists mystery_ticket_units integer not null default 0,
  add column if not exists paid_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- -----------------------------------------------------------------------------
-- CUPONES
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
-- MYSTERY BOXES + PREMIOS + TICKETS + TIRADAS
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
-- Seed inicial de ruleta (5€) con probabilidades configuradas
-- -----------------------------------------------------------------------------
insert into mystery_boxes (name, slug, description, ticket_price, image, is_active)
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

-- Fuerza recarga de schema cache para PostgREST
notify pgrst, 'reload schema';
