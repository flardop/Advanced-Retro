-- Retro Storage Auctions
-- Base SQL para mover el MVP de storage JSON a tablas PostgreSQL/Supabase.

create extension if not exists pgcrypto;

create table if not exists public.retro_storage_auctions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  teaser text not null default '',
  category text not null,
  warehouse_code text not null unique,
  rarity_label text not null default 'Curado',
  image_url text not null,
  preview_mode text not null check (preview_mode in ('blur', 'partial', 'clear')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'closed', 'revealed', 'cancelled')),
  transparency_note text not null default '',
  legal_note text not null default '',
  guaranteed_minimum text not null default '',
  minimum_estimated_value_cents integer not null default 0,
  starting_bid_cents integer not null default 0,
  current_bid_cents integer not null default 0,
  min_increment_cents integer not null default 100,
  extension_window_seconds integer not null default 120,
  extension_by_seconds integer not null default 90,
  rent_fee_cents_per_month integer,
  rent_grace_days integer,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  extended_until timestamptz,
  revealed_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  current_winner_user_id uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auctions_status_idx
  on public.retro_storage_auctions(status, starts_at, ends_at);

create table if not exists public.retro_storage_auction_hints (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  detail text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_hints_auction_idx
  on public.retro_storage_auction_hints(auction_id, sort_order);

create table if not exists public.retro_storage_auction_contents (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  label text not null,
  item_type text not null check (item_type in ('console', 'game', 'accessory', 'collectible', 'document')),
  condition_label text not null default 'Bueno',
  estimated_value_cents integer not null default 0,
  verified boolean not null default false,
  marketplace_ready boolean not null default false,
  is_guaranteed boolean not null default false,
  is_hidden_until_reveal boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_contents_auction_idx
  on public.retro_storage_auction_contents(auction_id, is_hidden_until_reveal);

create table if not exists public.retro_storage_auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'accepted' check (status in ('accepted', 'rejected', 'cancelled')),
  source text not null default 'web',
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_bids_auction_idx
  on public.retro_storage_auction_bids(auction_id, amount_cents desc, created_at desc);

create index if not exists retro_storage_auction_bids_user_idx
  on public.retro_storage_auction_bids(user_id, created_at desc);

create table if not exists public.retro_storage_auction_chat_messages (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  kind text not null default 'message' check (kind in ('message', 'reaction')),
  moderation_state text not null default 'visible' check (moderation_state in ('visible', 'hidden', 'flagged')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_auction_chat_messages_auction_idx
  on public.retro_storage_auction_chat_messages(auction_id, created_at desc);

create table if not exists public.retro_storage_auction_reminders (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  channel text not null default 'onsite' check (channel in ('onsite', 'email', 'push')),
  last_notified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (auction_id, user_id, channel)
);

create index if not exists retro_storage_auction_reminders_user_idx
  on public.retro_storage_auction_reminders(user_id, created_at desc);

create table if not exists public.retro_storage_auction_interest (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('buy', 'rent')),
  state text not null default 'requested' check (state in ('requested', 'reviewing', 'approved', 'rejected', 'converted')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (auction_id, user_id, action)
);

create index if not exists retro_storage_auction_interest_auction_idx
  on public.retro_storage_auction_interest(auction_id, action, created_at desc);

create table if not exists public.retro_storage_auction_reports (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  chat_message_id uuid not null references public.retro_storage_auction_chat_messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  state text not null default 'open' check (state in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create index if not exists retro_storage_auction_reports_state_idx
  on public.retro_storage_auction_reports(state, created_at desc);

create table if not exists public.retro_storage_storage_contracts (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid references public.retro_storage_auctions(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  award_id uuid,
  monthly_fee_cents integer not null default 0,
  grace_days integer not null default 0,
  status text not null default 'active' check (status in ('active', 'grace', 'expired', 'transferred', 'cancelled')),
  started_at timestamptz not null default timezone('utc', now()),
  next_billing_at timestamptz,
  expires_at timestamptz,
  transferred_to_advanced_retro_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists retro_storage_storage_contracts_user_idx
  on public.retro_storage_storage_contracts(user_id, status, next_billing_at);

create table if not exists public.retro_storage_awards (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.retro_storage_auctions(id) on delete cascade,
  winner_user_id uuid not null references public.users(id) on delete cascade,
  winning_bid_id uuid references public.retro_storage_auction_bids(id) on delete set null,
  total_paid_cents integer not null default 0,
  assignment_state text not null default 'pending' check (assignment_state in ('pending', 'assigned', 'listed', 'stored', 'cancelled')),
  assigned_to_profile_at timestamptz,
  converted_to_marketplace_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists retro_storage_awards_auction_unique
  on public.retro_storage_awards(auction_id);

alter table public.retro_storage_auctions enable row level security;
alter table public.retro_storage_auction_hints enable row level security;
alter table public.retro_storage_auction_contents enable row level security;
alter table public.retro_storage_auction_bids enable row level security;
alter table public.retro_storage_auction_chat_messages enable row level security;
alter table public.retro_storage_auction_reminders enable row level security;
alter table public.retro_storage_auction_interest enable row level security;
alter table public.retro_storage_auction_reports enable row level security;
alter table public.retro_storage_storage_contracts enable row level security;
alter table public.retro_storage_awards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auctions' and policyname = 'retro_storage_auctions_public_read'
  ) then
    create policy retro_storage_auctions_public_read
      on public.retro_storage_auctions
      for select
      using (status in ('scheduled', 'live', 'closed', 'revealed'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_hints' and policyname = 'retro_storage_auction_hints_public_read'
  ) then
    create policy retro_storage_auction_hints_public_read
      on public.retro_storage_auction_hints
      for select
      using (
        exists (
          select 1
          from public.retro_storage_auctions rsa
          where rsa.id = auction_id
            and rsa.status in ('scheduled', 'live', 'closed', 'revealed')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_contents' and policyname = 'retro_storage_auction_contents_public_read'
  ) then
    create policy retro_storage_auction_contents_public_read
      on public.retro_storage_auction_contents
      for select
      using (
        exists (
          select 1
          from public.retro_storage_auctions rsa
          where rsa.id = auction_id
            and (
              rsa.status in ('revealed')
              or coalesce(is_hidden_until_reveal, false) = false
            )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_bids' and policyname = 'retro_storage_auction_bids_user_write'
  ) then
    create policy retro_storage_auction_bids_user_write
      on public.retro_storage_auction_bids
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_chat_messages' and policyname = 'retro_storage_auction_chat_user_write'
  ) then
    create policy retro_storage_auction_chat_user_write
      on public.retro_storage_auction_chat_messages
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_chat_messages' and policyname = 'retro_storage_auction_chat_public_read'
  ) then
    create policy retro_storage_auction_chat_public_read
      on public.retro_storage_auction_chat_messages
      for select
      using (
        moderation_state = 'visible'
        and exists (
          select 1
          from public.retro_storage_auctions rsa
          where rsa.id = auction_id
            and rsa.status in ('live', 'closed', 'revealed')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_reminders' and policyname = 'retro_storage_auction_reminders_user_self'
  ) then
    create policy retro_storage_auction_reminders_user_self
      on public.retro_storage_auction_reminders
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_interest' and policyname = 'retro_storage_auction_interest_user_self'
  ) then
    create policy retro_storage_auction_interest_user_self
      on public.retro_storage_auction_interest
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_auction_reports' and policyname = 'retro_storage_auction_reports_user_self'
  ) then
    create policy retro_storage_auction_reports_user_self
      on public.retro_storage_auction_reports
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_awards' and policyname = 'retro_storage_awards_user_read'
  ) then
    create policy retro_storage_awards_user_read
      on public.retro_storage_awards
      for select
      to authenticated
      using (auth.uid() = winner_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'retro_storage_storage_contracts' and policyname = 'retro_storage_storage_contracts_user_read'
  ) then
    create policy retro_storage_storage_contracts_user_read
      on public.retro_storage_storage_contracts
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
