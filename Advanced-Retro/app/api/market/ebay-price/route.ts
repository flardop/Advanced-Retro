import { NextResponse } from 'next/server';
import { fetchEbayMarketSnapshotByQueryWithOptions } from '@/lib/ebayBrowse';
import { getRequestDurationMs, getRequestStartTimeMs, logApiPerformanceEvent } from '@/lib/performanceMetrics';

export const dynamic = 'force-dynamic';
const PUBLIC_CACHE_HEADER = 'public, s-maxage=300, stale-while-revalidate=3600';
const ENDPOINT = '/api/market/ebay-price';

export async function GET(req: Request) {
  const startMs = getRequestStartTimeMs();
  const respond = (
    body: unknown,
    status = 200,
    cacheControl = 'no-store',
    cacheHit: boolean | null = null
  ) => {
    void logApiPerformanceEvent({
      endpoint: ENDPOINT,
      method: 'GET',
      statusCode: status,
      durationMs: getRequestDurationMs(startMs),
      cacheHit,
    });
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': cacheControl,
      },
    });
  };

  try {
    const url = new URL(req.url);
    const query = String(url.searchParams.get('q') || '').trim();
    const marketplaceId = String(url.searchParams.get('marketplace') || '').trim();
    const fallbackRaw = String(url.searchParams.get('fallback') || '').trim().toLowerCase();
    const allowFallback = !(fallbackRaw === '0' || fallbackRaw === 'false' || fallbackRaw === 'off');

    if (!query) {
      return respond(
        { error: 'Query requerida. Usa /api/market/ebay-price?q=nombre+producto' },
        400,
        'no-store',
        null
      );
    }

    const snapshot = await fetchEbayMarketSnapshotByQueryWithOptions(query, {
      marketplaceId: marketplaceId || undefined,
      allowMarketplaceFallback: allowFallback,
      targetSampleSize: 18,
    });
    if (!snapshot.available) {
      return respond({
        ...snapshot,
        debug_hint: '/api/market/ebay-diagnostic?q=' + encodeURIComponent(query),
      }, 200, PUBLIC_CACHE_HEADER, null);
    }
    return respond(snapshot, 200, PUBLIC_CACHE_HEADER, null);
  } catch (error: any) {
    return respond(
      { error: error?.message || 'No se pudo consultar eBay' },
      500,
      'no-store',
      null
    );
  }
}
