-- =============================================================================
-- SECURITY ADVISOR FIX (RLS) · 2026-03
-- Proyecto: Advanced Retro
-- Objetivo: cerrar avisos "RLS Disabled in Public" sin romper catálogo público.
-- =============================================================================

-- 1) Activar RLS en TODAS las tablas del schema public (si existe alguna nueva)
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- 2) Políticas mínimas para lectura pública del catálogo (evita romper /api/catalog/public en fallback anon)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'products'
  ) then
    execute 'drop policy if exists "products public read" on public.products';

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'products' and column_name = 'status'
    ) then
      execute $p$
        create policy "products public read"
        on public.products for select
        using (coalesce(status, 'active') <> 'archived')
      $p$;
    else
      execute $p$
        create policy "products public read"
        on public.products for select
        using (true)
      $p$;
    end if;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'categories'
  ) then
    execute 'drop policy if exists "categories public read" on public.categories';
    execute $p$
      create policy "categories public read"
      on public.categories for select
      using (true)
    $p$;
  end if;
end $$;

-- 3) Políticas de propietario para tablas sensibles (si existen)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'users'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'id'
  ) then
    execute 'drop policy if exists "users own read" on public.users';
    execute 'drop policy if exists "users own update" on public.users';
    execute $p$
      create policy "users own read"
      on public.users for select
      using (auth.uid() = id)
    $p$;
    execute $p$
      create policy "users own update"
      on public.users for update
      using (auth.uid() = id)
      with check (auth.uid() = id)
    $p$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'orders'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'user_id'
  ) then
    execute 'drop policy if exists "orders own read" on public.orders';
    execute $p$
      create policy "orders own read"
      on public.orders for select
      using (auth.uid() = user_id)
    $p$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'mystery_tickets'
  ) then
    execute 'drop policy if exists "mystery tickets own read" on public.mystery_tickets';
    execute $p$
      create policy "mystery tickets own read"
      on public.mystery_tickets for select
      using (auth.uid() = user_id)
    $p$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'mystery_spins'
  ) then
    execute 'drop policy if exists "mystery spins own read" on public.mystery_spins';
    execute $p$
      create policy "mystery spins own read"
      on public.mystery_spins for select
      using (auth.uid() = user_id)
    $p$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'coupons'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'user_id'
  ) then
    execute 'drop policy if exists "coupons own read" on public.coupons';
    execute $p$
      create policy "coupons own read"
      on public.coupons for select
      using (auth.uid() = user_id)
    $p$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'support_tickets'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'support_tickets' and column_name = 'user_id'
  ) then
    execute 'drop policy if exists "tickets own read" on public.support_tickets';
    execute 'drop policy if exists "tickets own insert" on public.support_tickets';
    execute $p$
      create policy "tickets own read"
      on public.support_tickets for select
      using (auth.uid() = user_id)
    $p$;
    execute $p$
      create policy "tickets own insert"
      on public.support_tickets for insert
      with check (auth.uid() = user_id)
    $p$;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_product_listings'
  ) then
    execute 'drop policy if exists "listings public approved read" on public.user_product_listings';
    execute 'drop policy if exists "listings own read" on public.user_product_listings';
    execute 'drop policy if exists "listings own insert" on public.user_product_listings';
    execute 'drop policy if exists "listings own update" on public.user_product_listings';

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'user_product_listings' and column_name = 'status'
    ) then
      execute $p$
        create policy "listings public approved read"
        on public.user_product_listings for select
        using (status = 'approved')
      $p$;
    else
      execute $p$
        create policy "listings public approved read"
        on public.user_product_listings for select
        using (true)
      $p$;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'user_product_listings' and column_name = 'user_id'
    ) then
      execute $p$
        create policy "listings own read"
        on public.user_product_listings for select
        using (auth.uid() = user_id)
      $p$;
      execute $p$
        create policy "listings own insert"
        on public.user_product_listings for insert
        with check (auth.uid() = user_id)
      $p$;
      execute $p$
        create policy "listings own update"
        on public.user_product_listings for update
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id)
      $p$;
    end if;
  end if;
end $$;

-- 4) Recarga de schema cache PostgREST
notify pgrst, 'reload schema';

-- 5) Checks finales (debe quedar disabled_rls_tables = 0)
with public_tables as (
  select schemaname, tablename, rowsecurity
  from pg_tables
  where schemaname = 'public'
),
policy_count as (
  select schemaname, tablename, count(*)::int as policies
  from pg_policies
  where schemaname = 'public'
  group by 1,2
)
select
  (select count(*) from public_tables where rowsecurity = false) as disabled_rls_tables,
  (select count(*) from public_tables) as total_public_tables,
  (select count(*) from policy_count) as tables_with_policies,
  case
    when (select count(*) from public_tables where rowsecurity = false) = 0
      then 'OK: RLS activado en todas las tablas public'
    else 'ERROR: quedan tablas public con RLS desactivado'
  end as status;

-- Listado de tablas con RLS desactivado (debe salir vacío)
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false
order by tablename;
