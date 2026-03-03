import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { toPriceChartingConsoleName, stripProductNameForExternalSearch } from '@/lib/catalogPlatform';
import { isMysteryOrRouletteProduct } from '@/lib/productMarket';
import { parseProductRouteParam } from '@/lib/productUrl';
import {
  fetchEbayMarketSnapshotByQueryWithOptions,
  type EbayMarketSnapshot,
} from '@/lib/ebayBrowse';
import { getRequestDurationMs, getRequestStartTimeMs, logApiPerformanceEvent } from '@/lib/performanceMetrics';

export const dynamic = 'force-dynamic';
const RAW_MARKET_SNAPSHOT_TTL_MS = Number(
  process.env.MARKET_SNAPSHOT_TTL_MS || 6 * 60 * 60 * 1000
);
const MARKET_SNAPSHOT_TTL_MS = Number.isFinite(RAW_MARKET_SNAPSHOT_TTL_MS)
  ? Math.max(30_000, Math.round(RAW_MARKET_SNAPSHOT_TTL_MS))
  : 6 * 60 * 60 * 1000;
const MARKET_SNAPSHOT_PROVIDER = 'ebay';
const PRICE_HISTORY_CACHE_HEADER = 'public, s-maxage=180, stale-while-revalidate=1800';
const ENDPOINT = '/api/products/[id]/price-history';
const MAX_MARKET_COMPARABLES = 40;

type PricePoint = {
  date: string;
  price: number;
};

type ProductWithMarketOverrides = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
  ebay_query?: string | null;
  ebay_marketplace_id?: string | null;
};

type MarketSnapshotRow = {
  id: string;
  product_id: string;
  provider: string;
  marketplace_id: string | null;
  query: string | null;
  currency: string | null;
  sample_size: number;
  total_results: number;
  min_price_cents: number | null;
  median_price_cents: number | null;
  average_price_cents: number | null;
  max_price_cents: number | null;
  payload: any;
  collected_at: string;
};

function parseBooleanLike(value: string | null): boolean {
  const safe = String(value || '').trim().toLowerCase();
  return safe === '1' || safe === 'true' || safe === 'yes' || safe === 'on';
}

function toSafePrice(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

function sortByDate(points: PricePoint[]): PricePoint[] {
  return [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function compactPoints(points: PricePoint[], max = 80): PricePoint[] {
  if (points.length <= max) return points;
  return points.slice(points.length - max);
}

function buildPricePointsFromEbayComparables(snapshot: EbayMarketSnapshot | null): PricePoint[] {
  if (!snapshot?.available) return [];

  const comparableRows = Array.isArray(snapshot.comparables)
    ? snapshot.comparables
        .map((item) => ({
          cents: toSafePrice((item as any)?.price),
          date:
            typeof (item as any)?.listingDate === 'string'
              ? String((item as any).listingDate)
              : null,
        }))
        .filter((item): item is { cents: number; date: string | null } => typeof item.cents === 'number' && item.cents > 0)
        .slice(0, 40)
    : [];

  const datedComparables = comparableRows
    .filter((item) => Boolean(item.date) && Number.isFinite(new Date(String(item.date)).getTime()))
    .sort((a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime());

  if (datedComparables.length >= 2) {
    return datedComparables.map((item) => ({
      date: new Date(String(item.date)).toISOString(),
      price: item.cents,
    }));
  }

  if (comparableRows.length >= 2) {
    const now = Date.now();
    const startMs = now - (comparableRows.length - 1) * 24 * 60 * 60 * 1000;
    return comparableRows.map((item, index) => ({
      date: new Date(startMs + index * 24 * 60 * 60 * 1000).toISOString(),
      price: item.cents,
    }));
  }

  // Fallback: algunos snapshots cacheados traen min/mediana/media/max pero no comparables.
  const statValues = [
    toSafePrice(snapshot.minPrice),
    toSafePrice(snapshot.medianPrice),
    toSafePrice(snapshot.averagePrice),
    toSafePrice(snapshot.maxPrice),
  ].filter((value): value is number => typeof value === 'number' && value > 0);

  const uniqueStats = [...new Set(statValues)];
  if (uniqueStats.length < 2) return [];

  const sortedStats = [...uniqueStats].sort((a, b) => a - b);
  const now = Date.now();
  const startMs = now - (sortedStats.length - 1) * 24 * 60 * 60 * 1000;
  return sortedStats.map((price, index) => ({
    date: new Date(startMs + index * 24 * 60 * 60 * 1000).toISOString(),
    price,
  }));
}

function parseLegacyOrderItems(productId: string, orders: any[]): PricePoint[] {
  const points: PricePoint[] = [];

  for (const order of orders || []) {
    const date = typeof order?.created_at === 'string' ? order.created_at : '';
    const status = String(order?.status || '').toLowerCase();
    if (!date || ['pending', 'cancelled'].includes(status)) continue;

    const rawItems = Array.isArray(order?.items) ? order.items : [];
    for (const item of rawItems) {
      if (!item || typeof item !== 'object') continue;
      const rawProductId = (item as any).product_id ?? (item as any).productId ?? (item as any).id;
      if (String(rawProductId || '') !== productId) continue;

      const price =
        toSafePrice((item as any).unit_price) ??
        toSafePrice((item as any).unitPrice) ??
        toSafePrice((item as any).price) ??
        toSafePrice((item as any).amount);

      if (price) {
        points.push({ date, price });
      }
    }
  }

  return points;
}

function isMissingColumnError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
}

function isMissingRelationError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('relation') && message.includes('does not exist');
}

function toValidCents(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num);
}

async function loadProductWithMarketOverrides(productId: string): Promise<ProductWithMarketOverrides | null> {
  if (!supabaseAdmin) return null;

  const probe = await supabaseAdmin
    .from('products')
    .select('id,name,category,price,ebay_query,ebay_marketplace_id')
    .eq('id', productId)
    .maybeSingle();

  if (!probe.error) return (probe.data as ProductWithMarketOverrides | null) || null;
  if (!isMissingColumnError(probe.error)) throw new Error(probe.error.message || 'Error loading product');

  const fallback = await supabaseAdmin
    .from('products')
    .select('id,name,category,price')
    .eq('id', productId)
    .maybeSingle();
  if (fallback.error) throw new Error(fallback.error.message || 'Error loading product');
  if (!fallback.data) return null;
  return {
    ...(fallback.data as ProductWithMarketOverrides),
    ebay_query: null,
    ebay_marketplace_id: null,
  };
}

async function resolveProductByIdentifier(identifier: string): Promise<ProductWithMarketOverrides | null> {
  const parsed = parseProductRouteParam(identifier);
  const idCandidate = String(parsed.idCandidate || '').trim();
  const slugCandidate = String(parsed.slugCandidate || '').trim();

  if (idCandidate) {
    const byId = await loadProductWithMarketOverrides(idCandidate);
    if (byId) return byId;
  }

  if (!slugCandidate || !supabaseAdmin) return null;

  const probe = await supabaseAdmin
    .from('products')
    .select('id,name,category,price,ebay_query,ebay_marketplace_id')
    .eq('slug', slugCandidate)
    .maybeSingle();

  if (!probe.error && probe.data) {
    return probe.data as ProductWithMarketOverrides;
  }
  if (probe.error && !isMissingColumnError(probe.error)) {
    throw new Error(probe.error.message || 'Error loading product by slug');
  }

  return null;
}

function snapshotRowToMarketGuide(row: MarketSnapshotRow): EbayMarketSnapshot {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  return {
    available: Boolean(payload.available),
    provider: 'ebay',
    note: typeof payload.note === 'string' ? payload.note : undefined,
    query: row.query || undefined,
    marketplaceId: String(row.marketplace_id || payload.marketplaceId || 'EBAY_ES'),
    attemptedMarketplaces: Array.isArray(payload.attemptedMarketplaces)
      ? payload.attemptedMarketplaces.map((item: unknown) => String(item))
      : undefined,
    currency: row.currency || (typeof payload.currency === 'string' ? payload.currency : null),
    sampleSize: Number.isFinite(Number(row.sample_size)) ? Number(row.sample_size) : 0,
    totalResults: Number.isFinite(Number(row.total_results)) ? Number(row.total_results) : 0,
    minPrice: toValidCents(row.min_price_cents),
    maxPrice: toValidCents(row.max_price_cents),
    averagePrice: toValidCents(row.average_price_cents),
    medianPrice: toValidCents(row.median_price_cents),
    comparables: Array.isArray(payload.comparables)
      ? payload.comparables.slice(0, MAX_MARKET_COMPARABLES)
      : [],
  };
}

async function loadLatestMarketSnapshot(productId: string): Promise<MarketSnapshotRow | null> {
  if (!supabaseAdmin) return null;
  const res = await supabaseAdmin
    .from('product_market_snapshots')
    .select(
      'id,product_id,provider,marketplace_id,query,currency,sample_size,total_results,min_price_cents,median_price_cents,average_price_cents,max_price_cents,payload,collected_at'
    )
    .eq('provider', MARKET_SNAPSHOT_PROVIDER)
    .eq('product_id', productId)
    .order('collected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (res.error) {
    if (isMissingRelationError(res.error)) return null;
    throw new Error(res.error.message || 'Error loading market cache');
  }
  return (res.data as MarketSnapshotRow | null) || null;
}

function isFreshSnapshot(collectedAtIso: string): boolean {
  const collectedAtMs = new Date(collectedAtIso).getTime();
  if (!Number.isFinite(collectedAtMs)) return false;
  return Date.now() - collectedAtMs <= Math.max(30_000, MARKET_SNAPSHOT_TTL_MS);
}

async function saveMarketSnapshot(
  productId: string,
  query: string,
  snapshot: EbayMarketSnapshot
): Promise<void> {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin.from('product_market_snapshots').insert({
    product_id: productId,
    provider: MARKET_SNAPSHOT_PROVIDER,
    marketplace_id: snapshot.marketplaceId,
    query,
    currency: snapshot.currency,
    sample_size: Number(snapshot.sampleSize || 0),
    total_results: Number(snapshot.totalResults || 0),
    min_price_cents: toValidCents(snapshot.minPrice),
    median_price_cents: toValidCents(snapshot.medianPrice),
    average_price_cents: toValidCents(snapshot.averagePrice),
    max_price_cents: toValidCents(snapshot.maxPrice),
    payload: {
      available: snapshot.available,
      note: snapshot.note || null,
      attemptedMarketplaces: Array.isArray(snapshot.attemptedMarketplaces)
        ? snapshot.attemptedMarketplaces
        : [],
      marketplaceId: snapshot.marketplaceId,
      currency: snapshot.currency,
      comparables: Array.isArray(snapshot.comparables)
        ? snapshot.comparables.slice(0, MAX_MARKET_COMPARABLES)
        : [],
    },
  });

  if (error && !isMissingRelationError(error)) {
    console.warn('Error saving product_market_snapshots cache:', error.message || error);
  }
}

function normalizeConsoleForQuery(value: string): string {
  return String(value || '')
    .replace(/gameboy/gi, 'game boy')
    .replace(/gamecube/gi, 'gamecube')
    .replace(/\s+/g, ' ')
    .trim();
}

function withoutDiacritics(value: string): string {
  try {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return value;
  }
}

function normalizeQueryToken(value: string): string {
  return String(value || '')
    .replace(/['"`]/g, ' ')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildEbayQueryCandidates(product: ProductWithMarketOverrides): string[] {
  const explicit = normalizeQueryToken(String(product.ebay_query || ''));
  const cleanName =
    normalizeQueryToken(stripProductNameForExternalSearch(String(product.name || ''))) ||
    normalizeQueryToken(String(product.name || ''));
  const asciiName = normalizeQueryToken(withoutDiacritics(cleanName));
  const consoleName = normalizeConsoleForQuery(
    toPriceChartingConsoleName({
      category: String(product.category || ''),
      name: String(product.name || ''),
    })
  );

  const seed: string[] = [];
  if (explicit) seed.push(explicit);
  if (cleanName && consoleName) {
    seed.push(`${cleanName} ${consoleName}`);
    seed.push(`${cleanName} ${consoleName} pal`);
    seed.push(`${cleanName} ${consoleName} cartridge`);
    seed.push(`${cleanName} ${consoleName} cib`);
  }
  if (asciiName && asciiName !== cleanName && consoleName) {
    seed.push(`${asciiName} ${consoleName}`);
  }
  if (cleanName) {
    seed.push(cleanName);
    seed.push(`${cleanName} retro game`);
  }

  return [...new Set(seed.map((item) => normalizeQueryToken(item)).filter(Boolean))].slice(0, 8);
}

function ebaySnapshotScore(snapshot: any): number {
  const availableBoost = snapshot?.available ? 1000 : 0;
  const samples = Number(snapshot?.sampleSize || 0);
  const total = Number(snapshot?.totalResults || 0);
  return availableBoost + samples * 100 + total;
}

async function fetchBestEbaySnapshotForProduct(product: ProductWithMarketOverrides) {
  const queries = buildEbayQueryCandidates(product);
  if (queries.length === 0) {
    return {
      snapshot: await fetchEbayMarketSnapshotByQueryWithOptions(String(product.name || '')),
      selectedQuery: String(product.name || ''),
      attempts: [],
    };
  }

  const attempts: Array<{
    query: string;
    available: boolean;
    sampleSize: number;
    totalResults: number;
    marketplaceId: string;
    note: string | null;
  }> = [];
  let best: any = null;
  let selectedQuery = queries[0];

  for (const query of queries) {
    const snapshot = await fetchEbayMarketSnapshotByQueryWithOptions(query, {
      marketplaceId: String(product.ebay_marketplace_id || '').trim() || undefined,
      allowMarketplaceFallback: true,
      targetSampleSize: 18,
      searchLimit: 40,
    });

    attempts.push({
      query,
      available: Boolean(snapshot.available),
      sampleSize: Number(snapshot.sampleSize || 0),
      totalResults: Number(snapshot.totalResults || 0),
      marketplaceId: String(snapshot.marketplaceId || ''),
      note: snapshot.note || null,
    });

    if (!best || ebaySnapshotScore(snapshot) > ebaySnapshotScore(best)) {
      best = snapshot;
      selectedQuery = query;
    }

    if (snapshot.available && Number(snapshot.sampleSize || 0) >= 18) {
      best = snapshot;
      selectedQuery = query;
      break;
    }
  }

  return {
    snapshot: best,
    selectedQuery,
    attempts,
  };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const startMs = getRequestStartTimeMs();
  let marketCacheHit: boolean | null = null;
  let resolvedProductIdForMetrics: string | null = null;
  const reqUrl = new URL(req.url);
  const forceRefresh =
    parseBooleanLike(reqUrl.searchParams.get('refresh')) ||
    parseBooleanLike(reqUrl.searchParams.get('forceRefresh')) ||
    parseBooleanLike(reqUrl.searchParams.get('noCache'));

  const respond = (
    body: unknown,
    status = 200,
    cacheControl = 'no-store',
    cacheHit: boolean | null = marketCacheHit
  ) => {
    void logApiPerformanceEvent({
      endpoint: ENDPOINT,
      method: 'GET',
      statusCode: status,
      durationMs: getRequestDurationMs(startMs),
      cacheHit,
      metadata: {
        productId: resolvedProductIdForMetrics || String(params?.id || ''),
        productParam: String(params?.id || ''),
        forceRefresh,
      },
    });
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': cacheControl,
      },
    });
  };

  try {
    const productParam = String(params?.id || '').trim();
    if (!productParam) {
      return respond(
        { error: 'Product id is required' },
        400,
        'no-store',
        null
      );
    }

    if (!supabaseAdmin) {
      return respond(
        { error: 'Supabase not configured' },
        503,
        'no-store',
        null
      );
    }

    const product = await resolveProductByIdentifier(productParam);
    if (!product) {
      return respond(
        { error: 'Product not found' },
        404,
        'no-store',
        null
      );
    }
    const productId = String(product.id || '').trim();
    resolvedProductIdForMetrics = productId || null;

    let points: PricePoint[] = [];

    const orderItemsProbe = await supabaseAdmin
      .from('order_items')
      .select('unit_price,orders!inner(created_at,status)')
      .eq('product_id', productId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'orders',
      })
      .limit(3000);

    if (!orderItemsProbe.error) {
      for (const row of orderItemsProbe.data || []) {
        const orderRel = Array.isArray((row as any).orders)
          ? (row as any).orders[0]
          : (row as any).orders;

        if (!orderRel) continue;
        const status = String(orderRel.status || '').toLowerCase();
        if (['pending', 'cancelled'].includes(status)) continue;

        const price = toSafePrice((row as any).unit_price);
        if (!price) continue;

        const date = String(orderRel.created_at || '');
        if (!date) continue;

        points.push({
          date,
          price,
        });
      }
    }

    if (points.length === 0) {
      const { data: legacyOrders, error: legacyError } = await supabaseAdmin
        .from('orders')
        .select('created_at,status,items')
        .order('created_at', { ascending: true })
        .limit(3000);

      if (!legacyError) {
        points = parseLegacyOrderItems(productId, legacyOrders || []);
      }
    }

    const sorted = compactPoints(sortByDate(points), 80);

    let marketGuideEbay: any = null;
    let marketGuideEbayDebug: any = null;
    if (!isMysteryOrRouletteProduct(product as any)) {
      const cachedSnapshot = forceRefresh ? null : await loadLatestMarketSnapshot(productId);
      if (cachedSnapshot && isFreshSnapshot(cachedSnapshot.collected_at)) {
        marketGuideEbay = snapshotRowToMarketGuide(cachedSnapshot);
        marketCacheHit = true;
        marketGuideEbayDebug = {
          selectedQuery: cachedSnapshot.query || String(product.name || ''),
          attempts: [],
          cache: {
            source: 'db',
            collectedAt: cachedSnapshot.collected_at,
            fresh: true,
            forcedRefresh: forceRefresh,
          },
          productOverride: {
            ebay_query: String(product.ebay_query || '').trim() || null,
            ebay_marketplace_id: String(product.ebay_marketplace_id || '').trim() || null,
          },
        };
      } else {
        const ebayData = await fetchBestEbaySnapshotForProduct(product);
        marketGuideEbay = ebayData.snapshot;
        marketCacheHit = false;
        marketGuideEbayDebug = {
          selectedQuery: ebayData.selectedQuery,
          attempts: ebayData.attempts,
          cache: {
            source: 'network',
            forcedRefresh: forceRefresh,
            fallbackFromStale:
              Boolean(cachedSnapshot) && !Boolean(ebayData.snapshot?.available),
            staleCollectedAt: cachedSnapshot?.collected_at || null,
          },
          productOverride: {
            ebay_query: String(product.ebay_query || '').trim() || null,
            ebay_marketplace_id: String(product.ebay_marketplace_id || '').trim() || null,
          },
        };

        if (ebayData.snapshot) {
          await saveMarketSnapshot(productId, ebayData.selectedQuery, ebayData.snapshot);
        }

        if (
          cachedSnapshot &&
          (!ebayData.snapshot || (!ebayData.snapshot.available && Number(ebayData.snapshot.sampleSize || 0) === 0))
        ) {
          marketGuideEbay = snapshotRowToMarketGuide(cachedSnapshot);
          marketCacheHit = true;
          marketGuideEbayDebug.cache = {
            source: 'db-stale',
            collectedAt: cachedSnapshot.collected_at,
            reusedBecause: 'network_result_not_useful',
          };
        }
      }
    }

    if (sorted.length > 0) {
      return respond(
        {
          success: true,
          source: 'orders',
          salesCount: sorted.length,
          points: sorted,
          marketGuideEbay,
          marketGuideEbayDebug,
        },
        200,
        PRICE_HISTORY_CACHE_HEADER
      );
    }

    const marketPoints = compactPoints(sortByDate(buildPricePointsFromEbayComparables(marketGuideEbay)), 80);
    if (marketPoints.length > 0) {
      return respond(
        {
          success: true,
          source: 'ebay',
          salesCount: 0,
          points: marketPoints,
          marketGuideEbay,
          marketGuideEbayDebug,
        },
        200,
        PRICE_HISTORY_CACHE_HEADER
      );
    }

    const currentPrice = toSafePrice(product.price);
    if (currentPrice) {
      return respond({
        success: true,
        source: 'current',
        salesCount: 0,
        points: [{ date: new Date().toISOString(), price: currentPrice }],
        marketGuideEbay,
        marketGuideEbayDebug,
      }, 200, PRICE_HISTORY_CACHE_HEADER);
    }

    return respond({
      success: true,
      source: 'none',
      salesCount: 0,
      points: [],
      marketGuideEbay,
      marketGuideEbayDebug,
    }, 200, PRICE_HISTORY_CACHE_HEADER);
  } catch (error: any) {
    return respond(
      { error: error?.message || 'Failed to load product price history' },
      500,
      'no-store',
      null
    );
  }
}
