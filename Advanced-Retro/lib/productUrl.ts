const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toSafeString(value: unknown): string {
  return String(value ?? '').trim();
}

function slugify(input: string): string {
  return toSafeString(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 100);
}

export function isUuidLike(value: string): boolean {
  return UUID_V4_REGEX.test(toSafeString(value));
}

export function parseProductRouteParam(raw: string): {
  raw: string;
  idCandidate: string | null;
  slugCandidate: string | null;
} {
  const safe = decodeURIComponent(toSafeString(raw));
  if (!safe) return { raw: '', idCandidate: null, slugCandidate: null };

  if (isUuidLike(safe)) {
    return { raw: safe, idCandidate: safe, slugCandidate: null };
  }

  const withIdSuffix = safe.match(/^(.*)--([0-9a-f-]{36})$/i);
  if (withIdSuffix) {
    const slugCandidate = slugify(withIdSuffix[1] || '');
    const idCandidate = toSafeString(withIdSuffix[2] || '');
    return {
      raw: safe,
      idCandidate: isUuidLike(idCandidate) ? idCandidate : null,
      slugCandidate: slugCandidate || null,
    };
  }

  return { raw: safe, idCandidate: null, slugCandidate: slugify(safe) || null };
}

function getRawSlug(product: any): string {
  const explicit = slugify(toSafeString(product?.slug));
  if (explicit) return explicit;
  return slugify(toSafeString(product?.name));
}

export function getProductRouteSegment(product: any): string {
  const id = toSafeString(product?.id);
  const slug = getRawSlug(product);

  if (slug && id) {
    // If real slug exists in DB, keep cleaner URL. For generated slug fallback,
    // append id so routes always resolve even without slug column.
    if (toSafeString(product?.slug)) return slug;
    return `${slug}--${id}`;
  }
  if (slug) return slug;
  return id;
}

export function getProductHref(product: any, options?: { complete?: boolean }): string {
  const segment = getProductRouteSegment(product);
  if (!segment) return options?.complete ? '/tienda?complete=1' : '/tienda';
  const base = `/producto/${encodeURIComponent(segment)}`;
  return options?.complete ? `${base}?complete=1` : base;
}

