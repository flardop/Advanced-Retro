const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT_ID_REGEX = /^[0-9a-f]{6,12}$/i;
const LEGACY_ID_REGEX = /^[a-z0-9][a-z0-9._:-]{1,79}$/i;

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
  idPrefixCandidate: string | null;
  slugCandidate: string | null;
} {
  let safe = toSafeString(raw);
  try {
    safe = decodeURIComponent(safe);
  } catch {
    // Keep the original segment when URL decoding fails.
  }
  if (!safe) return { raw: '', idCandidate: null, idPrefixCandidate: null, slugCandidate: null };

  if (isUuidLike(safe)) {
    return { raw: safe, idCandidate: safe, idPrefixCandidate: null, slugCandidate: null };
  }

  // Legacy format: slug--<uuid>
  const withIdSuffix = safe.match(/^(.*)--([0-9a-f-]{36})$/i);
  if (withIdSuffix) {
    const slugCandidate = slugify(withIdSuffix[1] || '');
    const idCandidate = toSafeString(withIdSuffix[2] || '');
    return {
      raw: safe,
      idCandidate: isUuidLike(idCandidate) ? idCandidate : null,
      idPrefixCandidate: null,
      slugCandidate: slugCandidate || null,
    };
  }

  // New format: slug-p-<idToken>
  // idToken can be:
  // - uuid prefix (recommended short format),
  // - full legacy id (for non-UUID catalogs),
  // - full uuid (for compatibility).
  const withShortId = safe.match(/^(.*)-p-([a-z0-9._:-]{2,80})$/i);
  if (withShortId) {
    const slugCandidate = slugify(withShortId[1] || '');
    const idToken = toSafeString(withShortId[2] || '').toLowerCase();
    const isShortPrefix = SHORT_ID_REGEX.test(idToken) && !isUuidLike(idToken);
    const idCandidate =
      isUuidLike(idToken) || (LEGACY_ID_REGEX.test(idToken) && !isShortPrefix) ? idToken : null;
    const idPrefixCandidate =
      SHORT_ID_REGEX.test(idToken) || LEGACY_ID_REGEX.test(idToken) ? idToken : null;
    return {
      raw: safe,
      idCandidate,
      idPrefixCandidate,
      slugCandidate: slugCandidate || null,
    };
  }

  // Optional compatibility: slug--<idToken>
  const withLegacyShortId = safe.match(/^(.*)--([a-z0-9._:-]{2,80})$/i);
  if (withLegacyShortId) {
    const slugCandidate = slugify(withLegacyShortId[1] || '');
    const idToken = toSafeString(withLegacyShortId[2] || '').toLowerCase();
    const isShortPrefix = SHORT_ID_REGEX.test(idToken) && !isUuidLike(idToken);
    const idCandidate =
      isUuidLike(idToken) || (LEGACY_ID_REGEX.test(idToken) && !isShortPrefix) ? idToken : null;
    const idPrefixCandidate =
      SHORT_ID_REGEX.test(idToken) || LEGACY_ID_REGEX.test(idToken) ? idToken : null;
    return {
      raw: safe,
      idCandidate,
      idPrefixCandidate,
      slugCandidate: slugCandidate || null,
    };
  }

  return { raw: safe, idCandidate: null, idPrefixCandidate: null, slugCandidate: slugify(safe) || null };
}

function getRawSlug(product: any): string {
  const explicit = slugify(toSafeString(product?.slug));
  if (explicit) return explicit;
  return slugify(toSafeString(product?.name));
}

function getShortIdPrefix(value: unknown): string {
  const id = toSafeString(value).toLowerCase();
  if (!id) return '';
  if (isUuidLike(id)) {
    return id.split('-')[0] || '';
  }
  return id.replace(/[^a-z0-9._:-]/g, '').slice(0, 24);
}

export function getProductRouteSegment(product: any): string {
  const id = toSafeString(product?.id);
  const slug = getRawSlug(product);
  if (slug && id) {
    const shortPrefix = getShortIdPrefix(id);
    // Always include a short id prefix to avoid ambiguous slugs in catalogs with duplicates.
    if (shortPrefix) return `${slug}-p-${shortPrefix}`;
    return slug;
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
