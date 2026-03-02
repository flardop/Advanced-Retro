const PLACEHOLDER = '/placeholder.svg';

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

  if (category.includes('consola') || platform.includes('consola') || name.startsWith('consola ')) {
    return '/images/collections/consolas.svg';
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
