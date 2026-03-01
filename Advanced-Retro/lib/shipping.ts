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
