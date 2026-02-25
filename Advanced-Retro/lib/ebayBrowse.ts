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

export type EbayDiagnostics = {
  ok: boolean;
  timestamp: string;
  environment: {
    mode: 'sandbox' | 'production';
    baseUrl: string;
    marketplaceId: string;
    scope: string;
  };
  credentials: {
    configured: boolean;
    source: 'client' | 'app' | 'mixed' | 'missing';
    clientIdPreview: string | null;
    clientSecretConfigured: boolean;
    sandboxKeyDetected: boolean;
    productionKeyDetected: boolean;
  };
  oauth: {
    ok: boolean;
    source: 'cache' | 'network' | null;
    note: string | null;
    expiresInSecondsApprox: number | null;
  };
  searchTest: {
    performed: boolean;
    query: string | null;
    available: boolean;
    note: string | null;
    sampleSize: number;
    totalResults: number;
    currency: string | null;
  };
  checks: Array<{
    id: string;
    status: 'ok' | 'warning' | 'error';
    label: string;
    detail: string;
  }>;
  nextActions: string[];
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

function getCredentialSource(): 'client' | 'app' | 'mixed' | 'missing' {
  const hasClientPair =
    Boolean(normalizeString(process.env.EBAY_CLIENT_ID)) &&
    Boolean(normalizeString(process.env.EBAY_CLIENT_SECRET));
  const hasAppPair =
    Boolean(normalizeString(process.env.EBAY_APP_ID)) &&
    Boolean(normalizeString(process.env.EBAY_CERT_ID));

  if (hasClientPair && hasAppPair) return 'mixed';
  if (hasClientPair) return 'client';
  if (hasAppPair) return 'app';
  return 'missing';
}

function getAuthCredentials():
  | {
      clientId: string;
      clientSecret: string;
    }
  | null {
  const clientId =
    normalizeString(process.env.EBAY_CLIENT_ID) || normalizeString(process.env.EBAY_APP_ID);
  const clientSecret =
    normalizeString(process.env.EBAY_CLIENT_SECRET) || normalizeString(process.env.EBAY_CERT_ID);
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function maskClientId(value: string | null): string | null {
  const v = normalizeString(value || '');
  if (!v) return null;
  if (v.length <= 8) return `${v.slice(0, 2)}***`;
  return `${v.slice(0, 6)}...${v.slice(-6)}`;
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

async function getAccessToken(): Promise<{
  token: string | null;
  note?: string;
  fromCache?: boolean;
  expiresInSecondsApprox?: number | null;
}> {
  const credentials = getAuthCredentials();
  if (!credentials) {
    return {
      token: null,
      note:
        'EBAY_CLIENT_ID/EBAY_CLIENT_SECRET no configurados (también acepta EBAY_APP_ID/EBAY_CERT_ID)',
      fromCache: false,
      expiresInSecondsApprox: null,
    };
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAtMs > now + 15_000) {
    return {
      token: cachedAccessToken.value,
      fromCache: true,
      expiresInSecondsApprox: Math.max(0, Math.round((cachedAccessToken.expiresAtMs - now) / 1000)),
    };
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
        fromCache: false,
        expiresInSecondsApprox: null,
      };
    }

    const accessToken = normalizeString(payload?.access_token);
    const expiresInSeconds = Number(payload?.expires_in || 0);
    if (!accessToken || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      return {
        token: null,
        note: 'OAuth eBay devolvió una respuesta inválida',
        fromCache: false,
        expiresInSecondsApprox: null,
      };
    }

    cachedAccessToken = {
      value: accessToken,
      expiresAtMs: now + expiresInSeconds * 1000,
    };

    return {
      token: accessToken,
      fromCache: false,
      expiresInSecondsApprox: expiresInSeconds,
    };
  } catch (error: any) {
    return {
      token: null,
      note: error?.message || 'Error de red obteniendo token OAuth eBay',
      fromCache: false,
      expiresInSecondsApprox: null,
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

export async function runEbayDiagnostics(inputQuery?: string): Promise<EbayDiagnostics> {
  const marketplaceId = getMarketplaceId();
  const baseUrl = getEbayBaseUrl();
  const mode = isSandboxEnabled() ? 'sandbox' : 'production';
  const credentials = getAuthCredentials();
  const credentialSource = getCredentialSource();
  const clientId =
    normalizeString(process.env.EBAY_CLIENT_ID) || normalizeString(process.env.EBAY_APP_ID) || '';
  const sandboxKeyDetected = clientId.includes('SBX');
  const productionKeyDetected = Boolean(clientId) && !sandboxKeyDetected;
  const query = normalizeString(inputQuery || '') || 'pokemon yellow game boy';

  const checks: EbayDiagnostics['checks'] = [];
  const nextActions: string[] = [];

  checks.push({
    id: 'mode',
    status: 'ok',
    label: 'Modo eBay',
    detail: `${mode === 'sandbox' ? 'Sandbox' : 'Producción'} · ${baseUrl}`,
  });

  if (!credentials) {
    checks.push({
      id: 'credentials',
      status: 'error',
      label: 'Claves eBay',
      detail: 'No se detectan claves válidas (EBAY_CLIENT_ID/SECRET o EBAY_APP_ID/CERT_ID).',
    });
    nextActions.push('Configura las variables EBAY_APP_ID y EBAY_CERT_ID (o EBAY_CLIENT_ID / EBAY_CLIENT_SECRET) en Vercel.');
  } else {
    checks.push({
      id: 'credentials',
      status: 'ok',
      label: 'Claves eBay',
      detail: `Claves detectadas (${credentialSource}). Client ID: ${maskClientId(clientId)}`,
    });
  }

  if (sandboxKeyDetected && mode === 'production') {
    checks.push({
      id: 'sandbox-mismatch',
      status: 'warning',
      label: 'Posible desajuste sandbox/producción',
      detail: 'Las claves parecen de Sandbox (SBX) pero EBAY_USE_SANDBOX está desactivado.',
    });
    nextActions.push('Activa EBAY_USE_SANDBOX=true o cambia a claves de producción.');
  }

  if (productionKeyDetected && mode === 'sandbox') {
    checks.push({
      id: 'production-mismatch',
      status: 'warning',
      label: 'Posible desajuste producción/sandbox',
      detail: 'Las claves parecen de producción pero EBAY_USE_SANDBOX=true.',
    });
    nextActions.push('Desactiva EBAY_USE_SANDBOX=false si estás usando claves de producción.');
  }

  const oauthResult = await getAccessToken();
  const oauthOk = Boolean(oauthResult.token);
  checks.push({
    id: 'oauth',
    status: oauthOk ? 'ok' : 'error',
    label: 'OAuth token',
    detail: oauthOk
      ? `Token obtenido correctamente (${oauthResult.fromCache ? 'cache' : 'red'})`
      : oauthResult.note || 'No se pudo obtener token OAuth',
  });
  if (!oauthOk) {
    nextActions.push('Revisa App ID / Cert ID, el modo sandbox/producción y vuelve a hacer redeploy en Vercel.');
  }

  let snapshot: EbayMarketSnapshot | null = null;
  if (oauthOk) {
    snapshot = await fetchEbayMarketSnapshotByQuery(query);
    checks.push({
      id: 'search',
      status: snapshot.available ? 'ok' : 'warning',
      label: 'Búsqueda Browse API',
      detail: snapshot.available
        ? `Marketplace ${snapshot.marketplaceId} · ${snapshot.sampleSize} muestras con precio`
        : snapshot.note || 'La búsqueda respondió sin precios válidos',
    });
    if (!snapshot.available) {
      nextActions.push('Prueba otra query más específica (ej. “pokemon yellow game boy color pal”).');
      nextActions.push('Verifica EBAY_MARKETPLACE_ID (por ejemplo EBAY_ES o EBAY_GB) según el mercado que quieras comparar.');
    }
  }

  if (nextActions.length === 0) {
    nextActions.push('La configuración base está correcta. El siguiente paso es ajustar la query por producto para mejorar precisión.');
  }

  return {
    ok: Boolean(credentials) && oauthOk,
    timestamp: new Date().toISOString(),
    environment: {
      mode,
      baseUrl,
      marketplaceId,
      scope: EBAY_SCOPE,
    },
    credentials: {
      configured: Boolean(credentials),
      source: credentialSource,
      clientIdPreview: maskClientId(clientId || null),
      clientSecretConfigured: Boolean(
        normalizeString(process.env.EBAY_CLIENT_SECRET) || normalizeString(process.env.EBAY_CERT_ID)
      ),
      sandboxKeyDetected,
      productionKeyDetected,
    },
    oauth: {
      ok: oauthOk,
      source: oauthOk ? (oauthResult.fromCache ? 'cache' : 'network') : null,
      note: oauthOk ? null : oauthResult.note || 'No se pudo obtener token',
      expiresInSecondsApprox: oauthResult.expiresInSecondsApprox ?? null,
    },
    searchTest: {
      performed: oauthOk,
      query: oauthOk ? query : null,
      available: Boolean(snapshot?.available),
      note: snapshot?.note || null,
      sampleSize: Number(snapshot?.sampleSize || 0),
      totalResults: Number(snapshot?.totalResults || 0),
      currency: snapshot?.currency || null,
    },
    checks,
    nextActions,
  };
}
