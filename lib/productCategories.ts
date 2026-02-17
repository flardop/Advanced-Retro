export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
};

const KNOWN_CATEGORY_META: Record<
  string,
  { name: string; description: string; sortOrder: number }
> = {
  'juegos-gameboy': {
    name: 'Juegos Game Boy',
    description: 'Cartuchos y juegos clásicos de Game Boy.',
    sortOrder: 1,
  },
  'cajas-gameboy': {
    name: 'Cajas Game Boy',
    description: 'Cajas repro y cajas para colección.',
    sortOrder: 2,
  },
  accesorios: {
    name: 'Accesorios',
    description: 'Manuales, fundas, pegatinas y complementos.',
    sortOrder: 3,
  },
  'cajas-misteriosas': {
    name: 'Cajas Misteriosas',
    description: 'Sorpresas retro para coleccionistas.',
    sortOrder: 4,
  },
};

function toSafeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPrettyName(slug: string): string {
  const meta = KNOWN_CATEGORY_META[slug];
  if (meta) return meta.name;
  return slug
    .split('-')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function getSortOrder(slug: string): number {
  const meta = KNOWN_CATEGORY_META[slug];
  return meta ? meta.sortOrder : 999;
}

export function buildCategoriesFromProducts(products: any[]): ProductCategory[] {
  const slugs = new Set<string>();

  for (const product of products || []) {
    const raw = String(product?.category || '').trim();
    if (!raw) continue;
    const slug = toSafeSlug(raw);
    if (slug) slugs.add(slug);
  }

  const categories = [...slugs].map((slug) => {
    const meta = KNOWN_CATEGORY_META[slug];
    return {
      id: slug,
      slug,
      name: toPrettyName(slug),
      description: meta?.description,
    };
  });

  categories.sort((a, b) => {
    const byOrder = getSortOrder(a.slug) - getSortOrder(b.slug);
    if (byOrder !== 0) return byOrder;
    return a.name.localeCompare(b.name);
  });

  return categories;
}

