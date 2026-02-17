import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type PricePoint = {
  date: string;
  price: number; // cents
};

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function toSafePrice(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

function pickProductId(item: Record<string, unknown>): string {
  const raw = item.product_id ?? item.productId ?? item.id;
  return typeof raw === 'string' ? raw : '';
}

function pickItemPrice(item: Record<string, unknown>): number | null {
  return (
    toSafePrice(item.unit_price) ??
    toSafePrice(item.unitPrice) ??
    toSafePrice(item.price) ??
    toSafePrice(item.amount)
  );
}

function aggregateByMonth(points: PricePoint[], maxPoints = 24): PricePoint[] {
  if (points.length <= 1) return points;

  const buckets = new Map<string, { total: number; count: number; date: string }>();
  for (const point of points) {
    const date = new Date(point.date);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key) || { total: 0, count: 0, date: point.date };
    bucket.total += point.price;
    bucket.count += 1;
    bucket.date = point.date;
    buckets.set(key, bucket);
  }

  const monthly = [...buckets.values()]
    .map((bucket) => ({
      date: bucket.date,
      price: Math.round(bucket.total / Math.max(1, bucket.count)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (monthly.length <= maxPoints) return monthly;
  return monthly.slice(monthly.length - maxPoints);
}

function extractFromOrdersItems(productId: string, orders: any[]): PricePoint[] {
  const points: PricePoint[] = [];

  for (const order of orders || []) {
    if (!isValidDate(order?.created_at)) continue;
    const rawItems = Array.isArray(order?.items) ? order.items : [];

    for (const rawItem of rawItems) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const item = rawItem as Record<string, unknown>;
      if (pickProductId(item) !== productId) continue;

      const price = pickItemPrice(item);
      if (price) {
        points.push({ date: order.created_at, price });
      }
    }
  }

  return points;
}

function extractFromOrderItemsRelation(rows: any[]): PricePoint[] {
  const points: PricePoint[] = [];

  for (const row of rows || []) {
    const orderRelation = Array.isArray(row?.orders) ? row.orders[0] : row?.orders;
    if (!orderRelation || typeof orderRelation !== 'object') continue;

    const date = (orderRelation as any).created_at;
    if (!isValidDate(date)) continue;

    const status = String((orderRelation as any).status || '').toLowerCase();
    if (status && ['cancelled', 'pending'].includes(status)) continue;

    const price = toSafePrice(row?.unit_price);
    if (!price) continue;

    points.push({ date, price });
  }

  return points;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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
      .select('id,price')
      .eq('id', productId)
      .maybeSingle();

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let points: PricePoint[] = [];

    const { data: ordersWithItems, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('created_at,status,items')
      .in('status', ['paid', 'shipped', 'delivered'])
      .order('created_at', { ascending: true })
      .limit(1800);

    if (!ordersError) {
      points = extractFromOrdersItems(productId, ordersWithItems || []);
    }

    if (points.length === 0) {
      const { data: orderItems, error: orderItemsError } = await supabaseAdmin
        .from('order_items')
        .select('product_id,unit_price,orders(created_at,status)')
        .eq('product_id', productId)
        .limit(1800);

      if (!orderItemsError) {
        points = extractFromOrderItemsRelation(orderItems || []);
      }
    }

    points = points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const aggregated = aggregateByMonth(points, 24);

    if (aggregated.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'orders',
        points: aggregated,
      });
    }

    const currentPrice = toSafePrice(product.price);
    if (currentPrice) {
      return NextResponse.json({
        success: true,
        source: 'current',
        points: [{ date: new Date().toISOString(), price: currentPrice }],
      });
    }

    return NextResponse.json({
      success: true,
      source: 'none',
      points: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load product price history' },
      { status: 500 }
    );
  }
}
