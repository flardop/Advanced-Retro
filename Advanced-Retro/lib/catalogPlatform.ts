export type CatalogImagePlatform =
  | 'game-boy'
  | 'game-boy-color'
  | 'game-boy-advance'
  | 'super-nintendo'
  | 'gamecube';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripProductNameForExternalSearch(name: string): string {
  return normalizeText(name)
    .replace(
      /\b(caja|manual|insert|inlay|interior|protector|cartucho|funda|pegatina|poster|subscription|suscripcion|consola|console)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bgame boy color\b/g, 'gameboy color')
    .replace(/\bgame boy advance\b/g, 'gameboy advance')
    .replace(/\bgame boy\b/g, 'gameboy');
}

export function detectImagePlatformFromProduct(input: {
  category?: string | null;
  name?: string | null;
}): CatalogImagePlatform {
  const category = normalizeText(String(input.category || ''));
  const name = normalizeText(String(input.name || ''));
  const source = `${category} ${name}`.trim();

  if (source.includes('gamecube')) return 'gamecube';
  if (source.includes('super nintendo') || source.includes('snes')) return 'super-nintendo';
  if (source.includes('gameboy advance') || source.includes('game boy advance')) return 'game-boy-advance';
  if (source.includes('gameboy color') || source.includes('game boy color')) return 'game-boy-color';
  return 'game-boy';
}

export function toPriceChartingConsoleName(input: {
  category?: string | null;
  name?: string | null;
}): string {
  const platform = detectImagePlatformFromProduct(input);
  switch (platform) {
    case 'game-boy-color':
      return 'GameBoy Color';
    case 'game-boy-advance':
      return 'GameBoy Advance';
    case 'super-nintendo':
      return 'Super Nintendo';
    case 'gamecube':
      return 'Gamecube';
    case 'game-boy':
    default:
      return 'GameBoy';
  }
}
