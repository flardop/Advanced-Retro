import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  getProductSocialSummariesFromDb,
  getProductSocialSummary,
  readProductSocialState,
} from '@/lib/productSocialStorage';
import { getProductLikesSnapshot } from '@/lib/productLikesDb';
import { getRequestDurationMs, getRequestStartTimeMs, logApiPerformanceEvent } from '@/lib/performanceMetrics';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
const ENDPOINT = '/api/products/social/batch';

async function getOptionalAuthUser(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!token || !supabaseAdmin) return null;

  const authRes = await supabaseAdmin.auth.getUser(token);
  if (authRes.error || !authRes.data?.user) return null;
  return authRes.data.user;
}

export async function POST(req: Request) {
  const startMs = getRequestStartTimeMs();
  const respond = (
    body: unknown,
    status = 200,
    cacheHit: boolean | null = null
  ) => {
    void logApiPerformanceEvent({
      endpoint: ENDPOINT,
      method: 'POST',
      statusCode: status,
      durationMs: getRequestDurationMs(startMs),
      cacheHit,
    });
    return NextResponse.json(body, { status });
  };

  try {
    const body = await req.json().catch(() => null);
    const rawIds = Array.isArray(body?.productIds) ? body.productIds : [];

    const user = await getOptionalAuthUser(req);

    const visitorId = user?.id ? `auth-${user.id}` : null;

    const productIds = rawIds
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id: string) => id.trim())
      .slice(0, 300);

    if (productIds.length === 0) return respond({ success: true, metrics: {} }, 200, null);

    const uniqueIds = [...new Set<string>(productIds)];
    const metrics: Record<string, ReturnType<typeof getProductSocialSummary>> = {};
    const likeSnapshot = await getProductLikesSnapshot(uniqueIds, user?.id || null);
    const dbSummary = await getProductSocialSummariesFromDb(uniqueIds);
    const missingProductIds: string[] = [];

    for (const productId of uniqueIds) {
      const row = dbSummary.rowsByProductId[productId];
      if (!row) {
        missingProductIds.push(productId);
        continue;
      }

      const fallbackLikes = Number(row.likes_count || 0);
      metrics[productId] = {
        visits: Number(row.visits || 0),
        likes: likeSnapshot.available
          ? Number(likeSnapshot.likesByProduct[productId] || 0)
          : fallbackLikes,
        reviewsCount: Number(row.reviews_count || 0),
        ratingAverage: Number(row.rating_average || 0),
        likedByCurrentVisitor: user?.id
          ? likeSnapshot.available
            ? Boolean(likeSnapshot.likedByCurrentUser[productId])
            : false
          : false,
      };
    }

    const fallbackIds = dbSummary.available ? missingProductIds.slice(0, 40) : uniqueIds.slice(0, 40);
    await Promise.all(
      fallbackIds.map(async (productId) => {
        const state = await readProductSocialState(productId);
        const baseSummary = getProductSocialSummary(state, visitorId);
        metrics[productId] = {
          ...baseSummary,
          likes: likeSnapshot.available
            ? Number(likeSnapshot.likesByProduct[productId] || 0)
            : baseSummary.likes,
          likedByCurrentVisitor: user?.id
            ? likeSnapshot.available
              ? Boolean(likeSnapshot.likedByCurrentUser[productId])
              : baseSummary.likedByCurrentVisitor
            : false,
        };
      })
    );

    const cacheHit = dbSummary.available ? fallbackIds.length === 0 : null;
    return respond({ success: true, metrics }, 200, cacheHit);
  } catch (error: any) {
    return respond(
      { error: error?.message || 'Failed to load social metrics' },
      500,
      null
    );
  }
}
