import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  addReview,
  getProductSocialSummary,
  normalizeVisitorId,
  readProductSocialState,
  toVisitorStorageKey,
  toggleLike,
  trackVisit,
  uploadReviewPhotoDataUrls,
  writeProductSocialState,
} from '@/lib/productSocialStorage';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getOptionalAuthUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
  try {
    const productId = params.id;
    if (!productId) return badRequest('Product id is required');

    const user = await getOptionalAuthUser();
    const visitorId = resolveVisitorId(req.nextUrl.searchParams.get('visitorId'), user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;
    const state = await readProductSocialState(productId);
    const summary = getProductSocialSummary(state, visitorKey);

    let canReview = false;
    if (user?.id) {
      canReview = await hasPurchasedProduct(user.id, productId);
    }

    return NextResponse.json({
      success: true,
      productId,
      summary,
      canReview,
      requiresPurchaseForReview: true,
      reviews: state.reviews,
      updatedAt: state.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load product social data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;
    if (!productId) return badRequest('Product id is required');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Invalid payload');

    const action = String((body as any).action || '').trim();
    if (!action) return badRequest('action is required');

    const user = await getOptionalAuthUser();
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
      return NextResponse.json(
        { error: 'Demasiadas acciones en poco tiempo. Inténtalo de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const visitorId = resolveVisitorId((body as any).visitorId, user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;
    const state = await readProductSocialState(productId);

    if (action === 'visit') {
      if (!visitorKey) return badRequest('visitorId is required');
      const changed = trackVisit(state, visitorKey);
      if (changed) await writeProductSocialState(productId, state);
      return NextResponse.json({
        success: true,
        summary: getProductSocialSummary(state, visitorKey),
      });
    }

    if (action === 'toggle_like') {
      if (!visitorKey) return badRequest('visitorId is required');
      trackVisit(state, visitorKey);
      const liked = toggleLike(state, visitorKey);
      await writeProductSocialState(productId, state);
      return NextResponse.json({
        success: true,
        liked,
        summary: getProductSocialSummary(state, visitorKey),
      });
    }

    if (action === 'add_review') {
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Debes iniciar sesión para valorar productos' },
          { status: 401 }
        );
      }

      if (!visitorKey) {
        return NextResponse.json({ error: 'No se pudo validar tu sesión' }, { status: 401 });
      }

      const purchased = await hasPurchasedProduct(user.id, productId);
      if (!purchased) {
        return NextResponse.json(
          { error: 'Solo pueden valorar usuarios que compraron este producto' },
          { status: 403 }
        );
      }

      trackVisit(state, visitorKey);

      const rating = Number((body as any).rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return badRequest('rating must be an integer from 1 to 5');
      }

      const rawComment = typeof (body as any).comment === 'string' ? (body as any).comment.trim() : '';
      if (rawComment.length < 2 || rawComment.length > 1000) {
        return badRequest('comment must be between 2 and 1000 chars');
      }

      const authorName =
        typeof (body as any).authorName === 'string' && (body as any).authorName.trim()
          ? (body as any).authorName.trim().slice(0, 60)
          : 'Coleccionista';

      const duplicate = state.reviews.find(
        (review) =>
          review.visitorId === visitorKey &&
          review.comment === rawComment &&
          review.rating === rating
      );
      if (duplicate) {
        return NextResponse.json({
          success: true,
          review: duplicate,
          summary: getProductSocialSummary(state, visitorKey),
          reviews: state.reviews,
          duplicate: true,
        });
      }

      const review = addReview(state, {
        visitorId: visitorKey,
        authorName,
        rating,
        comment: rawComment,
      });

      const uploadedPhotos = await uploadReviewPhotoDataUrls(
        productId,
        review.id,
        (body as any).photos
      );
      review.photos = uploadedPhotos;

      await writeProductSocialState(productId, state);

      return NextResponse.json({
        success: true,
        review,
        summary: getProductSocialSummary(state, visitorKey),
        reviews: state.reviews,
      });
    }

    return badRequest('Unsupported action');
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update product social data' },
      { status: 500 }
    );
  }
}
