const PLACEHOLDER = '/placeholder.svg';
const GENERATED_PRODUCT_BASE = '/images/products/generated';
const generatedProductImage = (fileName: string) => `${GENERATED_PRODUCT_BASE}/${fileName}`;
const componentImage = (fileName: string) => `/images/components/${fileName}`;

function normalizeLookup(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

type PlatformAssetKey = 'gameboy' | 'gbc' | 'gba' | 'snes' | 'gamecube';
type ComponentAssetKey = 'manual' | 'insert' | 'protector_juego' | 'protector_caja' | 'caja';

const COMPONENT_IMAGE_BY_PLATFORM: Record<PlatformAssetKey, Record<ComponentAssetKey, string>> = {
  gameboy: {
    manual: componentImage('gameboy-manual.svg'),
    insert: componentImage('gameboy-insert.svg'),
    protector_juego: componentImage('gameboy-protector-juego.svg'),
    protector_caja: componentImage('gameboy-protector-caja.svg'),
    caja: componentImage('gameboy-caja.svg'),
  },
  gbc: {
    manual: componentImage('gbc-manual.svg'),
    insert: componentImage('gbc-insert.svg'),
    protector_juego: componentImage('gbc-protector-juego.svg'),
    protector_caja: componentImage('gbc-protector-caja.svg'),
    caja: componentImage('gbc-caja.svg'),
  },
  gba: {
    manual: componentImage('gba-manual.svg'),
    insert: componentImage('gba-insert.svg'),
    protector_juego: componentImage('gba-protector-juego.svg'),
    protector_caja: componentImage('gba-protector-caja.svg'),
    caja: componentImage('gba-caja.svg'),
  },
  snes: {
    manual: componentImage('snes-manual.svg'),
    insert: componentImage('snes-insert.svg'),
    protector_juego: componentImage('snes-protector-juego.svg'),
    protector_caja: componentImage('snes-protector-caja.svg'),
    caja: componentImage('snes-caja.svg'),
  },
  gamecube: {
    manual: componentImage('gamecube-manual.svg'),
    insert: componentImage('gamecube-insert.svg'),
    protector_juego: componentImage('gamecube-protector-juego.svg'),
    protector_caja: componentImage('gamecube-protector-caja.svg'),
    caja: componentImage('gamecube-caja.svg'),
  },
};

function detectPlatformAssetKey(product: any): PlatformAssetKey {
  const source = normalizeLookup(
    `${String(product?.platform || '')} ${String(product?.category || product?.category_id || '')} ${String(product?.name || '')}`
  );
  if (source.includes('gamecube') || source.includes('game cube')) return 'gamecube';
  if (source.includes('snes') || source.includes('super nintendo')) return 'snes';
  if (source.includes('gameboy advance') || source.includes('game boy advance') || source.includes('gba')) return 'gba';
  if (source.includes('gameboy color') || source.includes('game boy color') || source.includes('gbc')) return 'gbc';
  return 'gameboy';
}

function detectComponentAssetKey(product: any): ComponentAssetKey | null {
  const type = normalizeLookup(product?.component_type);
  const source = normalizeLookup(`${String(product?.name || '')} ${String(product?.category || '')}`);
  if (source.includes('mystery') || source.includes('misteriosa')) return null;

  if (type === 'manual' || source.includes('manual')) return 'manual';
  if (type === 'insert' || source.includes('insert') || source.includes('inlay') || source.includes('interior')) return 'insert';
  if (type === 'protector_caja' || (source.includes('protector') && source.includes('caja'))) return 'protector_caja';
  if (type === 'protector_juego' || type === 'protector' || source.includes('protector')) return 'protector_juego';
  if (type === 'caja' || source.includes('caja')) return 'caja';
  return null;
}

function getComponentImageOverride(product: any): string | null {
  const component = detectComponentAssetKey(product);
  if (!component) return null;
  const platform = detectPlatformAssetKey(product);
  return COMPONENT_IMAGE_BY_PLATFORM[platform][component] || null;
}

function getConsoleComponentImageOverride(product: any): string | null {
  const name = normalizeLookup(product?.name);
  const category = normalizeLookup(product?.category || product?.category_id);
  const componentType = normalizeLookup(product?.component_type);
  const source = `${name} ${category} ${componentType}`;

  if (source.includes('game boy light')) {
    return '/images/products/special-editions/console-special-gameboy-light.png';
  }

  const isConsoleComponent =
    name.includes('consola') ||
    category.includes('consolas-retro') ||
    category.includes('hardware') ||
    componentType.includes('consola') ||
    componentType.includes('console');

  if (!isConsoleComponent) return null;

  const platform = detectPlatformAssetKey(product);

  if (source.includes('protector')) return COMPONENT_IMAGE_BY_PLATFORM[platform].protector_caja;
  if (source.includes('insert') || source.includes('inlay') || source.includes('interior')) {
    return COMPONENT_IMAGE_BY_PLATFORM[platform].insert;
  }
  if (source.includes('manual')) return COMPONENT_IMAGE_BY_PLATFORM[platform].manual;
  if (source.includes('caja')) return COMPONENT_IMAGE_BY_PLATFORM[platform].caja;

  return null;
}

function getConsoleImageOverride(product: any): string | null {
  const name = normalizeLookup(product?.name);
  const category = normalizeLookup(product?.category || product?.category_id);
  const platform = normalizeLookup(product?.platform);
  const componentType = normalizeLookup(product?.component_type);

  const isConsoleDomain =
    category.includes('consola') ||
    category.includes('hardware') ||
    platform.includes('consola') ||
    name.startsWith('consola ') ||
    componentType.includes('console') ||
    componentType.includes('consola');

  if (!isConsoleDomain) return null;

  const platformKey = detectPlatformAssetKey(product);

  if (componentType.includes('manual')) return COMPONENT_IMAGE_BY_PLATFORM[platformKey].manual;
  if (componentType.includes('insert')) return COMPONENT_IMAGE_BY_PLATFORM[platformKey].insert;
  if (componentType.includes('protector')) return COMPONENT_IMAGE_BY_PLATFORM[platformKey].protector_caja;
  if (componentType === 'caja' || name.includes('caja consola')) return COMPONENT_IMAGE_BY_PLATFORM[platformKey].caja;

  if (name.includes('panasonic q')) return '/images/products/special-editions/console-special-panasonic-q.jpg';
  if (name.includes('game boy light')) return '/images/products/special-editions/console-special-gameboy-light.png';
  if (name.includes('pikachu')) return '/images/products/special-editions/console-special-gbc-pikachu.jpg';
  if (name.includes('nes classic') || name.includes('sp nes')) {
    return '/images/products/special-editions/console-special-gba-sp-nes.jpg';
  }
  if (name.includes('famicom jr') || name.includes('snes jr')) {
    return '/images/products/special-editions/console-special-snes-jr.jpg';
  }

  if (name.includes('playstation 2') || platform.includes('playstation-2') || platform.includes('ps2')) {
    return generatedProductImage('console-ps2-neon.png');
  }
  if (name.includes('dreamcast') || platform.includes('dreamcast')) {
    return generatedProductImage('console-dreamcast-neon.png');
  }
  if (
    name.includes('playstation') ||
    name.includes('ps1') ||
    name.includes('ps one') ||
    name.includes('psx') ||
    platform.includes('playstation') ||
    platform.includes('ps1') ||
    platform.includes('psx')
  ) {
    return generatedProductImage('console-ps1-neon.png');
  }
  if (name.includes('sega saturn') || name.includes('saturn') || platform.includes('saturn')) {
    return generatedProductImage('console-saturn-neon.png');
  }
  if (name.includes('mega drive') || name.includes('genesis') || platform.includes('mega-drive') || platform.includes('genesis')) {
    return generatedProductImage('console-genesis-neon.png');
  }
  if (
    name.includes('nintendo 64') ||
    name.includes(' n64') ||
    name.startsWith('n64') ||
    platform.includes('nintendo-64') ||
    platform.includes('n64')
  ) {
    return generatedProductImage('console-n64-neon.png');
  }
  if (
    name.includes('nintendo entertainment system') ||
    name.includes(' family computer') ||
    name.includes('famicom') ||
    name === 'nes' ||
    name.startsWith('nes ') ||
    platform.includes('nes') ||
    platform.includes('famicom')
  ) {
    return generatedProductImage('console-nes-neon.png');
  }

  if (name.includes('gamecube') || name.includes('game cube') || platform.includes('gamecube')) {
    return generatedProductImage('console-gamecube-neon.png');
  }
  if (name.includes('super nintendo') || name.includes('snes') || platform.includes('super-nintendo')) {
    return generatedProductImage('console-snes-neon.png');
  }
  if (name.includes('game boy advance sp') || name.includes('gba sp')) {
    return generatedProductImage('console-gba-sp-neon.png');
  }
  if (name.includes('game boy advance') || platform.includes('game-boy-advance') || platform.includes('gba')) {
    return generatedProductImage('console-gba-neon.png');
  }
  if (name.includes('game boy color') || platform.includes('game-boy-color') || platform.includes('gbc')) {
    return generatedProductImage('console-gameboy-transparent-neon.png');
  }
  if (name.includes('game boy pocket')) {
    return generatedProductImage('console-gameboy-classic-front-neon.png');
  }
  if (name.includes('game boy') || platform.includes('game-boy') || platform.includes('gb')) {
    return generatedProductImage('console-gameboy-classic-neon.png');
  }

  return generatedProductImage('console-gameboy-classic-neon.png');
}

function getStrongImageOverride(product: any): string | null {
  return (
    getConsoleComponentImageOverride(product) ||
    getComponentImageOverride(product) ||
    getConsoleImageOverride(product)
  );
}

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const value = url.trim();
  if (!value) return false;
  if (!(value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'))) {
    return false;
  }

  const lower = value.toLowerCase();
  // Fuentes históricas inestables o que apuntan a HTML en vez de imagen.
  if (lower.includes('splash.games.directory')) return false;
  if (lower.includes('gbxtreme.com/product/')) return false;

  const hasImageExt = /\.(jpg|jpeg|png|webp|gif|avif|heic|heif)(\?|$)/.test(lower);
  const knownImageHost =
    lower.includes('images.unsplash.com') ||
    lower.includes('/storage/v1/object/') ||
    lower.includes('/object/public/');

  return hasImageExt || knownImageHost || value.startsWith('/');
}

function scoreImageCandidate(url: string): number {
  const lower = String(url || '').toLowerCase();
  if (!lower) return 0;
  if (lower.includes('named_boxarts')) return 100;
  if (lower.includes('boxart')) return 95;
  if (lower.startsWith('/images/products/generated/')) return 98;
  if (lower.startsWith('/images/generated/')) return 92;
  if (lower.startsWith('/images/collections/')) return 86;
  if (lower.startsWith('/images/components/')) return 84;
  if (lower.includes('supabase.co/storage')) return 20;
  if (lower.includes('named_titles')) return 48;
  if (lower.includes('named_snaps')) return 36;
  return 60;
}

function parseImageCollection(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }

  if (typeof raw !== 'string') return [];
  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // Fall through to separator parsing.
    }
  }

  return value
    .split(/[\n,;|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getProductImageUrl(product: any): string {
  const strongOverride = getStrongImageOverride(product);
  if (strongOverride) return strongOverride;

  const fromArray = parseImageCollection(product?.images);
  const fromSingle = parseImageCollection(product?.image);
  const fromLegacy = parseImageCollection(product?.gallery_images);
  const candidates = [...fromArray, ...fromSingle, ...fromLegacy];
  const valid = candidates.filter(isValidImageUrl);
  if (valid.length > 0) {
    const sorted = [...valid].sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
    return sorted[0];
  }

  return getProductFallbackImageUrl(product);
}

export function getProductImageUrls(product: any): string[] {
  const strongOverride = getStrongImageOverride(product);
  const raw = [
    ...parseImageCollection(product?.images),
    ...parseImageCollection(product?.image),
    ...parseImageCollection(product?.gallery_images),
  ];

  const deduped = [...new Set(raw)];
  const valid = deduped
    .filter(isValidImageUrl)
    .sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
  if (strongOverride) {
    return [strongOverride, ...valid.filter((image) => image !== strongOverride)];
  }
  if (valid.length > 0) return valid;

  return [getProductFallbackImageUrl(product)];
}

export function getProductFallbackImageUrl(product: any): string {
  const strongOverride = getStrongImageOverride(product);
  if (strongOverride) return strongOverride;

  const name = String(product?.name || '').toLowerCase();
  const category = String(product?.category || product?.category_id || '').toLowerCase();
  const platform = String(product?.platform || '').toLowerCase();

  const has = (token: string) => name.includes(token) || category.includes(token) || platform.includes(token);
  const hasAny = (tokens: string[]) => tokens.some((token) => has(token));

  const componentFallback = getConsoleComponentImageOverride(product) || getComponentImageOverride(product);
  if (componentFallback) return componentFallback;

  if (category.includes('misterios') || category.includes('mystery') || Boolean(product?.is_mystery_box)) {
    if (name.includes('vip') || String(product?.slug || '').toLowerCase().includes('vip')) {
      return '/images/mystery/mystery-vip.webp';
    }
    if (name.includes('premium') || String(product?.slug || '').toLowerCase().includes('premium')) {
      return '/images/mystery/mystery-premium.webp';
    }
    return '/images/mystery/mystery-standard.webp';
  }

  if (
    category.includes('gamecube') ||
    platform.includes('gamecube') ||
    platform.includes('game cube') ||
    name.includes('gamecube') ||
    name.includes('game cube')
  ) {
    return generatedProductImage('console-gamecube-neon.png');
  }

  if (
    category.includes('super-nintendo') ||
    platform.includes('super-nintendo') ||
    platform.includes('snes') ||
    name.includes('super nintendo') ||
    name.includes('snes')
  ) {
    return generatedProductImage('cartridge-snes-neon.png');
  }

  if (
    category.includes('gameboy-advance') ||
    category.includes('game-boy-advance') ||
    platform.includes('game-boy-advance') ||
    platform.includes('gameboy advance') ||
    name.includes('game boy advance') ||
    name.includes('gameboy advance')
  ) {
    return generatedProductImage('cartridge-gba-neon.png');
  }

  if (
    category.includes('gameboy-color') ||
    category.includes('game-boy-color') ||
    platform.includes('game-boy-color') ||
    platform.includes('gameboy color') ||
    name.includes('game boy color') ||
    name.includes('gameboy color')
  ) {
    return generatedProductImage('cartridge-gameboy-neon.png');
  }

  if (
    category.includes('gameboy') ||
    category.includes('game-boy') ||
    platform.includes('game-boy') ||
    platform.includes('gameboy') ||
    name.includes('game boy')
  ) {
    return generatedProductImage('cartridge-gameboy-neon.png');
  }

  return generatedProductImage('controller-neon.png');
}
