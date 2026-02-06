-- =============================================================================
-- SEED para tu schema ACTUAL (slug, category_id, images) - Pegar en Supabase
-- =============================================================================
-- Ejecuta primero el schema.sql si no tienes tablas. Luego este archivo.
-- 1) Inserta categorías.
-- 2) Inserta productos con slug y category_id (sin columnas image/category/is_mystery_box).
-- La imagen principal es images[1]. Sustituye las URLs por las tuyas o Splash!
-- =============================================================================

-- CATEGORÍAS (slug debe coincidir con los usados abajo)
INSERT INTO categories (name, slug, description) VALUES
  ('Juegos Game Boy', 'juegos-gameboy', 'Juegos y cartuchos Game Boy'),
  ('Cajas Game Boy', 'cajas-gameboy', 'Cajas de reproducción'),
  ('Cajas Misteriosas', 'cajas-misteriosas', 'Cajas sorpresa'),
  ('Accesorios', 'accesorios', 'Manuales, pegatinas, cables')
ON CONFLICT (slug) DO NOTHING;

-- PRODUCTOS (juegos-gameboy)
INSERT INTO products (name, slug, description, price, status, stock, category_id, images) VALUES
('Pokémon Rojo', 'pokemon-rojo', 'Clásico RPG de Game Boy. Atrapa y entrena Pokémon en Kanto.', 3999, 'new', 25, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png']),
('Pokémon Azul', 'pokemon-azul', 'Edición azul del primer Pokémon. 151 criaturas por descubrir.', 3999, 'new', 22, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-blue.png']),
('Pokémon Amarillo', 'pokemon-amarillo', 'Sigue a Pikachu en esta edición especial con tu compañero en pantalla.', 4299, 'new', 18, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png']),
('The Legend of Zelda: Link''s Awakening', 'zelda-links-awakening', 'Aventura en la isla de Koholint. Uno de los mejores Zelda de portátil.', 4499, 'new', 15, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png']),
('Super Mario Land', 'super-mario-land', 'Mario en Game Boy. Niveles cortos y adictivos.', 2499, 'new', 30, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png']),
('Super Mario Land 2: 6 Golden Coins', 'super-mario-land-2', 'Mario explora islas y se enfrenta a Wario.', 2999, 'new', 20, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land-2.png']),
('Tetris', 'tetris', 'El puzzle de bloques que definió Game Boy. Incluye tema clásico.', 1999, 'new', 40, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/tetris.png']),
('Castlevania II: Belmont''s Revenge', 'castlevania-2-belmonts-revenge', 'Christopher Belmont contra los demonios. Plataformas y exploración.', 3499, 'new', 12, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/castlevania-2.png']),
('Bubble Bobble', 'bubble-bobble', 'Bub y Bob en burbujas. Cooperativo y adictivo.', 2799, 'new', 14, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/bubble-bobble.png']),
('DuckTales', 'ducktales', 'Scrooge McDuck buscando tesoros. Plataformas de Capcom.', 3299, 'new', 16, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/ducktales.png']),
('Adventure Island', 'adventure-island', 'Master Higgins recoge fruta y esquiva enemigos.', 2299, 'new', 18, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/adventure-island.png']),
('Kirby''s Dream Land', 'kirbys-dream-land', 'Kirby absorbe enemigos en su primera aventura.', 2699, 'new', 24, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/kirbys-dream-land.png']),
('Metroid II: Return of Samus', 'metroid-2', 'Samus caza Metroids en SR388.', 3899, 'new', 10, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png']),
('Donkey Kong', 'donkey-kong', 'El clásico arcade con niveles extra en Game Boy.', 2199, 'new', 28, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/donkey-kong.png']),
('Mega Man II', 'mega-man-2', 'Mega Man contra 8 Robot Masters en Game Boy.', 3199, 'new', 11, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/mega-man-2.png']),
('Final Fantasy Legend', 'final-fantasy-legend', 'RPG de Square. Primera entrega de la saga SaGa en occidente.', 3599, 'new', 9, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/ff-legend.png']),
('Q*bert', 'qbert', 'Clásico de saltos en pirámide. Versión Game Boy.', 1899, 'new', 15, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/qbert.png']),
('Wario Land: Super Mario Land 3', 'wario-land', 'Wario busca tesoros. Plataformas con transformaciones.', 2999, 'new', 17, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/wario-land.png']),
('Pokémon Verde (JP)', 'pokemon-verde-jp', 'Edición japonesa Green. Coleccionable.', 4599, 'new', 8, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-green.png']),
('Dr. Mario', 'dr-mario', 'Puzzle de pastillas y virus. Modo dos jugadores.', 2299, 'new', 22, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/dr-mario.png']),
('Gargoyle''s Quest', 'gargoyles-quest', 'Demón rojo en aventura acción-RPG. Spin-off de Ghosts ''n Goblins.', 2899, 'new', 7, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/gargoyles-quest.png']),
('Kid Icarus: Of Myths and Monsters', 'kid-icarus', 'Pit en Game Boy. Plataformas y exploración.', 3299, 'new', 13, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/kid-icarus.png']),
('Jurassic Park', 'jurassic-park', 'Aventura basada en la película. Varios modos de juego.', 2799, 'new', 19, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/jurassic-park.png']),
('Lucky Luke', 'lucky-luke', 'El vaquero en el oeste. Aventura gráfica Game Boy.', 2499, 'new', 14, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/lucky-luke.png']),
('Bomberman', 'bomberman', 'Bombas y laberintos. Multijugador con link cable.', 2399, 'new', 21, (SELECT id FROM categories WHERE slug = 'juegos-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/bomberman.png']);

-- PRODUCTOS (cajas-gameboy)
INSERT INTO products (name, slug, description, price, status, stock, category_id, images) VALUES
('Caja repro Pokémon Rojo', 'caja-repro-pokemon-rojo', 'Caja de reproducción estilo original para Pokémon Rojo Game Boy.', 600, 'new', 30, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png']),
('Caja repro Pokémon Azul', 'caja-repro-pokemon-azul', 'Caja de reproducción estilo original para Pokémon Azul Game Boy.', 600, 'new', 28, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-blue.png']),
('Caja repro Pokémon Amarillo', 'caja-repro-pokemon-amarillo', 'Caja de reproducción para Pokémon Amarillo. Incluye ventana.', 650, 'new', 20, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png']),
('Caja repro Zelda Link''s Awakening', 'caja-repro-zelda-links-awakening', 'Caja repro para The Legend of Zelda: Link''s Awakening.', 700, 'new', 18, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png']),
('Caja repro Super Mario Land', 'caja-repro-super-mario-land', 'Caja de reproducción Super Mario Land. Diseño EU/JP.', 550, 'new', 25, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png']),
('Caja repro Super Mario Land 2', 'caja-repro-super-mario-land-2', 'Caja repro 6 Golden Coins. Alta calidad de impresión.', 600, 'new', 22, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land-2.png']),
('Caja repro Tetris', 'caja-repro-tetris', 'Caja reproducción Tetris Game Boy. Icono clásico.', 500, 'new', 35, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/tetris.png']),
('Caja repro Castlevania II', 'caja-repro-castlevania-2', 'Caja Belmont''s Revenge. Estilo vintage.', 650, 'new', 15, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/castlevania-2.png']),
('Caja repro Bubble Bobble', 'caja-repro-bubble-bobble', 'Caja repro Bubble Bobble. Colores fieles al original.', 580, 'new', 16, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/bubble-bobble.png']),
('Caja repro DuckTales', 'caja-repro-ducktales', 'Caja reproducción DuckTales. Scrooge y sobrinos.', 620, 'new', 14, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/ducktales.png']),
('Caja repro Kirby''s Dream Land', 'caja-repro-kirbys-dream-land', 'Caja repro Kirby. Diseño limpio y colorido.', 590, 'new', 19, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/kirbys-dream-land.png']),
('Caja repro Metroid II', 'caja-repro-metroid-2', 'Caja Metroid II: Return of Samus. Estilo oscuro.', 680, 'new', 12, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png']),
('Caja repro Donkey Kong', 'caja-repro-donkey-kong', 'Caja repro Donkey Kong Game Boy. Clásico Nintendo.', 520, 'new', 26, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/donkey-kong.png']),
('Caja repro Mega Man II', 'caja-repro-mega-man-2', 'Caja Mega Man II. Robot Masters en portada.', 630, 'new', 11, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/mega-man-2.png']),
('Caja repro Wario Land', 'caja-repro-wario-land', 'Caja Wario Land: Super Mario Land 3.', 600, 'new', 17, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/wario-land.png']),
('Caja repro Jurassic Park', 'caja-repro-jurassic-park', 'Caja Jurassic Park Game Boy. Logo y dinosaurios.', 580, 'new', 20, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/jurassic-park.png']),
('Caja repro Lucky Luke', 'caja-repro-lucky-luke', 'Caja Lucky Luke. Estilo western.', 550, 'new', 18, (SELECT id FROM categories WHERE slug = 'cajas-gameboy' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/lucky-luke.png']);

-- PRODUCTOS (accesorios)
INSERT INTO products (name, slug, description, price, status, stock, category_id, images) VALUES
('Manual Pokémon Rojo', 'manual-pokemon-rojo', 'Manual de instrucciones reproducción Pokémon Rojo.', 800, 'new', 25, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png']),
('Manual Pokémon Azul', 'manual-pokemon-azul', 'Manual de instrucciones reproducción Pokémon Azul.', 800, 'new', 23, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-blue.png']),
('Manual Zelda Link''s Awakening', 'manual-zelda-links-awakening', 'Manual Zelda Link''s Awakening. Mapas y consejos.', 850, 'new', 18, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png']),
('Insert Pokémon Rojo', 'insert-pokemon-rojo', 'Insert interior caja Pokémon Rojo (repro).', 400, 'new', 30, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-red.png']),
('Insert Pokémon Amarillo', 'insert-pokemon-amarillo', 'Insert interior caja Pokémon Amarillo.', 400, 'new', 22, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png']),
('Pegatina Zelda saga', 'pegatina-zelda-saga', 'Pegatina oficial estilo Zelda para consolas o fundas.', 300, 'new', 50, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png']),
('Pegatina Pokémon saga', 'pegatina-pokemon-saga', 'Pegatina pack Pokémon (Pikachu, starters).', 350, 'new', 45, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/pokemon-yellow.png']),
('Pegatina Mario Game Boy', 'pegatina-mario-game-boy', 'Pegatina retro Mario para Game Boy / funda.', 300, 'new', 40, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png']),
('Pegatina Donkey Kong saga', 'pegatina-donkey-kong-saga', 'Pegatina Donkey Kong. Estilo arcade.', 300, 'new', 38, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/donkey-kong.png']),
('Pegatina Metroid', 'pegatina-metroid', 'Pegatina Metroid / Samus. Diseño retro.', 320, 'new', 28, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png']),
('Pegatina Kirby', 'pegatina-kirby', 'Pegatina Kirby Dream Land. Rosa y amarillo.', 300, 'new', 35, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/kirbys-dream-land.png']),
('Manual Super Mario Land', 'manual-super-mario-land', 'Manual repro Super Mario Land.', 750, 'new', 20, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/super-mario-land.png']),
('Manual Tetris', 'manual-tetris', 'Manual Tetris Game Boy. Reglas y modos.', 700, 'new', 32, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/tetris.png']),
('Manual DuckTales', 'manual-ducktales', 'Manual DuckTales. Guía de niveles.', 800, 'new', 15, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/ducktales.png']),
('Insert Zelda Link''s Awakening', 'insert-zelda-links-awakening', 'Insert interior caja Zelda Link''s Awakening.', 450, 'new', 18, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/zelda-links-awakening.png']),
('Insert Metroid II', 'insert-metroid-2', 'Insert Metroid II. Estilo SR388.', 450, 'new', 12, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/metroid-2.png']),
('Cable Link Game Boy', 'cable-link-game-boy', 'Cable link para partidas multijugador Game Boy / Game Boy Color.', 1999, 'new', 15, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/link-cable.png']),
('Funda Game Boy original', 'funda-game-boy-original', 'Funda protectora para Game Boy DMG. Tela dura.', 1299, 'new', 22, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/funda-dmg.png']),
('Lupa Light para Game Boy', 'lupa-light-game-boy', 'Lupa con luz para pantalla Game Boy. Mejora visibilidad.', 999, 'new', 19, (SELECT id FROM categories WHERE slug = 'accesorios' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/lupa-light.png']);

-- PRODUCTOS (cajas-misteriosas)
INSERT INTO products (name, slug, description, price, status, stock, category_id, images) VALUES
('Caja Misteriosa Premium', 'caja-misteriosa-premium', 'Caja misteriosa con sorpresas retro gaming: juego + caja o accesorios aleatorios.', 3999, 'new', 20, (SELECT id FROM categories WHERE slug = 'cajas-misteriosas' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/mystery-box.png']),
('Caja Misteriosa Estándar', 'caja-misteriosa-estandar', 'Sorpresa retro: 1 juego o 2 accesorios/pegatinas. Ideal regalo.', 2499, 'new', 30, (SELECT id FROM categories WHERE slug = 'cajas-misteriosas' LIMIT 1), ARRAY['https://splash.games.directory/covers/game-boy/mystery-box.png']);

-- Total: 4 categorías + 25 juegos + 17 cajas + 19 accesorios + 2 cajas misteriosas = 63 productos
-- Sustituye las URLs de images por tus propias imágenes (Supabase Storage o Splash!).
