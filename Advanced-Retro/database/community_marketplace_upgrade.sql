-- =============================================================================
-- COMMUNITY MARKETPLACE UPGRADE
-- Ejecutar en Supabase SQL Editor
-- Objetivo:
--   - Publicación de comunidad a 0€
--   - Comisión fija del 10%
--   - Estado y seguimiento de entrega con email comprador opcional
-- =============================================================================

alter table if exists user_product_listings
  add column if not exists listing_fee_cents integer not null default 0,
  add column if not exists commission_rate numeric(5,2) not null default 10.00,
  add column if not exists commission_cents integer not null default 0,
  add column if not exists approved_at timestamptz,
  add column if not exists buyer_email text,
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists shipping_carrier text,
  add column if not exists shipping_tracking_code text,
  add column if not exists shipping_notes text,
  add column if not exists delivered_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_product_listings_delivery_status_check'
  ) then
    alter table user_product_listings
      add constraint user_product_listings_delivery_status_check
      check (delivery_status in ('pending','processing','shipped','delivered','cancelled')) not valid;
  end if;
end $$;

create index if not exists idx_user_product_listings_delivery_status on user_product_listings(delivery_status);
create index if not exists idx_user_product_listings_buyer_email on user_product_listings(buyer_email);

update user_product_listings
set
  listing_fee_cents = 0,
  commission_rate = coalesce(commission_rate, 10.00),
  commission_cents = round(price * (coalesce(commission_rate, 10.00) / 100.0))::integer,
  delivery_status = coalesce(nullif(delivery_status, ''), 'pending')
where true;
