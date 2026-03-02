/**
 * Rellena imágenes reales para productos que todavía usan fallback genérico
 * (collections/fallbacks/placeholder) y no son componentes sueltos.
 *
 * Uso:
 *   npx tsx scripts/fill-fallback-product-images.ts --limit=180
 */

import { createClient } from '@supabase/supabase-js';
import { searchGameImages } from '../lib/gameImages';
import { detectImagePlatformFromProduct, stripProductNameForExternalSearch } from '../lib/catalogPlatform';
import { getFallbackImageUrls, isLikelyProductImageUrl } from '../lib/productImageRules';

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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isGenericFallbackUrl(url: unknown): boolean {
  const value = String(url || '').trim().toLowerCase();
  if (!value) return true;
  if (value === '/placeholder.svg') return true;
  if (value.startsWith('/images/collections/')) return true;
  if (value.startsWith('/images/fallbacks/')) return true;
  if (value.includes('via.placeholder.com')) return true;
  if (value.includes('splash.games.directory')) return true;
  if (value.includes('gbxtreme.com/product/')) return true;
  return false;
}

function isLikelyComponent(row: any): boolean {
  const componentType = normalize(row?.component_type);
  if (componentType && componentType !== 'full_game' && componentType !== 'cartucho') return true;

  const source = normalize(`${row?.name || ''} ${row?.description || ''} ${row?.long_description || ''}`);
  return (
    source.includes('manual') ||
    source.includes('insert') ||
    source.includes('inlay') ||
    source.includes('protector') ||
    source.includes('funda') ||
    source.includes('pegatina') ||
    source.includes('sticker') ||
    source.includes('poster')
  );
}

function isMystery(row: any): boolean {
  const category = normalize(row?.category || row?.category_id);
  return Boolean(row?.is_mystery_box) || category.includes('misterios') || category.includes('mystery');
}

async function getProductsAndCategoryResolver() {
  let usesCategoryId = true;
  let productsQuery: any = await supabase
    .from('products')
    .select('id,name,description,long_description,image,images,category_id,component_type,is_mystery_box')
    .order('name');

  if (productsQuery.error && String(productsQuery.error.message || '').includes('category_id')) {
    usesCategoryId = false;
    productsQuery = await supabase
      .from('products')
      .select('id,name,description,long_description,image,images,category,component_type,is_mystery_box')
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
    input.name.replace(/\([^)]*\)/g, ' '),
    input.name.replace(/[^a-zA-Z0-9\s]/g, ' '),
  ]).filter(Boolean);

  for (const variant of variants) {
    const results = await searchGameImages({
      gameName: variant,
      platform,
      preferSource: 'libretro',
    });
    const urls = unique(results.map((item) => item.url).filter(isLikelyProductImageUrl))
      .filter((url) => !isGenericFallbackUrl(url))
      .slice(0, 6);

    if (urls.length > 0) return urls;
  }

  // Si no hay portada real, al menos devuelve fallback estable del proyecto.
  return getFallbackImageUrls({
    category: input.category,
    platform,
    name: input.name,
  }).filter(isLikelyProductImageUrl);
}

function parseLimitArg(): number {
  const arg = process.argv.find((item) => item.startsWith('--limit='));
  if (!arg) return 180;
  const value = Number(arg.split('=')[1] || 180);
  if (!Number.isFinite(value) || value <= 0) return 180;
  return Math.min(Math.floor(value), 2000);
}

async function main() {
  const limit = parseLimitArg();
  const { products, getCategorySlug } = await getProductsAndCategoryResolver();

  const targets = products.filter((row: any) => {
    if (isMystery(row)) return false;
    if (isLikelyComponent(row)) return false;

    const values = unique([row.image, ...(Array.isArray(row.images) ? row.images : [])]);
    if (values.length === 0) return true;
    return values.every((url) => isGenericFallbackUrl(url));
  });

  const batch = targets.slice(0, limit);

  console.log(`🎯 Productos con portada genérica detectados: ${targets.length}`);
  console.log(`🧰 Procesando lote: ${batch.length} (limit=${limit})`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of batch) {
    const name = String(row.name || '').trim();
    const category = getCategorySlug(row);

    try {
      const urls = await resolveStableImages({ name, category });
      const finalUrls = unique(urls).slice(0, 6);
      const main = finalUrls[0] || '';

      if (!main || isGenericFallbackUrl(main)) {
        skipped += 1;
        console.log(`⚠️  ${name} -> sin portada real encontrada`);
        await wait(120);
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
        console.log(`❌ ${name}: ${error.message}`);
      } else {
        updated += 1;
        console.log(`✅ ${name} -> ${main}`);
      }
    } catch (error: any) {
      errors += 1;
      console.log(`❌ ${name}: ${error?.message || error}`);
    }

    await wait(180);
  }

  console.log('\n📊 Resumen');
  console.log(
    JSON.stringify(
      {
        scanned: batch.length,
        remainingDetected: Math.max(0, targets.length - batch.length),
        updated,
        skipped,
        errors,
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

