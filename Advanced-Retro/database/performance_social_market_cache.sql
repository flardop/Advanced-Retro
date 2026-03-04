-- =============================================================================
-- PERFORMANCE PATCH: social summary + market snapshot cache
-- Ejecutar en Supabase SQL Editor (idempotente).
-- =============================================================================

create table if not exists public.product_social_summary (
  product_id uuid primary key references public.products(id) on delete cascade,
  visits integer not null default 0,
  likes_count integer not null default 0,
  reviews_count integer not null default 0,
  rating_average numeric(4,2) not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_social_summary_visits
  on public.product_social_summary(visits desc);
create index if not exists idx_product_social_summary_likes
  on public.product_social_summary(likes_count desc);
create index if not exists idx_product_social_summary_updated
  on public.product_social_summary(updated_at desc);

create table if not exists public.product_social_visits (
  product_id uuid not null references public.products(id) on delete cascade,
  visitor_key text not null,
  visits_count integer not null default 0,
  last_visit_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, visitor_key)
);

create index if not exists idx_product_social_visits_product
  on public.product_social_visits(product_id);
create index if not exists idx_product_social_visits_last
  on public.product_social_visits(last_visit_at desc);

create table if not exists public.product_social_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  visitor_key text not null,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, visitor_key, rating, comment)
);

create index if not exists idx_product_social_reviews_product_time
  on public.product_social_reviews(product_id, created_at desc);
create index if not exists idx_product_social_reviews_user
  on public.product_social_reviews(user_id, created_at desc);

alter table if exists public.product_social_summary enable row level security;
alter table if exists public.product_social_visits enable row level security;
alter table if exists public.product_social_reviews enable row level security;

drop policy if exists "product_social_summary_public_read" on public.product_social_summary;
create policy "product_social_summary_public_read"
on public.product_social_summary
for select
using (true);

drop policy if exists "product_social_reviews_public_read" on public.product_social_reviews;
create policy "product_social_reviews_public_read"
on public.product_social_reviews
for select
using (true);

-- Cache de mercado (si no existe aún)
create table if not exists public.product_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  provider text not null check (provider in ('ebay','pricecharting','manual')),
  marketplace_id text,
  query text,
  currency text,
  sample_size integer not null default 0,
  total_results integer not null default 0,
  min_price_cents integer,
  median_price_cents integer,
  average_price_cents integer,
  max_price_cents integer,
  payload jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now()
);

create index if not exists idx_market_snapshots_product_time
  on public.product_market_snapshots(product_id, collected_at desc);
create index if not exists idx_market_snapshots_provider
  on public.product_market_snapshots(provider, collected_at desc);

-- Métricas de rendimiento API (para dashboard admin)
create table if not exists public.api_performance_events (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  method text not null,
  status_code integer not null check (status_code between 100 and 599),
  duration_ms integer not null check (duration_ms >= 0),
  cache_hit boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_perf_created
  on public.api_performance_events(created_at desc);
create index if not exists idx_api_perf_endpoint_method
  on public.api_performance_events(endpoint, method, created_at desc);
create index if not exists idx_api_perf_status
  on public.api_performance_events(status_code, created_at desc);
create index if not exists idx_api_perf_cache
  on public.api_performance_events(cache_hit, created_at desc);

alter table if exists public.api_performance_events enable row level security;

notify pgrst, 'reload schema';
