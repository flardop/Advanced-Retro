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
