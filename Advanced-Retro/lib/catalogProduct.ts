export type CatalogPlatformSlug =
  | 'game-boy'
  | 'game-boy-color'
  | 'game-boy-advance'
  | 'super-nintendo'
  | 'gamecube'
  | 'consolas';

type CatalogRow = Record<string, any>;

const PLATFORM_MATCH_ORDER: Array<Exclude<CatalogPlatformSlug, 'consolas'>> = [
  'game-boy-color',
  'game-boy-advance',
  'super-nintendo',
  'gamecube',
  'game-boy',
];

const PLATFORM_ALIASES: Record<Exclude<CatalogPlatformSlug, 'consolas'>, string[]> = {
  'game-boy': ['game boy', 'gameboy', 'dmg 01', 'dmg 001'],
  'game-boy-color': ['game boy color', 'gameboy color', 'gbc'],
  'game-boy-advance': ['game boy advance', 'gameboy advance', 'gba'],
  'super-nintendo': ['super nintendo', 'super famicom', 'snes'],
  gamecube: ['gamecube', 'game cube', 'gcn'],
};

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCatalogText(value: unknown): string {
  return safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => normalizeCatalogText(value || '')).filter(Boolean))];
}

export function isConsoleHardwareProduct(product: CatalogRow): boolean {
  const category = normalizeCatalogText(product?.category || product?.category_id || '');
  const componentType = normalizeCatalogText(product?.component_type || '');
  const name = normalizeCatalogText(product?.name || '');
  const platform = normalizeCatalogText(product?.platform || '');

  return (
    componentType === 'consola' ||
    componentType === 'console' ||
    category.includes('consolas retro') ||
    category === 'consolas' ||
    category.includes('hardware') ||
    name.startsWith('consola ') ||
    name.includes(' consola ') ||
    platform === 'consolas'
  );
}

function getPlatformSignals(product: CatalogRow): string[] {
  return uniqueNonEmpty([
    product?.platform,
    product?.category,
    product?.category_id,
    product?.slug,
    product?.collection_key,
    product?.name,
  ]);
}

function signalMatchesAliases(signal: string, aliases: string[]): boolean {
  return aliases.some((alias) => signal.includes(alias));
}

export function getProductPlatformSlug(product: CatalogRow): CatalogPlatformSlug | null {
  const signals = getPlatformSignals(product);

  for (const platform of PLATFORM_MATCH_ORDER) {
    if (signals.some((signal) => signalMatchesAliases(signal, PLATFORM_ALIASES[platform]))) {
      return platform;
    }
  }

  if (isConsoleHardwareProduct(product)) {
    return 'consolas';
  }

  return null;
}

export function matchesProductPlatform(product: CatalogRow, slug: CatalogPlatformSlug): boolean {
  if (slug === 'consolas') {
    return isConsoleHardwareProduct(product);
  }

  return getProductPlatformSlug(product) === slug;
}

function getComponentFamily(product: CatalogRow): string {
  const componentType = normalizeCatalogText(product?.component_type || '');
  const name = normalizeCatalogText(product?.name || '');
  const category = normalizeCatalogText(product?.category || product?.category_id || '');

  if (componentType.includes('manual') || name.startsWith('manual ')) return 'manual';
  if (componentType.includes('insert') || name.startsWith('insert ') || name.includes(' inlay ')) return 'insert';
  if (componentType.includes('protector') || name.startsWith('protector ')) return 'protector';
  if (componentType.includes('consola') || componentType.includes('console') || isConsoleHardwareProduct(product)) return 'consola';
  if (name.startsWith('caja ') || category.includes('cajas')) return 'caja';
  if (Boolean(product?.is_mystery_box) || category.includes('mystery') || category.includes('cajas misteriosas')) return 'mystery';
  return componentType || 'juego';
}

function getEditionToken(product: CatalogRow): string {
  const source = normalizeCatalogText(`${safeText(product?.edition)} ${safeText(product?.name)}`);
  if (source.includes('repro') || source.includes('replica') || source.includes('reproduccion')) return 'repro';
  if (source.includes('original')) return 'original';
  if (source.includes('sin etiqueta')) return 'sin-etiqueta';
  return 'sin-especificar';
}

function getComparableName(product: CatalogRow): string {
  let source = safeText(product?.name || '');
  source = source
    .replace(/^Protector\s+juego\s+/i, '')
    .replace(/^Protector\s+caja\s+/i, '')
    .replace(/^Manual\s+/i, '')
    .replace(/^Insert\s*\(Inlay\)\s+/i, '')
    .replace(/^Insert\s+/i, '')
    .replace(/^Caja\s+/i, '');
  source = source.replace(/\s*\((Game Boy Color|Game Boy Advance|Game Boy|GameCube|Game Cube|Super Nintendo|SNES)\)\s*$/i, '');
  return normalizeCatalogText(source);
}

function getImageCandidates(product: CatalogRow): string[] {
  const list = Array.isArray(product?.images)
    ? product.images.map((entry: unknown) => safeText(entry).trim()).filter(Boolean)
    : [];
  const image = safeText(product?.image).trim();
  return [...new Set([...list, image].filter(Boolean))];
}

function compareCatalogRows(a: CatalogRow, b: CatalogRow): number {
  const aPlatformInName = Number(/\((Game Boy Color|Game Boy Advance|Game Boy|GameCube|Game Cube|Super Nintendo|SNES)\)/i.test(safeText(a?.name)));
  const bPlatformInName = Number(/\((Game Boy Color|Game Boy Advance|Game Boy|GameCube|Game Cube|Super Nintendo|SNES)\)/i.test(safeText(b?.name)));
  if (bPlatformInName !== aPlatformInName) return bPlatformInName - aPlatformInName;

  const imageDiff = getImageCandidates(b).length - getImageCandidates(a).length;
  if (imageDiff !== 0) return imageDiff;

  const stockDiff = safeNumber(b?.stock) - safeNumber(a?.stock);
  if (stockDiff !== 0) return stockDiff;

  const nameLengthDiff = safeText(b?.name).length - safeText(a?.name).length;
  if (nameLengthDiff !== 0) return nameLengthDiff;

  const updatedAtDiff = new Date(safeText(b?.updated_at) || 0).getTime() - new Date(safeText(a?.updated_at) || 0).getTime();
  if (updatedAtDiff !== 0) return updatedAtDiff;

  const createdAtDiff = new Date(safeText(b?.created_at) || 0).getTime() - new Date(safeText(a?.created_at) || 0).getTime();
  if (createdAtDiff !== 0) return createdAtDiff;

  return safeText(b?.id).localeCompare(safeText(a?.id));
}

export function getCatalogDeduplicationKey(product: CatalogRow): string {
  const name = getComparableName(product);
  const platform = getProductPlatformSlug(product) || 'sin-plataforma';
  const component = getComponentFamily(product);
  const edition = getEditionToken(product);
  return `${name}||${platform}||${component}||${edition}`;
}

export function dedupeCatalogProducts<T extends CatalogRow>(rows: T[]): T[] {
  const groups = new Map<string, T>();

  for (const row of rows) {
    const id = safeText(row?.id).trim();
    const name = safeText(row?.name).trim();
    if (!id || !name) continue;

    const key = getCatalogDeduplicationKey(row);
    const current = groups.get(key);
    if (!current || compareCatalogRows(row, current) < 0) {
      groups.set(key, row);
    }
  }

  return [...groups.values()].sort((a, b) => {
    const updatedAtDiff = new Date(safeText(b?.updated_at) || 0).getTime() - new Date(safeText(a?.updated_at) || 0).getTime();
    if (updatedAtDiff !== 0) return updatedAtDiff;

    const createdAtDiff = new Date(safeText(b?.created_at) || 0).getTime() - new Date(safeText(a?.created_at) || 0).getTime();
    if (createdAtDiff !== 0) return createdAtDiff;

    return safeText(b?.id).localeCompare(safeText(a?.id));
  });
}
