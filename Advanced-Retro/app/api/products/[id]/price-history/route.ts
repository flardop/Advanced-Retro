import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { toPriceChartingConsoleName, stripProductNameForExternalSearch } from '@/lib/catalogPlatform';
import { fetchPriceChartingSnapshotByQuery } from '@/lib/priceCharting';
import { isMysteryOrRouletteProduct } from '@/lib/productMarket';
import { fetchEbayMarketSnapshotByQueryWithOptions } from '@/lib/ebayBrowse';

export const dynamic = 'force-dynamic';

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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const productId = String(params?.id || '').trim();
    if (!productId) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const product = await loadProductWithMarketOverrides(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

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

    let marketGuide: any = null;
    let marketGuideEbay: any = null;
    let marketGuideEbayDebug: any = null;
    if (!isMysteryOrRouletteProduct(product as any)) {
      const externalName =
        stripProductNameForExternalSearch(String(product.name || '')) || String(product.name || '');
      const externalConsole = toPriceChartingConsoleName({
        category: String((product as any).category || ''),
        name: String(product.name || ''),
      });
      const priceChartingQuery = `${externalName} ${externalConsole}`.trim();
      const [priceChartingSnapshot, ebayData] = await Promise.all([
        fetchPriceChartingSnapshotByQuery(priceChartingQuery),
        fetchBestEbaySnapshotForProduct(product),
      ]);
      marketGuide = priceChartingSnapshot;
      marketGuideEbay = ebayData.snapshot;
      marketGuideEbayDebug = {
        selectedQuery: ebayData.selectedQuery,
        attempts: ebayData.attempts,
        productOverride: {
          ebay_query: String(product.ebay_query || '').trim() || null,
          ebay_marketplace_id: String(product.ebay_marketplace_id || '').trim() || null,
        },
      };
    }

    if (sorted.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'orders',
        salesCount: sorted.length,
        points: sorted,
        marketGuide,
        marketGuideEbay,
        marketGuideEbayDebug,
      });
    }

    const currentPrice = toSafePrice(product.price);
    if (currentPrice) {
      return NextResponse.json({
        success: true,
        source: 'current',
        salesCount: 0,
        points: [{ date: new Date().toISOString(), price: currentPrice }],
        marketGuide,
        marketGuideEbay,
        marketGuideEbayDebug,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'none',
      salesCount: 0,
      points: [],
      marketGuide,
      marketGuideEbay,
      marketGuideEbayDebug,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load product price history' },
      { status: 500 }
    );
  }
}
