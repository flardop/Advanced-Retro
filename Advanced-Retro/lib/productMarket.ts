type MarketProductInput = {
  name?: unknown;
  category?: unknown;
  is_mystery_box?: unknown;
  isMysteryBox?: unknown;
};

function normalize(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isMysteryOrRouletteProduct(input: MarketProductInput): boolean {
  if (input?.is_mystery_box === true || input?.isMysteryBox === true) {
    return true;
  }

  const category = normalize(input?.category);
  const name = normalize(input?.name);
  const source = `${category} ${name}`.trim();

  if (!source) return false;

  return (
    source.includes('cajas-misteriosas') ||
    source.includes('mystery') ||
    source.includes('misteriosa') ||
    source.includes('ruleta') ||
    source.includes('tirada')
  );
}
