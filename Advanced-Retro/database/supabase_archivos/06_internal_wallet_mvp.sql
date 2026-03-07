-- =========================================================
-- INTERNAL WALLET MVP (saldo interno / cartera)
-- Ejecutar en Supabase SQL Editor
-- =========================================================

create table if not exists user_wallet_accounts (
  user_id uuid primary key references users(id) on delete cascade,
  balance_cents integer not null default 0 check (balance_cents >= 0),
  pending_cents integer not null default 0 check (pending_cents >= 0),
  total_earned_cents integer not null default 0 check (total_earned_cents >= 0),
  total_withdrawn_cents integer not null default 0 check (total_withdrawn_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  direction text not null check (direction in ('credit', 'debit')),
  status text not null check (status in ('pending', 'available', 'spent', 'cancelled')),
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
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_user_created
  on user_wallet_transactions(user_id, created_at desc);

create index if not exists idx_wallet_transactions_kind
  on user_wallet_transactions(kind);

create unique index if not exists idx_wallet_tx_reference_unique
  on user_wallet_transactions(user_id, kind, reference_type, reference_id)
  where reference_type is not null and reference_id is not null;

-- Inicializa carteras para usuarios existentes (opcional, seguro)
insert into user_wallet_accounts (user_id)
select u.id
from users u
where not exists (
  select 1 from user_wallet_accounts w where w.user_id = u.id
);
