const DEFAULT_SITE_URL = 'https://advancedretro.es';

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

export function absoluteUrl(path = '/'): string {
  return new URL(path, getSiteUrl()).toString();
}
