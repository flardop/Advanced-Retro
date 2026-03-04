import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductLikesSnapshot } from '@/lib/productLikesDb';
import { isProductSocialSqlAvailable } from '@/lib/productSocialSql';
import { getProductSocialSummary, readProductSocialState } from '@/lib/productSocialStorage';

type SocialSummaryRow = {
  product_id: string;
  visits: number;
  likes_count: number;
  reviews_count: number;
  rating_average: number;
};

export type SocialBackfillOptions = {
  limit?: number;
  dryRun?: boolean;
  productIds?: string[];
};

export type SocialBackfillResult = {
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  sqlAvailable: boolean;
  scanned: number;
  processed: number;
  productsWithLegacyData: number;
  skippedNoData: number;
  summaryRowsUpserted: number;
  visitRowsUpserted: number;
  reviewRowsUpserted: number;
  likesSource: 'product_likes' | 'storage';
  errors: Array<{ productId: string; message: string }>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function sanitizeProductIds(input: unknown, max = 500): string[] {
  if (!Array.isArray(input)) return [];
  const unique = new Set<string>();
  for (const item of input) {
    const id = String(item || '').trim();
    if (!id) continue;
    unique.add(id);
    if (unique.size >= max) break;
  }
  return [...unique];
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num;
}

function toRounded(value: unknown, fallback = 0): number {
  return Math.round(toSafeNumber(value, fallback));
}

function toFixed2(value: unknown, fallback = 0): number {
  return Number(toSafeNumber(value, fallback).toFixed(2));
}

function safeIsoDate(input: unknown, fallbackIso: string): string {
  const value = String(input || '').trim();
  if (!value) return fallbackIso;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return fallbackIso;
  return new Date(timestamp).toISOString();
}

async function loadTargetProductIds(limit: number, inputProductIds?: unknown): Promise<string[]> {
  const explicit = sanitizeProductIds(inputProductIds, limit);
  if (explicit.length > 0) return explicit.slice(0, limit);

  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message || 'No se pudieron cargar productos');
  return (data || [])
    .map((row: any) => String(row?.id || '').trim())
    .filter(Boolean);
}

async function loadSummaryMap(productIds: string[]): Promise<Record<string, SocialSummaryRow>> {
  if (!supabaseAdmin || productIds.length === 0) return {};
  const { data, error } = await supabaseAdmin
    .from('product_social_summary')
    .select('product_id,visits,likes_count,reviews_count,rating_average')
    .in('product_id', productIds);

  if (error) return {};

  const map: Record<string, SocialSummaryRow> = {};
  for (const row of data || []) {
    const productId = String((row as any)?.product_id || '').trim();
    if (!productId) continue;
    map[productId] = {
      product_id: productId,
      visits: toRounded((row as any)?.visits, 0),
      likes_count: toRounded((row as any)?.likes_count, 0),
      reviews_count: toRounded((row as any)?.reviews_count, 0),
      rating_average: toFixed2((row as any)?.rating_average, 0),
    };
  }
  return map;
}

async function loadExistingVisitRows(productId: string): Promise<Record<string, number>> {
  if (!supabaseAdmin) return {};
  const { data, error } = await supabaseAdmin
    .from('product_social_visits')
    .select('visitor_key,visits_count')
    .eq('product_id', productId)
    .limit(3000);

  if (error) return {};
  const map: Record<string, number> = {};
  for (const row of data || []) {
    const visitorKey = String((row as any)?.visitor_key || '').trim();
    if (!visitorKey) continue;
    map[visitorKey] = Math.max(0, toRounded((row as any)?.visits_count, 0));
  }
  return map;
}

function shouldProcessProduct(params: {
  stateVisits: number;
  stateLikes: number;
  stateReviews: number;
  likesCount: number;
  existingSummary?: SocialSummaryRow;
}): boolean {
  const summary = params.existingSummary;
  return (
    params.stateVisits > 0 ||
    params.stateLikes > 0 ||
    params.stateReviews > 0 ||
    params.likesCount > 0 ||
    toRounded(summary?.visits, 0) > 0 ||
    toRounded(summary?.likes_count, 0) > 0 ||
    toRounded(summary?.reviews_count, 0) > 0
  );
}

export async function runSocialStorageToSqlBackfill(
  options: SocialBackfillOptions = {}
): Promise<SocialBackfillResult> {
  const startedAt = nowIso();
  const dryRun = Boolean(options.dryRun);
  const limit = Math.min(Math.max(toPositiveInt(options.limit, 250), 1), 1000);

  if (!supabaseAdmin) {
    throw new Error('Supabase no configurado');
  }

  const sqlAvailable = await isProductSocialSqlAvailable(true);
  if (!sqlAvailable) {
    throw new Error(
      'Falta configurar tablas sociales SQL. Ejecuta: database/performance_social_market_cache.sql'
    );
  }

  const productIds = await loadTargetProductIds(limit, options.productIds);
  const likesSnapshot = await getProductLikesSnapshot(productIds, null);
  const likesSource: 'product_likes' | 'storage' = likesSnapshot.available ? 'product_likes' : 'storage';
  const existingSummaryMap = await loadSummaryMap(productIds);

  const result: SocialBackfillResult = {
    startedAt,
    finishedAt: startedAt,
    dryRun,
    sqlAvailable,
    scanned: productIds.length,
    processed: 0,
    productsWithLegacyData: 0,
    skippedNoData: 0,
    summaryRowsUpserted: 0,
    visitRowsUpserted: 0,
    reviewRowsUpserted: 0,
    likesSource,
    errors: [],
  };

  for (const productId of productIds) {
    try {
      const state = await readProductSocialState(productId);
      const stateSummary = getProductSocialSummary(state, null);
      const stateLikeCount = Math.max(0, Object.keys(state.likeByVisitor || {}).length);
      const likesCount = likesSnapshot.available
        ? Math.max(0, toRounded(likesSnapshot.likesByProduct[productId], 0))
        : stateLikeCount;

      const existingSummary = existingSummaryMap[productId];
      const shouldProcess = shouldProcessProduct({
        stateVisits: Math.max(0, toRounded(state.visits, 0)),
        stateLikes: stateLikeCount,
        stateReviews: Math.max(0, state.reviews.length),
        likesCount,
        existingSummary,
      });

      if (!shouldProcess) {
        result.skippedNoData += 1;
        continue;
      }

      result.productsWithLegacyData += 1;

      const visitsFromState = Math.max(0, toRounded(state.visits, 0));
      const reviewsCountFromState = Math.max(0, state.reviews.length);
      const existingVisits = Math.max(0, toRounded(existingSummary?.visits, 0));
      const existingLikes = Math.max(0, toRounded(existingSummary?.likes_count, 0));
      const existingReviews = Math.max(0, toRounded(existingSummary?.reviews_count, 0));
      const existingRating = toFixed2(existingSummary?.rating_average, 0);

      const summaryVisits = Math.max(existingVisits, visitsFromState);
      const summaryLikes = likesSnapshot.available ? likesCount : Math.max(existingLikes, likesCount, stateLikeCount);
      const summaryReviews = Math.max(existingReviews, reviewsCountFromState);
      const summaryRating =
        summaryReviews === 0
          ? 0
          : summaryReviews > reviewsCountFromState
            ? existingRating
            : toFixed2(stateSummary.ratingAverage, existingRating);

      if (!dryRun) {
        const summaryUpsert = await supabaseAdmin
          .from('product_social_summary')
          .upsert(
            {
              product_id: productId,
              visits: summaryVisits,
              likes_count: summaryLikes,
              reviews_count: summaryReviews,
              rating_average: summaryRating,
              updated_at: nowIso(),
            },
            { onConflict: 'product_id' }
          );
        if (summaryUpsert.error) {
          throw new Error(summaryUpsert.error.message || 'No se pudo guardar summary');
        }
      }
      result.summaryRowsUpserted += 1;

      const visitEntries = Object.entries(state.visitByVisitor || {}).filter(
        ([key]) => String(key || '').trim().length > 0
      );
      const existingVisitMap = dryRun ? {} : await loadExistingVisitRows(productId);
      const fallbackVisitIso = safeIsoDate(state.updatedAt, nowIso());
      const visitRows: Array<{
        product_id: string;
        visitor_key: string;
        visits_count: number;
        last_visit_at: string;
        updated_at: string;
      }> = [];

      let mappedVisitsCount = 0;
      for (const [visitorKeyRaw, lastVisitRaw] of visitEntries) {
        const visitorKey = String(visitorKeyRaw || '').trim().slice(0, 120);
        if (!visitorKey) continue;
        const existingCount = Math.max(0, toRounded(existingVisitMap[visitorKey], 0));
        const visitsCount = Math.max(existingCount, 1);
        mappedVisitsCount += visitsCount;
        visitRows.push({
          product_id: productId,
          visitor_key: visitorKey,
          visits_count: visitsCount,
          last_visit_at: safeIsoDate(lastVisitRaw, fallbackVisitIso),
          updated_at: nowIso(),
        });
      }

      if (visitsFromState > mappedVisitsCount) {
        const legacyVisitorKey = `legacy-backfill-${productId}`;
        const existingLegacyCount = Math.max(0, toRounded(existingVisitMap[legacyVisitorKey], 0));
        visitRows.push({
          product_id: productId,
          visitor_key: legacyVisitorKey,
          visits_count: Math.max(existingLegacyCount, visitsFromState - mappedVisitsCount),
          last_visit_at: fallbackVisitIso,
          updated_at: nowIso(),
        });
      }

      if (visitRows.length > 0) {
        if (!dryRun) {
          const visitUpsert = await supabaseAdmin
            .from('product_social_visits')
            .upsert(visitRows, { onConflict: 'product_id,visitor_key' });
          if (visitUpsert.error) {
            throw new Error(visitUpsert.error.message || 'No se pudieron guardar visitas');
          }
        }
        result.visitRowsUpserted += visitRows.length;
      }

      const reviewRows = (state.reviews || []).map((review) => ({
        id: String(review.id || '').trim() || undefined,
        product_id: productId,
        user_id: null,
        visitor_key: String(review.visitorId || '').trim().slice(0, 120),
        author_name: String(review.authorName || 'Coleccionista').trim().slice(0, 60) || 'Coleccionista',
        rating: Math.max(1, Math.min(5, toRounded(review.rating, 5))),
        comment: String(review.comment || '').trim().slice(0, 1000),
        photos: Array.isArray(review.photos)
          ? review.photos.map((photo) => String(photo || '')).filter(Boolean).slice(0, 3)
          : [],
        created_at: safeIsoDate(review.createdAt, fallbackVisitIso),
        updated_at: nowIso(),
      })).filter((row) => row.visitor_key && row.comment);

      if (reviewRows.length > 0) {
        if (!dryRun) {
          const reviewsUpsert = await supabaseAdmin
            .from('product_social_reviews')
            .upsert(reviewRows, {
              onConflict: 'product_id,visitor_key,rating,comment',
            });
          if (reviewsUpsert.error) {
            throw new Error(reviewsUpsert.error.message || 'No se pudieron guardar reseñas');
          }
        }
        result.reviewRowsUpserted += reviewRows.length;
      }

      result.processed += 1;
    } catch (error: any) {
      result.errors.push({
        productId,
        message: String(error?.message || 'Error desconocido'),
      });
    }
  }

  result.finishedAt = nowIso();
  return result;
}
