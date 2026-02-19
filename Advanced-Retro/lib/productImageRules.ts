import type { CatalogImagePlatform } from './catalogPlatform';

const UNSPLASH_RETRO_1 =
  'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1200&h=1200&fit=crop&q=80';
const UNSPLASH_RETRO_2 =
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=1200&fit=crop&q=80';

const WIKIMEDIA_GB =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Game-Boy-FL.png/1920px-Game-Boy-FL.png';
const WIKIMEDIA_GBC =
  'https://upload.wikimedia.org/wikipedia/commons/2/26/Nintendo_Game_Boy_Color.png';

const LIBRETRO_GB_TETRIS =
  'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy/Named_Boxarts/Tetris.png';
const LIBRETRO_GB_POKEMON_RED =
  'https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy/Named_Boxarts/Pokemon%20-%20Red%20Version.png';

const KNOWN_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'thumbnails.libretro.com',
  'splash.games.directory',
  'images.igdb.com',
  'upload.wikimedia.org',
]);

function normalizeText(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isImageExtensionPath(pathname: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif|avif|svg)$/i.test(pathname);
}

export function isLikelyProductImageUrl(rawUrl: unknown): boolean {
  const url = String(rawUrl || '').trim();
  if (!url) return false;
  if (url.includes('/placeholder.svg') || url === '/placeholder.svg') return false;

  // rutas locales del proyecto
  if (url.startsWith('/')) {
    return true;
  }

  if (!/^https?:\/\//i.test(url)) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  // algunos productos traían URL de ficha HTML, no imagen
  if (host.endsWith('gbxtreme.com') && path.startsWith('/product/')) {
    return false;
  }

  if (KNOWN_IMAGE_HOSTS.has(host)) return true;
  if (host.includes('supabase.co') && path.includes('/storage/v1/object/public/')) return true;

  return isImageExtensionPath(path);
}

export function hasAnyValidProductImage(values: unknown[]): boolean {
  return (values || []).some((item) => isLikelyProductImageUrl(item));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

export function getFallbackImageUrls(input: {
  category?: string | null;
  platform?: CatalogImagePlatform | null;
  name?: string | null;
}): string[] {
  const category = normalizeText(input.category);
  const name = normalizeText(input.name);

  if (category.includes('cajas-misteriosas') || name.includes('mystery') || name.includes('misteriosa') || name.includes('ruleta')) {
    return unique([UNSPLASH_RETRO_1, UNSPLASH_RETRO_2]);
  }

  if (category.includes('consolas')) {
    return unique([WIKIMEDIA_GB, WIKIMEDIA_GBC, UNSPLASH_RETRO_1]);
  }

  if (category.includes('accesorios') || category.includes('manuales')) {
    return unique([UNSPLASH_RETRO_2, UNSPLASH_RETRO_1, LIBRETRO_GB_TETRIS]);
  }

  if (category.includes('cajas')) {
    return unique([LIBRETRO_GB_POKEMON_RED, LIBRETRO_GB_TETRIS, UNSPLASH_RETRO_2]);
  }

  if (category.includes('juegos') || String(input.platform || '').length > 0) {
    return unique([LIBRETRO_GB_TETRIS, LIBRETRO_GB_POKEMON_RED, UNSPLASH_RETRO_1]);
  }

  return unique([UNSPLASH_RETRO_1, UNSPLASH_RETRO_2, LIBRETRO_GB_TETRIS]);
}
