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

notify pgrst, 'reload schema';

