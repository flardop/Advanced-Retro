import { NextRequest, NextResponse } from 'next/server';
import {
  addReview,
  getProductSocialSummary,
  normalizeVisitorId,
  readProductSocialState,
  toggleLike,
  trackVisit,
  uploadReviewPhotoDataUrls,
  writeProductSocialState,
} from '@/lib/productSocialStorage';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) return badRequest('Product id is required');

    const visitorId = normalizeVisitorId(req.nextUrl.searchParams.get('visitorId'));
    const state = await readProductSocialState(productId);
    const summary = getProductSocialSummary(state, visitorId);

    return NextResponse.json({
      success: true,
      productId,
      summary,
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) return badRequest('Product id is required');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Invalid payload');

    const action = String((body as any).action || '').trim();
    if (!action) return badRequest('action is required');

    const visitorId = normalizeVisitorId((body as any).visitorId);
    const state = await readProductSocialState(productId);

    if (action === 'visit') {
      if (!visitorId) return badRequest('visitorId is required');
      const changed = trackVisit(state, visitorId);
      if (changed) await writeProductSocialState(productId, state);
      return NextResponse.json({
        success: true,
        summary: getProductSocialSummary(state, visitorId),
      });
    }

    if (action === 'toggle_like') {
      if (!visitorId) return badRequest('visitorId is required');
      trackVisit(state, visitorId);
      const liked = toggleLike(state, visitorId);
      await writeProductSocialState(productId, state);
      return NextResponse.json({
        success: true,
        liked,
        summary: getProductSocialSummary(state, visitorId),
      });
    }

    if (action === 'add_review') {
      if (!visitorId) return badRequest('visitorId is required');
      trackVisit(state, visitorId);

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
          review.visitorId === visitorId &&
          review.comment === rawComment &&
          review.rating === rating
      );
      if (duplicate) {
        return NextResponse.json({
          success: true,
          review: duplicate,
          summary: getProductSocialSummary(state, visitorId),
          reviews: state.reviews,
          duplicate: true,
        });
      }

      const review = addReview(state, {
        visitorId,
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
        summary: getProductSocialSummary(state, visitorId),
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
