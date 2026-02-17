export function normalizeProductText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isManualProduct(product: any): boolean {
  const category = String(product?.category || product?.category_id || '').toLowerCase();
  const source = normalizeProductText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );

  if (category === 'manuales' || category.includes('manual')) return true;

  return (
    source.includes(' manual ') ||
    source.startsWith('manual ') ||
    source.endsWith(' manual') ||
    source.includes(' instrucciones ') ||
    source.includes(' instruction booklet ')
  );
}
