import { NextResponse } from 'next/server';
import {
  getProductSocialSummary,
  normalizeVisitorId,
  readProductSocialState,
} from '@/lib/productSocialStorage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rawIds = Array.isArray(body?.productIds) ? body.productIds : [];
    const visitorId = normalizeVisitorId(body?.visitorId);

    const productIds = rawIds
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id: string) => id.trim())
      .slice(0, 300);

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, metrics: {} });
    }

    const uniqueIds = [...new Set<string>(productIds)];
    const metrics: Record<string, ReturnType<typeof getProductSocialSummary>> = {};

    await Promise.all(
      uniqueIds.map(async (productId) => {
        const state = await readProductSocialState(productId);
        metrics[productId] = getProductSocialSummary(state, visitorId);
      })
    );

    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load social metrics' },
      { status: 500 }
    );
  }
}
