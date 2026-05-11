const PLACEHOLDER = '/placeholder.svg';

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
    manual: '/images/products/consoles-extra/cartridge-dmg-back.png',
    insert: '/images/products/consoles-extra/cartridge-dmg-back.png',
    protector_juego: '/images/products/consoles-extra/cartridge-gbc-front.png',
    protector_caja: '/images/products/consoles-extra/cartridge-gbc-front.png',
    caja: '/images/products/consoles-extra/cartridge-dmg-front.png',
  },
  gbc: {
    manual: '/images/products/consoles-extra/cartridge-gbc-front.png',
    insert: '/images/products/consoles-extra/cartridge-gbc-front.png',
    protector_juego: '/images/products/consoles-extra/cartridge-gbc-front.png',
    protector_caja: '/images/products/consoles-extra/cartridge-gbc-front.png',
    caja: '/images/products/consoles-extra/cartridge-gbc-front.png',
  },
  gba: {
    manual: '/images/products/consoles-extra/cartridge-gba-front.png',
    insert: '/images/products/consoles-extra/cartridge-gba-front.png',
    protector_juego: '/images/products/consoles-extra/cartridge-gba-front.png',
    protector_caja: '/images/products/consoles-extra/cartridge-gba-front.png',
    caja: '/images/products/consoles-extra/cartridge-gba-front.png',
  },
  snes: {
    manual: '/images/products/consoles-extra/cartridge-snes-back-angled.png',
    insert: '/images/products/consoles-extra/cartridge-snes-back-angled.png',
    protector_juego: '/images/products/consoles-extra/cartridge-snes-back.png',
    protector_caja: '/images/products/consoles-extra/cartridge-snes-back.png',
    caja: '/images/products/consoles-extra/cartridge-snes-back-angled.png',
  },
  gamecube: {
    manual: '/images/products/console-gamecube.jpg',
    insert: '/images/products/console-gamecube.jpg',
    protector_juego: '/images/products/console-gamecube.jpg',
    protector_caja: '/images/products/console-gamecube.jpg',
    caja: '/images/products/console-gamecube.jpg',
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

  if (componentType.includes('manual')) return '/images/products/consoles-extra/cartridge-dmg-back.png';
  if (componentType.includes('insert')) return '/images/products/consoles-extra/cartridge-dmg-back.png';
  if (componentType.includes('protector')) return '/images/products/consoles-extra/cartridge-gbc-front.png';
  if (componentType === 'caja' || name.includes('caja consola')) return '/images/products/consoles-extra/cartridge-dmg-front.png';

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
    return '/images/products/consoles-extra/console-ps2-slim.png';
  }
  if (name.includes('dreamcast') || platform.includes('dreamcast')) {
    return '/images/products/consoles-extra/console-dreamcast.png';
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
    return '/images/products/consoles-extra/console-ps1.png';
  }
  if (name.includes('sega saturn') || name.includes('saturn') || platform.includes('saturn')) {
    return '/images/products/consoles-extra/console-sega-saturn.png';
  }
  if (name.includes('mega drive') || name.includes('genesis') || platform.includes('mega-drive') || platform.includes('genesis')) {
    return '/images/products/consoles-extra/console-genesis.png';
  }
  if (
    name.includes('nintendo 64') ||
    name.includes(' n64') ||
    name.startsWith('n64') ||
    platform.includes('nintendo-64') ||
    platform.includes('n64')
  ) {
    return '/images/products/consoles-extra/console-n64.png';
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
    return '/images/products/consoles-extra/console-nes-modern.png';
  }

  if (name.includes('gamecube') || name.includes('game cube') || platform.includes('gamecube')) {
    return '/images/products/console-gamecube.jpg';
  }
  if (name.includes('super nintendo') || name.includes('snes') || platform.includes('super-nintendo')) {
    return '/images/products/console-snes-pal.jpg';
  }
  if (name.includes('game boy advance sp') || name.includes('gba sp')) {
    return '/images/products/consoles-extra/console-gba-sp.png';
  }
  if (name.includes('game boy advance') || platform.includes('game-boy-advance') || platform.includes('gba')) {
    return '/images/products/console-gba.jpg';
  }
  if (name.includes('game boy color') || platform.includes('game-boy-color') || platform.includes('gbc')) {
    return '/images/products/console-gbc.jpg';
  }
  if (name.includes('game boy pocket')) {
    return '/images/products/consoles-extra/console-gameboy-pocket.png';
  }
  if (name.includes('game boy') || platform.includes('game-boy') || platform.includes('gb')) {
    return '/images/products/console-gb-dmg.jpg';
  }

  return '/images/products/console-gb-dmg.jpg';
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
  const fromArray = parseImageCollection(product?.images);
  const fromSingle = parseImageCollection(product?.image);
  const fromLegacy = parseImageCollection(product?.gallery_images);
  const candidates = [...fromArray, ...fromSingle, ...fromLegacy];
  const valid = candidates.filter(isValidImageUrl);
  if (valid.length > 0) {
    const sorted = [...valid].sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
    return sorted[0];
  }

  const componentOverride = getComponentImageOverride(product);
  if (componentOverride) return componentOverride;

  const consoleOverride = getConsoleImageOverride(product);
  if (consoleOverride) return consoleOverride;

  return getProductFallbackImageUrl(product);
}

export function getProductImageUrls(product: any): string[] {
  const raw = [
    ...parseImageCollection(product?.images),
    ...parseImageCollection(product?.image),
    ...parseImageCollection(product?.gallery_images),
  ];

  const deduped = [...new Set(raw)];
  const valid = deduped
    .filter(isValidImageUrl)
    .sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
  if (valid.length > 0) return valid;

  const componentOverride = getComponentImageOverride(product);
  if (componentOverride) return [componentOverride];

  const consoleOverride = getConsoleImageOverride(product);
  if (consoleOverride) return [consoleOverride];

  return [getProductFallbackImageUrl(product)];
}

export function getProductFallbackImageUrl(product: any): string {
  const componentOverride = getComponentImageOverride(product);
  if (componentOverride) return componentOverride;

  const consoleOverride = getConsoleImageOverride(product);
  if (consoleOverride) return consoleOverride;

  const name = String(product?.name || '').toLowerCase();
  const category = String(product?.category || product?.category_id || '').toLowerCase();
  const platform = String(product?.platform || '').toLowerCase();

  const has = (token: string) => name.includes(token) || category.includes(token) || platform.includes(token);
  const hasAny = (tokens: string[]) => tokens.some((token) => has(token));

  // Fallbacks específicos para componentes (evita placeholders en manuales/protectores/inserts).
  if (hasAny(['manual', 'manuales'])) {
    return '/images/fallbacks/manual.svg';
  }
  if (hasAny(['insert', 'inlay', 'interior'])) {
    return '/images/fallbacks/insert.svg';
  }
  if (has('protector') && hasAny(['caja', 'box'])) {
    return '/images/fallbacks/protector-caja.svg';
  }
  if (has('protector') || has('funda')) {
    return '/images/fallbacks/protector-juego.svg';
  }
  if (has('cartucho')) {
    return '/images/fallbacks/cartucho.svg';
  }
  if (has('caja')) {
    return '/images/fallbacks/caja.svg';
  }

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
    return '/images/collections/gamecube.svg';
  }

  if (
    category.includes('super-nintendo') ||
    platform.includes('super-nintendo') ||
    platform.includes('snes') ||
    name.includes('super nintendo') ||
    name.includes('snes')
  ) {
    return '/images/collections/super-nintendo.svg';
  }

  if (
    category.includes('gameboy-advance') ||
    category.includes('game-boy-advance') ||
    platform.includes('game-boy-advance') ||
    platform.includes('gameboy advance') ||
    name.includes('game boy advance') ||
    name.includes('gameboy advance')
  ) {
    return '/images/collections/game-boy-advance.svg';
  }

  if (
    category.includes('gameboy-color') ||
    category.includes('game-boy-color') ||
    platform.includes('game-boy-color') ||
    platform.includes('gameboy color') ||
    name.includes('game boy color') ||
    name.includes('gameboy color')
  ) {
    return '/images/collections/game-boy-color.svg';
  }

  if (
    category.includes('gameboy') ||
    category.includes('game-boy') ||
    platform.includes('game-boy') ||
    platform.includes('gameboy') ||
    name.includes('game boy')
  ) {
    return '/images/collections/game-boy.svg';
  }

  return PLACEHOLDER;
}
