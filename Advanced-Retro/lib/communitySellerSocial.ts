import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureSocialBucket, normalizeVisitorId, toVisitorStorageKey } from '@/lib/productSocialStorage';

type SellerSocialState = {
  visits: number;
  visitByVisitor: Record<string, string>;
  likeByVisitor: Record<string, boolean>;
  updatedAt: string;
};

export type SellerSocialSummary = {
  visits: number;
  likes: number;
  likedByCurrentVisitor: boolean;
  updatedAt: string;
};

function defaultState(): SellerSocialState {
  return {
    visits: 0,
    visitByVisitor: {},
    likeByVisitor: {},
    updatedAt: new Date().toISOString(),
  };
}

function statePath(userId: string) {
  return `community/sellers/${userId}/social.json`;
}

function sanitizeState(raw: any): SellerSocialState {
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

  return safe;
}

export async function readSellerSocialState(userId: string): Promise<SellerSocialState> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin.storage.from('product-social').download(statePath(userId));
  if (error || !data) return defaultState();

  try {
    const raw = JSON.parse(await data.text());
    return sanitizeState(raw);
  } catch {
    return defaultState();
  }
}

export async function writeSellerSocialState(userId: string, state: SellerSocialState): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  await ensureSocialBucket();

  const payload = {
    ...sanitizeState(state),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.storage
    .from('product-social')
    .upload(statePath(userId), Buffer.from(JSON.stringify(payload), 'utf8'), {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });

  if (error) throw new Error(`Error writing seller social state: ${error.message}`);
}

export function trackSellerProfileVisit(state: SellerSocialState, visitorId: string): boolean {
  const visitorKey = toVisitorStorageKey(visitorId);
  if (!visitorKey) return false;

  state.visits += 1;
  state.visitByVisitor[visitorKey] = new Date().toISOString();
  state.updatedAt = new Date().toISOString();
  return true;
}

export function toggleSellerProfileLike(state: SellerSocialState, visitorId: string): boolean {
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

export function getSellerSocialSummary(
  state: SellerSocialState,
  visitorId?: string | null
): SellerSocialSummary {
  const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : '';
  return {
    visits: Math.max(0, Number(state.visits || 0)),
    likes: Object.keys(state.likeByVisitor || {}).length,
    likedByCurrentVisitor: Boolean(visitorKey && state.likeByVisitor[visitorKey]),
    updatedAt: state.updatedAt || new Date().toISOString(),
  };
}

