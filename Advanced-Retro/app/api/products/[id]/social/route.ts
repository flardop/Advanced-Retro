import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  addReview,
  getProductSocialSummary,
  normalizeVisitorId,
  readProductSocialState,
  toVisitorStorageKey,
  trackVisit,
  uploadReviewPhotoDataUrls,
  writeProductSocialState,
} from '@/lib/productSocialStorage';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';
import { getProductLikeSummary, toggleProductLike } from '@/lib/productLikesDb';
import { getProductLikesSetupErrorMessage, isProductLikesSetupMissing } from '@/lib/productLikesSetup';
import { grantXpToUser } from '@/lib/gamificationServer';
import { getRequestDurationMs, getRequestStartTimeMs, logApiPerformanceEvent } from '@/lib/performanceMetrics';
import {
  addReviewSql,
  getProductReviewsSql,
  getProductSocialSummarySql,
  isProductSocialSqlAvailable,
  trackVisitSql,
} from '@/lib/productSocialSql';

export const dynamic = 'force-dynamic';
const ENDPOINT = '/api/products/[id]/social';

function mergeReviews(sqlReviews: any[], legacyReviews: any[]): any[] {
  const merged = [...(Array.isArray(sqlReviews) ? sqlReviews : [])];
  const seen = new Set(
    merged.map((review: any) =>
      [
        String(review?.id || ''),
        String(review?.visitorId || ''),
        String(review?.rating || ''),
        String(review?.comment || '').trim(),
      ].join('::')
    )
  );

  for (const review of Array.isArray(legacyReviews) ? legacyReviews : []) {
    const key = [
      String(review?.id || ''),
      String(review?.visitorId || ''),
      String(review?.rating || ''),
      String(review?.comment || '').trim(),
    ].join('::');
    if (!seen.has(key)) {
      merged.push(review);
      seen.add(key);
    }
  }

  return merged
    .filter((review: any) => Number(review?.rating || 0) >= 1 && String(review?.comment || '').trim().length > 0)
    .sort((a: any, b: any) => {
      const aTime = new Date(String(a?.createdAt || 0)).getTime();
      const bTime = new Date(String(b?.createdAt || 0)).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    })
    .slice(0, 250);
}

function computeAverageRating(reviews: any[]): number {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0);
  return Number((total / reviews.length).toFixed(2));
}

async function getOptionalAuthUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getOptionalAuthUserFromRequest(req: NextRequest) {
  const cookieUser = await getOptionalAuthUser();
  if (cookieUser) return cookieUser;

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!token || !supabaseAdmin) return null;

  const authRes = await supabaseAdmin.auth.getUser(token);
  if (authRes.error || !authRes.data?.user) return null;
  return authRes.data.user;
}

function resolveVisitorId(raw: unknown, authUserId?: string): string | null {
  if (authUserId) {
    return `auth-${authUserId}`;
  }
  return normalizeVisitorId(raw);
}

async function hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id,status,order_items(product_id)')
    .eq('user_id', userId)
    .in('status', ['paid', 'shipped', 'delivered'])
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return false;

  for (const order of orders || []) {
    const items = Array.isArray((order as any).order_items) ? (order as any).order_items : [];
    if (items.some((item: any) => String(item?.product_id || '') === productId)) {
      return true;
    }
  }

  const { data: legacyOrders, error: legacyError } = await supabaseAdmin
    .from('orders')
    .select('status,items')
    .eq('user_id', userId)
    .in('status', ['paid', 'shipped', 'delivered'])
    .limit(500);

  if (!legacyError) {
    for (const order of legacyOrders || []) {
      const items = Array.isArray((order as any).items) ? (order as any).items : [];
      if (
        items.some((item: any) =>
          String(item?.product_id || item?.productId || item?.id || '') === productId
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const startMs = getRequestStartTimeMs();
  const respond = (body: unknown, status = 200, cacheHit: boolean | null = null) => {
    void logApiPerformanceEvent({
      endpoint: ENDPOINT,
      method: 'GET',
      statusCode: status,
      durationMs: getRequestDurationMs(startMs),
      cacheHit,
      metadata: {
        productId: String(params?.id || ''),
      },
    });
    return NextResponse.json(body, { status });
  };
  const respondBadRequest = (message: string) => respond({ error: message }, 400, null);

  try {
    const productId = params.id;
    if (!productId) return respondBadRequest('Product id is required');

    const user = await getOptionalAuthUserFromRequest(req);
    const visitorId = resolveVisitorId(req.nextUrl.searchParams.get('visitorId'), user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;
    const socialSqlAvailable = await isProductSocialSqlAvailable();
    const state = socialSqlAvailable ? null : await readProductSocialState(productId);
    const baseSummary = socialSqlAvailable
      ? await getProductSocialSummarySql(productId, false)
      : getProductSocialSummary(state!, visitorKey);
    const likeSummary = await getProductLikeSummary(productId, user?.id || null);
    const summary = {
      ...baseSummary,
      likes: likeSummary.available ? likeSummary.likes : baseSummary.likes,
      likedByCurrentVisitor: user?.id
        ? likeSummary.available
          ? likeSummary.likedByCurrentUser
          : baseSummary.likedByCurrentVisitor
        : false,
    };

    let canReview = false;
    if (user?.id) {
      canReview = await hasPurchasedProduct(user.id, productId);
    }

    const sqlReviews = socialSqlAvailable ? await getProductReviewsSql(productId) : [];
    let reviews = socialSqlAvailable ? sqlReviews : state!.reviews;
    let legacyState: Awaited<ReturnType<typeof readProductSocialState>> | null = null;

    if (
      socialSqlAvailable &&
      (sqlReviews.length === 0 || Number(summary.reviewsCount || 0) > sqlReviews.length)
    ) {
      legacyState = await readProductSocialState(productId);
      if (legacyState.reviews.length > 0) {
        reviews = mergeReviews(sqlReviews, legacyState.reviews);
      }
    }

    if (reviews.length > 0) {
      const mergedCount = reviews.length;
      if (Number(summary.reviewsCount || 0) < mergedCount) {
        summary.reviewsCount = mergedCount;
      }
      if (Number(summary.ratingAverage || 0) <= 0) {
        summary.ratingAverage = computeAverageRating(reviews);
      }
    }

    return respond({
      success: true,
      productId,
      summary,
      canReview,
      requiresPurchaseForReview: true,
      reviews,
      updatedAt: socialSqlAvailable ? legacyState?.updatedAt || new Date().toISOString() : state!.updatedAt,
    }, 200, socialSqlAvailable ? true : null);
  } catch (error: any) {
    return respond(
      { error: error?.message || 'Failed to load product social data' },
      500,
      null
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const startMs = getRequestStartTimeMs();
  const respond = (body: unknown, status = 200, cacheHit: boolean | null = null) => {
    void logApiPerformanceEvent({
      endpoint: ENDPOINT,
      method: 'POST',
      statusCode: status,
      durationMs: getRequestDurationMs(startMs),
      cacheHit,
      metadata: {
        productId: String(params?.id || ''),
      },
    });
    return NextResponse.json(body, { status });
  };
  const respondBadRequest = (message: string) => respond({ error: message }, 400, null);

  try {
    const productId = params.id;
    if (!productId) return respondBadRequest('Product id is required');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return respondBadRequest('Invalid payload');

    const action = String((body as any).action || '').trim();
    if (!action) return respondBadRequest('action is required');

    const user = await getOptionalAuthUserFromRequest(req);
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const rl = checkRateLimit({
      key: `product-social:${action}:${user?.id || ip}`,
      maxRequests: action === 'visit' ? 120 : action === 'toggle_like' ? 40 : 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return respond(
        { error: 'Demasiadas acciones en poco tiempo. Inténtalo de nuevo en un minuto.' },
        429,
        null
      );
    }

    const visitorId = resolveVisitorId((body as any).visitorId, user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;
    const socialSqlAvailable = await isProductSocialSqlAvailable();
    const state = socialSqlAvailable ? null : await readProductSocialState(productId);

    if (action === 'visit') {
      if (!visitorKey) return respondBadRequest('visitorId is required');
      if (socialSqlAvailable) {
        const baseSummary = await trackVisitSql(productId, visitorKey);
        const likeSummary = await getProductLikeSummary(productId, user?.id || null);
        return respond({
          success: true,
          summary: {
            ...baseSummary,
            likes: likeSummary.available ? likeSummary.likes : baseSummary.likes,
            likedByCurrentVisitor: user?.id
              ? likeSummary.available
                ? likeSummary.likedByCurrentUser
                : false
              : false,
          },
        }, 200, true);
      }

      const changed = trackVisit(state!, visitorKey);
      if (changed) await writeProductSocialState(productId, state!);
      return respond({
        success: true,
        summary: getProductSocialSummary(state!, visitorKey),
      }, 200, false);
    }

    if (action === 'toggle_like') {
      if (!user?.id) {
        return respond(
          { error: 'Debes iniciar sesión para guardar favoritos' },
          401,
          null
        );
      }

      const likeResult = await toggleProductLike(productId, user.id);
      const baseSummary = socialSqlAvailable
        ? await getProductSocialSummarySql(productId, false)
        : getProductSocialSummary(state!, visitorKey);
      const summary = {
        ...baseSummary,
        likes: likeResult.available ? likeResult.likes : baseSummary.likes,
        likedByCurrentVisitor: likeResult.available
          ? likeResult.likedByCurrentUser
          : baseSummary.likedByCurrentVisitor,
      };

      return respond({
        success: true,
        liked: summary.likedByCurrentVisitor,
        summary,
      }, 200, socialSqlAvailable ? true : null);
    }

    if (action === 'add_review') {
      if (!user?.id) {
        return respond(
          { error: 'Debes iniciar sesión para valorar productos' },
          401,
          null
        );
      }

      if (!visitorKey) {
        return respond({ error: 'No se pudo validar tu sesión' }, 401, null);
      }

      const purchased = await hasPurchasedProduct(user.id, productId);
      if (!purchased) {
        return respond(
          { error: 'Solo pueden valorar usuarios que compraron este producto' },
          403,
          null
        );
      }

      const rating = Number((body as any).rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return respondBadRequest('rating must be an integer from 1 to 5');
      }

      const rawComment = typeof (body as any).comment === 'string' ? (body as any).comment.trim() : '';
      if (rawComment.length < 2 || rawComment.length > 1000) {
        return respondBadRequest('comment must be between 2 and 1000 chars');
      }

      const authorName =
        typeof (body as any).authorName === 'string' && (body as any).authorName.trim()
          ? (body as any).authorName.trim().slice(0, 60)
          : 'Coleccionista';

      const duplicate = !socialSqlAvailable
        ? state!.reviews.find(
            (review) =>
              review.visitorId === visitorKey &&
              review.comment === rawComment &&
              review.rating === rating
          )
        : null;
      if (duplicate) {
        return respond({
          success: true,
          review: duplicate,
          summary: getProductSocialSummary(state!, visitorKey),
          reviews: state!.reviews,
          duplicate: true,
        }, 200, false);
      }

      if (socialSqlAvailable) {
        const tempReviewId = crypto.randomUUID();
        const uploadedPhotos = await uploadReviewPhotoDataUrls(
          productId,
          tempReviewId,
          (body as any).photos
        );

        const sqlResult = await addReviewSql({
          productId,
          userId: user.id,
          visitorKey,
          authorName,
          rating,
          comment: rawComment,
          photos: uploadedPhotos,
        });

        const likeSummary = await getProductLikeSummary(productId, user.id);
        const summary = {
          ...sqlResult.summary,
          likes: likeSummary.available ? likeSummary.likes : sqlResult.summary.likes,
          likedByCurrentVisitor: likeSummary.available
            ? likeSummary.likedByCurrentUser
            : sqlResult.summary.likedByCurrentVisitor,
        };

        void grantXpToUser({
          userId: user.id,
          actionKey: 'comment_posted',
          dedupeKey: `product-review:${sqlResult.review.id}`,
          metadata: {
            product_id: productId,
            review_id: sqlResult.review.id,
            rating,
          },
        });

        return respond({
          success: true,
          review: sqlResult.review,
          summary,
          reviews: sqlResult.reviews,
          duplicate: sqlResult.duplicate,
        }, 200, true);
      }

      const review = addReview(state!, {
        visitorId: visitorKey,
        authorName,
        rating,
        comment: rawComment,
      });

      const uploadedPhotos = await uploadReviewPhotoDataUrls(productId, review.id, (body as any).photos);
      review.photos = uploadedPhotos;

      await writeProductSocialState(productId, state!);

      void grantXpToUser({
        userId: user.id,
        actionKey: 'comment_posted',
        dedupeKey: `product-review:${review.id}`,
        metadata: {
          product_id: productId,
          review_id: review.id,
          rating,
        },
      });

      return respond({
        success: true,
        review,
        summary: getProductSocialSummary(state!, visitorKey),
        reviews: state!.reviews,
      }, 200, false);
    }

    return respondBadRequest('Unsupported action');
  } catch (error: any) {
    if (isProductLikesSetupMissing(error)) {
      return respond(
        { error: getProductLikesSetupErrorMessage(), setupRequired: true },
        503,
        null
      );
    }
    return respond(
      { error: error?.message || 'Failed to update product social data' },
      500,
      null
    );
  }
}
