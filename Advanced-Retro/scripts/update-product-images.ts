/**
 * Script para actualizar portadas de productos.
 *
 * Uso recomendado (solo juegos principales):
 *   npx tsx scripts/update-product-images.ts --force
 *
 * Opciones:
 *   --force         Reprocesa aunque ya tenga imagen
 *   --all-products  Incluye cajas/manuales/accesorios (por defecto: solo juegos principales)
 *   --limit=120     Limita número de productos procesados
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { searchGameImages } from '../lib/gameImages';
import { detectImagePlatformFromProduct, stripProductNameForExternalSearch } from '../lib/catalogPlatform';
import { getFallbackImageUrls, hasAnyValidProductImage, isLikelyProductImageUrl } from '../lib/productImageRules';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const forceUpdate = process.argv.includes('--force');
const processAllProducts = process.argv.includes('--all-products');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1] || 0)) : 0;

const GENERIC_COLLECTION_FALLBACK_RE = /^\/images\/collections\/.+\.(svg|png|jpg|jpeg|webp)$/i;
const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'game',
  'boy',
  'gameboy',
  'color',
  'advance',
  'super',
  'nintendo',
  'system',
  'edition',
  'version',
  'usa',
  'europe',
  'japan',
  'pal',
  'ntsc',
  'of',
  'a',
  'an',
  'to',
]);
const COMPONENT_MARKERS_RE =
  /\b(caja|manual|insert|inlay|interior|protector|funda|pegatina|sticker|poster|subscription|suscripcion)\b/i;

async function loadEnvFileIfNeeded(projectRoot: string) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return;
  }

  const envPath = path.join(projectRoot, '.env.local');
  if (!existsSync(envPath)) return;

  const content = await fs.readFile(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeImageCandidates(values: unknown[]): string[] {
  return [...new Set((values || []).map((item) => String(item || '').trim()).filter(Boolean))];
}

function normalizedTokens(input: string): string[] {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length >= 2)
    .filter((token) => !STOPWORDS.has(token));
}

function isGenericCollectionFallback(url: string): boolean {
  if (!url) return false;
  if (url === '/placeholder.svg') return true;
  return GENERIC_COLLECTION_FALLBACK_RE.test(url);
}

function isCoverStillMissing(values: string[]): boolean {
  if (values.length === 0) return true;
  const nonGeneric = values.filter((url) => !isGenericCollectionFallback(url));
  if (nonGeneric.length === 0) return true;
  return !hasAnyValidProductImage(nonGeneric);
}

function isMainGameLikeProduct(input: {
  name: string;
  category: string;
  componentType?: string;
  isMystery?: boolean;
}): boolean {
  if (input.isMystery) return false;
  const category = String(input.category || '').toLowerCase();
  const componentType = String(input.componentType || '').toLowerCase();
  const name = String(input.name || '');

  if (componentType && !['full_game', 'cartucho', ''].includes(componentType)) return false;
  if (COMPONENT_MARKERS_RE.test(name)) return false;
  if (category.includes('manual') || category.includes('accesorio') || category.includes('cajas-') || category.includes('cajas_')) {
    return false;
  }
  if (category.includes('juegos-')) return true;
  return /(game ?boy|gamecube|snes|super nintendo)/i.test(name);
}

function requiredTokenMatches(tokenCount: number): number {
  if (tokenCount <= 1) return 1;
  if (tokenCount === 2) return 2;
  return 2;
}

function isLikelyNameImageMatch(productName: string, imageUrl: string): boolean {
  const nameTokens = normalizedTokens(productName);
  if (nameTokens.length === 0) return true;

  let decoded = String(imageUrl || '');
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // use raw
  }

  const urlTokens = normalizedTokens(decoded);
  if (urlTokens.length === 0) return false;

  let overlap = 0;
  for (const token of nameTokens) {
    if (urlTokens.includes(token)) overlap += 1;
  }

  return overlap >= requiredTokenMatches(nameTokens.length);
}

async function isReachableImage(url: string): Promise<boolean> {
  if (!isLikelyProductImageUrl(url)) return false;
  if (url.startsWith('/')) return true;
  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) return false;
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    return contentType.includes('image/');
  } catch {
    return false;
  }
}

async function selectReachableImages(urls: string[]): Promise<string[]> {
  const validated: string[] = [];
  for (const url of urls) {
    if (await isReachableImage(url)) {
      validated.push(url);
    }
    if (validated.length >= 6) break;
  }
  return validated;
}

async function searchWikipediaImage(query: string): Promise<string | null> {
  const q = String(query || '').trim();
  if (!q) return null;

  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
    const summaryRes = await fetch(summaryUrl);
    if (summaryRes.ok) {
      const summary = (await summaryRes.json()) as any;
      const direct = String(summary?.thumbnail?.source || '').trim();
      if (direct && /^https?:\/\//i.test(direct)) return direct;
    }
  } catch {
    // ignore
  }

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      `${q} video game`
    )}&format=json&utf8=1&srlimit=1`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const payload = (await searchRes.json()) as any;
    const title = String(payload?.query?.search?.[0]?.title || '').trim();
    if (!title) return null;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return null;
    const summary = (await summaryRes.json()) as any;
    const found = String(summary?.thumbnail?.source || '').trim();
    if (!found || !/^https?:\/\//i.test(found)) return null;
    return found;
  } catch {
    return null;
  }
}

function buildSearchVariants(name: string): string[] {
  return normalizeImageCandidates([
    name,
    stripProductNameForExternalSearch(name) || name,
    String(name || '').replace(/\([^)]*\)/g, '').trim(),
    String(name || '').replace(/Pokémon/g, 'Pokemon'),
    String(name || '').replace(/Pokemon/g, 'Pokémon'),
  ]);
}

async function updateProductImages() {
  await loadEnvFileIfNeeded(path.resolve(__dirname, '..'));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Obteniendo productos de la base de datos...');
  console.log(
    `⚙️  Modo: ${forceUpdate ? 'FORCE' : 'NORMAL'} · ${processAllProducts ? 'TODOS LOS PRODUCTOS' : 'SOLO JUEGOS PRINCIPALES'}`
  );

  let usesCategoryId = true;
  let productsQuery: any = await supabase
    .from('products')
    .select('id, name, image, images, category_id, component_type, is_mystery_box')
    .order('name');

  if (productsQuery.error && String(productsQuery.error.message || '').includes('category_id')) {
    usesCategoryId = false;
    productsQuery = await supabase
      .from('products')
      .select('id, name, image, images, category, component_type, is_mystery_box')
      .order('name');
  }

  const { data: products, error: fetchError } = productsQuery;
  if (fetchError) {
    console.error('❌ Error obteniendo productos:', fetchError);
    return;
  }
  if (!products || products.length === 0) {
    console.log('⚠️  No se encontraron productos');
    return;
  }

  let categoryMap = new Map<string, string>();
  if (usesCategoryId) {
    const { data: categories } = await supabase.from('categories').select('id, slug');
    categoryMap = new Map((categories || []).map((cat: any) => [String(cat.id), String(cat.slug)]));
  }

  const candidates = (products as any[]).filter((product) => {
    const categorySlug = usesCategoryId ? categoryMap.get(String(product.category_id || '')) || '' : String(product.category || '');
    if (processAllProducts) return true;
    return isMainGameLikeProduct({
      name: String(product.name || ''),
      category: categorySlug,
      componentType: String(product.component_type || ''),
      isMystery: Boolean(product.is_mystery_box),
    });
  });

  const queue = limit > 0 ? candidates.slice(0, limit) : candidates;
  console.log(`📦 Productos candidatos: ${queue.length} (total tabla: ${products.length})\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of queue) {
    const categorySlug = usesCategoryId ? categoryMap.get(String(product.category_id || '')) || '' : String(product.category || '');
    const existingImages = normalizeImageCandidates([
      ...(Array.isArray(product.images) ? product.images : []),
      String(product.image || ''),
    ]);
    const firstExisting = existingImages[0] || '';

    const hasValidImageNow =
      !isCoverStillMissing(existingImages) &&
      !isGenericCollectionFallback(firstExisting) &&
      isLikelyNameImageMatch(String(product.name || ''), firstExisting);

    if (hasValidImageNow && !forceUpdate) {
      skipped += 1;
      continue;
    }

    try {
      console.log(`🔍 Buscando imagen para: "${product.name}"...`);

      const platform = detectImagePlatformFromProduct({
        category: categorySlug,
        name: String(product.name || ''),
      });

      const searchVariants = buildSearchVariants(String(product.name || ''));
      let imageUrls: string[] = [];

      for (const searchTerm of searchVariants) {
        if (!searchTerm) continue;

        const imageResults = await searchGameImages({
          gameName: searchTerm,
          platform,
          preferSource: 'libretro',
        });

        const candidates = normalizeImageCandidates(
          imageResults.map((item) => item.url).filter(isLikelyProductImageUrl)
        ).filter((url) => isLikelyNameImageMatch(String(product.name || ''), url));

        const reachable = await selectReachableImages(candidates);
        if (reachable.length > 0) {
          imageUrls = reachable;
          break;
        }
      }

      if (imageUrls.length === 0) {
        for (const searchTerm of searchVariants) {
          const wikiUrl = await searchWikipediaImage(searchTerm);
          if (!wikiUrl) continue;
          if (!isLikelyNameImageMatch(String(product.name || ''), wikiUrl)) continue;
          if (await isReachableImage(wikiUrl)) {
            imageUrls = [wikiUrl];
            break;
          }
        }
      }

      if (imageUrls.length === 0) {
        const fallbackCandidates = getFallbackImageUrls({
          category: categorySlug,
          platform,
          name: String(product.name || ''),
        }).filter(isLikelyProductImageUrl);
        imageUrls = await selectReachableImages(fallbackCandidates);
      }

      const imageUrl = imageUrls[0] || '';
      if (!imageUrl || imageUrl === '/placeholder.svg') {
        console.log(`⚠️  Sin portada válida para "${product.name}"`);
        skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ image: imageUrl, images: imageUrls })
        .eq('id', product.id);

      if (updateError) {
        errors += 1;
        console.log(`❌ Error actualizando "${product.name}": ${updateError.message}`);
      } else {
        updated += 1;
        console.log(`✅ ${product.name} -> ${imageUrl}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 220));
    } catch (error: any) {
      errors += 1;
      console.log(`❌ Error procesando "${product.name}": ${error?.message || error}`);
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`✅ Actualizados: ${updated}`);
  console.log(`⏭️  Saltados: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
}

updateProductImages()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
