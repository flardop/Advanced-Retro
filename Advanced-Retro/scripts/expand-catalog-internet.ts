/**
 * Amplía catálogo con juegos de varias consolas + consolas retro
 * y asigna imágenes desde internet (LibRetro + Wikipedia).
 *
 * Uso:
 *   npx tsx scripts/expand-catalog-internet.ts
 *   npx tsx scripts/expand-catalog-internet.ts --force
 */

import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { searchGameImages } from '../lib/gameImages';
import {
  detectImagePlatformFromProduct,
  stripProductNameForExternalSearch,
  type CatalogImagePlatform,
} from '../lib/catalogPlatform';

type BaseGameSeed = {
  title: string;
  category: string;
  platform: CatalogImagePlatform;
  price: number;
  stock: number;
};

type ConsoleSeed = {
  label: string;
  wikiTitle: string;
  platform: CatalogImagePlatform;
  price: number;
  stock: number;
};

type ProductPayload = {
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
};

const force = process.argv.includes('--force');

const BOX_CATEGORY_BY_PLATFORM: Record<CatalogImagePlatform, string> = {
  'game-boy': 'cajas-gameboy',
  'game-boy-color': 'cajas-gameboy',
  'game-boy-advance': 'cajas-gameboy',
  'super-nintendo': 'cajas-gameboy',
  gamecube: 'cajas-gameboy',
};

const GAME_SEEDS: BaseGameSeed[] = [
  {
    title: 'Pokemon Crystal (Game Boy Color)',
    category: 'juegos-gameboy',
    platform: 'game-boy-color',
    price: 7999,
    stock: 8,
  },
  {
    title: 'The Legend of Zelda: Oracle of Ages (Game Boy Color)',
    category: 'juegos-gameboy',
    platform: 'game-boy-color',
    price: 5499,
    stock: 9,
  },
  {
    title: 'Wario Land 3 (Game Boy Color)',
    category: 'juegos-gameboy',
    platform: 'game-boy-color',
    price: 4499,
    stock: 10,
  },
  {
    title: 'Pokemon Emerald (Game Boy Advance)',
    category: 'juegos-gameboy',
    platform: 'game-boy-advance',
    price: 9999,
    stock: 6,
  },
  {
    title: 'Metroid Fusion (Game Boy Advance)',
    category: 'juegos-gameboy',
    platform: 'game-boy-advance',
    price: 6999,
    stock: 9,
  },
  {
    title: 'The Legend of Zelda: The Minish Cap (Game Boy Advance)',
    category: 'juegos-gameboy',
    platform: 'game-boy-advance',
    price: 7499,
    stock: 7,
  },
  {
    title: 'Super Metroid (Super Nintendo)',
    category: 'juegos-gameboy',
    platform: 'super-nintendo',
    price: 9999,
    stock: 6,
  },
  {
    title: 'Chrono Trigger (Super Nintendo)',
    category: 'juegos-gameboy',
    platform: 'super-nintendo',
    price: 12999,
    stock: 5,
  },
  {
    title: 'The Legend of Zelda: A Link to the Past (Super Nintendo)',
    category: 'juegos-gameboy',
    platform: 'super-nintendo',
    price: 8999,
    stock: 8,
  },
  {
    title: 'The Legend of Zelda: The Wind Waker (GameCube)',
    category: 'juegos-gameboy',
    platform: 'gamecube',
    price: 7999,
    stock: 7,
  },
  {
    title: 'Metroid Prime (GameCube)',
    category: 'juegos-gameboy',
    platform: 'gamecube',
    price: 5999,
    stock: 9,
  },
  {
    title: 'Super Smash Bros. Melee (GameCube)',
    category: 'juegos-gameboy',
    platform: 'gamecube',
    price: 6999,
    stock: 7,
  },
];

const CONSOLE_SEEDS: ConsoleSeed[] = [
  {
    label: 'Consola Game Boy DMG-01',
    wikiTitle: 'Game Boy',
    platform: 'game-boy',
    price: 13999,
    stock: 4,
  },
  {
    label: 'Consola Game Boy Color',
    wikiTitle: 'Game Boy Color',
    platform: 'game-boy-color',
    price: 11999,
    stock: 5,
  },
  {
    label: 'Consola Game Boy Advance',
    wikiTitle: 'Game Boy Advance',
    platform: 'game-boy-advance',
    price: 10999,
    stock: 5,
  },
  {
    label: 'Consola Super Nintendo',
    wikiTitle: 'Super Nintendo Entertainment System',
    platform: 'super-nintendo',
    price: 16999,
    stock: 3,
  },
  {
    label: 'Consola Nintendo GameCube',
    wikiTitle: 'GameCube',
    platform: 'gamecube',
    price: 14999,
    stock: 3,
  },
];

async function loadEnvFileIfNeeded(projectRoot: string) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;

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

function uniqueUrls(list: string[]): string[] {
  return [...new Set(list.map((item) => item.trim()).filter(Boolean))];
}

function roundTo50(cents: number): number {
  return Math.round(cents / 50) * 50;
}

function splitImageSet(images: string[]) {
  const first = images[0] || '';
  const title = images.find((url) => url.includes('/Named_Titles/')) || '';
  const snap = images.find((url) => url.includes('/Named_Snaps/')) || '';
  const box = images.find((url) => url.includes('/Named_Boxarts/')) || first;

  return {
    boxImages: uniqueUrls([box, title, snap].filter(Boolean)),
    manualImages: uniqueUrls([title, snap, box].filter(Boolean)),
    insertImages: uniqueUrls([snap, title, box].filter(Boolean)),
  };
}

async function fetchWikipediaImage(pageTitle: string): Promise<string | null> {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', pageTitle);
  url.searchParams.set('prop', 'pageimages');
  url.searchParams.set('format', 'json');
  url.searchParams.set('pithumbsize', '1920');

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AdvancedRetro/1.0 (catalog seeder)' },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as any;
    const pages = payload?.query?.pages || {};
    for (const key of Object.keys(pages)) {
      const candidate = pages[key]?.thumbnail?.source;
      if (typeof candidate === 'string' && candidate.startsWith('http')) {
        return candidate;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function upsertProduct(supabase: any, product: ProductPayload) {
  const image = product.images[0] || null;
  const payload = {
    name: product.name,
    category: product.category,
    description: product.description,
    price: Math.max(50, Math.round(product.price)),
    stock: Math.max(0, Math.round(product.stock)),
    is_mystery_box: false,
    image,
    images: product.images,
  };

  const { data: existing, error: findError } = await supabase
    .from('products')
    .select('id,image,images')
    .eq('name', product.name)
    .eq('category', product.category)
    .limit(1);

  if (findError) {
    throw new Error(`Error buscando "${product.name}": ${findError.message}`);
  }

  const row = existing?.[0];
  if (!row) {
    const { error: insertError } = await (supabase.from('products') as any).insert(payload);
    if (insertError) {
      throw new Error(`Error creando "${product.name}": ${insertError.message}`);
    }
    return 'created';
  }

  const currentImages = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  const hasStrongImages = currentImages.length >= 2 || (typeof row.image === 'string' && row.image.startsWith('http'));
  if (!force && hasStrongImages) {
    return 'skipped';
  }

  const { error: updateError } = await (supabase
    .from('products')
    .update(payload)
    .eq('id', row.id) as any);

  if (updateError) {
    throw new Error(`Error actualizando "${product.name}": ${updateError.message}`);
  }
  return 'updated';
}

function buildGameBundle(seed: BaseGameSeed, gameImages: string[]): ProductPayload[] {
  const pieces = splitImageSet(gameImages);
  const mainImages = pieces.boxImages.length > 0 ? pieces.boxImages : gameImages;
  const basePrice = Math.max(100, Math.round(seed.price));

  return [
    {
      name: seed.title,
      category: seed.category,
      description: `${seed.title} para coleccionistas retro.`,
      price: basePrice,
      stock: seed.stock,
      images: mainImages,
    },
    {
      name: `Caja ${seed.title}`,
      category: BOX_CATEGORY_BY_PLATFORM[seed.platform],
      description: `Caja para ${seed.title}.`,
      price: Math.max(600, roundTo50(basePrice * 0.2)),
      stock: Math.max(6, Math.round(seed.stock * 1.4)),
      images: pieces.boxImages,
    },
    {
      name: `Manual ${seed.title}`,
      category: 'accesorios',
      description: `Manual para ${seed.title}.`,
      price: Math.max(700, roundTo50(basePrice * 0.16)),
      stock: Math.max(6, Math.round(seed.stock * 1.5)),
      images: pieces.manualImages,
    },
    {
      name: `Insert (Inlay) ${seed.title}`,
      category: 'accesorios',
      description: `Insert interior para ${seed.title}.`,
      price: 250,
      stock: Math.max(8, Math.round(seed.stock * 1.8)),
      images: pieces.insertImages,
    },
    {
      name: `Protector juego ${seed.title}`,
      category: 'accesorios',
      description: `Protector para cartucho o disco de ${seed.title}.`,
      price: 300,
      stock: Math.max(8, Math.round(seed.stock * 1.8)),
      images: pieces.insertImages,
    },
    {
      name: `Protector caja ${seed.title}`,
      category: 'accesorios',
      description: `Protector para caja de ${seed.title}.`,
      price: 350,
      stock: Math.max(8, Math.round(seed.stock * 1.8)),
      images: pieces.boxImages,
    },
  ];
}

function buildConsoleBundle(seed: ConsoleSeed, imageUrl: string): ProductPayload[] {
  const images = uniqueUrls([imageUrl]);

  return [
    {
      name: seed.label,
      category: 'accesorios',
      description: `${seed.label} revisada y lista para colección.`,
      price: seed.price,
      stock: seed.stock,
      images,
    },
    {
      name: `Caja consola ${seed.label.replace(/^Consola\s+/i, '')}`,
      category: 'accesorios',
      description: `Caja para ${seed.label}.`,
      price: Math.max(3500, roundTo50(seed.price * 0.22)),
      stock: Math.max(4, seed.stock + 2),
      images,
    },
    {
      name: `Manual consola ${seed.label.replace(/^Consola\s+/i, '')}`,
      category: 'accesorios',
      description: `Manual de uso para ${seed.label}.`,
      price: 1900,
      stock: Math.max(6, seed.stock + 4),
      images,
    },
    {
      name: `Insert consola ${seed.label.replace(/^Consola\s+/i, '')}`,
      category: 'accesorios',
      description: `Insert interior para caja de ${seed.label}.`,
      price: 500,
      stock: Math.max(8, seed.stock + 5),
      images,
    },
    {
      name: `Protector consola ${seed.label.replace(/^Consola\s+/i, '')}`,
      category: 'accesorios',
      description: `Protector exterior para ${seed.label}.`,
      price: 800,
      stock: Math.max(8, seed.stock + 5),
      images,
    },
  ];
}

async function main() {
  await loadEnvFileIfNeeded(process.cwd());

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`Mode: ${force ? 'FORCE' : 'SAFE'} | Seeding juegos y consolas...`);

  for (const seed of GAME_SEEDS) {
    const query = stripProductNameForExternalSearch(seed.title) || seed.title;
    const images = await searchGameImages({
      gameName: query,
      platform: detectImagePlatformFromProduct({ category: seed.category, name: seed.title }),
      preferSource: 'libretro',
    });
    const imageUrls = uniqueUrls(images.map((item) => item.url)).filter(
      (url) => url && url !== '/placeholder.svg'
    );
    if (imageUrls.length === 0) {
      console.warn(`⚠️ Sin imagen para juego: ${seed.title}`);
      continue;
    }

    const bundle = buildGameBundle(seed, imageUrls);
    for (const product of bundle) {
      const status = await upsertProduct(supabase, product);
      if (status === 'created') created += 1;
      else if (status === 'updated') updated += 1;
      else skipped += 1;
    }
  }

  for (const seed of CONSOLE_SEEDS) {
    const wikiImage = await fetchWikipediaImage(seed.wikiTitle);
    if (!wikiImage) {
      console.warn(`⚠️ Sin imagen Wikipedia para ${seed.label}`);
      continue;
    }

    const bundle = buildConsoleBundle(seed, wikiImage);
    for (const product of bundle) {
      const status = await upsertProduct(supabase, product);
      if (status === 'created') created += 1;
      else if (status === 'updated') updated += 1;
      else skipped += 1;
    }
  }

  console.log('--- Resultado expansión catálogo ---');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch((error) => {
  console.error(`❌ ${error?.message || error}`);
  process.exit(1);
});
