/**
 * Script para normalizar nombres de productos
 * Mejora los nombres para que coincidan con juegos en LibRetro/IGDB
 * 
 * Uso:
 * npx tsx scripts/normalize-product-names.ts --dry-run
 * npx tsx scripts/normalize-product-names.ts (sin --dry-run para aplicar cambios)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dryRun = process.argv.includes('--dry-run');

// Mapa de normalizaciones: nombre actual → nombre normalizado
const nameNormalizations: Record<string, string> = {
  // Pokémon - español a inglés
  'Pokémon Rojo': 'Pokemon Red',
  'Pokémon Azul': 'Pokemon Blue',
  'Pokémon Amarillo': 'Pokemon Yellow',
  'Pokémon Verde (JP)': 'Pokemon Green',

  // Quitar acentos y caracteres especiales (si ayuda)
  'Castlevania Adventure': 'Castlevania: The Adventure',
  "Castlevania II: Belmont's Revenge": "Castlevania II: Belmont's Revenge",

  // The Legend of Zelda - normalizar formato
  "The Legend of Zelda: Link's Awakening": "The Legend of Zelda: Link's Awakening",
  // Si el anterior no encuentra, probar sin comillas:
  "The Legend of Zelda Links Awakening": "The Legend of Zelda: Link's Awakening",

  // Quitar "caja Game Boy" o "manual" para buscar solo el juego
  'Adventure Island caja Game Boy': 'Adventure Island',
  'Bomb Jack caja Game Boy': 'Bomb Jack',
  'Bubble Bobble caja Game Boy': 'Bubble Bobble',
  'Castlevania Adventure caja Game Boy': 'Castlevania: The Adventure',
  'Jurassic Park caja Game Boy': 'Jurassic Park',
  'Lucky Luke caja Game Boy': 'Lucky Luke',
  'Trip World caja Game Boy': 'Trip World',

  // Manuales
  'Manual DuckTales': 'DuckTales',
  'Manual Pokémon Azul': 'Pokemon Blue',
  'Manual Pokémon Rojo': 'Pokemon Red',
  'Manual Super Mario Land': 'Super Mario Land',
  'Manual Tetris': 'Tetris',
  "Manual Zelda Link's Awakening": "The Legend of Zelda: Link's Awakening",

  // Inserts
  'Insert Metroid II': 'Metroid II: Return of Samus',
  'Insert Pokémon Amarillo': 'Pokemon Yellow',
  'Insert Pokémon Rojo': 'Pokemon Red',
  "Insert Zelda Link's Awakening": "The Legend of Zelda: Link's Awakening",

  // Final Fantasy
  'Final Fantasy Legend': 'Final Fantasy Legend',
  'Final Fantasy Legend II': 'Final Fantasy Legend II',

  // Super Mario Land 2
  'Super Mario Land 2: 6 Golden Coins': 'Super Mario Land 2',

  // Accesos (estos NO tienen equivalente en juegos, se ignoran)
  'Cable Link Game Boy': null, // Accesorio - ignorar
  'Caja Misteriosa Estándar': null,
  'Caja Misteriosa Premium': null,
  'Caja Original Game Boy': null,
  'Funda Game Boy original': null,
  'Lupa Light para Game Boy': null,
  'Pegatina Donkey Kong saga': null,
  'Pegatina Kirby': null,
  'Pegatina Mario Game Boy': null,
  'Pegatina Metroid': null,
  'Pegatina Pokémon saga': null,
  'Pegatina Zelda saga': null,
  'Caja repro Bubble Bobble': null,
  'Caja repro Castlevania II': null,
  'Caja repro Donkey Kong': null,
  'Caja repro DuckTales': null,
  'Caja repro Jurassic Park': null,
  "Caja repro Kirby's Dream Land": null,
  'Caja repro Lucky Luke': null,
  'Caja repro Mega Man II': null,
  'Caja repro Metroid II': null,
  'Caja repro Pokémon Amarillo': null,
  'Caja repro Pokémon Azul': null,
  'Caja repro Pokémon Rojo': null,
  'Caja repro Super Mario Land': null,
  'Caja repro Super Mario Land 2': null,
  'Caja repro Tetris': null,
  'Caja repro Wario Land': null,
  "Caja repro Zelda Link's Awakening": null,
};

async function normalizeProductNames() {
  console.log('🔍 Obteniendo productos de la base de datos...');

  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, name')
    .order('name');

  if (fetchError) {
    console.error('❌ Error obteniendo productos:', fetchError);
    return;
  }

  if (!products || products.length === 0) {
    console.log('⚠️  No se encontraron productos');
    return;
  }

  console.log(`📦 Encontrados ${products.length} productos\n`);

  let updated = 0;
  let ignored = 0;
  let noChange = 0;

  for (const product of products) {
    const newName = nameNormalizations[product.name];

    // Si newName es null, es un accesorio que no debería cambiar
    if (newName === null) {
      console.log(`⏭️  Ignorando accesorio: "${product.name}"`);
      ignored++;
      continue;
    }

    // Si no está en el mapa, dejar como está
    if (newName === undefined) {
      console.log(`✅ Sin cambios: "${product.name}"`);
      noChange++;
      continue;
    }

    // Si el nombre es igual, no cambiar
    if (newName === product.name) {
      console.log(`✅ Sin cambios: "${product.name}"`);
      noChange++;
      continue;
    }

    // Cambiar nombre
    if (dryRun) {
      console.log(`(dry-run) 📝 "${product.name}" → "${newName}"`);
      updated++;
    } else {
      const { error: updateError } = await supabase
        .from('products')
        .update({ name: newName })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error actualizando "${product.name}":`, updateError);
      } else {
        console.log(`✅ Actualizado: "${product.name}" → "${newName}"`);
        updated++;
      }
    }

    // Pequeña pausa
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n📊 Resumen:');
  console.log(`📝 Actualizados: ${updated}`);
  console.log(`⏭️  Ignorados (accesorios): ${ignored}`);
  console.log(`✅ Sin cambios: ${noChange}`);
}

normalizeProductNames()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
