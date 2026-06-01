import type { CatalogImagePlatform } from './catalogPlatform';

const GENERATED_PRODUCT_BASE = '/images/products/generated';
const generatedProductImage = (fileName: string) => `${GENERATED_PRODUCT_BASE}/${fileName}`;

const UNSPLASH_RETRO_1 =
  'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1200&h=1200&fit=crop&q=80';
const UNSPLASH_RETRO_2 =
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=1200&fit=crop&q=80';

const CONSOLE_BOX_GB = generatedProductImage('gameboy-box-neon.png');
const CONSOLE_INSERT_UNIVERSAL = generatedProductImage('cartridge-gameboy-neon.png');
const CONSOLE_MANUAL_GB = generatedProductImage('cartridge-gameboy-neon.png');
const CONSOLE_PROTECTOR_UNIVERSAL = generatedProductImage('gameboy-protector-neon.png');
const CONSOLE_GAMEBOY_LIGHT = '/images/products/special-editions/console-special-gameboy-light.png';

const COMPONENT_IMAGE_BY_PLATFORM: Record<string, Record<'caja' | 'insert' | 'manual' | 'protector', string>> = {
  gameboy: {
    caja: CONSOLE_BOX_GB,
    insert: CONSOLE_INSERT_UNIVERSAL,
    manual: CONSOLE_MANUAL_GB,
    protector: CONSOLE_PROTECTOR_UNIVERSAL,
  },
  gbc: {
    caja: generatedProductImage('gameboy-box-neon.png'),
    insert: generatedProductImage('cartridge-gameboy-neon.png'),
    manual: generatedProductImage('cartridge-gameboy-neon.png'),
    protector: generatedProductImage('gameboy-protector-neon.png'),
  },
  gba: {
    caja: generatedProductImage('cartridge-gba-neon.png'),
    insert: generatedProductImage('cartridge-gba-neon.png'),
    manual: generatedProductImage('cartridge-gba-neon.png'),
    protector: generatedProductImage('gameboy-protector-neon.png'),
  },
  snes: {
    caja: generatedProductImage('cartridge-snes-neon.png'),
    insert: generatedProductImage('cartridge-snes-neon.png'),
    manual: generatedProductImage('cartridge-snes-neon.png'),
    protector: generatedProductImage('cartridge-snes-neon.png'),
  },
  gamecube: {
    caja: generatedProductImage('console-gamecube-neon.png'),
    insert: generatedProductImage('console-gamecube-neon.png'),
    manual: generatedProductImage('console-gamecube-neon.png'),
    protector: generatedProductImage('console-gamecube-neon.png'),
  },
};

const KNOWN_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'thumbnails.libretro.com',
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

  // No usar imágenes subidas por usuarios al bucket de comunidad como imagen de catálogo.
  if (path.includes('/community-listings/')) {
    return false;
  }

  // Muchas rutas de splash históricas están caídas (404) en este catálogo.
  // Preferimos reemplazarlas por fuentes estables.
  if (host === 'splash.games.directory') {
    return false;
  }

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
  const platform = normalizeText(input.platform);
  const source = `${name} ${category} ${platform}`;
  const platformKey = source.includes('gamecube') || source.includes('game cube')
    ? 'gamecube'
    : source.includes('super nintendo') || source.includes('snes')
      ? 'snes'
      : source.includes('game boy advance') || source.includes('gameboy advance') || source.includes('gba')
        ? 'gba'
        : source.includes('game boy color') || source.includes('gameboy color') || source.includes('gbc')
          ? 'gbc'
          : 'gameboy';

  if (source.includes('game boy light')) {
    return unique([CONSOLE_GAMEBOY_LIGHT]);
  }

  const isConsoleComponent =
    source.includes('consola') ||
    category.includes('consolas-retro') ||
    category.includes('hardware');

  if (isConsoleComponent && source.includes('protector')) {
    return unique([COMPONENT_IMAGE_BY_PLATFORM[platformKey].protector]);
  }

  if (isConsoleComponent && (source.includes('insert') || source.includes('inlay') || source.includes('interior'))) {
    return unique([COMPONENT_IMAGE_BY_PLATFORM[platformKey].insert]);
  }

  if (isConsoleComponent && source.includes('manual')) {
    return unique([COMPONENT_IMAGE_BY_PLATFORM[platformKey].manual]);
  }

  if (isConsoleComponent && source.includes('caja')) {
    return unique([COMPONENT_IMAGE_BY_PLATFORM[platformKey].caja]);
  }

  if (category.includes('cajas-misteriosas') || name.includes('mystery') || name.includes('misteriosa') || name.includes('ruleta')) {
    return unique([UNSPLASH_RETRO_1, UNSPLASH_RETRO_2]);
  }

  if (category.includes('consolas')) {
    return unique([
      generatedProductImage('console-gameboy-classic-neon.png'),
      generatedProductImage('console-snes-neon.png'),
      generatedProductImage('console-ps1-neon.png'),
    ]);
  }

  if (category.includes('accesorios') || category.includes('manuales')) {
    return unique([
      generatedProductImage('controller-neon.png'),
      generatedProductImage('gameboy-protector-neon.png'),
      generatedProductImage('cartridge-gameboy-neon.png'),
    ]);
  }

  if (category.includes('cajas')) {
    return unique([
      generatedProductImage('gameboy-box-neon.png'),
      generatedProductImage('cartridge-gameboy-neon.png'),
      generatedProductImage('cartridge-gba-neon.png'),
    ]);
  }

  if (category.includes('juegos') || String(input.platform || '').length > 0) {
    return unique([
      generatedProductImage('cartridge-gameboy-neon.png'),
      generatedProductImage('cartridge-gba-neon.png'),
      generatedProductImage('cartridge-snes-neon.png'),
    ]);
  }

  return unique([
    generatedProductImage('controller-neon.png'),
    generatedProductImage('console-gameboy-classic-neon.png'),
    generatedProductImage('cartridge-gameboy-neon.png'),
  ]);
}
