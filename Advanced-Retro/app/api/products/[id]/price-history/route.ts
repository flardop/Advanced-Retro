import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { toPriceChartingConsoleName, stripProductNameForExternalSearch } from '@/lib/catalogPlatform';
import { fetchPriceChartingSnapshotByQuery } from '@/lib/priceCharting';
import { isMysteryOrRouletteProduct } from '@/lib/productMarket';

export const dynamic = 'force-dynamic';

type PricePoint = {
  date: string;
  price: number;
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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const productId = String(params?.id || '').trim();
    if (!productId) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id,name,category,price')
      .eq('id', productId)
      .maybeSingle();

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }
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
    if (!isMysteryOrRouletteProduct(product as any)) {
      const externalName =
        stripProductNameForExternalSearch(String(product.name || '')) || String(product.name || '');
      const externalConsole = toPriceChartingConsoleName({
        category: String((product as any).category || ''),
        name: String(product.name || ''),
      });
      const priceChartingQuery = `${externalName} ${externalConsole}`.trim();
      marketGuide = await fetchPriceChartingSnapshotByQuery(priceChartingQuery);
    }

    if (sorted.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'orders',
        salesCount: sorted.length,
        points: sorted,
        marketGuide,
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
      });
    }

    return NextResponse.json({
      success: true,
      source: 'none',
      salesCount: 0,
      points: [],
      marketGuide,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load product price history' },
      { status: 500 }
    );
  }
}
