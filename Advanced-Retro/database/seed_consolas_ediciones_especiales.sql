-- =============================================================================
-- SEED: EDICIONES ESPECIALES DE CONSOLAS (solo plataformas ya usadas en tienda)
-- Game Boy, Game Boy Color, Game Boy Advance, Super Nintendo, GameCube.
-- Requiere imágenes reales locales en /public/images/products/special-editions.
-- =============================================================================

alter table if exists public.products add column if not exists category text;
alter table if exists public.products add column if not exists image text;
alter table if exists public.products add column if not exists images text[];
alter table if exists public.products add column if not exists status text;
alter table if exists public.products add column if not exists component_type text;
alter table if exists public.products add column if not exists edition text;
alter table if exists public.products add column if not exists collection_key text;
alter table if exists public.products add column if not exists platform text;
alter table if exists public.products add column if not exists long_description text;
alter table if exists public.products add column if not exists ebay_query text;
alter table if exists public.products add column if not exists ebay_marketplace_id text;
alter table if exists public.products add column if not exists is_active boolean;
alter table if exists public.products add column if not exists created_at timestamptz;
alter table if exists public.products add column if not exists updated_at timestamptz;

with payload(name, description, long_description, price, image, category, stock, component_type, edition, collection_key, platform, ebay_query, ebay_marketplace_id) as (
  values
    (
      'Consola Game Boy Light Gold (Edición especial JP)',
      'Game Boy Light japonesa con retroiluminación integrada. Modelo raro para coleccionismo.',
      'Edición especial lanzada en Japón. Muy buscada por coleccionistas de hardware portátil clásico.',
      38999,
      '/images/products/special-editions/console-special-gameboy-light.png',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'game-boy',
      'game boy light gold japan',
      'EBAY_ES'
    ),
    (
      'Consola Game Boy Color Pikachu (Edición especial)',
      'Game Boy Color con diseño Pikachu. Variante especial de colección.',
      'Edición especial de Game Boy Color con temática Pikachu. Pieza destacada para vitrina retro.',
      32999,
      '/images/products/special-editions/console-special-gbc-pikachu.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'game-boy-color',
      'game boy color pikachu special edition',
      'EBAY_ES'
    ),
    (
      'Consola Game Boy Advance SP NES Classic (Edición especial)',
      'Game Boy Advance SP NES Classic Edition. Variante limitada de colección.',
      'Modelo SP inspirado en NES Classic. Acabado especial y tirada limitada según mercado.',
      34999,
      '/images/products/special-editions/console-special-gba-sp-nes.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'game-boy-advance',
      'game boy advance sp nes classic edition',
      'EBAY_ES'
    ),
    (
      'Consola Super Famicom Jr (Edición especial Japón)',
      'Revisión compacta de SNES/Super Famicom. Modelo difícil de conseguir fuera de Japón.',
      'Super Famicom Jr es una revisión de hardware muy buscada por coleccionistas de Super Nintendo.',
      35999,
      '/images/products/special-editions/console-special-snes-jr.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'super-nintendo',
      'super famicom jr console special',
      'EBAY_ES'
    ),
    (
      'Consola Panasonic Q (Edición especial GameCube)',
      'Variante Panasonic Q compatible con GameCube/DVD. Hardware premium de colección.',
      'Panasonic Q es una de las variantes más raras dentro del ecosistema GameCube.',
      129999,
      '/images/products/special-editions/console-special-panasonic-q.jpg',
      'consolas-retro',
      1,
      'full_game',
      'original',
      'console-special-editions',
      'gamecube',
      'panasonic q gamecube console',
      'EBAY_ES'
    )
)
update public.products p
set
  description = x.description,
  long_description = x.long_description,
  price = x.price,
  image = x.image,
  images = array[x.image],
  category = x.category,
  stock = x.stock,
  status = 'new',
  component_type = x.component_type,
  edition = x.edition,
  collection_key = x.collection_key,
  platform = x.platform,
  ebay_query = x.ebay_query,
  ebay_marketplace_id = x.ebay_marketplace_id,
  is_active = true,
  updated_at = now()
from payload x
where lower(coalesce(p.name, '')) = lower(x.name);

with payload(name, description, long_description, price, image, category, stock, component_type, edition, collection_key, platform, ebay_query, ebay_marketplace_id) as (
  values
    ('Consola Game Boy Light Gold (Edición especial JP)', 'Game Boy Light japonesa con retroiluminación integrada. Modelo raro para coleccionismo.', 'Edición especial lanzada en Japón. Muy buscada por coleccionistas de hardware portátil clásico.', 38999, '/images/products/special-editions/console-special-gameboy-light.png', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'game-boy', 'game boy light gold japan', 'EBAY_ES'),
    ('Consola Game Boy Color Pikachu (Edición especial)', 'Game Boy Color con diseño Pikachu. Variante especial de colección.', 'Edición especial de Game Boy Color con temática Pikachu. Pieza destacada para vitrina retro.', 32999, '/images/products/special-editions/console-special-gbc-pikachu.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'game-boy-color', 'game boy color pikachu special edition', 'EBAY_ES'),
    ('Consola Game Boy Advance SP NES Classic (Edición especial)', 'Game Boy Advance SP NES Classic Edition. Variante limitada de colección.', 'Modelo SP inspirado en NES Classic. Acabado especial y tirada limitada según mercado.', 34999, '/images/products/special-editions/console-special-gba-sp-nes.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'game-boy-advance', 'game boy advance sp nes classic edition', 'EBAY_ES'),
    ('Consola Super Famicom Jr (Edición especial Japón)', 'Revisión compacta de SNES/Super Famicom. Modelo difícil de conseguir fuera de Japón.', 'Super Famicom Jr es una revisión de hardware muy buscada por coleccionistas de Super Nintendo.', 35999, '/images/products/special-editions/console-special-snes-jr.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'super-nintendo', 'super famicom jr console special', 'EBAY_ES'),
    ('Consola Panasonic Q (Edición especial GameCube)', 'Variante Panasonic Q compatible con GameCube/DVD. Hardware premium de colección.', 'Panasonic Q es una de las variantes más raras dentro del ecosistema GameCube.', 129999, '/images/products/special-editions/console-special-panasonic-q.jpg', 'consolas-retro', 1, 'full_game', 'original', 'console-special-editions', 'gamecube', 'panasonic q gamecube console', 'EBAY_ES')
)
insert into public.products (
  name,
  description,
  long_description,
  price,
  image,
  images,
  category,
  stock,
  status,
  component_type,
  edition,
  collection_key,
  platform,
  ebay_query,
  ebay_marketplace_id,
  is_active,
  created_at,
  updated_at
)
select
  x.name,
  x.description,
  x.long_description,
  x.price,
  x.image,
  array[x.image],
  x.category,
  x.stock,
  'new',
  x.component_type,
  x.edition,
  x.collection_key,
  x.platform,
  x.ebay_query,
  x.ebay_marketplace_id,
  true,
  now(),
  now()
from payload x
where not exists (
  select 1 from public.products p where lower(coalesce(p.name, '')) = lower(x.name)
);

notify pgrst, 'reload schema';
