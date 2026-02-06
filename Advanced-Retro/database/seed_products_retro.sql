-- =============================================================================
-- SEED: Catálogo completo productos retro Game Boy - ADVANCED RETRO
-- =============================================================================
-- Requisitos: tabla products con columnas:
--   id (UUID, autogenerado), name, description, price (centavos), image (URL),
--   images (text[]), category (text), stock (int), is_mystery_box (boolean)
--
-- Si tu tabla usa category_id (UUID) y slug en vez de category (text), ver
-- al final del archivo la sección "Alternativa: schema con category_id y slug".
--
-- Imágenes: Las URLs usan placeholders. Reemplaza por tus propias URLs
-- (Splash! https://splash.games.directory/c/covers, o imágenes alojadas por ti).
-- =============================================================================

-- Asegurar columnas si tu schema actual no las tiene (PostgreSQL 11+)
ALTER TABLE products ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_mystery_box boolean DEFAULT false;

-- Si tu tabla tiene slug NOT NULL y no tienes category como text, comenta los
-- ALTER de arriba y usa la versión "Alternativa" al final.

-- =============================================================================
-- CATEGORÍA: juegos-gameboy (juegos / cartuchos)
-- =============================================================================

INSERT INTO products (name, description, price, image, images, category, stock, is_mystery_box) VALUES
('Pokémon Rojo', 'Clásico RPG de Game Boy. Atrapa y entrena Pokémon en Kanto.', 3999, 'https://splash.games.directory/covers/game-boy/pokemon-red.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png'], 'juegos-gameboy', 25, false),
('Pokémon Azul', 'Edición azul del primer Pokémon. 151 criaturas por descubrir.', 3999, 'https://splash.games.directory/covers/game-boy/pokemon-blue.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-blue.png'], 'juegos-gameboy', 22, false),
('Pokémon Amarillo', 'Sigue a Pikachu en esta edición especial con tu compañero en pantalla.', 4299, 'https://splash.games.directory/covers/game-boy/pokemon-yellow.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png'], 'juegos-gameboy', 18, false),
('The Legend of Zelda: Link''s Awakening', 'Aventura en la isla de Koholint. Uno de los mejores Zelda de portátil.', 4499, 'https://splash.games.directory/covers/game-boy/zelda-links-awakening.png', ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png'], 'juegos-gameboy', 15, false),
('Super Mario Land', 'Mario en Game Boy. Niveles cortos y adictivos.', 2499, 'https://splash.games.directory/covers/game-boy/super-mario-land.png', ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png'], 'juegos-gameboy', 30, false),
('Super Mario Land 2: 6 Golden Coins', 'Mario explora islas y se enfrenta a Wario.', 2999, 'https://splash.games.directory/covers/game-boy/super-mario-land-2.png', ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land-2.png'], 'juegos-gameboy', 20, false),
('Tetris', 'El puzzle de bloques que definió Game Boy. Incluye tema clásico.', 1999, 'https://splash.games.directory/covers/game-boy/tetris.png', ARRAY['https://splash.games.directory/covers/game-boy/tetris.png'], 'juegos-gameboy', 40, false),
('Castlevania II: Belmont''s Revenge', 'Christopher Belmont contra los demonios. Plataformas y exploración.', 3499, 'https://splash.games.directory/covers/game-boy/castlevania-2.png', ARRAY['https://splash.games.directory/covers/game-boy/castlevania-2.png'], 'juegos-gameboy', 12, false),
('Bubble Bobble', 'Bub y Bob en burbujas. Cooperativo y adictivo.', 2799, 'https://splash.games.directory/covers/game-boy/bubble-bobble.png', ARRAY['https://splash.games.directory/covers/game-boy/bubble-bobble.png'], 'juegos-gameboy', 14, false),
('DuckTales', 'Scrooge McDuck buscando tesoros. Plataformas de Capcom.', 3299, 'https://splash.games.directory/covers/game-boy/ducktales.png', ARRAY['https://splash.games.directory/covers/game-boy/ducktales.png'], 'juegos-gameboy', 16, false),
('Adventure Island', 'Master Higgins recoge fruta y esquiva enemigos.', 2299, 'https://splash.games.directory/covers/game-boy/adventure-island.png', ARRAY['https://splash.games.directory/covers/game-boy/adventure-island.png'], 'juegos-gameboy', 18, false),
('Kirby''s Dream Land', 'Kirby absorbe enemigos en su primera aventura.', 2699, 'https://splash.games.directory/covers/game-boy/kirbys-dream-land.png', ARRAY['https://splash.games.directory/covers/game-boy/kirbys-dream-land.png'], 'juegos-gameboy', 24, false),
('Metroid II: Return of Samus', 'Samus caza Metroids en SR388.', 3899, 'https://splash.games.directory/covers/game-boy/metroid-2.png', ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png'], 'juegos-gameboy', 10, false),
('Donkey Kong', 'El clásico arcade con niveles extra en Game Boy.', 2199, 'https://splash.games.directory/covers/game-boy/donkey-kong.png', ARRAY['https://splash.games.directory/covers/game-boy/donkey-kong.png'], 'juegos-gameboy', 28, false),
('Mega Man II', 'Mega Man contra 8 Robot Masters en Game Boy.', 3199, 'https://splash.games.directory/covers/game-boy/mega-man-2.png', ARRAY['https://splash.games.directory/covers/game-boy/mega-man-2.png'], 'juegos-gameboy', 11, false),
('Final Fantasy Legend', 'RPG de Square. Primera entrega de la saga SaGa en occidente.', 3599, 'https://splash.games.directory/covers/game-boy/ff-legend.png', ARRAY['https://splash.games.directory/covers/game-boy/ff-legend.png'], 'juegos-gameboy', 9, false),
('Q*bert', 'Clásico de saltos en pirámide. Versión Game Boy.', 1899, 'https://splash.games.directory/covers/game-boy/qbert.png', ARRAY['https://splash.games.directory/covers/game-boy/qbert.png'], 'juegos-gameboy', 15, false),
('Wario Land: Super Mario Land 3', 'Wario busca tesoros. Plataformas con transformaciones.', 2999, 'https://splash.games.directory/covers/game-boy/wario-land.png', ARRAY['https://splash.games.directory/covers/game-boy/wario-land.png'], 'juegos-gameboy', 17, false),
('Pokémon Verde (JP)', 'Edición japonesa Green. Coleccionable.', 4599, 'https://splash.games.directory/covers/game-boy/pokemon-green.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-green.png'], 'juegos-gameboy', 8, false),
('Dr. Mario', 'Puzzle de pastillas y virus. Modo dos jugadores.', 2299, 'https://splash.games.directory/covers/game-boy/dr-mario.png', ARRAY['https://splash.games.directory/covers/game-boy/dr-mario.png'], 'juegos-gameboy', 22, false),
('Gargoyle''s Quest', 'Demón rojo en aventura acción-RPG. Spin-off de Ghosts ''n Goblins.', 2899, 'https://splash.games.directory/covers/game-boy/gargoyles-quest.png', ARRAY['https://splash.games.directory/covers/game-boy/gargoyles-quest.png'], 'juegos-gameboy', 7, false),
('Kid Icarus: Of Myths and Monsters', 'Pit en Game Boy. Plataformas y exploración.', 3299, 'https://splash.games.directory/covers/game-boy/kid-icarus.png', ARRAY['https://splash.games.directory/covers/game-boy/kid-icarus.png'], 'juegos-gameboy', 13, false),
('Jurassic Park', 'Aventura basada en la película. Varios modos de juego.', 2799, 'https://splash.games.directory/covers/game-boy/jurassic-park.png', ARRAY['https://splash.games.directory/covers/game-boy/jurassic-park.png'], 'juegos-gameboy', 19, false),
('Lucky Luke', 'El vaquero en el oeste. Aventura gráfica Game Boy.', 2499, 'https://splash.games.directory/covers/game-boy/lucky-luke.png', ARRAY['https://splash.games.directory/covers/game-boy/lucky-luke.png'], 'juegos-gameboy', 14, false),
('Bomberman', 'Bombas y laberintos. Multijugador con link cable.', 2399, 'https://splash.games.directory/covers/game-boy/bomberman.png', ARRAY['https://splash.games.directory/covers/game-boy/bomberman.png'], 'juegos-gameboy', 21, false);

-- =============================================================================
-- CATEGORÍA: cajas-gameboy (cajas reproducción)
-- =============================================================================

INSERT INTO products (name, description, price, image, images, category, stock, is_mystery_box) VALUES
('Caja repro Pokémon Rojo', 'Caja de reproducción estilo original para Pokémon Rojo Game Boy.', 600, 'https://splash.games.directory/covers/game-boy/pokemon-red.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png'], 'cajas-gameboy', 30, false),
('Caja repro Pokémon Azul', 'Caja de reproducción estilo original para Pokémon Azul Game Boy.', 600, 'https://splash.games.directory/covers/game-boy/pokemon-blue.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-blue.png'], 'cajas-gameboy', 28, false),
('Caja repro Pokémon Amarillo', 'Caja de reproducción para Pokémon Amarillo. Incluye ventana.', 650, 'https://splash.games.directory/covers/game-boy/pokemon-yellow.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png'], 'cajas-gameboy', 20, false),
('Caja repro Zelda Link''s Awakening', 'Caja repro para The Legend of Zelda: Link''s Awakening.', 700, 'https://splash.games.directory/covers/game-boy/zelda-links-awakening.png', ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png'], 'cajas-gameboy', 18, false),
('Caja repro Super Mario Land', 'Caja de reproducción Super Mario Land. Diseño EU/JP.', 550, 'https://splash.games.directory/covers/game-boy/super-mario-land.png', ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png'], 'cajas-gameboy', 25, false),
('Caja repro Super Mario Land 2', 'Caja repro 6 Golden Coins. Alta calidad de impresión.', 600, 'https://splash.games.directory/covers/game-boy/super-mario-land-2.png', ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land-2.png'], 'cajas-gameboy', 22, false),
('Caja repro Tetris', 'Caja reproducción Tetris Game Boy. Icono clásico.', 500, 'https://splash.games.directory/covers/game-boy/tetris.png', ARRAY['https://splash.games.directory/covers/game-boy/tetris.png'], 'cajas-gameboy', 35, false),
('Caja repro Castlevania II', 'Caja Belmont''s Revenge. Estilo vintage.', 650, 'https://splash.games.directory/covers/game-boy/castlevania-2.png', ARRAY['https://splash.games.directory/covers/game-boy/castlevania-2.png'], 'cajas-gameboy', 15, false),
('Caja repro Bubble Bobble', 'Caja repro Bubble Bobble. Colores fieles al original.', 580, 'https://splash.games.directory/covers/game-boy/bubble-bobble.png', ARRAY['https://splash.games.directory/covers/game-boy/bubble-bobble.png'], 'cajas-gameboy', 16, false),
('Caja repro DuckTales', 'Caja reproducción DuckTales. Scrooge y sobrinos.', 620, 'https://splash.games.directory/covers/game-boy/ducktales.png', ARRAY['https://splash.games.directory/covers/game-boy/ducktales.png'], 'cajas-gameboy', 14, false),
('Caja repro Kirby''s Dream Land', 'Caja repro Kirby. Diseño limpio y colorido.', 590, 'https://splash.games.directory/covers/game-boy/kirbys-dream-land.png', ARRAY['https://splash.games.directory/covers/game-boy/kirbys-dream-land.png'], 'cajas-gameboy', 19, false),
('Caja repro Metroid II', 'Caja Metroid II: Return of Samus. Estilo oscuro.', 680, 'https://splash.games.directory/covers/game-boy/metroid-2.png', ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png'], 'cajas-gameboy', 12, false),
('Caja repro Donkey Kong', 'Caja repro Donkey Kong Game Boy. Clásico Nintendo.', 520, 'https://splash.games.directory/covers/game-boy/donkey-kong.png', ARRAY['https://splash.games.directory/covers/game-boy/donkey-kong.png'], 'cajas-gameboy', 26, false),
('Caja repro Mega Man II', 'Caja Mega Man II. Robot Masters en portada.', 630, 'https://splash.games.directory/covers/game-boy/mega-man-2.png', ARRAY['https://splash.games.directory/covers/game-boy/mega-man-2.png'], 'cajas-gameboy', 11, false),
('Caja repro Wario Land', 'Caja Wario Land: Super Mario Land 3.', 600, 'https://splash.games.directory/covers/game-boy/wario-land.png', ARRAY['https://splash.games.directory/covers/game-boy/wario-land.png'], 'cajas-gameboy', 17, false),
('Caja repro Jurassic Park', 'Caja Jurassic Park Game Boy. Logo y dinosaurios.', 580, 'https://splash.games.directory/covers/game-boy/jurassic-park.png', ARRAY['https://splash.games.directory/covers/game-boy/jurassic-park.png'], 'cajas-gameboy', 20, false),
('Caja repro Lucky Luke', 'Caja Lucky Luke. Estilo western.', 550, 'https://splash.games.directory/covers/game-boy/lucky-luke.png', ARRAY['https://splash.games.directory/covers/game-boy/lucky-luke.png'], 'cajas-gameboy', 18, false);

-- =============================================================================
-- CATEGORÍA: accesorios (manuales, inserts, pegatinas, extras)
-- =============================================================================

INSERT INTO products (name, description, price, image, images, category, stock, is_mystery_box) VALUES
('Manual Pokémon Rojo', 'Manual de instrucciones reproducción Pokémon Rojo.', 800, 'https://splash.games.directory/covers/game-boy/pokemon-red.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png'], 'accesorios', 25, false),
('Manual Pokémon Azul', 'Manual de instrucciones reproducción Pokémon Azul.', 800, 'https://splash.games.directory/covers/game-boy/pokemon-blue.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-blue.png'], 'accesorios', 23, false),
('Manual Zelda Link''s Awakening', 'Manual Zelda Link''s Awakening. Mapas y consejos.', 850, 'https://splash.games.directory/covers/game-boy/zelda-links-awakening.png', ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png'], 'accesorios', 18, false),
('Insert Pokémon Rojo', 'Insert interior caja Pokémon Rojo (repro).', 400, 'https://splash.games.directory/covers/game-boy/pokemon-red.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png'], 'accesorios', 30, false),
('Insert Pokémon Amarillo', 'Insert interior caja Pokémon Amarillo.', 400, 'https://splash.games.directory/covers/game-boy/pokemon-yellow.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png'], 'accesorios', 22, false),
('Pegatina Zelda saga', 'Pegatina oficial estilo Zelda para consolas o fundas.', 300, 'https://splash.games.directory/covers/game-boy/zelda-links-awakening.png', ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png'], 'accesorios', 50, false),
('Pegatina Pokémon saga', 'Pegatina pack Pokémon (Pikachu, starters).', 350, 'https://splash.games.directory/covers/game-boy/pokemon-yellow.png', ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png'], 'accesorios', 45, false),
('Pegatina Mario Game Boy', 'Pegatina retro Mario para Game Boy / funda.', 300, 'https://splash.games.directory/covers/game-boy/super-mario-land.png', ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png'], 'accesorios', 40, false),
('Pegatina Donkey Kong saga', 'Pegatina Donkey Kong. Estilo arcade.', 300, 'https://splash.games.directory/covers/game-boy/donkey-kong.png', ARRAY['https://splash.games.directory/covers/game-boy/donkey-kong.png'], 'accesorios', 38, false),
('Pegatina Metroid', 'Pegatina Metroid / Samus. Diseño retro.', 320, 'https://splash.games.directory/covers/game-boy/metroid-2.png', ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png'], 'accesorios', 28, false),
('Pegatina Kirby', 'Pegatina Kirby Dream Land. Rosa y amarillo.', 300, 'https://splash.games.directory/covers/game-boy/kirbys-dream-land.png', ARRAY['https://splash.games.directory/covers/game-boy/kirbys-dream-land.png'], 'accesorios', 35, false),
('Manual Super Mario Land', 'Manual repro Super Mario Land.', 750, 'https://splash.games.directory/covers/game-boy/super-mario-land.png', ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png'], 'accesorios', 20, false),
('Manual Tetris', 'Manual Tetris Game Boy. Reglas y modos.', 700, 'https://splash.games.directory/covers/game-boy/tetris.png', ARRAY['https://splash.games.directory/covers/game-boy/tetris.png'], 'accesorios', 32, false),
('Manual DuckTales', 'Manual DuckTales. Guía de niveles.', 800, 'https://splash.games.directory/covers/game-boy/ducktales.png', ARRAY['https://splash.games.directory/covers/game-boy/ducktales.png'], 'accesorios', 15, false),
('Insert Zelda Link''s Awakening', 'Insert interior caja Zelda Link''s Awakening.', 450, 'https://splash.games.directory/covers/game-boy/zelda-links-awakening.png', ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png'], 'accesorios', 18, false),
('Insert Metroid II', 'Insert Metroid II. Estilo SR388.', 450, 'https://splash.games.directory/covers/game-boy/metroid-2.png', ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png'], 'accesorios', 12, false),
('Cable Link Game Boy', 'Cable link para partidas multijugador Game Boy / Game Boy Color.', 1999, 'https://splash.games.directory/covers/game-boy/link-cable.png', ARRAY['https://splash.games.directory/covers/game-boy/link-cable.png'], 'accesorios', 15, false),
('Funda Game Boy original', 'Funda protectora para Game Boy DMG. Tela dura.', 1299, 'https://splash.games.directory/covers/game-boy/funda-dmg.png', ARRAY['https://splash.games.directory/covers/game-boy/funda-dmg.png'], 'accesorios', 22, false),
('Lupa Light para Game Boy', 'Lupa con luz para pantalla Game Boy. Mejora visibilidad.', 999, 'https://splash.games.directory/covers/game-boy/lupa-light.png', ARRAY['https://splash.games.directory/covers/game-boy/lupa-light.png'], 'accesorios', 19, false);

-- =============================================================================
-- CATEGORÍA: cajas-misteriosas (mystery box)
-- =============================================================================

INSERT INTO products (name, description, price, image, images, category, stock, is_mystery_box) VALUES
('Caja Misteriosa Premium', 'Caja misteriosa con sorpresas retro gaming: juego + caja o accesorios aleatorios.', 3999, 'https://splash.games.directory/covers/game-boy/mystery-box.png', ARRAY['https://splash.games.directory/covers/game-boy/mystery-box.png'], 'cajas-misteriosas', 20, true),
('Caja Misteriosa Estándar', 'Sorpresa retro: 1 juego o 2 accesorios/pegatinas. Ideal regalo.', 2499, 'https://splash.games.directory/covers/game-boy/mystery-box.png', ARRAY['https://splash.games.directory/covers/game-boy/mystery-box.png'], 'cajas-misteriosas', 30, true);

-- =============================================================================
-- FIN SEED PRINCIPAL
-- Total: 25 juegos + 17 cajas repro + 19 accesorios + 2 cajas misteriosas = 63 productos
-- =============================================================================

-- NOTA: Las URLs de imagen son placeholders. Sustituye por:
-- - Portadas reales desde https://splash.games.directory/c/covers (busca "Game Boy")
-- - O sube tus propias imágenes a Supabase Storage y usa esas URLs.
-- Splash! usa URLs de corta duración; para producción conviene alojar las imágenes tú mismo.


-- =============================================================================
-- ALTERNATIVA: Si tu tabla products usa category_id (UUID) y slug (unique)
-- =============================================================================
-- 1) Inserta categorías y guarda sus IDs (o usa slugs en subconsultas).
-- 2) Sustituye "category" por category_id y añade slug en cada INSERT.
--
-- Ejemplo de categorías:
-- INSERT INTO categories (name, slug, description) VALUES
--   ('Juegos Game Boy', 'juegos-gameboy', 'Juegos y cartuchos Game Boy'),
--   ('Cajas Game Boy', 'cajas-gameboy', 'Cajas de reproducción'),
--   ('Cajas Misteriosas', 'cajas-misteriosas', 'Cajas sorpresa'),
--   ('Accesorios', 'accesorios', 'Manuales, pegatinas, cables');
--
-- Ejemplo de un INSERT adaptado (un solo producto):
-- INSERT INTO products (name, slug, description, price, status, stock, category_id, images)
-- SELECT
--   'Pokémon Rojo',
--   'pokemon-rojo',
--   'Clásico RPG de Game Boy.',
--   3999,
--   'new',
--   25,
--   (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1),
--   ARRAY['https://...'];
-- =============================================================================
