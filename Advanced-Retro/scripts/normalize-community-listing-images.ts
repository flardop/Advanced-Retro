/**
 * Reemplaza imágenes de anuncios de comunidad (subidas por usuarios) por portadas
 * profesionales para catálogo público/comunidad.
 *
 * Uso:
 *   npx tsx scripts/normalize-community-listing-images.ts --apply
 *   npx tsx scripts/normalize-community-listing-images.ts --limit=200 --apply
 *   npx tsx scripts/normalize-community-listing-images.ts --all --apply
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { searchGameImages } from '../lib/gameImages';
import { detectImagePlatformFromProduct, stripProductNameForExternalSearch } from '../lib/catalogPlatform';
import { getFallbackImageUrls, isLikelyProductImageUrl } from '../lib/productImageRules';

type ListingRow = {
  id: string;
  title: string;
  category: string | null;
  images: string[] | null;
  updated_at?: string | null;
};

type ProductRow = {
  name: string | null;
  category: string | null;
  image: string | null;
  images: string[] | null;
};

function parseArgs(argv: string[]) {
  let limit = 160;
  let apply = false;
  let processAll = false;

  for (const arg of argv) {
    const value = String(arg || '').trim();
    if (!value) continue;
    if (value === '--apply') apply = true;
    if (value === '--all') processAll = true;
    if (value.startsWith('--limit=')) {
      const parsed = Number(value.slice('--limit='.length));
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(4000, Math.floor(parsed));
      }
    }
  }

  return { limit, apply, processAll };
}

async function loadEnvFileIfNeeded(projectRoot: string) {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (hasUrl && hasKey) return;

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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCleanListingTitle(raw: string): string {
  const normalized = normalizeText(raw)
    .replace(
      /\b(lote|coleccion|coleccionista|set|completo|completa|edicion|clasica|clasico|retro|portatil|ltd|nuevo|nueva|usado|usada)\b/g,
      ' '
    )
    .replace(/\(([^)]*)\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    .replace(/\bpokemon oro\b/g, 'pokemon gold')
    .replace(/\bpokemon plata\b/g, 'pokemon silver')
    .replace(/\bpokemon rojo\b/g, 'pokemon red')
    .replace(/\bpokemon azul\b/g, 'pokemon blue')
    .replace(/\bpokemon amarillo\b/g, 'pokemon yellow')
    .trim();
}

function toTokenSet(value: string): Set<string> {
  const stop = new Set([
    'game',
    'boy',
    'color',
    'advance',
    'super',
    'nintendo',
    'consola',
    'retro',
    'edition',
    'edicion',
    'version',
  ]);
  return new Set(
    normalizeText(value)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stop.has(token))
  );
}

function calcSimilarity(a: string, b: string): number {
  const aSet = toTokenSet(a);
  const bSet = toTokenSet(b);
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let overlap = 0;
  for (const token of aSet) {
    if (bSet.has(token)) overlap += 1;
  }
  return overlap / Math.max(aSet.size, bSet.size);
}

function listingFallbackImages(input: { category: string; title: string }): string[] {
  const category = normalizeText(input.category);
  const title = normalizeText(input.title);
  if (category.includes('consolas') || title.includes('consola')) {
    if (title.includes('game boy color') || title.includes('gameboy color')) {
      return ['/images/products/console-gbc.jpg'];
    }
    if (title.includes('game boy advance') || title.includes('gameboy advance')) {
      return ['/images/products/console-gba.jpg'];
    }
    if (title.includes('super nintendo') || title.includes('snes')) {
      return ['/images/products/console-snes-pal.jpg'];
    }
    if (title.includes('game cube') || title.includes('gamecube')) {
      return ['/images/products/console-gamecube.jpg'];
    }
    return ['/images/products/console-gb-dmg.jpg'];
  }
  if (category.includes('gameboy-color') || title.includes('game boy color') || title.includes('gameboy color')) {
    return ['/images/collections/game-boy-color.svg'];
  }
  if (category.includes('gameboy-advance') || title.includes('game boy advance') || title.includes('gameboy advance')) {
    return ['/images/collections/game-boy-advance.svg'];
  }
  if (category.includes('gamecube') || title.includes('gamecube') || title.includes('game cube')) {
    return ['/images/collections/gamecube.svg'];
  }
  if (category.includes('super-nintendo') || title.includes('super nintendo') || title.includes('snes')) {
    return ['/images/collections/super-nintendo.svg'];
  }
  return ['/images/collections/game-boy.svg'];
}

function resolveKnownListingImages(rawTitle: string): string[] {
  const title = normalizeText(rawTitle);
  if (!title) return [];

  if (title.includes('pokemon plata') || title.includes('pokemon silver')) {
    return [
      'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy%20Color/Named_Boxarts/Pokemon%20-%20Silver%20Version%20(USA%2C%20Europe)%20(SGB%20Enhanced)%20(GB%20Compatible).png',
    ];
  }

  if (title.includes('pokemon oro') || title.includes('pokemon gold')) {
    return [
      'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy%20Color/Named_Boxarts/Pokemon%20-%20Gold%20Version%20(USA%2C%20Europe)%20(SGB%20Enhanced)%20(GB%20Compatible).png',
    ];
  }

  if (title.includes('pokemon pinball')) {
    return [
      'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy%20Color/Named_Boxarts/Pokemon%20Pinball%20(Europe)%20(En%2CFr%2CDe%2CEs%2CIt)%20(Rumble%20Version)%20(SGB%20Enhanced)%20(GB%20Compatible).png',
    ];
  }

  if (title.includes('donkey kong')) {
    return [
      'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy/Named_Boxarts/Donkey%20Kong%20(World)%20(Rev%201)%20(SGB%20Enhanced).png',
    ];
  }

  if (title.includes('super mario bros')) {
    return [
      'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy%20Color/Named_Boxarts/Super%20Mario%20Bros.%20Deluxe%20(USA%2C%20Europe)%20(Rev%201).png',
    ];
  }

  return [];
}

function looksLikeUserUploadedCommunityImage(url: string): boolean {
  const safe = String(url || '').trim().toLowerCase();
  if (!safe) return true;
  if (!safe.startsWith('http')) return true;
  return (
    safe.includes('/community-listings/') ||
    safe.includes('/imports/') ||
    safe.includes('/users/')
  );
}

function shouldRefreshListingImages(row: ListingRow) {
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  if (images.length === 0) return true;
  return images.some((image) => looksLikeUserUploadedCommunityImage(image));
}

async function resolveProfessionalImages(input: { title: string; category: string }) {
  const known = resolveKnownListingImages(input.title).filter(isLikelyProductImageUrl);
  if (known.length > 0) {
    return unique(known);
  }

  const normalizedTitleRaw = normalizeText(input.title);
  if (normalizeText(input.category).includes('consolas') || normalizedTitleRaw.includes('consola')) {
    return unique(listingFallbackImages({ category: input.category, title: input.title }));
  }

  const cleanedTitle = buildCleanListingTitle(input.title);
  const platform = detectImagePlatformFromProduct({
    category: input.category,
    name: cleanedTitle || input.title,
  });

  const normalizedTitle = normalizeText(cleanedTitle || input.title);
  const pokemonGoldAlias =
    normalizedTitle.includes('pokemon gold') || normalizedTitle.includes('pokemon oro')
      ? 'Pokemon - Gold Version'
      : '';
  const pokemonSilverAlias =
    normalizedTitle.includes('pokemon silver') || normalizedTitle.includes('pokemon plata')
      ? 'Pokemon - Silver Version'
      : '';

  const variants = unique([
    pokemonGoldAlias,
    pokemonSilverAlias,
    cleanedTitle,
    input.title,
    stripProductNameForExternalSearch(cleanedTitle || input.title),
    cleanedTitle.replace(/pokemon\s+gold/gi, 'pokemon oro'),
    cleanedTitle.replace(/pokemon\s+silver/gi, 'pokemon plata'),
    cleanedTitle.replace(/Pokémon/g, 'Pokemon'),
    cleanedTitle.replace(/Pokemon/g, 'Pokémon'),
    cleanedTitle.replace(/\([^)]*\)/g, ' '),
    cleanedTitle.replace(/[^a-zA-Z0-9\s]/g, ' '),
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

  return unique([
    ...listingFallbackImages({ category: input.category, title: input.title }),
    ...getFallbackImageUrls({
      category: input.category,
      platform,
      name: input.title,
    }).filter(isLikelyProductImageUrl),
  ]);
}

function pickBestCatalogCandidate(products: ProductRow[], listing: ListingRow): string[] {
  const listingTitle = buildCleanListingTitle(listing.title || '');
  const listingCategory = normalizeText(listing.category || '');
  if (listingCategory.includes('consolas') || normalizeText(listing.title || '').includes('consola')) {
    return [];
  }
  let bestScore = 0;
  let bestImages: string[] = [];

  for (const product of products) {
    const name = String(product.name || '').trim();
    if (!name) continue;
    const productCategory = normalizeText(product.category || '');

    let score = calcSimilarity(listingTitle, name);
    if (score <= 0) continue;

    // Prioriza categorías cercanas.
    if (listingCategory && productCategory && listingCategory.split('-')[0] === productCategory.split('-')[0]) {
      score += 0.08;
    }

    // Evita accesorios/manuales para anuncios de juegos.
    if (listingCategory.includes('juegos') && productCategory.includes('accesorios')) {
      score -= 0.2;
    }

    const candidateImages = unique(
      [...(Array.isArray(product.images) ? product.images : []), String(product.image || '').trim()].filter(
        isLikelyProductImageUrl
      )
    );
    if (candidateImages.length === 0) continue;

    if (score > bestScore) {
      bestScore = score;
      bestImages = candidateImages.slice(0, 6);
    }
  }

  if (bestScore >= 0.45 && bestImages.length > 0) {
    return bestImages;
  }
  return [];
}

async function main() {
  const { limit, apply, processAll } = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(__dirname, '..');
  await loadEnvFileIfNeeded(projectRoot);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const productsResult = await supabase
    .from('products')
    .select('name,category,image,images')
    .limit(5000);
  if (productsResult.error) throw new Error(productsResult.error.message);
  const products = (productsResult.data || []) as ProductRow[];

  const { data, error } = await supabase
    .from('user_product_listings')
    .select('id,title,category,images,updated_at')
    .order('updated_at', { ascending: false })
    .limit(processAll ? 4000 : limit);

  if (error) throw new Error(error.message);

  const rows = (data || []) as ListingRow[];
  const targets = rows.filter((row) => processAll || shouldRefreshListingImages(row));

  console.log(`📦 Anuncios leídos: ${rows.length}`);
  console.log(`🎯 Objetivos a normalizar: ${targets.length}`);
  console.log(`🗂️  Productos base para matching: ${products.length}`);
  console.log(`🛠️  Modo: ${apply ? 'APPLY' : 'DRY-RUN'}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of targets) {
    const title = String(row.title || '').trim();
    const category = String(row.category || '').trim();
    try {
      const knownMatch = resolveKnownListingImages(title).filter(isLikelyProductImageUrl);
      const catalogMatch = knownMatch.length > 0 ? knownMatch : pickBestCatalogCandidate(products, row);
      const images = unique(
        catalogMatch.length > 0 ? catalogMatch : await resolveProfessionalImages({ title, category })
      ).slice(0, 6);
      const first = images[0] || '';
      if (!first) {
        skipped += 1;
        console.log(`⚠️  ${title}: sin imagen alternativa`);
        await wait(120);
        continue;
      }

      if (apply) {
        const { error: updateError } = await supabase
          .from('user_product_listings')
          .update({
            images,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (updateError) {
          errors += 1;
          console.log(`❌ ${title}: ${updateError.message}`);
        } else {
          updated += 1;
          console.log(`✅ ${title} -> ${first}`);
        }
      } else {
        updated += 1;
        console.log(`🧪 ${title} -> ${first}`);
      }
    } catch (error: any) {
      errors += 1;
      console.log(`❌ ${title}: ${error?.message || error}`);
    }

    await wait(180);
  }

  console.log('\n📊 Resumen');
  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        scanned: rows.length,
        targets: targets.length,
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
