-- =============================================================================
-- Seed inicial de actividad social (usuarios + reseñas + métricas)
-- -----------------------------------------------------------------------------
-- Uso recomendado:
-- 1) Ejecutar en Supabase SQL Editor.
-- 2) Después recargar la web.
--
-- Nota:
-- - Este seed crea actividad inicial para evitar "tienda vacía".
-- - Está pensado como arranque de comunidad, no como sustituto de actividad real.
-- =============================================================================

create extension if not exists pgcrypto;

alter table if exists public.users add column if not exists level integer default 1;
alter table if exists public.users add column if not exists xp_total integer default 0;
alter table if exists public.users add column if not exists xp_updated_at timestamptz default now();
alter table if exists public.users add column if not exists profile_theme text default 'neon-grid';
alter table if exists public.users add column if not exists is_verified_seller boolean default false;

-- -----------------------------------------------------------------------------
-- 1) Perfiles semilla (avatares + banners)
-- -----------------------------------------------------------------------------
with seed_profiles as (
  select *
  from (
    values
      ('seed.alex@advancedretro.es', 'Alex Molina', 'Colecciono portátiles clásicas y ediciones PAL.', 'Siempre cazando joyas ocultas', 'Game Boy', 'https://randomuser.me/api/portraits/men/11.jpg', 'https://picsum.photos/seed/ar-banner-01/1400/420'),
      ('seed.marta@advancedretro.es', 'Marta Rivas', 'Me centro en cajas originales y manuales en muy buen estado.', 'Fan del cartón bien cuidado', 'Game Boy Color', 'https://randomuser.me/api/portraits/women/12.jpg', 'https://picsum.photos/seed/ar-banner-02/1400/420'),
      ('seed.saul@advancedretro.es', 'Saúl Romero', 'Busco completos y protectores premium para vitrina.', 'Completo o nada', 'GameCube', 'https://randomuser.me/api/portraits/men/13.jpg', 'https://picsum.photos/seed/ar-banner-03/1400/420'),
      ('seed.ines@advancedretro.es', 'Inés Beltrán', 'Colección temática Nintendo portátil desde hace años.', 'Portátiles retro forever', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/14.jpg', 'https://picsum.photos/seed/ar-banner-04/1400/420'),
      ('seed.erik@advancedretro.es', 'Erik Sanz', 'Comparo estado, serigrafía y calidad de impresión.', 'Detalles por encima de todo', 'Super Nintendo', 'https://randomuser.me/api/portraits/men/15.jpg', 'https://picsum.photos/seed/ar-banner-05/1400/420'),
      ('seed.laura@advancedretro.es', 'Laura Peña', 'Mi prioridad: juegos clásicos listos para jugar.', 'Retro para jugar, no solo mirar', 'Game Boy', 'https://randomuser.me/api/portraits/women/16.jpg', 'https://picsum.photos/seed/ar-banner-06/1400/420'),
      ('seed.dani@advancedretro.es', 'Dani Cortés', 'Valoro mucho el estado del manual y el insert.', 'Manual + insert = felicidad', 'Game Boy Color', 'https://randomuser.me/api/portraits/men/17.jpg', 'https://picsum.photos/seed/ar-banner-07/1400/420'),
      ('seed.noa@advancedretro.es', 'Noa Campos', 'Compro para colección y también para regalo.', 'Regalos retro con historia', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/18.jpg', 'https://picsum.photos/seed/ar-banner-08/1400/420'),
      ('seed.raul@advancedretro.es', 'Raúl Navarro', 'Me gustan las ediciones especiales y packs completos.', 'Cazador de ediciones raras', 'GameCube', 'https://randomuser.me/api/portraits/men/19.jpg', 'https://picsum.photos/seed/ar-banner-09/1400/420'),
      ('seed.sara@advancedretro.es', 'Sara Vidal', 'Sigo de cerca precios y cambios de mercado.', 'Seguimiento diario de precios', 'Super Nintendo', 'https://randomuser.me/api/portraits/women/20.jpg', 'https://picsum.photos/seed/ar-banner-10/1400/420'),
      ('seed.oscar@advancedretro.es', 'Óscar Gil', 'Coleccionista de RPG y catálogo clásico de Nintendo.', 'RPG retro en vitrina', 'Game Boy', 'https://randomuser.me/api/portraits/men/21.jpg', 'https://picsum.photos/seed/ar-banner-11/1400/420'),
      ('seed.clara@advancedretro.es', 'Clara Nieto', 'Me fijo en conservación real y transparencia del vendedor.', 'Estado real primero', 'Game Boy Color', 'https://randomuser.me/api/portraits/women/22.jpg', 'https://picsum.photos/seed/ar-banner-12/1400/420'),
      ('seed.jorge@advancedretro.es', 'Jorge Peralta', 'Juego y colecciono, equilibrio entre valor y disfrute.', 'Retro práctico', 'GameCube', 'https://randomuser.me/api/portraits/men/23.jpg', 'https://picsum.photos/seed/ar-banner-13/1400/420'),
      ('seed.alba@advancedretro.es', 'Alba Serrano', 'Me interesan cajas repro para completar sets incompletos.', 'Completar colección sin drama', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/24.jpg', 'https://picsum.photos/seed/ar-banner-14/1400/420'),
      ('seed.miguel@advancedretro.es', 'Miguel Reyes', 'Suelo comprar lotes de clásicos para restauración ligera.', 'Restauración y mimo', 'Super Nintendo', 'https://randomuser.me/api/portraits/men/25.jpg', 'https://picsum.photos/seed/ar-banner-15/1400/420'),
      ('seed.irene@advancedretro.es', 'Irene Lozano', 'Me encantan las portadas en estado impecable.', 'Portadas y arte original', 'Game Boy', 'https://randomuser.me/api/portraits/women/26.jpg', 'https://picsum.photos/seed/ar-banner-16/1400/420'),
      ('seed.hugo@advancedretro.es', 'Hugo León', 'Veo esta tienda como punto fijo para retro serio.', 'Calidad estable', 'Game Boy Color', 'https://randomuser.me/api/portraits/men/27.jpg', 'https://picsum.photos/seed/ar-banner-17/1400/420'),
      ('seed.vera@advancedretro.es', 'Vera Salas', 'Busco producto probado y envío rápido.', 'Rapidez + cuidado', 'Game Boy Advance', 'https://randomuser.me/api/portraits/women/28.jpg', 'https://picsum.photos/seed/ar-banner-18/1400/420')
  ) as t(email, name, bio, tagline, favorite_console, avatar_url, banner_url)
),
upserted_users as (
  insert into public.users (
    id,
    email,
    name,
    role,
    avatar_url,
    banner_url,
    bio,
    tagline,
    favorite_console,
    is_verified_seller,
    profile_theme,
    level,
    xp_total,
    xp_updated_at,
    created_at,
    updated_at
  )
  select
    coalesce((select u.id from public.users u where u.email = p.email), gen_random_uuid()),
    p.email,
    p.name,
    'user',
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.tagline,
    p.favorite_console,
    true,
    'neon-grid',
    2 + (row_number() over (order by p.email) % 7),
    180 + (row_number() over (order by p.email) * 35),
    now(),
    now() - make_interval(days => 30 + (row_number() over (order by p.email) % 40)),
    now()
  from seed_profiles p
  on conflict (email) do update
  set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    banner_url = excluded.banner_url,
    bio = excluded.bio,
    tagline = excluded.tagline,
    favorite_console = excluded.favorite_console,
    is_verified_seller = true,
    updated_at = now()
  returning id, email, name
),
target_products as (
  select
    p.id as product_id,
    p.name as product_name,
    coalesce(p.is_mystery_box, false) as is_mystery_box,
    row_number() over (order by p.updated_at desc nulls last, p.created_at desc nulls last, p.id) as rn
  from public.products p
  where coalesce(p.stock, 0) > 0
    and p.category in (
      'juegos-gameboy',
      'juegos-gameboy-color',
      'juegos-gameboy-advance',
      'juegos-super-nintendo',
      'juegos-gamecube',
      'cajas-misteriosas'
    )
  limit 24
),
review_templates as (
  select *
  from (
    values
      (1, 5, 'Muy buen estado general. Llegó bien protegido y coincide con la descripción.'),
      (2, 5, 'Compra fácil y envío rápido. Para colección queda perfecto.'),
      (3, 4, 'Producto correcto y buena comunicación. Repetiría compra sin problema.'),
      (4, 5, 'Sorprende el cuidado en los detalles, especialmente caja/manual.'),
      (5, 4, 'Relación calidad-precio bastante buena para como está el mercado.'),
      (6, 5, 'Se nota revisión previa. Todo funcionando y limpio.'),
      (7, 3, 'Tardó un poco más de lo esperado, pero el artículo llegó bien.'),
      (8, 4, 'Buena opción para completar colección sin complicaciones.'),
      (9, 5, 'Muy satisfecho con la compra, estado mejor de lo que esperaba.'),
      (10, 4, 'Descripción honesta y fotos útiles, eso se agradece mucho.')
  ) as t(idx, rating, comment)
),
user_pool as (
  select
    u.id as user_id,
    u.name as author_name,
    row_number() over (order by u.email) as rn
  from upserted_users u
),
review_rows as (
  select
    tp.product_id,
    up.user_id,
    ('seed-review-' || tp.rn || '-' || up.rn || '-' || rt.idx) as visitor_key,
    up.author_name,
    rt.rating,
    rt.comment,
    now() - make_interval(days => ((tp.rn * 3 + up.rn + rt.idx) % 50), hours => ((rt.idx * 2 + up.rn) % 20)) as created_at
  from target_products tp
  join user_pool up
    on ((tp.rn + up.rn) % 5) = 0
  join review_templates rt
    on ((rt.idx + tp.rn + up.rn) % 3) = 0
  where
    (tp.is_mystery_box and rt.idx <= 6)
    or (not tp.is_mystery_box and rt.idx <= 8)
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
  from review_rows r
  on conflict (product_id, visitor_key, rating, comment) do nothing
  returning product_id
),
visit_seed as (
  select
    tp.product_id,
    ('seed-visit-' || tp.rn || '-' || gs.n) as visitor_key,
    (2 + ((tp.rn + gs.n) % 5)) as visits_count,
    now() - make_interval(days => ((tp.rn + gs.n) % 35)) as visit_at
  from target_products tp
  cross join lateral generate_series(1, 16) as gs(n)
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
touched_products as (
  select distinct product_id from target_products
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
    greatest(0, round(coalesce(ra.reviews_count, 0) * 0.65)::int) as likes_count,
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
    sp.product_id,
    sp.visits,
    sp.likes_count,
    sp.reviews_count,
    sp.rating_average,
    now()
  from summary_payload sp
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
  'seed_users', (select count(*) from upserted_users),
  'target_products', (select count(*) from touched_products),
  'inserted_reviews', (select count(*) from ins_reviews),
  'seeded_visits', (select count(*) from ins_visits),
  'updated_summary_rows', (select count(*) from upsert_summary)
) as seed_result;

