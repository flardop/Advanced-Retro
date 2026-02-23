import { createHash, randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SOCIAL_BUCKET = 'product-social';
// Count page openings again without long cooldown so the UI reflects visits in real time.
const VISIT_COOLDOWN_MS = 0;
const MAX_REVIEWS_PER_PRODUCT = 250;
const MAX_REVIEW_PHOTOS = 3;
const MAX_REVIEW_PHOTO_BYTES = 2_500_000;
const VISITOR_KEY_PREFIX = 'vf_';
const VISITOR_HASH_SECRET =
  process.env.SOCIAL_VISITOR_HASH_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'advanced-retro-social';

export type ProductReview = {
  id: string;
  visitorId: string;
  authorName: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
};

type ProductSocialState = {
  visits: number;
  visitByVisitor: Record<string, string>;
  likeByVisitor: Record<string, boolean>;
  reviews: ProductReview[];
  updatedAt: string;
};

export type ProductSocialSummary = {
  visits: number;
  likes: number;
  reviewsCount: number;
  ratingAverage: number;
  likedByCurrentVisitor: boolean;
};

const defaultState = (): ProductSocialState => ({
  visits: 0,
  visitByVisitor: {},
  likeByVisitor: {},
  reviews: [],
  updatedAt: new Date().toISOString(),
});

const statePath = (productId: string) => `products/${productId}/social.json`;

export function toVisitorStorageKey(visitorId: string): string {
  const normalized = normalizeVisitorId(visitorId);
  if (!normalized) return '';

  if (new RegExp(`^${VISITOR_KEY_PREFIX}[a-f0-9]{32}$`).test(normalized)) {
    return normalized;
  }

  const digest = createHash('sha256')
    .update(`${VISITOR_HASH_SECRET}:${normalized}`)
    .digest('hex')
    .slice(0, 32);
  return `${VISITOR_KEY_PREFIX}${digest}`;
}

export function normalizeVisitorId(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (value.length < 8 || value.length > 120) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return null;
  return value;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function sanitizeReview(raw: any): ProductReview | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID();
  const rawVisitorId = normalizeVisitorId(raw.visitorId);
  if (!rawVisitorId) return null;
  const visitorId = toVisitorStorageKey(rawVisitorId);
  if (!visitorId) return null;

  const rating = Number(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;

  const authorName =
    typeof raw.authorName === 'string' && raw.authorName.trim()
      ? raw.authorName.trim().slice(0, 60)
      : 'Coleccionista';
  const comment =
    typeof raw.comment === 'string' && raw.comment.trim()
      ? raw.comment.trim().slice(0, 1000)
      : '';
  if (!comment) return null;

  const photos = Array.isArray(raw.photos)
    ? raw.photos.filter((photo: unknown) => typeof photo === 'string' && photo.startsWith('http')).slice(0, MAX_REVIEW_PHOTOS)
    : [];

  const createdAt =
    typeof raw.createdAt === 'string' && raw.createdAt.trim()
      ? raw.createdAt
      : new Date().toISOString();

  return { id, visitorId, authorName, rating, comment, photos, createdAt };
}

function sanitizeState(raw: any): ProductSocialState {
  const safe = defaultState();
  if (!raw || typeof raw !== 'object') return safe;

  safe.visits = toSafeNumber(raw.visits, 0);
  safe.visitByVisitor =
    raw.visitByVisitor && typeof raw.visitByVisitor === 'object' && !Array.isArray(raw.visitByVisitor)
      ? Object.fromEntries(
          Object.entries(raw.visitByVisitor)
            .map(([key, value]) => {
              const safeKey = normalizeVisitorId(key);
              return [safeKey ? toVisitorStorageKey(safeKey) : null, typeof value === 'string' ? value : ''];
            })
            .filter(([key]) => Boolean(key))
        ) as Record<string, string>
      : {};

  safe.likeByVisitor =
    raw.likeByVisitor && typeof raw.likeByVisitor === 'object' && !Array.isArray(raw.likeByVisitor)
      ? Object.fromEntries(
          Object.entries(raw.likeByVisitor)
            .map(([key, value]) => {
              const safeKey = normalizeVisitorId(key);
              return [safeKey ? toVisitorStorageKey(safeKey) : null, Boolean(value)];
            })
            .filter(([key, value]) => Boolean(key) && value === true)
        ) as Record<string, boolean>
      : {};

  const reviews = Array.isArray(raw.reviews) ? raw.reviews : [];
  safe.reviews = reviews
    .map((item: any) => sanitizeReview(item))
    .filter((item: ProductReview | null): item is ProductReview => Boolean(item))
    .sort((a: ProductReview, b: ProductReview) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_REVIEWS_PER_PRODUCT);

  safe.updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
      ? raw.updatedAt
      : new Date().toISOString();

  return safe;
}

export async function ensureSocialBucket(): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw new Error(`Error listing buckets: ${listError.message}`);

  const exists = (buckets || []).some((bucket) => bucket.name === SOCIAL_BUCKET || bucket.id === SOCIAL_BUCKET);
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(SOCIAL_BUCKET, {
    public: true,
  });
  if (createError) {
    const message = String(createError.message || '').toLowerCase();
    if (message.includes('already exists') || message.includes('duplicate')) return;
    throw new Error(`Error creating social bucket: ${createError.message}`);
  }
}

export async function readProductSocialState(productId: string): Promise<ProductSocialState> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin.storage.from(SOCIAL_BUCKET).download(statePath(productId));
  if (error || !data) return defaultState();

  try {
    const raw = JSON.parse(await data.text());
    return sanitizeState(raw);
  } catch {
    return defaultState();
  }
}

export async function writeProductSocialState(productId: string, state: ProductSocialState): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  await ensureSocialBucket();

  const payload = {
    ...sanitizeState(state),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.storage
    .from(SOCIAL_BUCKET)
    .upload(statePath(productId), Buffer.from(JSON.stringify(payload), 'utf8'), {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });

  if (error) {
    throw new Error(`Error writing social state: ${error.message}`);
  }
}

export function trackVisit(state: ProductSocialState, visitorId: string): boolean {
  const visitorKey = toVisitorStorageKey(visitorId);
  if (!visitorKey) return false;

  const now = Date.now();
  const lastIso = state.visitByVisitor[visitorKey];
  const lastAt = lastIso ? new Date(lastIso).getTime() : 0;

  if (VISIT_COOLDOWN_MS > 0 && lastAt && now - lastAt < VISIT_COOLDOWN_MS) {
    return false;
  }

  state.visits += 1;
  state.visitByVisitor[visitorKey] = new Date(now).toISOString();
  state.updatedAt = new Date(now).toISOString();
  return true;
}

export function toggleLike(state: ProductSocialState, visitorId: string): boolean {
  const visitorKey = toVisitorStorageKey(visitorId);
  if (!visitorKey) return false;

  if (state.likeByVisitor[visitorKey]) {
    delete state.likeByVisitor[visitorKey];
    state.updatedAt = new Date().toISOString();
    return false;
  }

  state.likeByVisitor[visitorKey] = true;
  state.updatedAt = new Date().toISOString();
  return true;
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Buffer; ext: string } {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Formato de foto invalido');
  }

  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.length > MAX_REVIEW_PHOTO_BYTES) {
    throw new Error('Foto demasiado grande (max 2.5 MB)');
  }

  const extByMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  const ext = extByMime[mime];
  if (!ext) {
    throw new Error('Tipo de foto no soportado');
  }

  return { mime, bytes, ext };
}

export async function uploadReviewPhotoDataUrls(
  productId: string,
  reviewId: string,
  rawPhotos: unknown
): Promise<string[]> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const photos = Array.isArray(rawPhotos)
    ? rawPhotos.filter((item): item is string => typeof item === 'string').slice(0, MAX_REVIEW_PHOTOS)
    : [];
  if (photos.length === 0) return [];

  await ensureSocialBucket();
  const uploadedUrls: string[] = [];

  for (let index = 0; index < photos.length; index += 1) {
    const { mime, bytes, ext } = parseDataUrl(photos[index]);
    const path = `products/${productId}/reviews/${reviewId}-${index + 1}.${ext}`;

    const { error } = await supabaseAdmin.storage.from(SOCIAL_BUCKET).upload(path, bytes, {
      upsert: true,
      contentType: mime,
    });
    if (error) throw new Error(`Error subiendo foto de reseña: ${error.message}`);

    const { data } = supabaseAdmin.storage.from(SOCIAL_BUCKET).getPublicUrl(path);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

export function addReview(
  state: ProductSocialState,
  payload: {
    visitorId: string;
    authorName: string;
    rating: number;
    comment: string;
    photos?: string[];
  }
): ProductReview {
  const visitorKey = toVisitorStorageKey(payload.visitorId);
  if (!visitorKey) {
    throw new Error('Invalid visitor id');
  }

  const review: ProductReview = {
    id: randomUUID(),
    visitorId: visitorKey,
    authorName: payload.authorName.trim().slice(0, 60) || 'Coleccionista',
    rating: payload.rating,
    comment: payload.comment.trim().slice(0, 1000),
    photos: (payload.photos || []).slice(0, MAX_REVIEW_PHOTOS),
    createdAt: new Date().toISOString(),
  };

  state.reviews.unshift(review);
  if (state.reviews.length > MAX_REVIEWS_PER_PRODUCT) {
    state.reviews = state.reviews.slice(0, MAX_REVIEWS_PER_PRODUCT);
  }
  state.updatedAt = new Date().toISOString();
  return review;
}

export function getProductSocialSummary(
  state: ProductSocialState,
  visitorId?: string | null
): ProductSocialSummary {
  const likes = Object.keys(state.likeByVisitor).length;
  const reviewsCount = state.reviews.length;
  const ratingAverage =
    reviewsCount > 0
      ? Number(
          (
            state.reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviewsCount
          ).toFixed(2)
        )
      : 0;

  const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : '';

  return {
    visits: state.visits,
    likes,
    reviewsCount,
    ratingAverage,
    likedByCurrentVisitor: Boolean(visitorKey && state.likeByVisitor[visitorKey]),
  };
}
