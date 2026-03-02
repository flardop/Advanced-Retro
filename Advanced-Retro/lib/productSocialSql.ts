import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { ProductReview, ProductSocialSummary } from '@/lib/productSocialStorage';

const VISIT_COOLDOWN_MS = 0;
const SQL_AVAILABILITY_TTL_MS = 5 * 60 * 1000;

type ProductSocialSummaryRow = {
  product_id: string;
  visits: number;
  likes_count: number;
  reviews_count: number;
  rating_average: number;
};

let cachedSqlAvailable: boolean | null = null;
let cachedSqlAvailableAtMs = 0;

function nowIso(): string {
  return new Date().toISOString();
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function isMissingRelationError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('relation') && message.includes('does not exist');
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toSummary(row: Partial<ProductSocialSummaryRow> | null, likedByCurrentVisitor = false): ProductSocialSummary {
  return {
    visits: toSafeNumber(row?.visits, 0),
    likes: toSafeNumber(row?.likes_count, 0),
    reviewsCount: toSafeNumber(row?.reviews_count, 0),
    ratingAverage: round2(toSafeNumber(row?.rating_average, 0)),
    likedByCurrentVisitor: Boolean(likedByCurrentVisitor),
  };
}

async function getSummaryRow(productId: string): Promise<ProductSocialSummaryRow | null> {
  if (!supabaseAdmin) return null;
  const res = await supabaseAdmin
    .from('product_social_summary')
    .select('product_id,visits,likes_count,reviews_count,rating_average')
    .eq('product_id', productId)
    .maybeSingle();

  if (res.error) {
    if (isMissingRelationError(res.error)) return null;
    throw new Error(res.error.message || 'No se pudo cargar resumen social');
  }
  return (res.data as ProductSocialSummaryRow | null) || null;
}

async function upsertSummaryRow(
  payload: ProductSocialSummaryRow
): Promise<ProductSocialSummaryRow> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const res = await supabaseAdmin
    .from('product_social_summary')
    .upsert(
      {
        product_id: payload.product_id,
        visits: toSafeNumber(payload.visits, 0),
        likes_count: toSafeNumber(payload.likes_count, 0),
        reviews_count: toSafeNumber(payload.reviews_count, 0),
        rating_average: round2(toSafeNumber(payload.rating_average, 0)),
        updated_at: nowIso(),
      },
      { onConflict: 'product_id' }
    )
    .select('product_id,visits,likes_count,reviews_count,rating_average')
    .single();

  if (res.error) {
    if (isMissingRelationError(res.error)) {
      throw new Error('PRODUCT_SOCIAL_SQL_TABLES_MISSING');
    }
    throw new Error(res.error.message || 'No se pudo actualizar resumen social');
  }
  return res.data as ProductSocialSummaryRow;
}

export async function isProductSocialSqlAvailable(force = false): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const now = Date.now();
  if (!force && cachedSqlAvailable !== null && now - cachedSqlAvailableAtMs < SQL_AVAILABILITY_TTL_MS) {
    return cachedSqlAvailable;
  }

  const checks = await Promise.all([
    supabaseAdmin.from('product_social_summary').select('product_id').limit(1),
    supabaseAdmin.from('product_social_visits').select('product_id').limit(1),
    supabaseAdmin.from('product_social_reviews').select('id').limit(1),
  ]);

  const available = checks.every((check) => !check.error);
  const allMissing = checks.every((check) => isMissingRelationError(check.error));
  cachedSqlAvailable = available || !allMissing ? available : false;
  cachedSqlAvailableAtMs = now;

  return Boolean(cachedSqlAvailable);
}

export async function getProductSocialSummarySql(
  productId: string,
  likedByCurrentVisitor = false
): Promise<ProductSocialSummary> {
  const row = await getSummaryRow(productId);
  return toSummary(row, likedByCurrentVisitor);
}

export async function getProductReviewsSql(productId: string, limit = 250): Promise<ProductReview[]> {
  if (!supabaseAdmin) return [];

  const safeLimit = Math.min(Math.max(Math.round(limit), 1), 250);
  const res = await supabaseAdmin
    .from('product_social_reviews')
    .select('id,visitor_key,author_name,rating,comment,photos,created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (res.error) {
    if (isMissingRelationError(res.error)) return [];
    throw new Error(res.error.message || 'No se pudieron cargar reseñas');
  }

  return (res.data || []).map((row: any) => ({
    id: String(row?.id || ''),
    visitorId: String(row?.visitor_key || ''),
    authorName: String(row?.author_name || 'Coleccionista'),
    rating: toSafeNumber(row?.rating, 0),
    comment: String(row?.comment || ''),
    photos: Array.isArray(row?.photos) ? row.photos.map((item: unknown) => String(item || '')) : [],
    createdAt: String(row?.created_at || ''),
  }));
}

export async function trackVisitSql(
  productId: string,
  visitorKey: string
): Promise<ProductSocialSummary> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const visitRes = await supabaseAdmin
    .from('product_social_visits')
    .select('visits_count,last_visit_at')
    .eq('product_id', productId)
    .eq('visitor_key', visitorKey)
    .maybeSingle();

  if (visitRes.error && !isMissingRelationError(visitRes.error)) {
    throw new Error(visitRes.error.message || 'No se pudo registrar visita');
  }
  if (visitRes.error && isMissingRelationError(visitRes.error)) {
    throw new Error('PRODUCT_SOCIAL_SQL_TABLES_MISSING');
  }

  const now = Date.now();
  const lastVisitAtMs = visitRes.data?.last_visit_at ? new Date(String(visitRes.data.last_visit_at)).getTime() : 0;
  const shouldSkipIncrement = VISIT_COOLDOWN_MS > 0 && Number.isFinite(lastVisitAtMs) && now - lastVisitAtMs < VISIT_COOLDOWN_MS;

  if (shouldSkipIncrement) {
    return getProductSocialSummarySql(productId, false);
  }

  if (visitRes.data) {
    const nextVisits = toSafeNumber(visitRes.data.visits_count, 0) + 1;
    const updateRes = await supabaseAdmin
      .from('product_social_visits')
      .update({
        visits_count: nextVisits,
        last_visit_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq('product_id', productId)
      .eq('visitor_key', visitorKey);

    if (updateRes.error) {
      throw new Error(updateRes.error.message || 'No se pudo actualizar visita');
    }
  } else {
    const insertRes = await supabaseAdmin.from('product_social_visits').insert({
      product_id: productId,
      visitor_key: visitorKey,
      visits_count: 1,
      last_visit_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    if (insertRes.error) {
      throw new Error(insertRes.error.message || 'No se pudo insertar visita');
    }
  }

  const summary = await getSummaryRow(productId);
  const nextSummary = await upsertSummaryRow({
    product_id: productId,
    visits: toSafeNumber(summary?.visits, 0) + 1,
    likes_count: toSafeNumber(summary?.likes_count, 0),
    reviews_count: toSafeNumber(summary?.reviews_count, 0),
    rating_average: toSafeNumber(summary?.rating_average, 0),
  });
  return toSummary(nextSummary, false);
}

export async function addReviewSql(params: {
  productId: string;
  userId: string;
  visitorKey: string;
  authorName: string;
  rating: number;
  comment: string;
  photos: string[];
}): Promise<{ review: ProductReview; summary: ProductSocialSummary; reviews: ProductReview[]; duplicate: boolean }> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const duplicateRes = await supabaseAdmin
    .from('product_social_reviews')
    .select('id,visitor_key,author_name,rating,comment,photos,created_at')
    .eq('product_id', params.productId)
    .eq('visitor_key', params.visitorKey)
    .eq('rating', params.rating)
    .eq('comment', params.comment)
    .limit(1)
    .maybeSingle();

  if (duplicateRes.error && !isMissingRelationError(duplicateRes.error)) {
    throw new Error(duplicateRes.error.message || 'No se pudo validar reseña');
  }
  if (duplicateRes.error && isMissingRelationError(duplicateRes.error)) {
    throw new Error('PRODUCT_SOCIAL_SQL_TABLES_MISSING');
  }

  if (duplicateRes.data) {
    const summary = await getProductSocialSummarySql(params.productId, false);
    const reviews = await getProductReviewsSql(params.productId);
    return {
      review: {
        id: String(duplicateRes.data.id),
        visitorId: String(duplicateRes.data.visitor_key || ''),
        authorName: String(duplicateRes.data.author_name || 'Coleccionista'),
        rating: toSafeNumber(duplicateRes.data.rating, 0),
        comment: String(duplicateRes.data.comment || ''),
        photos: Array.isArray(duplicateRes.data.photos)
          ? duplicateRes.data.photos.map((item: unknown) => String(item || ''))
          : [],
        createdAt: String(duplicateRes.data.created_at || ''),
      },
      summary,
      reviews,
      duplicate: true,
    };
  }

  const insertRes = await supabaseAdmin
    .from('product_social_reviews')
    .insert({
      product_id: params.productId,
      user_id: params.userId,
      visitor_key: params.visitorKey,
      author_name: params.authorName.trim().slice(0, 60) || 'Coleccionista',
      rating: params.rating,
      comment: params.comment.trim().slice(0, 1000),
      photos: (params.photos || []).slice(0, 3),
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    .select('id,visitor_key,author_name,rating,comment,photos,created_at')
    .single();

  if (insertRes.error) {
    throw new Error(insertRes.error.message || 'No se pudo guardar reseña');
  }

  const summaryRow = await getSummaryRow(params.productId);
  const previousCount = toSafeNumber(summaryRow?.reviews_count, 0);
  const previousAverage = toSafeNumber(summaryRow?.rating_average, 0);
  const nextCount = previousCount + 1;
  const nextAverage =
    nextCount > 0 ? round2((previousAverage * previousCount + params.rating) / nextCount) : params.rating;

  const nextSummary = await upsertSummaryRow({
    product_id: params.productId,
    visits: toSafeNumber(summaryRow?.visits, 0),
    likes_count: toSafeNumber(summaryRow?.likes_count, 0),
    reviews_count: nextCount,
    rating_average: nextAverage,
  });

  const review: ProductReview = {
    id: String(insertRes.data.id),
    visitorId: String(insertRes.data.visitor_key || ''),
    authorName: String(insertRes.data.author_name || 'Coleccionista'),
    rating: toSafeNumber(insertRes.data.rating, 0),
    comment: String(insertRes.data.comment || ''),
    photos: Array.isArray(insertRes.data.photos)
      ? insertRes.data.photos.map((item: unknown) => String(item || ''))
      : [],
    createdAt: String(insertRes.data.created_at || ''),
  };

  const reviews = await getProductReviewsSql(params.productId);
  return {
    review,
    summary: toSummary(nextSummary, false),
    reviews,
    duplicate: false,
  };
}

export async function syncProductLikeCountIntoSummarySql(productId: string, likesCount: number): Promise<void> {
  if (!supabaseAdmin) return;
  const summaryRow = await getSummaryRow(productId);
  const payload: ProductSocialSummaryRow = {
    product_id: productId,
    visits: toSafeNumber(summaryRow?.visits, 0),
    likes_count: Math.max(0, Math.round(likesCount)),
    reviews_count: toSafeNumber(summaryRow?.reviews_count, 0),
    rating_average: toSafeNumber(summaryRow?.rating_average, 0),
  };

  try {
    await upsertSummaryRow(payload);
  } catch (error: any) {
    if (String(error?.message || '') === 'PRODUCT_SOCIAL_SQL_TABLES_MISSING') {
      return;
    }
    console.warn('Error syncing likes into social summary:', error);
  }
}
