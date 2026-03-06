export type CookieConsentState = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: number;
};

export const COOKIE_CONSENT_STORAGE_KEY = 'advancedretro-cookie-consent-v1';
export const COOKIE_CONSENT_COOKIE_KEY = 'advancedretro_cookie_consent';
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_SETTINGS_EVENT = 'advancedretro:open-cookie-settings';
export const COOKIE_CONSENT_CHANGED_EVENT = 'advancedretro:consent-changed';

export function createDefaultConsent(): CookieConsentState {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
}

export function normalizeConsent(input: unknown): CookieConsentState {
  const fallback = createDefaultConsent();
  if (!input || typeof input !== 'object') return fallback;

  const source = input as Partial<CookieConsentState>;
  return {
    necessary: true,
    preferences: Boolean(source.preferences),
    analytics: Boolean(source.analytics),
    marketing: Boolean(source.marketing),
    updatedAt:
      typeof source.updatedAt === 'string' && source.updatedAt.trim()
        ? source.updatedAt
        : fallback.updatedAt,
    version:
      typeof source.version === 'number' && Number.isFinite(source.version)
        ? source.version
        : COOKIE_CONSENT_VERSION,
  };
}

export function encodeConsentCookie(consent: CookieConsentState): string {
  const payload = JSON.stringify({
    v: consent.version,
    p: consent.preferences ? 1 : 0,
    a: consent.analytics ? 1 : 0,
    m: consent.marketing ? 1 : 0,
    t: consent.updatedAt,
  });
  return encodeURIComponent(payload);
}

export function decodeConsentCookie(raw: string): CookieConsentState | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as {
      v?: number;
      p?: number;
      a?: number;
      m?: number;
      t?: string;
    };
    return normalizeConsent({
      version: parsed.v,
      preferences: Boolean(parsed.p),
      analytics: Boolean(parsed.a),
      marketing: Boolean(parsed.m),
      updatedAt: parsed.t || new Date().toISOString(),
      necessary: true,
    });
  } catch {
    return null;
  }
}

