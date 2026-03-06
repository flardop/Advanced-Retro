const PLACEHOLDER = '/placeholder.svg';

function normalizeLookup(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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

  if (componentType.includes('manual')) return '/images/products/console-manual-gb.jpg';
  if (componentType.includes('insert')) return '/images/products/console-insert-universal.jpg';
  if (componentType.includes('protector')) return '/images/products/console-protector-universal.jpg';
  if (componentType === 'caja' || name.includes('caja consola')) return '/images/products/console-box-gb.jpg';

  if (name.includes('panasonic q')) return '/images/products/special-editions/console-special-panasonic-q.jpg';
  if (name.includes('game boy light')) return '/images/products/special-editions/console-special-gameboy-light.png';
  if (name.includes('pikachu')) return '/images/products/special-editions/console-special-gbc-pikachu.jpg';
  if (name.includes('nes classic') || name.includes('sp nes')) {
    return '/images/products/special-editions/console-special-gba-sp-nes.jpg';
  }
  if (name.includes('famicom jr') || name.includes('snes jr')) {
    return '/images/products/special-editions/console-special-snes-jr.jpg';
  }

  if (name.includes('gamecube') || name.includes('game cube') || platform.includes('gamecube')) {
    return '/images/products/console-gamecube.jpg';
  }
  if (name.includes('super nintendo') || name.includes('snes') || platform.includes('super-nintendo')) {
    return '/images/products/console-snes-pal.jpg';
  }
  if (name.includes('game boy advance') || platform.includes('game-boy-advance') || platform.includes('gba')) {
    return '/images/products/console-gba.jpg';
  }
  if (name.includes('game boy color') || platform.includes('game-boy-color') || platform.includes('gbc')) {
    return '/images/products/console-gbc.jpg';
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
  const consoleOverride = getConsoleImageOverride(product);
  if (consoleOverride) return consoleOverride;

  const fromArray = parseImageCollection(product?.images);
  const fromSingle = parseImageCollection(product?.image);
  const fromLegacy = parseImageCollection(product?.gallery_images);
  const candidates = [...fromArray, ...fromSingle, ...fromLegacy];
  for (const candidate of candidates) {
    if (isValidImageUrl(candidate)) return candidate;
  }
  return getProductFallbackImageUrl(product);
}

export function getProductImageUrls(product: any): string[] {
  const raw = [
    ...parseImageCollection(product?.images),
    ...parseImageCollection(product?.image),
    ...parseImageCollection(product?.gallery_images),
  ];

  const deduped = [...new Set(raw)];
  const valid = deduped.filter(isValidImageUrl);
  return valid.length > 0 ? valid : [getProductFallbackImageUrl(product)];
}

export function getProductFallbackImageUrl(product: any): string {
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
    return '/images/mystery-box-5.png';
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
