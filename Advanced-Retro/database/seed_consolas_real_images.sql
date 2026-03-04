-- =============================================================================
-- SEED CONSOLAS + HARDWARE (IMAGEN REAL LOCAL)
-- Ejecuta este script en Supabase SQL Editor.
-- Usa imágenes servidas desde /public/images/products.
-- =============================================================================

alter table if exists public.products add column if not exists category text;
alter table if exists public.products add column if not exists image text;
alter table if exists public.products add column if not exists images text[];
alter table if exists public.products add column if not exists component_type text;
alter table if exists public.products add column if not exists edition text;
alter table if exists public.products add column if not exists platform text;

with payload(name, description, price, image, category, stock, component_type, edition, platform) as (
  values
    (
      'Consola Game Boy DMG-01',
      'Consola clásica revisada y lista para colección.',
      11999,
      '/images/products/console-gb-dmg.jpg',
      'consolas-retro',
      4,
      'full_game',
      'original',
      'game-boy'
    ),
    (
      'Consola Game Boy Color',
      'Consola Game Boy Color funcional y revisada.',
      12999,
      '/images/products/console-gbc.jpg',
      'consolas-retro',
      3,
      'full_game',
      'original',
      'game-boy-color'
    ),
    (
      'Consola Game Boy Advance',
      'Consola Game Boy Advance en buen estado.',
      13999,
      '/images/products/console-gba.jpg',
      'consolas-retro',
      3,
      'full_game',
      'original',
      'game-boy-advance'
    ),
    (
      'Consola Super Nintendo PAL',
      'Consola Super Nintendo PAL con test de funcionamiento.',
      14999,
      '/images/products/console-snes-pal.jpg',
      'consolas-retro',
      2,
      'full_game',
      'original',
      'super-nintendo'
    ),
    (
      'Consola Nintendo GameCube',
      'Nintendo GameCube revisada para uso y coleccionismo.',
      15999,
      '/images/products/console-gamecube.jpg',
      'consolas-retro',
      2,
      'full_game',
      'original',
      'gamecube'
    ),
    (
      'Caja consola Game Boy original',
      'Caja suelta de consola Game Boy.',
      3999,
      '/images/products/console-box-gb.jpg',
      'consolas-retro',
      5,
      'caja',
      'sin-especificar',
      'game-boy'
    ),
    (
      'Manual consola Game Boy',
      'Manual de instrucciones de consola Game Boy.',
      1999,
      '/images/products/console-manual-gb.jpg',
      'manuales',
      10,
      'manual',
      'sin-especificar',
      'game-boy'
    ),
    (
      'Protector consola Game Boy (universal)',
      'Protector universal de caja para productos Game Boy.',
      350,
      '/images/products/console-protector-universal.jpg',
      'accesorios',
      60,
      'protector_caja',
      'sin-especificar',
      'game-boy'
    ),
    (
      'Insert consola Game Boy (universal)',
      'Insert interior universal para juegos/cajas Game Boy.',
      250,
      '/images/products/console-insert-universal.jpg',
      'accesorios',
      60,
      'insert',
      'sin-especificar',
      'game-boy'
    )
)
update public.products p
set
  description = x.description,
  price = x.price,
  image = x.image,
  images = array[x.image],
  category = x.category,
  stock = x.stock,
  component_type = x.component_type,
  edition = x.edition,
  platform = x.platform,
  updated_at = now()
from payload x
where lower(p.name) = lower(x.name);

with payload(name, description, price, image, category, stock, component_type, edition, platform) as (
  values
    ('Consola Game Boy DMG-01', 'Consola clásica revisada y lista para colección.', 11999, '/images/products/console-gb-dmg.jpg', 'consolas-retro', 4, 'full_game', 'original', 'game-boy'),
    ('Consola Game Boy Color', 'Consola Game Boy Color funcional y revisada.', 12999, '/images/products/console-gbc.jpg', 'consolas-retro', 3, 'full_game', 'original', 'game-boy-color'),
    ('Consola Game Boy Advance', 'Consola Game Boy Advance en buen estado.', 13999, '/images/products/console-gba.jpg', 'consolas-retro', 3, 'full_game', 'original', 'game-boy-advance'),
    ('Consola Super Nintendo PAL', 'Consola Super Nintendo PAL con test de funcionamiento.', 14999, '/images/products/console-snes-pal.jpg', 'consolas-retro', 2, 'full_game', 'original', 'super-nintendo'),
    ('Consola Nintendo GameCube', 'Nintendo GameCube revisada para uso y coleccionismo.', 15999, '/images/products/console-gamecube.jpg', 'consolas-retro', 2, 'full_game', 'original', 'gamecube'),
    ('Caja consola Game Boy original', 'Caja suelta de consola Game Boy.', 3999, '/images/products/console-box-gb.jpg', 'consolas-retro', 5, 'caja', 'sin-especificar', 'game-boy'),
    ('Manual consola Game Boy', 'Manual de instrucciones de consola Game Boy.', 1999, '/images/products/console-manual-gb.jpg', 'manuales', 10, 'manual', 'sin-especificar', 'game-boy'),
    ('Protector consola Game Boy (universal)', 'Protector universal de caja para productos Game Boy.', 350, '/images/products/console-protector-universal.jpg', 'accesorios', 60, 'protector_caja', 'sin-especificar', 'game-boy'),
    ('Insert consola Game Boy (universal)', 'Insert interior universal para juegos/cajas Game Boy.', 250, '/images/products/console-insert-universal.jpg', 'accesorios', 60, 'insert', 'sin-especificar', 'game-boy')
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
  now(),
  now()
from payload x
where not exists (
  select 1
  from public.products p
  where lower(p.name) = lower(x.name)
);

-- Asegura imagen real para cualquier producto ya existente en categoría consolas sin imagen.
update public.products
set
  image = '/images/products/console-gb-dmg.jpg',
  images = array['/images/products/console-gb-dmg.jpg'],
  updated_at = now()
where coalesce(image, '') = ''
  and lower(coalesce(category, '')) = 'consolas-retro';

