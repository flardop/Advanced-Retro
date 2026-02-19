export function normalizeProductText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasToken(text: string, token: string): boolean {
  const safe = ` ${text} `;
  const key = ` ${token} `;
  return safe.includes(key);
}

export function buildBaseGameTitle(value: string): string {
  return normalizeProductText(value)
    .replace(
      /\b(caja|repro|replica|reproduccion|manual|insert|interior|protector|cartucho|pegatina|funda|game boy|color|advance|original|oficial|autentico|authentic|oem|version|edicion|completo|completa|complete|cib|solo)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}

export function scoreProductSimilarity(a: string, b: string): number {
  const aTokens = new Set(
    buildBaseGameTitle(a)
      .split(' ')
      .filter((token) => token.length >= 3)
  );
  const bTokens = new Set(
    buildBaseGameTitle(b)
      .split(' ')
      .filter((token) => token.length >= 3)
  );

  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

export function isManualProduct(product: any): boolean {
  const component = String(product?.component_type || '').toLowerCase();
  if (component === 'manual') return true;

  const category = String(product?.category || product?.category_id || '').toLowerCase();
  const source = normalizeProductText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );

  if (category === 'manuales' || category.includes('manual')) return true;

  return (
    hasToken(source, 'manual') ||
    hasToken(source, 'manuales') ||
    hasToken(source, 'instrucciones') ||
    (hasToken(source, 'instruction') && hasToken(source, 'booklet'))
  );
}

export function isInsertProduct(product: any): boolean {
  const component = String(product?.component_type || '').toLowerCase();
  if (component === 'insert') return true;

  const category = String(product?.category || product?.category_id || '').toLowerCase();
  const source = normalizeProductText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );

  if (category.includes('insert') || category.includes('inlay')) return true;
  return hasToken(source, 'insert') || hasToken(source, 'inlay') || hasToken(source, 'interior');
}

export function isGameProtectorProduct(product: any): boolean {
  const component = String(product?.component_type || '').toLowerCase();
  if (component === 'protector_juego') return true;

  const source = normalizeProductText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );
  return (
    hasToken(source, 'protector') &&
    (hasToken(source, 'juego') || hasToken(source, 'cartucho') || hasToken(source, 'game'))
  );
}

export function isBoxProtectorProduct(product: any): boolean {
  const component = String(product?.component_type || '').toLowerCase();
  if (component === 'protector_caja') return true;

  const source = normalizeProductText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );
  return hasToken(source, 'protector') && (hasToken(source, 'caja') || hasToken(source, 'box'));
}

export function isBoxProduct(product: any): boolean {
  const component = String(product?.component_type || '').toLowerCase();
  if (component === 'caja') return true;

  const category = String(product?.category || product?.category_id || '').toLowerCase();
  const source = normalizeProductText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );

  if (category === 'cajas-gameboy' || category.includes('caja')) return true;
  return hasToken(source, 'caja') || hasToken(source, 'box');
}

export function isAccessoryProduct(product: any): boolean {
  const category = String(product?.category || product?.category_id || '').toLowerCase();
  return category === 'accesorios' || category.includes('accesorio');
}

export function isMainGameProduct(product: any): boolean {
  const component = String(product?.component_type || '').toLowerCase();
  if (component && component !== 'full_game' && component !== 'cartucho') return false;

  const category = String(product?.category || product?.category_id || '').toLowerCase();
  const isGameCategory = category.startsWith('juegos-') || category === 'consolas-retro';
  if (category && !isGameCategory) return false;
  if (isManualProduct(product)) return false;
  if (isBoxProduct(product)) return false;
  return true;
}

export function isCompleteGameProduct(product: any, allProducts: any[]): boolean {
  const source = normalizeProductText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );

  if (
    hasToken(source, 'completo') ||
    hasToken(source, 'completa') ||
    hasToken(source, 'complete') ||
    hasToken(source, 'cib')
  ) {
    return true;
  }

  if (!isMainGameProduct(product)) return false;

  const baseName = String(product?.name || '');
  const baseCollection = normalizeProductText(String(product?.collection_key || ''));
  let hasManualMatch = false;
  let hasBoxMatch = false;
  let hasInsertMatch = false;
  let hasGameProtectorMatch = false;
  let hasBoxProtectorMatch = false;

  for (const candidate of allProducts || []) {
    if (!candidate || String(candidate?.id) === String(product?.id)) continue;
    if (Number(candidate?.stock || 0) <= 0) continue;

    const candidateCollection = normalizeProductText(String(candidate?.collection_key || ''));
    const score =
      baseCollection && candidateCollection === baseCollection
        ? 1
        : scoreProductSimilarity(baseName, String(candidate?.name || ''));
    if (score < 0.45) continue;

    if (isManualProduct(candidate)) hasManualMatch = true;
    if (isBoxProduct(candidate)) hasBoxMatch = true;
    if (isInsertProduct(candidate)) hasInsertMatch = true;
    if (isGameProtectorProduct(candidate)) hasGameProtectorMatch = true;
    if (isBoxProtectorProduct(candidate)) hasBoxProtectorMatch = true;

    if (
      hasManualMatch &&
      hasBoxMatch &&
      hasInsertMatch &&
      hasGameProtectorMatch &&
      hasBoxProtectorMatch
    ) {
      return true;
    }
  }

  return false;
}
