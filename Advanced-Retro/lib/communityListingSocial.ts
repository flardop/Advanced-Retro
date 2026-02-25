import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureSocialBucket, normalizeVisitorId, toVisitorStorageKey } from '@/lib/productSocialStorage';

const MAX_COMMENTS_PER_LISTING = 250;

export type CommunityListingComment = {
  id: string;
  visitorId: string;
  userId: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  comment: string;
  createdAt: string;
};

type CommunityListingSocialState = {
  visits: number;
  visitByVisitor: Record<string, string>;
  likeByVisitor: Record<string, boolean>;
  comments: CommunityListingComment[];
  updatedAt: string;
};

export type CommunityListingSocialSummary = {
  visits: number;
  likes: number;
  commentsCount: number;
  likedByCurrentVisitor: boolean;
  updatedAt: string;
};

function defaultState(): CommunityListingSocialState {
  return {
    visits: 0,
    visitByVisitor: {},
    likeByVisitor: {},
    comments: [],
    updatedAt: new Date().toISOString(),
  };
}

function statePath(listingId: string) {
  return `community/listings/${listingId}/social.json`;
}

function sanitizeComment(raw: any): CommunityListingComment | null {
  if (!raw || typeof raw !== 'object') return null;

  const rawVisitor = normalizeVisitorId(raw.visitorId);
  if (!rawVisitor) return null;
  const visitorId = toVisitorStorageKey(rawVisitor);
  if (!visitorId) return null;

  const comment =
    typeof raw.comment === 'string' && raw.comment.trim()
      ? raw.comment.trim().slice(0, 1200)
      : '';
  if (comment.length < 2) return null;

  const authorName =
    typeof raw.authorName === 'string' && raw.authorName.trim()
      ? raw.authorName.trim().slice(0, 60)
      : 'Coleccionista';

  const authorAvatarUrl =
    typeof raw.authorAvatarUrl === 'string' &&
    raw.authorAvatarUrl.trim() &&
    (/^https?:\/\//i.test(raw.authorAvatarUrl) || raw.authorAvatarUrl.startsWith('/'))
      ? raw.authorAvatarUrl.trim()
      : null;

  const userId =
    typeof raw.userId === 'string' && raw.userId.trim()
      ? raw.userId.trim().slice(0, 80)
      : null;

  const createdAt =
    typeof raw.createdAt === 'string' && raw.createdAt.trim()
      ? raw.createdAt.trim()
      : new Date().toISOString();

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID();

  return {
    id,
    visitorId,
    userId,
    authorName,
    authorAvatarUrl,
    comment,
    createdAt,
  };
}

function sanitizeState(raw: any): CommunityListingSocialState {
  const safe = defaultState();
  if (!raw || typeof raw !== 'object') return safe;

  safe.visits = Number.isFinite(Number(raw.visits)) ? Math.max(0, Math.round(Number(raw.visits))) : 0;
  safe.updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt.trim() ? raw.updatedAt : new Date().toISOString();

  if (raw.visitByVisitor && typeof raw.visitByVisitor === 'object' && !Array.isArray(raw.visitByVisitor)) {
    safe.visitByVisitor = Object.fromEntries(
      Object.entries(raw.visitByVisitor)
        .map(([key, value]) => {
          const normalized = normalizeVisitorId(key);
          if (!normalized) return [null, null];
          return [toVisitorStorageKey(normalized), typeof value === 'string' ? value : ''];
        })
        .filter(([key, value]) => Boolean(key) && typeof value === 'string')
    ) as Record<string, string>;
  }

  if (raw.likeByVisitor && typeof raw.likeByVisitor === 'object' && !Array.isArray(raw.likeByVisitor)) {
    safe.likeByVisitor = Object.fromEntries(
      Object.entries(raw.likeByVisitor)
        .map(([key, value]) => {
          const normalized = normalizeVisitorId(key);
          if (!normalized) return [null, false];
          return [toVisitorStorageKey(normalized), Boolean(value)];
        })
        .filter(([key, value]) => Boolean(key) && value === true)
    ) as Record<string, boolean>;
  }

  const comments = Array.isArray(raw.comments) ? raw.comments : [];
  safe.comments = comments
    .map((item: any) => sanitizeComment(item))
    .filter((item: CommunityListingComment | null): item is CommunityListingComment => Boolean(item))
    .sort(
      (a: CommunityListingComment, b: CommunityListingComment) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, MAX_COMMENTS_PER_LISTING);

  return safe;
}

export async function readCommunityListingSocialState(listingId: string): Promise<CommunityListingSocialState> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin.storage.from('product-social').download(statePath(listingId));
  if (error || !data) return defaultState();

  try {
    const raw = JSON.parse(await data.text());
    return sanitizeState(raw);
  } catch {
    return defaultState();
  }
}

export async function writeCommunityListingSocialState(
  listingId: string,
  state: CommunityListingSocialState
): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  await ensureSocialBucket();

  const payload = {
    ...sanitizeState(state),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.storage
    .from('product-social')
    .upload(statePath(listingId), Buffer.from(JSON.stringify(payload), 'utf8'), {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });

  if (error) throw new Error(`Error writing community listing social state: ${error.message}`);
}

export function trackCommunityListingVisit(state: CommunityListingSocialState, visitorId: string): boolean {
  const visitorKey = toVisitorStorageKey(visitorId);
  if (!visitorKey) return false;

  state.visits += 1;
  state.visitByVisitor[visitorKey] = new Date().toISOString();
  state.updatedAt = new Date().toISOString();
  return true;
}

export function toggleCommunityListingLike(state: CommunityListingSocialState, visitorId: string): boolean {
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

export function addCommunityListingComment(
  state: CommunityListingSocialState,
  payload: {
    visitorId: string;
    userId?: string | null;
    authorName: string;
    authorAvatarUrl?: string | null;
    comment: string;
  }
): CommunityListingComment {
  const visitorKey = toVisitorStorageKey(payload.visitorId);
  if (!visitorKey) throw new Error('Invalid visitor id');

  const next: CommunityListingComment = {
    id: randomUUID(),
    visitorId: visitorKey,
    userId: payload.userId ? String(payload.userId).trim().slice(0, 80) : null,
    authorName: String(payload.authorName || '').trim().slice(0, 60) || 'Coleccionista',
    authorAvatarUrl:
      typeof payload.authorAvatarUrl === 'string' &&
      payload.authorAvatarUrl.trim() &&
      (/^https?:\/\//i.test(payload.authorAvatarUrl) || payload.authorAvatarUrl.startsWith('/'))
        ? payload.authorAvatarUrl.trim()
        : null,
    comment: String(payload.comment || '').trim().slice(0, 1200),
    createdAt: new Date().toISOString(),
  };

  if (next.comment.length < 2) {
    throw new Error('Comentario demasiado corto');
  }

  state.comments.unshift(next);
  if (state.comments.length > MAX_COMMENTS_PER_LISTING) {
    state.comments = state.comments.slice(0, MAX_COMMENTS_PER_LISTING);
  }
  state.updatedAt = new Date().toISOString();
  return next;
}

export function getCommunityListingSocialSummary(
  state: CommunityListingSocialState,
  visitorId?: string | null
): CommunityListingSocialSummary {
  const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : '';

  return {
    visits: Math.max(0, Number(state.visits || 0)),
    likes: Object.keys(state.likeByVisitor || {}).length,
    commentsCount: Array.isArray(state.comments) ? state.comments.length : 0,
    likedByCurrentVisitor: Boolean(visitorKey && state.likeByVisitor[visitorKey]),
    updatedAt: state.updatedAt || new Date().toISOString(),
  };
}
