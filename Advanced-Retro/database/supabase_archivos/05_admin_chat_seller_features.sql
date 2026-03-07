-- =========================================================
-- ADMIN + CHAT + SELLER FEATURES
-- Ejecutar en Supabase SQL Editor
-- =========================================================

alter table users add column if not exists bio text;
alter table users add column if not exists is_verified_seller boolean not null default false;
alter table users add column if not exists updated_at timestamptz default now();

create index if not exists idx_users_verified_seller on users(is_verified_seller);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_support_tickets_user on support_tickets(user_id);
create index if not exists idx_support_tickets_order on support_tickets(order_id);
create index if not exists idx_support_tickets_status on support_tickets(status);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  is_admin boolean not null default false,
  message text not null,
  created_at timestamptz default now()
);

create index if not exists idx_support_messages_ticket on support_messages(ticket_id, created_at desc);

create table if not exists user_product_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text not null,
  price integer not null check (price > 0),
  category text not null default 'juegos-gameboy',
  condition text not null default 'used',
  originality_status text not null check (originality_status in ('original_verificado', 'original_sin_verificar', 'repro_1_1', 'mixto')),
  originality_notes text,
  images text[] not null default '{}',
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_user_product_listings_user on user_product_listings(user_id);
create index if not exists idx_user_product_listings_status on user_product_listings(status);

alter table support_tickets enable row level security;
alter table support_messages enable row level security;
alter table user_product_listings enable row level security;

create policy if not exists "tickets own read"
on support_tickets for select
using (auth.uid() = user_id);

create policy if not exists "tickets own insert"
on support_tickets for insert
with check (auth.uid() = user_id);

create policy if not exists "messages own read"
on support_messages for select
using (
  exists (
    select 1 from support_tickets t
    where t.id = ticket_id and t.user_id = auth.uid()
  )
);

create policy if not exists "messages own insert"
on support_messages for insert
with check (
  exists (
    select 1 from support_tickets t
    where t.id = ticket_id and t.user_id = auth.uid()
  )
);

create policy if not exists "listings own read"
on user_product_listings for select
using (auth.uid() = user_id);

create policy if not exists "listings own insert"
on user_product_listings for insert
with check (auth.uid() = user_id);

create policy if not exists "listings own update"
on user_product_listings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
