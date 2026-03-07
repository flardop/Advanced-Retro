export type ShippingAddressInput = {
  full_name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
};

export type ShippingQuote = {
  method: 'envio-estandar';
  costCents: number;
  zone:
    | 'local_arenys_barcelona'
    | 'cataluna'
    | 'espana_peninsula'
    | 'espana_baleares'
    | 'espana_canarias'
    | 'espana_ceuta_melilla'
    | 'eu'
    | 'europe_non_eu'
    | 'rest_world';
  etaLabel: string;
};

export type CommunityPackageSize = 'small' | 'medium' | 'large' | 'oversize';
export type CommunityShippingZone = ShippingQuote['zone'];

export type CommunityShippingQuote = ShippingQuote & {
  packageSize: CommunityPackageSize;
  baseCents: number;
  sizeMultiplier: number;
  handlingCents: number;
  fuelCents: number;
  protectionCents: number;
  subtotalCents: number;
};

const EU_CODES = new Set([
  'AT',
  'BE',
  'BG',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'EL',
  'ES',
  'FI',
  'FR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
]);

const NON_EU_EUROPE_CODES = new Set(['GB', 'UK', 'CH', 'NO', 'IS', 'LI']);

function clean(input: unknown): string {
  return String(input || '')
    .trim()
    .toUpperCase();
}

function countryCodeFromInput(country: unknown): string {
  const value = clean(country);
  if (!value) return 'ES';
  if (value.length === 2) return value;

  if (['SPAIN', 'ESPANA', 'ESPAÑA', 'REINO DE ESPANA', 'REINO DE ESPAÑA'].includes(value)) return 'ES';
  if (['PORTUGAL'].includes(value)) return 'PT';
  if (['FRANCE', 'FRANCIA'].includes(value)) return 'FR';
  if (['ITALY', 'ITALIA'].includes(value)) return 'IT';
  if (['GERMANY', 'ALEMANIA'].includes(value)) return 'DE';
  if (['UNITED KINGDOM', 'REINO UNIDO', 'UK', 'GREAT BRITAIN'].includes(value)) return 'GB';
  if (['SWITZERLAND', 'SUIZA'].includes(value)) return 'CH';
  if (['NORWAY', 'NORUEGA'].includes(value)) return 'NO';
  if (['UNITED STATES', 'USA', 'ESTADOS UNIDOS'].includes(value)) return 'US';

  return value.slice(0, 2);
}

function normalizePostalCode(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

function spainPostalPrefix(postalCode: string): number | null {
  if (!/^\d{5}$/.test(postalCode)) return null;
  const prefix = Number(postalCode.slice(0, 2));
  if (!Number.isInteger(prefix) || prefix < 1 || prefix > 52) return null;
  return prefix;
}

function normalizePackageSize(value: unknown): CommunityPackageSize {
  const key = String(value || '')
    .trim()
    .toLowerCase();
  if (key === 'small' || key === 'medium' || key === 'large' || key === 'oversize') {
    return key;
  }
  return 'medium';
}

const COMMUNITY_ZONE_BASE_CENTS: Record<CommunityShippingZone, number> = {
  local_arenys_barcelona: 390,
  cataluna: 490,
  espana_peninsula: 590,
  espana_baleares: 990,
  espana_canarias: 1590,
  espana_ceuta_melilla: 1290,
  eu: 1290,
  europe_non_eu: 1790,
  rest_world: 2490,
};

const COMMUNITY_ZONE_ETA: Record<CommunityShippingZone, string> = {
  local_arenys_barcelona: '24-48h',
  cataluna: '24-72h',
  espana_peninsula: '24-72h',
  espana_baleares: '48-96h',
  espana_canarias: '4-7 días',
  espana_ceuta_melilla: '3-6 días',
  eu: '3-6 días',
  europe_non_eu: '4-8 días',
  rest_world: '5-12 días',
};

const COMMUNITY_PACKAGE_MULTIPLIER: Record<CommunityPackageSize, number> = {
  small: 1,
  medium: 1.18,
  large: 1.45,
  oversize: 1.85,
};

const COMMUNITY_PACKAGE_HANDLING: Record<CommunityPackageSize, number> = {
  small: 60,
  medium: 90,
  large: 160,
  oversize: 280,
};

export function inferShippingZoneFromAddress(address: ShippingAddressInput): CommunityShippingZone {
  return calculateShippingQuoteFromArenys(address).zone;
}

export function calculateCommunityShippingQuoteFromArenys(input: {
  address?: ShippingAddressInput | null;
  zone?: CommunityShippingZone | null;
  packageSize?: unknown;
  itemPriceCents?: number;
}): CommunityShippingQuote {
  const packageSize = normalizePackageSize(input.packageSize);
  const zone = input.zone || inferShippingZoneFromAddress(input.address || {});
  const baseCents = COMMUNITY_ZONE_BASE_CENTS[zone] ?? COMMUNITY_ZONE_BASE_CENTS.espana_peninsula;
  const sizeMultiplier = COMMUNITY_PACKAGE_MULTIPLIER[packageSize] ?? COMMUNITY_PACKAGE_MULTIPLIER.medium;
  const handlingCents = COMMUNITY_PACKAGE_HANDLING[packageSize] ?? COMMUNITY_PACKAGE_HANDLING.medium;
  const fuelCents = Math.max(35, Math.round(baseCents * 0.08));
  const protectionCents = Math.min(990, Math.max(0, Math.round(Math.max(0, Number(input.itemPriceCents || 0)) * 0.006)));
  const subtotalCents = Math.round(baseCents * sizeMultiplier) + handlingCents + fuelCents;
  const costCents = subtotalCents + protectionCents;

  return {
    method: 'envio-estandar',
    zone,
    etaLabel: COMMUNITY_ZONE_ETA[zone] || '24-72h',
    costCents,
    packageSize,
    baseCents,
    sizeMultiplier,
    handlingCents,
    fuelCents,
    protectionCents,
    subtotalCents,
  };
}

export function calculateShippingQuoteFromArenys(address: ShippingAddressInput): ShippingQuote {
  const countryCode = countryCodeFromInput(address.country);
  const postalCode = normalizePostalCode(address.postal_code);
  const postalPrefix = countryCode === 'ES' ? spainPostalPrefix(postalCode) : null;

  if (countryCode === 'ES') {
    if (postalPrefix === 8) {
      return {
        method: 'envio-estandar',
        costCents: 395,
        zone: 'local_arenys_barcelona',
        etaLabel: '24-48h',
      };
    }

    if (postalPrefix === 7) {
      return {
        method: 'envio-estandar',
        costCents: 990,
        zone: 'espana_baleares',
        etaLabel: '48-96h',
      };
    }

    if (postalPrefix === 35 || postalPrefix === 38) {
      return {
        method: 'envio-estandar',
        costCents: 1590,
        zone: 'espana_canarias',
        etaLabel: '4-7 días',
      };
    }

    if (postalPrefix === 51 || postalPrefix === 52) {
      return {
        method: 'envio-estandar',
        costCents: 1290,
        zone: 'espana_ceuta_melilla',
        etaLabel: '3-6 días',
      };
    }

    if (postalPrefix === 17 || postalPrefix === 25 || postalPrefix === 43) {
      return {
        method: 'envio-estandar',
        costCents: 490,
        zone: 'cataluna',
        etaLabel: '24-72h',
      };
    }

    return {
      method: 'envio-estandar',
      costCents: 590,
      zone: 'espana_peninsula',
      etaLabel: '24-72h',
    };
  }

  if (EU_CODES.has(countryCode)) {
    return {
      method: 'envio-estandar',
      costCents: 1290,
      zone: 'eu',
      etaLabel: '3-6 días',
    };
  }

  if (NON_EU_EUROPE_CODES.has(countryCode)) {
    return {
      method: 'envio-estandar',
      costCents: 1790,
      zone: 'europe_non_eu',
      etaLabel: '4-8 días',
    };
  }

  return {
    method: 'envio-estandar',
    costCents: 2490,
    zone: 'rest_world',
    etaLabel: '5-12 días',
  };
}
