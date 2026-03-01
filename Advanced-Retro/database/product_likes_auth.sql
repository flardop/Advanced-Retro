-- Likes por usuario autenticado para productos
create extension if not exists pgcrypto;

create table if not exists public.product_likes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists idx_product_likes_product_id on public.product_likes(product_id);
create index if not exists idx_product_likes_user_id on public.product_likes(user_id);

alter table public.product_likes enable row level security;

drop policy if exists "product_likes_select_all" on public.product_likes;
create policy "product_likes_select_all"
on public.product_likes
for select
using (true);

drop policy if exists "product_likes_insert_own" on public.product_likes;
create policy "product_likes_insert_own"
on public.product_likes
for insert
with check (auth.uid() = user_id);

drop policy if exists "product_likes_delete_own" on public.product_likes;
create policy "product_likes_delete_own"
on public.product_likes
for delete
using (auth.uid() = user_id);
