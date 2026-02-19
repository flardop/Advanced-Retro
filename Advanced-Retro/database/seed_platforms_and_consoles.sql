-- =============================================================================
-- SEED: categorías extra y productos base (GBC, GBA, SNES, GameCube, consolas)
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- Este seed asume esquema legacy con columna products.category (text).
-- Si usas category_id, adapta usando tu tabla categories.

alter table products add column if not exists category text;
alter table products add column if not exists image text;
alter table products add column if not exists images text[];
alter table products add column if not exists component_type text;
alter table products add column if not exists edition text;
alter table products add column if not exists platform text;

insert into products (name, description, price, image, images, category, stock, component_type, edition, platform)
values
  ('The Legend of Zelda: Oracle of Ages', 'Juego Game Boy Color clásico.', 4499, '/images/products/gbc-oracle-ages.jpg', array['/images/products/gbc-oracle-ages.jpg'], 'juegos-gameboy-color', 8, 'full_game', 'sin-especificar', 'game-boy-color'),
  ('Pokémon Cristal', 'Edición cristal para Game Boy Color.', 7999, '/images/products/gbc-pokemon-cristal.jpg', array['/images/products/gbc-pokemon-cristal.jpg'], 'juegos-gameboy-color', 6, 'full_game', 'sin-especificar', 'game-boy-color'),
  ('Metroid Fusion', 'Acción sci-fi para Game Boy Advance.', 6999, '/images/products/gba-metroid-fusion.jpg', array['/images/products/gba-metroid-fusion.jpg'], 'juegos-gameboy-advance', 10, 'full_game', 'sin-especificar', 'game-boy-advance'),
  ('Golden Sun', 'RPG icónico de Game Boy Advance.', 4999, '/images/products/gba-golden-sun.jpg', array['/images/products/gba-golden-sun.jpg'], 'juegos-gameboy-advance', 12, 'full_game', 'sin-especificar', 'game-boy-advance'),
  ('Super Metroid', 'Título legendario de Super Nintendo.', 8999, '/images/products/snes-super-metroid.jpg', array['/images/products/snes-super-metroid.jpg'], 'juegos-super-nintendo', 5, 'full_game', 'sin-especificar', 'super-nintendo'),
  ('Donkey Kong Country 2', 'Plataformas clásico de SNES.', 5499, '/images/products/snes-dkc2.jpg', array['/images/products/snes-dkc2.jpg'], 'juegos-super-nintendo', 9, 'full_game', 'sin-especificar', 'super-nintendo'),
  ('The Legend of Zelda: Wind Waker', 'Aventura cel-shading para GameCube.', 5999, '/images/products/gc-wind-waker.jpg', array['/images/products/gc-wind-waker.jpg'], 'juegos-gamecube', 7, 'full_game', 'sin-especificar', 'gamecube'),
  ('Resident Evil 4', 'Acción y terror para GameCube.', 4999, '/images/products/gc-resident-evil-4.jpg', array['/images/products/gc-resident-evil-4.jpg'], 'juegos-gamecube', 8, 'full_game', 'sin-especificar', 'gamecube'),
  ('Consola Game Boy DMG-01', 'Consola original Game Boy Classic.', 11999, '/images/products/console-gb-dmg.jpg', array['/images/products/console-gb-dmg.jpg'], 'consolas-retro', 4, 'full_game', 'original', 'game-boy'),
  ('Consola Super Nintendo PAL', 'Consola SNES modelo PAL.', 14999, '/images/products/console-snes-pal.jpg', array['/images/products/console-snes-pal.jpg'], 'consolas-retro', 3, 'full_game', 'original', 'super-nintendo'),
  ('Caja consola Game Boy original', 'Caja suelta para consola Game Boy.', 3999, '/images/products/console-box-gb.jpg', array['/images/products/console-box-gb.jpg'], 'consolas-retro', 5, 'caja', 'sin-especificar', 'game-boy'),
  ('Manual consola Game Boy', 'Manual de instrucciones de consola Game Boy.', 1999, '/images/products/console-manual-gb.jpg', array['/images/products/console-manual-gb.jpg'], 'manuales', 10, 'manual', 'sin-especificar', 'game-boy')
on conflict do nothing;
