const DEFAULT_SITE_URL = 'https://advancedretro.es';
const RETROVILLE_ROUTE_PREFIX = '/retroville';

function ensureAbsoluteUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  return parsed.origin;
}

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    '';

  if (!configured) {
    return DEFAULT_SITE_URL;
  }

  try {
    return ensureAbsoluteUrl(configured);
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function isRetrovilleStandalone(): boolean {
  return (
    process.env.NEXT_PUBLIC_RETROVILLE_STANDALONE === 'true' ||
    process.env.RETROVILLE_STANDALONE === 'true'
  );
}

export function retrovillePublicPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!isRetrovilleStandalone()) return normalized;
  if (normalized === RETROVILLE_ROUTE_PREFIX) return '/';
  if (normalized.startsWith(`${RETROVILLE_ROUTE_PREFIX}/`)) {
    return normalized.slice(RETROVILLE_ROUTE_PREFIX.length) || '/';
  }
  return normalized;
}

export function absoluteUrl(path = '/'): string {
  return new URL(retrovillePublicPath(path), getSiteUrl()).toString();
}
