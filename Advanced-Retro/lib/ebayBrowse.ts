const EBAY_PRODUCTION_BASE_URL = 'https://api.ebay.com';
const EBAY_SANDBOX_BASE_URL = 'https://api.sandbox.ebay.com';
const EBAY_BROWSE_SEARCH_PATH = '/buy/browse/v1/item_summary/search';
const EBAY_OAUTH_PATH = '/identity/v1/oauth2/token';
const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope';
const REQUEST_TIMEOUT_MS = 12_000;

type EbayOAuthTokenPayload = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type EbayPriceValue = {
  value?: string;
  currency?: string;
};

type EbayImageValue = {
  imageUrl?: string;
};

type EbayConditionValue = {
  condition?: string;
  conditionId?: string;
  conditionDescriptors?: unknown[];
};

type EbayItemSummary = {
  itemId?: string;
  title?: string;
  itemWebUrl?: string;
  price?: EbayPriceValue;
  convertedPrice?: EbayPriceValue;
  image?: EbayImageValue;
} & EbayConditionValue;

type EbaySearchPayload = {
  itemSummaries?: EbayItemSummary[];
  total?: number;
};

type EbayComparableItem = {
  itemId: string | null;
  title: string | null;
  itemWebUrl: string | null;
  imageUrl: string | null;
  condition: string | null;
  currency: string | null;
  price: number | null;
};

export type EbayMarketSnapshot = {
  available: boolean;
  provider: 'ebay';
  note?: string;
  query?: string;
  marketplaceId: string;
  currency: string | null;
  sampleSize: number;
  totalResults: number;
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  comparables: EbayComparableItem[];
};

let cachedAccessToken: { value: string; expiresAtMs: number } | null = null;

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isSandboxEnabled(): boolean {
  const raw = normalizeString(process.env.EBAY_USE_SANDBOX).toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function getEbayBaseUrl(): string {
  return isSandboxEnabled() ? EBAY_SANDBOX_BASE_URL : EBAY_PRODUCTION_BASE_URL;
}

function getMarketplaceId(): string {
  const fromEnv = normalizeString(process.env.EBAY_MARKETPLACE_ID);
  return fromEnv || 'EBAY_ES';
}

function getAuthCredentials():
  | {
      clientId: string;
      clientSecret: string;
    }
  | null {
  const clientId = normalizeString(process.env.EBAY_CLIENT_ID);
  const clientSecret = normalizeString(process.env.EBAY_CLIENT_SECRET);
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function toCentsFromPriceValue(value: unknown): number | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function toComparablePrice(item: EbayItemSummary): {
  cents: number | null;
  currency: string | null;
} {
  const directCurrency = normalizeString(item?.price?.currency).toUpperCase();
  const directCents = toCentsFromPriceValue(item?.price?.value);
  if (directCents) {
    return {
      cents: directCents,
      currency: directCurrency || null,
    };
  }

  const convertedCurrency = normalizeString(item?.convertedPrice?.currency).toUpperCase();
  const convertedCents = toCentsFromPriceValue(item?.convertedPrice?.value);
  if (convertedCents) {
    return {
      cents: convertedCents,
      currency: convertedCurrency || null,
    };
  }

  return { cents: null, currency: null };
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getAccessToken(): Promise<{ token: string | null; note?: string }> {
  const credentials = getAuthCredentials();
  if (!credentials) {
    return {
      token: null,
      note: 'EBAY_CLIENT_ID/EBAY_CLIENT_SECRET no configurados',
    };
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAtMs > now + 15_000) {
    return { token: cachedAccessToken.value };
  }

  const authValue = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: EBAY_SCOPE,
  });

  try {
    const response = await fetchWithTimeout(`${getEbayBaseUrl()}${EBAY_OAUTH_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authValue}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = (await response.json().catch(() => null)) as EbayOAuthTokenPayload | null;
    if (!response.ok) {
      const message =
        normalizeString(payload?.error_description) ||
        normalizeString(payload?.error) ||
        `HTTP ${response.status}`;
      return {
        token: null,
        note: `OAuth eBay falló: ${message}`,
      };
    }

    const accessToken = normalizeString(payload?.access_token);
    const expiresInSeconds = Number(payload?.expires_in || 0);
    if (!accessToken || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      return {
        token: null,
        note: 'OAuth eBay devolvió una respuesta inválida',
      };
    }

    cachedAccessToken = {
      value: accessToken,
      expiresAtMs: now + expiresInSeconds * 1000,
    };

    return { token: accessToken };
  } catch (error: any) {
    return {
      token: null,
      note: error?.message || 'Error de red obteniendo token OAuth eBay',
    };
  }
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const mid = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 0) {
    return Math.round((ordered[mid - 1] + ordered[mid]) / 2);
  }
  return ordered[mid];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function buildComparable(item: EbayItemSummary): EbayComparableItem {
  const priceInfo = toComparablePrice(item);
  return {
    itemId: normalizeString(item.itemId) || null,
    title: normalizeString(item.title) || null,
    itemWebUrl: normalizeString(item.itemWebUrl) || null,
    imageUrl: normalizeString(item.image?.imageUrl) || null,
    condition: normalizeString(item.condition) || null,
    currency: priceInfo.currency,
    price: priceInfo.cents,
  };
}

export async function fetchEbayMarketSnapshotByQuery(query: string): Promise<EbayMarketSnapshot> {
  const safeQuery = normalizeString(query);
  const marketplaceId = getMarketplaceId();

  if (!safeQuery) {
    return {
      available: false,
      provider: 'ebay',
      note: 'Query vacía',
      query: '',
      marketplaceId,
      currency: null,
      sampleSize: 0,
      totalResults: 0,
      minPrice: null,
      maxPrice: null,
      averagePrice: null,
      medianPrice: null,
      comparables: [],
    };
  }

  const auth = await getAccessToken();
  if (!auth.token) {
    return {
      available: false,
      provider: 'ebay',
      note: auth.note || 'No se pudo obtener token OAuth',
      query: safeQuery,
      marketplaceId,
      currency: null,
      sampleSize: 0,
      totalResults: 0,
      minPrice: null,
      maxPrice: null,
      averagePrice: null,
      medianPrice: null,
      comparables: [],
    };
  }

  const searchParams = new URLSearchParams({
    q: safeQuery,
    limit: '30',
    filter: 'buyingOptions:{FIXED_PRICE|AUCTION}',
  });

  try {
    const response = await fetchWithTimeout(
      `${getEbayBaseUrl()}${EBAY_BROWSE_SEARCH_PATH}?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
          Accept: 'application/json',
          'Accept-Language': 'es-ES',
        },
      }
    );

    const payload = (await response.json().catch(() => null)) as EbaySearchPayload | null;
    if (!response.ok) {
      return {
        available: false,
        provider: 'ebay',
        note: `HTTP ${response.status}`,
        query: safeQuery,
        marketplaceId,
        currency: null,
        sampleSize: 0,
        totalResults: 0,
        minPrice: null,
        maxPrice: null,
        averagePrice: null,
        medianPrice: null,
        comparables: [],
      };
    }

    const comparables = Array.isArray(payload?.itemSummaries)
      ? payload.itemSummaries.map((item) => buildComparable(item))
      : [];

    const priced = comparables.filter((item) => Number.isFinite(item.price) && (item.price || 0) > 0);
    const values = priced
      .map((item) => Number(item.price || 0))
      .filter((value) => Number.isFinite(value) && value > 0);

    const marketCurrency =
      priced
        .map((item) => normalizeString(item.currency).toUpperCase())
        .find(Boolean) || null;

    if (values.length === 0) {
      return {
        available: false,
        provider: 'ebay',
        note: 'Sin precios válidos en la búsqueda',
        query: safeQuery,
        marketplaceId,
        currency: marketCurrency,
        sampleSize: 0,
        totalResults: Number(payload?.total || comparables.length || 0),
        minPrice: null,
        maxPrice: null,
        averagePrice: null,
        medianPrice: null,
        comparables: comparables.slice(0, 8),
      };
    }

    return {
      available: true,
      provider: 'ebay',
      query: safeQuery,
      marketplaceId,
      currency: marketCurrency,
      sampleSize: values.length,
      totalResults: Number(payload?.total || comparables.length || values.length),
      minPrice: Math.min(...values),
      maxPrice: Math.max(...values),
      averagePrice: average(values),
      medianPrice: median(values),
      comparables: comparables.slice(0, 8),
    };
  } catch (error: any) {
    return {
      available: false,
      provider: 'ebay',
      note: error?.message || 'Error consultando eBay Browse API',
      query: safeQuery,
      marketplaceId,
      currency: null,
      sampleSize: 0,
      totalResults: 0,
      minPrice: null,
      maxPrice: null,
      averagePrice: null,
      medianPrice: null,
      comparables: [],
    };
  }
}
