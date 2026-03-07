-- =============================================================================
-- DEMO SEED: comunidad marketplace (perfiles + anuncios + reseñas)
-- -----------------------------------------------------------------------------
-- IMPORTANTE:
-- - Este script genera datos DEMO para que la web no se vea vacía en pruebas.
-- - No usar para simular actividad real de clientes.
-- - Es idempotente: evita duplicados en reseñas/anuncios por claves de control.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists unaccent;

with raw_feedback as (
  select *
  from (
    values
      ('jurritd', 21, 5, 'Goede koper'),
      ('enhteaunie', 30, 2, 'produit non conformes a la description'),
      ('bob030279', 30, 4, '👍🏾'),
      ('augustincoy6', 30, 5, 'parfait'),
      ('paloma5665', 30, 5, 'excelente'),
      ('denisisiis', 60, 5, 'good packaging fair price'),
      ('axel.eln', 60, 5, 'Nickel'),
      ('Vinted', 60, 4, 'Valoración automática: Venta completada con éxito'),
      ('jac12566', 60, 4, '👍'),
      ('cimencam', 60, 5, '5/5'),
      ('marecelachi', 60, 4, 'bien'),
      ('mcc1979', 60, 4, 'MT boa'),
      ('dalia280286', 60, 5, 'Muy bien nuevo'),
      ('Vinted', 60, 4, 'Valoración automática: Venta completada con éxito'),
      ('phil.66', 60, 4, '👍'),
      ('rosemariemartos', 90, 4, 'bien gracias'),
      ('cristinaballestero', 90, 4, 'bien'),
      ('kachslim', 90, 5, 'perfecto 👌'),
      ('brigi18', 90, 5, 'Todo bien!!!👍😉'),
      ('luisac.prado', 90, 5, 'Todo bien')
  ) as t(author_name, days_ago, rating, comment)
),
feedback as (
  select
    row_number() over (order by author_name, comment) as rn,
    trim(author_name) as author_name,
    greatest(1, least(5, rating))::smallint as rating,
    trim(comment) as comment,
    greatest(1, days_ago)::int as days_ago,
    nullif(
      regexp_replace(lower(unaccent(trim(author_name))), '[^a-z0-9]+', '', 'g'),
      ''
    ) as safe_slug
  from raw_feedback
),
seed_users_source as (
  select
    author_name,
    coalesce(safe_slug, 'collector' || rn::text) as safe_slug,
    min(days_ago) as days_ago
  from feedback
  group by author_name, coalesce(safe_slug, 'collector' || rn::text)
),
upsert_users as (
  insert into public.users (
    id,
    email,
    name,
    role,
    bio,
    tagline,
    favorite_console,
    profile_theme,
    badges,
    is_verified_seller,
    created_at,
    updated_at
  )
  select
    coalesce(
      (select u.id from public.users u where lower(u.email) = lower(s.safe_slug || '.demo@advancedretro.local') limit 1),
      gen_random_uuid()
    ),
    lower(s.safe_slug || '.demo@advancedretro.local'),
    s.author_name,
    'user',
    'Perfil demo de comunidad para pruebas visuales y QA.',
    'Coleccionista demo',
    'Game Boy',
    'neon-grid',
    array['demo_profile'],
    case when lower(s.author_name) = 'vinted' then false else true end,
    now() - make_interval(days => s.days_ago::int),
    now()
  from seed_users_source s
  on conflict (email) do update
  set
    name = excluded.name,
    bio = excluded.bio,
    tagline = excluded.tagline,
    favorite_console = excluded.favorite_console,
    profile_theme = excluded.profile_theme,
    badges = array(select distinct unnest(coalesce(public.users.badges, '{}') || excluded.badges)),
    updated_at = now()
  returning id, email, name
),
all_seed_users as (
  select u.id, u.email, u.name
  from public.users u
  join seed_users_source s
    on lower(u.email) = lower(s.safe_slug || '.demo@advancedretro.local')
),
product_pool as (
  select
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    p.category as category,
    coalesce(nullif(p.images[1], ''), nullif(p.image, ''), '/logo.png') as image_url,
    row_number() over (order by p.updated_at desc nulls last, p.created_at desc nulls last, p.id) as rn,
    count(*) over () as total_count
  from public.products p
  where coalesce(p.stock, 0) > 0
    and coalesce(p.is_mystery_box, false) = false
),
mapped_reviews as (
  select
    f.rn,
    f.author_name,
    f.rating,
    f.comment,
    f.days_ago,
    ('demo-review-' || f.rn::text || '-' || coalesce(f.safe_slug, 'collector')) as visitor_key,
    pp.product_id,
    su.id as user_id,
    now() - make_interval(
      days => f.days_ago::int,
      hours => ((f.rn * 3) % 20)::int
    ) as created_at
  from feedback f
  join product_pool pp
    on pp.rn = (((f.rn - 1) % nullif(pp.total_count, 0)) + 1)
  left join all_seed_users su
    on lower(su.name) = lower(f.author_name)
),
ins_reviews as (
  insert into public.product_social_reviews (
    product_id,
    user_id,
    visitor_key,
    author_name,
    rating,
    comment,
    photos,
    created_at,
    updated_at
  )
  select
    r.product_id,
    r.user_id,
    r.visitor_key,
    r.author_name,
    r.rating,
    r.comment,
    '{}'::text[],
    r.created_at,
    r.created_at
  from mapped_reviews r
  on conflict (product_id, visitor_key, rating, comment) do nothing
  returning product_id
),
seller_pool as (
  select
    u.id as user_id,
    u.name as seller_name,
    row_number() over (order by u.name) as rn
  from all_seed_users u
  where lower(u.name) <> 'vinted'
),
mapped_listings as (
  select
    s.user_id,
    s.seller_name,
    pp.product_id,
    pp.product_name,
    pp.category,
    pp.image_url,
    greatest(
      100,
      round(coalesce(pp.product_price, 2900)::numeric * (0.85 + ((s.rn % 4)::numeric * 0.08)))
    )::int as listing_price,
    now() - make_interval(days => ((s.rn * 4) % 28)::int) as created_at,
    case
      when (s.rn % 4) = 0 then 'restored'
      when (s.rn % 3) = 0 then 'new'
      else 'used'
    end as listing_condition,
    case
      when (s.rn % 4) = 0 then 'original_verificado'
      when (s.rn % 3) = 0 then 'repro_1_1'
      when (s.rn % 2) = 0 then 'original_sin_verificar'
      else 'mixto'
    end as originality_status,
    case
      when (s.rn % 3) = 0 then 'processing'
      when (s.rn % 5) = 0 then 'shipped'
      else 'pending'
    end as delivery_status
  from seller_pool s
  join product_pool pp
    on pp.rn = (((s.rn - 1) % nullif(pp.total_count, 0)) + 1)
),
ins_listings as (
  insert into public.user_product_listings (
    id,
    user_id,
    title,
    description,
    price,
    category,
    condition,
    originality_status,
    originality_notes,
    images,
    status,
    listing_fee_cents,
    commission_rate,
    commission_cents,
    approved_at,
    delivery_status,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    ml.user_id,
    ml.product_name || ' · Comunidad',
    'Anuncio demo: producto revisado visualmente para pruebas del marketplace. Estado y precio orientativos.',
    ml.listing_price,
    coalesce(nullif(ml.category, ''), 'juegos-gameboy'),
    ml.listing_condition,
    ml.originality_status,
    'Dato demo para validación de interfaz de comunidad.',
    array[ml.image_url]::text[],
    'approved',
    0,
    5.00,
    round(ml.listing_price * 0.05)::int,
    ml.created_at,
    ml.delivery_status,
    ml.created_at,
    now()
  from mapped_listings ml
  where not exists (
    select 1
    from public.user_product_listings x
    where x.user_id = ml.user_id
      and x.title = ml.product_name || ' · Comunidad'
  )
  returning id, user_id
),
touched_products as (
  select distinct product_id from mapped_reviews
),
review_agg as (
  select
    r.product_id,
    count(*)::int as reviews_count,
    round(avg(r.rating)::numeric, 2) as rating_average
  from public.product_social_reviews r
  where r.product_id in (select product_id from touched_products)
  group by r.product_id
),
visit_seed as (
  select
    pp.product_id,
    ('demo-visit-' || pp.rn::text || '-' || gs.n::text) as visitor_key,
    (1 + ((pp.rn + gs.n) % 4))::int as visits_count,
    now() - make_interval(days => ((pp.rn + gs.n) % 26)::int) as visit_at
  from product_pool pp
  cross join lateral generate_series(1, 8) as gs(n)
),
ins_visits as (
  insert into public.product_social_visits (
    product_id,
    visitor_key,
    visits_count,
    last_visit_at,
    created_at,
    updated_at
  )
  select
    v.product_id,
    v.visitor_key,
    v.visits_count,
    v.visit_at,
    v.visit_at,
    now()
  from visit_seed v
  on conflict (product_id, visitor_key) do update
  set
    visits_count = greatest(public.product_social_visits.visits_count, excluded.visits_count),
    last_visit_at = greatest(public.product_social_visits.last_visit_at, excluded.last_visit_at),
    updated_at = now()
  returning product_id
),
visit_agg as (
  select
    v.product_id,
    coalesce(sum(v.visits_count), 0)::int as visits_count
  from public.product_social_visits v
  where v.product_id in (select product_id from touched_products)
  group by v.product_id
),
summary_payload as (
  select
    tp.product_id,
    coalesce(va.visits_count, 0) as visits,
    greatest(0, round(coalesce(ra.reviews_count, 0) * 0.62)::int) as likes_count,
    coalesce(ra.reviews_count, 0) as reviews_count,
    coalesce(ra.rating_average, 0)::numeric(4,2) as rating_average
  from touched_products tp
  left join review_agg ra on ra.product_id = tp.product_id
  left join visit_agg va on va.product_id = tp.product_id
),
upsert_summary as (
  insert into public.product_social_summary (
    product_id,
    visits,
    likes_count,
    reviews_count,
    rating_average,
    updated_at
  )
  select
    s.product_id,
    s.visits,
    s.likes_count,
    s.reviews_count,
    s.rating_average,
    now()
  from summary_payload s
  on conflict (product_id) do update
  set
    visits = greatest(public.product_social_summary.visits, excluded.visits),
    likes_count = greatest(public.product_social_summary.likes_count, excluded.likes_count),
    reviews_count = greatest(public.product_social_summary.reviews_count, excluded.reviews_count),
    rating_average = case
      when excluded.reviews_count >= public.product_social_summary.reviews_count then excluded.rating_average
      else public.product_social_summary.rating_average
    end,
    updated_at = now()
  returning product_id
)
select json_build_object(
  'demo_users_upserted', (select count(*) from upsert_users),
  'demo_reviews_inserted', (select count(*) from ins_reviews),
  'demo_listings_inserted', (select count(*) from ins_listings),
  'demo_visits_seeded', (select count(*) from ins_visits),
  'summary_rows_updated', (select count(*) from upsert_summary)
) as demo_seed_result;

