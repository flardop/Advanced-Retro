-- =========================================================
-- WALLET WITHDRAWALS MVP (solicitudes de retirada)
-- Requiere ejecutar antes: database/internal_wallet_mvp.sql
-- Ejecutar en Supabase SQL Editor
-- =========================================================

create table if not exists user_wallet_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'paid', 'cancelled')
  ),
  payout_method text not null default 'manual_transfer',
  payout_details jsonb not null default '{}'::jsonb,
  note text,
  admin_note text,
  wallet_transaction_id uuid references user_wallet_transactions(id) on delete set null,
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wallet_withdrawals_user_created
  on user_wallet_withdrawal_requests(user_id, created_at desc);

create index if not exists idx_wallet_withdrawals_status
  on user_wallet_withdrawal_requests(status, created_at desc);

create index if not exists idx_wallet_withdrawals_tx
  on user_wallet_withdrawal_requests(wallet_transaction_id);

alter table if exists user_wallet_withdrawal_requests enable row level security;

drop policy if exists "wallet withdrawals own read" on user_wallet_withdrawal_requests;
create policy "wallet withdrawals own read"
on user_wallet_withdrawal_requests for select
using (auth.uid() = user_id);

drop policy if exists "wallet withdrawals own insert" on user_wallet_withdrawal_requests;
create policy "wallet withdrawals own insert"
on user_wallet_withdrawal_requests for insert
with check (auth.uid() = user_id);

drop policy if exists "wallet withdrawals own update" on user_wallet_withdrawal_requests;
create policy "wallet withdrawals own update"
on user_wallet_withdrawal_requests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
