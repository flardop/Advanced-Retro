-- =============================================================================
-- SECURITY HARDENING (RLS) - PUBLIC TABLES
-- Corrige avisos de "RLS Disabled in Public" en Supabase Security Advisor
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Habilitar RLS en tablas principales (solo si existen)
-- -----------------------------------------------------------------------------
alter table if exists public.users enable row level security;
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

-- Extras (si ya los has ejecutado)
alter table if exists public.support_tickets enable row level security;
alter table if exists public.support_messages enable row level security;
alter table if exists public.user_product_listings enable row level security;
alter table if exists public.community_posts enable row level security;
alter table if exists public.user_wallet_accounts enable row level security;
alter table if exists public.user_wallet_transactions enable row level security;
alter table if exists public.user_wallet_withdrawal_requests enable row level security;

-- -----------------------------------------------------------------------------
-- USERS (perfil propio)
-- -----------------------------------------------------------------------------
drop policy if exists "users own read" on public.users;
create policy "users own read"
on public.users for select
using (auth.uid() = id);

drop policy if exists "users own update" on public.users;
create policy "users own update"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- PRODUCTS (lectura pública catálogo)
-- Si existe columna is_active, solo muestra activos; si no, lectura pública total.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'is_active'
  ) then
    execute 'drop policy if exists "products public read" on public.products';
    execute $sql$
      create policy "products public read"
      on public.products for select
      using (coalesce(is_active, true) = true)
    $sql$;
  elsif exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'products'
  ) then
    execute 'drop policy if exists "products public read" on public.products';
    execute $sql$
      create policy "products public read"
      on public.products for select
      using (true)
    $sql$;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- ORDERS + ORDER ITEMS (lectura solo del propietario)
-- -----------------------------------------------------------------------------
drop policy if exists "orders own read" on public.orders;
create policy "orders own read"
on public.orders for select
using (auth.uid() = user_id);

drop policy if exists "order items own read" on public.order_items;
create policy "order items own read"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- ROULETTE_CONFIG legacy (si existe, lectura pública)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'roulette_config'
  ) then
    execute 'drop policy if exists "roulette config public read" on public.roulette_config';
    execute $sql$
      create policy "roulette config public read"
      on public.roulette_config for select
      using (true)
    $sql$;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- COUPONS + REDEMPTIONS (solo propietario)
-- -----------------------------------------------------------------------------
drop policy if exists "coupons own read" on public.coupons;
create policy "coupons own read"
on public.coupons for select
using (auth.uid() = user_id);

drop policy if exists "coupon redemptions own read" on public.coupon_redemptions;
create policy "coupon redemptions own read"
on public.coupon_redemptions for select
using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- MYSTERY BOXES / PREMIOS (lectura pública) + TICKETS / SPINS (propietario)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- SOPORTE / MARKETPLACE COMUNIDAD (si existen)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'support_tickets'
  ) then
    execute 'drop policy if exists "tickets own read" on public.support_tickets';
    execute 'drop policy if exists "tickets own insert" on public.support_tickets';
    execute $sql$
      create policy "tickets own read"
      on public.support_tickets for select
      using (auth.uid() = user_id)
    $sql$;
    execute $sql$
      create policy "tickets own insert"
      on public.support_tickets for insert
      with check (auth.uid() = user_id)
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'support_messages'
  ) then
    execute 'drop policy if exists "messages own read" on public.support_messages';
    execute 'drop policy if exists "messages own insert" on public.support_messages';
    execute $sql$
      create policy "messages own read"
      on public.support_messages for select
      using (
        exists (
          select 1
          from public.support_tickets t
          where t.id = ticket_id
            and t.user_id = auth.uid()
        )
      )
    $sql$;
    execute $sql$
      create policy "messages own insert"
      on public.support_messages for insert
      with check (
        exists (
          select 1
          from public.support_tickets t
          where t.id = ticket_id
            and t.user_id = auth.uid()
        )
      )
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_product_listings'
  ) then
    execute 'drop policy if exists "listings own read" on public.user_product_listings';
    execute 'drop policy if exists "listings own insert" on public.user_product_listings';
    execute 'drop policy if exists "listings own update" on public.user_product_listings';
    execute 'drop policy if exists "listings public approved read" on public.user_product_listings';
    execute $sql$
      create policy "listings own read"
      on public.user_product_listings for select
      using (auth.uid() = user_id)
    $sql$;
    execute $sql$
      create policy "listings public approved read"
      on public.user_product_listings for select
      using (status = 'approved')
    $sql$;
    execute $sql$
      create policy "listings own insert"
      on public.user_product_listings for insert
      with check (auth.uid() = user_id)
    $sql$;
    execute $sql$
      create policy "listings own update"
      on public.user_product_listings for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'community_posts'
  ) then
    execute 'drop policy if exists "community posts public read" on public.community_posts';
    execute 'drop policy if exists "community posts own insert" on public.community_posts';
    execute $sql$
      create policy "community posts public read"
      on public.community_posts for select
      using (true)
    $sql$;
    execute $sql$
      create policy "community posts own insert"
      on public.community_posts for insert
      with check (auth.uid() = user_id)
    $sql$;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- CARTERA INTERNA (si existe)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_wallet_accounts'
  ) then
    execute 'drop policy if exists "wallet account own read" on public.user_wallet_accounts';
    execute $sql$
      create policy "wallet account own read"
      on public.user_wallet_accounts for select
      using (auth.uid() = user_id)
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_wallet_transactions'
  ) then
    execute 'drop policy if exists "wallet tx own read" on public.user_wallet_transactions';
    execute $sql$
      create policy "wallet tx own read"
      on public.user_wallet_transactions for select
      using (auth.uid() = user_id)
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_wallet_withdrawal_requests'
  ) then
    execute 'drop policy if exists "wallet withdrawals own read" on public.user_wallet_withdrawal_requests';
    execute 'drop policy if exists "wallet withdrawals own insert" on public.user_wallet_withdrawal_requests';
    execute 'drop policy if exists "wallet withdrawals own update" on public.user_wallet_withdrawal_requests';
    execute $sql$
      create policy "wallet withdrawals own read"
      on public.user_wallet_withdrawal_requests for select
      using (auth.uid() = user_id)
    $sql$;
    execute $sql$
      create policy "wallet withdrawals own insert"
      on public.user_wallet_withdrawal_requests for insert
      with check (auth.uid() = user_id)
    $sql$;
    execute $sql$
      create policy "wallet withdrawals own update"
      on public.user_wallet_withdrawal_requests for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)
    $sql$;
  end if;
end $$;

-- Fuerza recarga schema cache PostgREST
notify pgrst, 'reload schema';
