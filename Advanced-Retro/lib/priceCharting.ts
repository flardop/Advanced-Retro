const PRICECHARTING_BASE_URL = 'https://www.pricecharting.com/api/product';
const REQUEST_TIMEOUT_MS = 12_000;

let lastApiCallMs = 0;

export type PriceChartingProductPayload = {
  status?: string;
  'error-message'?: string;
  id?: string;
  'product-name'?: string;
  'console-name'?: string;
  'release-date'?: string;
  'loose-price'?: number | string;
  'cib-price'?: number | string;
  'new-price'?: number | string;
  'box-only-price'?: number | string;
  'manual-only-price'?: number | string;
  'graded-price'?: number | string;
  [key: string]: unknown;
};

export type PriceChartingSnapshot = {
  available: boolean;
  provider: 'pricecharting';
  note?: string;
  query?: string;
  productId: string | null;
  productName: string | null;
  consoleName: string | null;
  releaseDate: string | null;
  loosePrice: number | null;
  cibPrice: number | null;
  newPrice: number | null;
  boxOnlyPrice: number | null;
  manualOnlyPrice: number | null;
  gradedPrice: number | null;
};

function toSafeInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function normalizeToken(raw: unknown): string {
  const token = typeof raw === 'string' ? raw.trim() : '';
  return token;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now();
  const delta = now - lastApiCallMs;
  if (delta < 1100) {
    await wait(1100 - delta);
  }
  lastApiCallMs = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPriceChartingSnapshotByQuery(query: string): Promise<PriceChartingSnapshot> {
  const token = normalizeToken(process.env.PRICECHARTING_API_TOKEN);
  const safeQuery = String(query || '').trim();

  if (!token) {
    return {
      available: false,
      provider: 'pricecharting',
      note: 'PRICECHARTING_API_TOKEN no configurado',
      query: safeQuery || undefined,
      productId: null,
      productName: null,
      consoleName: null,
      releaseDate: null,
      loosePrice: null,
      cibPrice: null,
      newPrice: null,
      boxOnlyPrice: null,
      manualOnlyPrice: null,
      gradedPrice: null,
    };
  }

  if (!safeQuery) {
    return {
      available: false,
      provider: 'pricecharting',
      note: 'Query vacía',
      productId: null,
      productName: null,
      consoleName: null,
      releaseDate: null,
      loosePrice: null,
      cibPrice: null,
      newPrice: null,
      boxOnlyPrice: null,
      manualOnlyPrice: null,
      gradedPrice: null,
    };
  }

  const url = `${PRICECHARTING_BASE_URL}?t=${encodeURIComponent(token)}&q=${encodeURIComponent(safeQuery)}`;

  try {
    const response = await throttledFetch(url);
    if (!response.ok) {
      return {
        available: false,
        provider: 'pricecharting',
        note: `HTTP ${response.status}`,
        query: safeQuery,
        productId: null,
        productName: null,
        consoleName: null,
        releaseDate: null,
        loosePrice: null,
        cibPrice: null,
        newPrice: null,
        boxOnlyPrice: null,
        manualOnlyPrice: null,
        gradedPrice: null,
      };
    }

    const payload = (await response.json()) as PriceChartingProductPayload;
    if (String(payload?.status || '').toLowerCase() !== 'success') {
      return {
        available: false,
        provider: 'pricecharting',
        note: String(payload?.['error-message'] || 'Respuesta no válida'),
        query: safeQuery,
        productId: null,
        productName: null,
        consoleName: null,
        releaseDate: null,
        loosePrice: null,
        cibPrice: null,
        newPrice: null,
        boxOnlyPrice: null,
        manualOnlyPrice: null,
        gradedPrice: null,
      };
    }

    const snapshot: PriceChartingSnapshot = {
      available: true,
      provider: 'pricecharting',
      query: safeQuery,
      productId: typeof payload.id === 'string' ? payload.id : null,
      productName: typeof payload['product-name'] === 'string' ? payload['product-name'] : null,
      consoleName: typeof payload['console-name'] === 'string' ? payload['console-name'] : null,
      releaseDate: typeof payload['release-date'] === 'string' ? payload['release-date'] : null,
      loosePrice: toSafeInt(payload['loose-price']),
      cibPrice: toSafeInt(payload['cib-price']),
      newPrice: toSafeInt(payload['new-price']),
      boxOnlyPrice: toSafeInt(payload['box-only-price']),
      manualOnlyPrice: toSafeInt(payload['manual-only-price']),
      gradedPrice: toSafeInt(payload['graded-price']),
    };

    return snapshot;
  } catch (error: any) {
    return {
      available: false,
      provider: 'pricecharting',
      note: error?.message || 'Error consultando PriceCharting',
      query: safeQuery,
      productId: null,
      productName: null,
      consoleName: null,
      releaseDate: null,
      loosePrice: null,
      cibPrice: null,
      newPrice: null,
      boxOnlyPrice: null,
      manualOnlyPrice: null,
      gradedPrice: null,
    };
  }
}
