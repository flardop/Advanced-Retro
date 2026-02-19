/**
 * Repara imágenes legacy de splash.games.directory en products y mystery_boxes
 * usando la misma estrategia estable del proyecto:
 * 1) búsqueda en libretro/igdb (preferencia libretro)
 * 2) fallback por categoría/plataforma
 *
 * Uso:
 *   npx tsx scripts/repair-splash-images.ts
 */

import { createClient } from '@supabase/supabase-js';
import { searchGameImages } from '../lib/gameImages';
import { detectImagePlatformFromProduct, stripProductNameForExternalSearch } from '../lib/catalogPlatform';
import {
  getFallbackImageUrls,
  isLikelyProductImageUrl,
} from '../lib/productImageRules';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

const LEGACY_BROKEN_LIBRETRO_URLS = new Set([
  'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy/Named_Boxarts/Tetris.png',
  'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy/Named_Boxarts/Pokemon%20-%20Red%20Version.png',
]);

function containsSplash(values: unknown[]): boolean {
  return values.some((value) => String(value || '').includes('splash.games.directory'));
}

function containsLegacyBrokenLibretro(values: unknown[]): boolean {
  return values.some((value) => LEGACY_BROKEN_LIBRETRO_URLS.has(String(value || '').trim()));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProductsAndCategoryResolver() {
  let usesCategoryId = true;
  let productsQuery: any = await supabase
    .from('products')
    .select('id,name,image,images,category_id')
    .order('name');

  if (productsQuery.error && String(productsQuery.error.message || '').includes('category_id')) {
    usesCategoryId = false;
    productsQuery = await supabase
      .from('products')
      .select('id,name,image,images,category')
      .order('name');
  }

  if (productsQuery.error) {
    throw new Error(productsQuery.error.message);
  }

  const products = productsQuery.data || [];

  let categoryMap = new Map<string, string>();
  if (usesCategoryId) {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id,slug');
    if (categoriesError) throw new Error(categoriesError.message);
    categoryMap = new Map((categories || []).map((cat) => [String(cat.id), String(cat.slug)]));
  }

  return {
    products,
    getCategorySlug: (row: any) =>
      usesCategoryId ? categoryMap.get(String(row.category_id || '')) || '' : String(row.category || ''),
  };
}

async function resolveStableImages(input: { name: string; category: string }): Promise<string[]> {
  const platform = detectImagePlatformFromProduct({
    category: input.category,
    name: input.name,
  });

  const variants = unique([
    input.name,
    stripProductNameForExternalSearch(input.name) || input.name,
    input.name.replace(/Pokémon/g, 'Pokemon'),
    input.name.replace(/Pokemon/g, 'Pokémon'),
    input.name.replace(/[^a-zA-Z0-9\s]/g, ' '),
  ]).filter(Boolean);

  for (const variant of variants) {
    const results = await searchGameImages({
      gameName: variant,
      platform,
      preferSource: 'libretro',
    });
    const urls = unique(results.map((item) => item.url).filter(isLikelyProductImageUrl)).slice(0, 6);
    if (urls.length > 0) return urls;
  }

  return getFallbackImageUrls({
    category: input.category,
    platform,
    name: input.name,
  }).filter(isLikelyProductImageUrl);
}

async function repairProducts() {
  const { products, getCategorySlug } = await getProductsAndCategoryResolver();

  const targets = products.filter((row: any) => {
    const values = [row.image, ...(Array.isArray(row.images) ? row.images : [])];
    return containsSplash(values) || containsLegacyBrokenLibretro(values);
  });

  console.log(`🧰 Productos a reparar (splash + legacy rotas): ${targets.length}`);

  let updated = 0;
  let errors = 0;

  for (const row of targets) {
    const name = String(row.name || '').trim();
    const category = getCategorySlug(row);

    try {
      const urls = await resolveStableImages({ name, category });
      const finalUrls = unique(urls).slice(0, 6);
      const main = finalUrls[0] || '';

      if (!main) {
        console.log(`⚠️  Sin imagen estable para: ${name}`);
        continue;
      }

      const { error } = await supabase
        .from('products')
        .update({
          image: main,
          images: finalUrls,
        })
        .eq('id', row.id);

      if (error) {
        errors += 1;
        console.log(`❌ Error actualizando ${name}: ${error.message}`);
      } else {
        updated += 1;
        console.log(`✅ ${name} -> ${main}`);
      }
    } catch (error: any) {
      errors += 1;
      console.log(`❌ Error procesando ${name}: ${error?.message || error}`);
    }

    await wait(220);
  }

  return { updated, errors, total: targets.length };
}

async function repairMysteryBoxes() {
  const { data, error } = await supabase
    .from('mystery_boxes')
    .select('id,name,image')
    .limit(200);

  if (error) {
    console.log(`ℹ️  mystery_boxes no disponible: ${error.message}`);
    return { updated: 0, errors: 0, total: 0 };
  }

  const rows = data || [];
  const targets = rows.filter((row: any) => {
    const image = String(row.image || '').trim();
    return image.includes('splash.games.directory') || image === '/images/mystery-box-5.png';
  });

  console.log(`🧰 Mystery boxes a reparar: ${targets.length}`);

  let updated = 0;
  let errors = 0;

  for (const row of targets) {
    const urls = getFallbackImageUrls({
      category: 'cajas-misteriosas',
      name: String(row.name || ''),
    }).filter(isLikelyProductImageUrl);
    const nextImage = urls[0] || '';
    if (!nextImage) continue;

    const { error: updateError } = await supabase
      .from('mystery_boxes')
      .update({ image: nextImage })
      .eq('id', row.id);

    if (updateError) {
      errors += 1;
      console.log(`❌ Error mystery ${row.name}: ${updateError.message}`);
    } else {
      updated += 1;
      console.log(`✅ Mystery ${row.name} -> ${nextImage}`);
    }
  }

  return { updated, errors, total: targets.length };
}

async function main() {
  console.log('🚀 Reparando imágenes splash...');
  const products = await repairProducts();
  const mystery = await repairMysteryBoxes();

  console.log('\n📊 Resumen final');
  console.log(
    JSON.stringify(
      {
        products,
        mystery,
      },
      null,
      2
    )
  );
}

main().catch((error: any) => {
  console.error(`❌ Error fatal: ${error?.message || error}`);
  process.exit(1);
});
