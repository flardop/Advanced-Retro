/**
 * Garantiza que cada juego principal tenga componentes comprables:
 * - Caja
 * - Manual
 * - Insert (Inlay)
 * - Protector juego
 * - Protector caja
 *
 * Uso:
 *   npx tsx scripts/ensure-complete-game-components.ts
 */

import { createClient } from '@supabase/supabase-js';

function isMainGameName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  if (n.startsWith('caja ')) return false;
  if (n.startsWith('manual ')) return false;
  if (n.startsWith('insert ')) return false;
  if (n.startsWith('protector ')) return false;
  if (n.startsWith('pegatina ')) return false;
  if (n.startsWith('consola ')) return false;
  return true;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name,category,description,price,stock,image,images')
    .order('name');

  if (error) throw new Error(error.message);
  const rows = products || [];

  const existingKey = new Set<string>();
  for (const row of rows) {
    existingKey.add(`${String(row.name || '').trim().toLowerCase()}||${String(row.category || '').trim().toLowerCase()}`);
  }

  const mainGames = rows.filter(
    (row) => String(row.category || '').trim() === 'juegos-gameboy' && isMainGameName(String(row.name || ''))
  );

  let created = 0;
  for (const game of mainGames) {
    const gameName = String(game.name || '').trim();
    if (!gameName) continue;

    const gamePrice = Math.max(100, Number(game.price || 0));
    const gameStock = Math.max(1, Number(game.stock || 0));
    const gameImages = uniqueStrings([
      ...(Array.isArray(game.images) ? game.images : []),
      String(game.image || ''),
    ]);
    const mainImage = gameImages[0] || '/placeholder.svg';

    const components = [
      {
        name: `Caja ${gameName}`,
        category: 'cajas-gameboy',
        description: `Caja para ${gameName}.`,
        price: Math.max(600, Math.round((gamePrice * 0.2) / 50) * 50),
        stock: Math.max(4, Math.round(gameStock * 1.3)),
      },
      {
        name: `Manual ${gameName}`,
        category: 'accesorios',
        description: `Manual para ${gameName}.`,
        price: Math.max(700, Math.round((gamePrice * 0.16) / 50) * 50),
        stock: Math.max(4, Math.round(gameStock * 1.4)),
      },
      {
        name: `Insert (Inlay) ${gameName}`,
        category: 'accesorios',
        description: `Insert interior para ${gameName}.`,
        price: 250,
        stock: Math.max(6, Math.round(gameStock * 1.5)),
      },
      {
        name: `Protector juego ${gameName}`,
        category: 'accesorios',
        description: `Protector para cartucho/disco de ${gameName}.`,
        price: 300,
        stock: Math.max(6, Math.round(gameStock * 1.6)),
      },
      {
        name: `Protector caja ${gameName}`,
        category: 'accesorios',
        description: `Protector para caja de ${gameName}.`,
        price: 350,
        stock: Math.max(6, Math.round(gameStock * 1.6)),
      },
    ];

    for (const component of components) {
      const key = `${component.name.toLowerCase()}||${component.category.toLowerCase()}`;
      if (existingKey.has(key)) continue;

      const payload = {
        name: component.name,
        category: component.category,
        description: component.description,
        price: component.price,
        stock: component.stock,
        is_mystery_box: false,
        image: mainImage,
        images: gameImages.length > 0 ? gameImages : [mainImage],
      };

      const { error: insertError } = await (supabase.from('products') as any).insert(payload);
      if (!insertError) {
        existingKey.add(key);
        created += 1;
      }
    }
  }

  console.log(`Componentes creados: ${created}`);
}

main().catch((error) => {
  console.error(`❌ ${error?.message || error}`);
  process.exit(1);
});
