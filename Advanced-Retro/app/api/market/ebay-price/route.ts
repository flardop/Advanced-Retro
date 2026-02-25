import { NextResponse } from 'next/server';
import { fetchEbayMarketSnapshotByQuery } from '@/lib/ebayBrowse';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = String(url.searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json(
        { error: 'Query requerida. Usa /api/market/ebay-price?q=nombre+producto' },
        { status: 400 }
      );
    }

    const snapshot = await fetchEbayMarketSnapshotByQuery(query);
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
