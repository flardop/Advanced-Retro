import { NextResponse } from 'next/server';
import { fetchEbayMarketSnapshotByQueryWithOptions } from '@/lib/ebayBrowse';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = String(url.searchParams.get('q') || '').trim();
    const marketplaceId = String(url.searchParams.get('marketplace') || '').trim();
    const fallbackRaw = String(url.searchParams.get('fallback') || '').trim().toLowerCase();
    const allowFallback = !(fallbackRaw === '0' || fallbackRaw === 'false' || fallbackRaw === 'off');

    if (!query) {
      return NextResponse.json(
        { error: 'Query requerida. Usa /api/market/ebay-price?q=nombre+producto' },
        { status: 400 }
      );
    }

    const snapshot = await fetchEbayMarketSnapshotByQueryWithOptions(query, {
      marketplaceId: marketplaceId || undefined,
      allowMarketplaceFallback: allowFallback,
      targetSampleSize: 18,
    });
    if (!snapshot.available) {
      return NextResponse.json({
        ...snapshot,
        debug_hint: '/api/market/ebay-diagnostic?q=' + encodeURIComponent(query),
      });
    }
    return NextResponse.json(snapshot);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo consultar eBay' },
      { status: 500 }
    );
  }
}
