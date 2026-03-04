-- =============================================================================
-- NORMALIZAR INSERTS A FORMATO GENERICO POR PLATAFORMA
-- Objetivo:
--   - Evitar "Insert <nombre del juego>"
--   - Dejar inserts universales por plataforma
--   - Mantener visible solo el insert generico de cada plataforma
--
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================

alter table if exists public.products add column if not exists component_type text;
alter table if exists public.products add column if not exists edition text;
alter table if exists public.products add column if not exists platform text;

-- Marca como insert cualquier producto legacy por nombre.
update public.products
set
  component_type = 'insert',
  updated_at = now()
where component_type is distinct from 'insert'
  and (
    lower(coalesce(name, '')) like '%insert%'
    or lower(coalesce(name, '')) like '%inlay%'
    or lower(coalesce(name, '')) like '%interior%'
  );

-- Intenta inferir plataforma en inserts legacy si faltaba.
update public.products
set
  platform = case
    when lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%game boy advance%'
      or lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%gba%'
      then 'game-boy-advance'
    when lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%game boy color%'
      or lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%gbc%'
      then 'game-boy-color'
    when lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%super nintendo%'
      or lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%snes%'
      then 'super-nintendo'
    when lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%gamecube%'
      then 'gamecube'
    when lower(coalesce(name, '') || ' ' || coalesce(description, '')) like '%game boy%'
      then 'game-boy'
    else coalesce(platform, 'retro')
  end,
  updated_at = now()
where component_type = 'insert'
  and (platform is null or trim(platform) = '');

-- Upsert inserts genericos por plataforma.
with payload(name, description, price, image, category, stock, component_type, edition, platform) as (
  values
    ('Insert Game Boy', 'Insert interior universal para juegos/cajas Game Boy.', 300, '/images/components/gameboy-insert.svg', 'accesorios', 120, 'insert', 'sin-especificar', 'game-boy'),
    ('Insert Game Boy Color', 'Insert interior universal para juegos/cajas Game Boy Color.', 300, '/images/components/gbc-insert.svg', 'accesorios', 100, 'insert', 'sin-especificar', 'game-boy-color'),
    ('Insert Game Boy Advance', 'Insert interior universal para juegos/cajas Game Boy Advance.', 300, '/images/components/gba-insert.svg', 'accesorios', 100, 'insert', 'sin-especificar', 'game-boy-advance'),
    ('Insert Super Nintendo', 'Insert interior universal para cajas Super Nintendo.', 400, '/images/components/snes-insert.svg', 'accesorios', 80, 'insert', 'sin-especificar', 'super-nintendo'),
    ('Insert GameCube', 'Insert interior universal para cajas GameCube.', 400, '/images/components/gamecube-insert.svg', 'accesorios', 80, 'insert', 'sin-especificar', 'gamecube')
)
update public.products p
set
  description = x.description,
  price = x.price,
  image = x.image,
  images = array[x.image],
  category = x.category,
  stock = greatest(coalesce(p.stock, 0), x.stock),
  component_type = x.component_type,
  edition = x.edition,
  platform = x.platform,
  updated_at = now()
from payload x
where lower(p.name) = lower(x.name);

with payload(name, description, price, image, category, stock, component_type, edition, platform) as (
  values
    ('Insert Game Boy', 'Insert interior universal para juegos/cajas Game Boy.', 300, '/images/components/gameboy-insert.svg', 'accesorios', 120, 'insert', 'sin-especificar', 'game-boy'),
    ('Insert Game Boy Color', 'Insert interior universal para juegos/cajas Game Boy Color.', 300, '/images/components/gbc-insert.svg', 'accesorios', 100, 'insert', 'sin-especificar', 'game-boy-color'),
    ('Insert Game Boy Advance', 'Insert interior universal para juegos/cajas Game Boy Advance.', 300, '/images/components/gba-insert.svg', 'accesorios', 100, 'insert', 'sin-especificar', 'game-boy-advance'),
    ('Insert Super Nintendo', 'Insert interior universal para cajas Super Nintendo.', 400, '/images/components/snes-insert.svg', 'accesorios', 80, 'insert', 'sin-especificar', 'super-nintendo'),
    ('Insert GameCube', 'Insert interior universal para cajas GameCube.', 400, '/images/components/gamecube-insert.svg', 'accesorios', 80, 'insert', 'sin-especificar', 'gamecube')
)
insert into public.products (
  name,
  description,
  price,
  image,
  images,
  category,
  stock,
  component_type,
  edition,
  platform,
  is_mystery_box,
  created_at,
  updated_at
)
select
  x.name,
  x.description,
  x.price,
  x.image,
  array[x.image],
  x.category,
  x.stock,
  x.component_type,
  x.edition,
  x.platform,
  false,
  now(),
  now()
from payload x
where not exists (
  select 1
  from public.products p
  where lower(p.name) = lower(x.name)
);

-- Oculta inserts legacy por juego (no genericos): se dejan con stock 0 para
-- que no se ofrezcan como opción comprable.
update public.products
set
  stock = 0,
  updated_at = now()
where component_type = 'insert'
  and lower(coalesce(name, '')) not in (
    'insert game boy',
    'insert game boy color',
    'insert game boy advance',
    'insert super nintendo',
    'insert gamecube'
  );

notify pgrst, 'reload schema';

