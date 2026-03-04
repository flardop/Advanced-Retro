import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  GAMIFICATION_ACTION_XP,
  getActionLabel,
  getAvatarFrameByLevel,
  getLevelFromXp,
  getLevelProgress,
  getRewardsUnlockedForLevel,
  isProfileCompletionEligible,
  LEVEL_REWARDS,
  type GamificationActionKey,
} from '@/lib/gamification';
import { ALL_BADGE_KEYS, normalizeBadgeKeys } from '@/lib/gamificationBadges';

type UserXpRow = {
  id: string;
  role?: string | null;
  xp_total: number | null;
  level: number | null;
  badges?: unknown;
  name?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  tagline?: string | null;
  favorite_console?: string | null;
  shipping_address?: unknown;
  is_verified_seller?: boolean | null;
  created_at?: string | null;
};

type RewardRow = {
  reward_key: string;
  reward_label: string;
  reward_type: string;
  level_required: number;
  metadata: Record<string, unknown> | null;
  unlocked_at: string;
};

type EventRow = {
  action_key: string;
  xp_delta: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type UserOrderSnapshot = {
  id: string;
  status: string | null;
  total: number | null;
  created_at: string | null;
  paid_at?: string | null;
  mystery_box_id?: string | null;
};

type BadgeStats = {
  hasShipping: boolean;
  profileCompleted: boolean;
  hasAvatar: boolean;
  hasBanner: boolean;
  hasBio: boolean;
  isVerifiedSeller: boolean;
  orderCount: number;
  cancelledOrderCount: number;
  hasHighValueOrder: boolean;
  hasNightOrder: boolean;
  mysteryOrderCount: number;
  mysterySpinCount: number;
  listingCount: number;
  deliveredListingCount: number;
  commentCount: number;
  likesGivenCount: number;
  streakCurrent: number;
  accountAgeDays: number;
  has0333Order: boolean;
  has64Order: boolean;
  hasMarathonOrder: boolean;
  level: number;
};

function hasMissingTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
}

function hasMissingColumnError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
}

function safeNumber(input: unknown, fallback = 0): number {
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

const MADRID_DATE_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toMadridIsoDate(value: Date): string {
  const parts = MADRID_DATE_PARTS.formatToParts(value);
  const year = parts.find((item) => item.type === 'year')?.value || '1970';
  const month = parts.find((item) => item.type === 'month')?.value || '01';
  const day = parts.find((item) => item.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

const MADRID_TIME_PARTS = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'Europe/Madrid',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function toMadridHourMinute(rawIso: string | null | undefined): { hour: number; minute: number } | null {
  const iso = String(rawIso || '').trim();
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = MADRID_TIME_PARTS.formatToParts(date);
  const hour = Number(parts.find((item) => item.type === 'hour')?.value || NaN);
  const minute = Number(parts.find((item) => item.type === 'minute')?.value || NaN);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour, minute };
}

function safeArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? (input as T[]) : [];
}

function hasShippingAddress(input: unknown): boolean {
  const shipping = input as Record<string, unknown> | null | undefined;
  if (!shipping || typeof shipping !== 'object' || Array.isArray(shipping)) return false;
  return (
    String(shipping.full_name || '').trim().length >= 3 &&
    String(shipping.line1 || '').trim().length >= 4 &&
    String(shipping.city || '').trim().length >= 2 &&
    String(shipping.postal_code || '').trim().length >= 3 &&
    String(shipping.country || '').trim().length >= 2
  );
}

function hasValidProfileImage(url: unknown): boolean {
  return String(url || '').trim().length >= 8;
}

function hasStrongText(text: unknown, minLength: number): boolean {
  return String(text || '').trim().length >= minLength;
}

function getAccountAgeDays(createdAt: string | null | undefined): number {
  const createdDate = new Date(String(createdAt || '').trim());
  if (Number.isNaN(createdDate.getTime())) return 0;
  const diffMs = Date.now() - createdDate.getTime();
  return diffMs > 0 ? Math.floor(diffMs / 86_400_000) : 0;
}

function mergeUniqueBadges(existing: unknown, newBadges: string[]): string[] {
  const base = normalizeBadgeKeys(existing);
  const merged = [...base];
  for (const badge of newBadges) {
    const normalized = String(badge || '').trim().toLowerCase();
    if (!normalized) continue;
    if (!merged.includes(normalized)) merged.push(normalized);
  }
  return merged.slice(0, 160);
}

async function getUserXpRow(userId: string): Promise<UserXpRow | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(
      'id,role,name,badges,xp_total,level,avatar_url,banner_url,bio,tagline,favorite_console,shipping_address,is_verified_seller,created_at'
    )
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserXpRow;
}

async function hasXpEventWithDedupeKey(dedupeKey: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const normalizedDedupeKey = String(dedupeKey || '').trim();
  if (!normalizedDedupeKey) return false;

  const { data, error } = await supabaseAdmin
    .from('user_xp_events')
    .select('id')
    .eq('dedupe_key', normalizedDedupeKey)
    .limit(1);

  if (error) {
    if (!hasMissingTableError(error) && !hasMissingColumnError(error)) {
      console.warn('XP dedupe precheck skipped:', error.message);
    }
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

function getBadgeDiffCount(current: string[], next: string[]): number {
  const currentSet = new Set(current);
  const nextSet = new Set(next);
  let diff = 0;
  for (const item of currentSet) {
    if (!nextSet.has(item)) diff += 1;
  }
  for (const item of nextSet) {
    if (!currentSet.has(item)) diff += 1;
  }
  return diff;
}

function sortBadgeKeys(keys: string[]): string[] {
  const normalized = [...new Set(keys.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))];
  const indexByKey = new Map(ALL_BADGE_KEYS.map((key, index) => [key, index]));
  return normalized.sort((a, b) => {
    const indexA = indexByKey.has(a) ? Number(indexByKey.get(a)) : 9_999;
    const indexB = indexByKey.has(b) ? Number(indexByKey.get(b)) : 9_999;
    if (indexA !== indexB) return indexA - indexB;
    return a.localeCompare(b, 'es');
  });
}

async function fetchUserOrders(userId: string): Promise<UserOrderSnapshot[]> {
  if (!supabaseAdmin) return [];
  const selectCandidates = [
    'id,status,total,created_at,paid_at,mystery_box_id',
    'id,status,total,created_at,paid_at',
    'id,status,total,created_at',
  ];

  for (const select of selectCandidates) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(select)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2500);

    if (!error && Array.isArray(data)) {
      return safeArray<any>(data).map((row) => ({
        id: String(row?.id || ''),
        status: typeof row?.status === 'string' ? row.status : null,
        total: Number.isFinite(Number(row?.total)) ? Number(row.total) : null,
        created_at: typeof row?.created_at === 'string' ? row.created_at : null,
        paid_at: typeof row?.paid_at === 'string' ? row.paid_at : null,
        mystery_box_id: typeof row?.mystery_box_id === 'string' ? row.mystery_box_id : null,
      }));
    }

    if (error && !hasMissingTableError(error) && !hasMissingColumnError(error)) {
      console.warn('Order metrics skipped:', error.message);
      return [];
    }
  }

  return [];
}

async function fetchOrderItemsQuantityMap(orderIds: string[]): Promise<Map<string, number>> {
  const byOrder = new Map<string, number>();
  if (!supabaseAdmin || orderIds.length === 0) return byOrder;

  const chunkSize = 250;
  for (let index = 0; index < orderIds.length; index += chunkSize) {
    const slice = orderIds.slice(index, index + chunkSize);
    if (slice.length === 0) continue;

    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select('order_id,quantity')
      .in('order_id', slice);

    if (error) {
      if (!hasMissingTableError(error) && !hasMissingColumnError(error)) {
        console.warn('Order item metrics skipped:', error.message);
      }
      return byOrder;
    }

    for (const row of safeArray<any>(data)) {
      const orderId = String(row?.order_id || '').trim();
      const quantity = Math.max(0, Math.floor(safeNumber(row?.quantity, 0)));
      if (!orderId || quantity <= 0) continue;
      byOrder.set(orderId, (byOrder.get(orderId) || 0) + quantity);
    }
  }

  return byOrder;
}

async function fetchExactCount(options: {
  table: string;
  apply: (query: any) => any;
}): Promise<number> {
  if (!supabaseAdmin) return 0;
  try {
    const baseQuery = supabaseAdmin.from(options.table).select('id', { head: true, count: 'exact' });
    const scopedQuery = options.apply(baseQuery);
    const { count, error } = await scopedQuery;
    if (error) {
      if (!hasMissingTableError(error) && !hasMissingColumnError(error)) {
        console.warn(`Count skipped for ${options.table}:`, error.message);
      }
      return 0;
    }
    return Math.max(0, Math.floor(safeNumber(count, 0)));
  } catch (error: any) {
    if (!hasMissingTableError(error) && !hasMissingColumnError(error)) {
      console.warn(`Count failed for ${options.table}:`, error?.message || error);
    }
    return 0;
  }
}

async function collectBadgeStats(userId: string, userRow: UserXpRow, level: number): Promise<BadgeStats> {
  const paidOrderStatuses = new Set(['paid', 'shipped', 'delivered']);
  const orders = await fetchUserOrders(userId);
  const paidOrders = orders.filter((order) =>
    paidOrderStatuses.has(String(order?.status || '').toLowerCase())
  );
  const paidOrderIds = paidOrders.map((order) => String(order.id || '').trim()).filter(Boolean);
  const orderItemQuantityByOrder = await fetchOrderItemsQuantityMap(paidOrderIds);

  const mysteryOrderCount = paidOrders.filter((order) => String(order?.mystery_box_id || '').trim().length > 0).length;
  const hasHighValueOrder = paidOrders.some((order) => safeNumber(order?.total, 0) >= 10_000);
  const has64Order = paidOrders.some((order) => safeNumber(order?.total, 0) === 6_400);
  const cancelledOrderCount = orders.filter(
    (order) => String(order?.status || '').toLowerCase() === 'cancelled'
  ).length;

  let hasNightOrder = false;
  let has0333Order = false;
  for (const order of paidOrders) {
    const hourMinute = toMadridHourMinute(order?.paid_at || order?.created_at || null);
    if (!hourMinute) continue;
    if (hourMinute.hour >= 0 && hourMinute.hour < 6) {
      hasNightOrder = true;
    }
    if (hourMinute.hour === 3 && hourMinute.minute === 33) {
      has0333Order = true;
    }
    if (hasNightOrder && has0333Order) break;
  }

  const hasMarathonOrder = paidOrders.some((order) => {
    const orderId = String(order.id || '').trim();
    if (!orderId) return false;
    return Math.max(0, Number(orderItemQuantityByOrder.get(orderId) || 0)) >= 3;
  });

  let listingCount = 0;
  let deliveredListingCount = 0;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('user_product_listings')
      .select('id,delivery_status')
      .eq('user_id', userId)
      .limit(3500);

    if (!error && Array.isArray(data)) {
      listingCount = data.length;
      deliveredListingCount = data.filter(
        (row) => String((row as any)?.delivery_status || '').toLowerCase() === 'delivered'
      ).length;
    } else if (error && !hasMissingTableError(error) && !hasMissingColumnError(error)) {
      console.warn('Listing metrics skipped:', error.message);
    }
  }

  const mysterySpinCount = await fetchExactCount({
    table: 'mystery_spins',
    apply: (query) => query.eq('user_id', userId),
  });
  const commentCount = await fetchExactCount({
    table: 'user_xp_events',
    apply: (query) => query.eq('user_id', userId).eq('action_key', 'comment_posted'),
  });
  const likesGivenCount = await fetchExactCount({
    table: 'product_likes',
    apply: (query) => query.eq('user_id', userId),
  });

  let streakCurrent = 0;
  if (supabaseAdmin) {
    const { data: streakRow, error: streakError } = await supabaseAdmin
      .from('user_login_streaks')
      .select('streak_count')
      .eq('user_id', userId)
      .maybeSingle();
    if (!streakError && streakRow) {
      streakCurrent = Math.max(0, Math.floor(safeNumber((streakRow as any)?.streak_count, 0)));
    } else if (streakError && !hasMissingTableError(streakError) && !hasMissingColumnError(streakError)) {
      console.warn('Streak metrics skipped:', streakError.message);
    }
  }

  return {
    hasShipping: hasShippingAddress(userRow.shipping_address),
    profileCompleted: isProfileCompletionEligible({
      name: userRow.name,
      avatar_url: userRow.avatar_url,
      banner_url: userRow.banner_url,
      bio: userRow.bio,
      tagline: userRow.tagline,
      favorite_console: userRow.favorite_console,
      shipping_address: userRow.shipping_address,
    }),
    hasAvatar: hasValidProfileImage(userRow.avatar_url),
    hasBanner: hasValidProfileImage(userRow.banner_url),
    hasBio: hasStrongText(userRow.bio, 20),
    isVerifiedSeller: Boolean(userRow.is_verified_seller) || String(userRow.role || '') === 'admin',
    orderCount: paidOrders.length,
    cancelledOrderCount,
    hasHighValueOrder,
    hasNightOrder,
    mysteryOrderCount,
    mysterySpinCount,
    listingCount,
    deliveredListingCount,
    commentCount,
    likesGivenCount,
    streakCurrent,
    accountAgeDays: getAccountAgeDays(userRow.created_at),
    has0333Order,
    has64Order,
    hasMarathonOrder,
    level,
  };
}

function collectAutomaticBadgeKeys(stats: BadgeStats): string[] {
  const badges = new Set<string>();
  const add = (condition: boolean, badgeKey: string) => {
    if (condition) badges.add(badgeKey);
  };

  add(stats.hasShipping, 'direccion-confirmada');
  add(stats.profileCompleted, 'perfil-completo');
  add(stats.hasAvatar, 'foto-perfil');
  add(stats.hasBanner, 'banner-personalizado');
  add(stats.hasBio, 'bio-retro');
  add(stats.isVerifiedSeller, 'cuenta-verificada');

  add(stats.orderCount >= 1, 'primer-cartucho');
  add(stats.orderCount >= 5, 'jugador-habitual');
  add(stats.orderCount >= 10, 'coleccionista-oficial');
  add(stats.orderCount >= 25, 'veterano-retro');
  add(stats.orderCount >= 50, 'leyenda-del-pixel');
  add(stats.orderCount >= 100, 'maestro-del-arcade');
  add(stats.hasHighValueOrder, 'inversor-retro');
  add(stats.hasNightOrder, 'buho-gamer');

  add(stats.mysteryOrderCount >= 1, 'valiente-del-misterio');
  add(stats.mysteryOrderCount >= 5, 'amante-del-azar');
  add(stats.mysteryOrderCount >= 10, 'maestro-del-destino');
  add(stats.mysterySpinCount >= 1, 'giro-inaugural');
  add(stats.mysterySpinCount >= 20, 'dios-del-spin');

  add(stats.listingCount >= 1, 'primer-vendedor');
  add(stats.listingCount >= 5, 'mercader-retro');
  add(stats.listingCount >= 20, 'tienda-activa');
  add(stats.listingCount >= 50, 'gran-comerciante');
  add(stats.deliveredListingCount >= 1, 'venta-exitosa');
  add(stats.deliveredListingCount >= 10, 'vendedor-confianza');
  add(stats.deliveredListingCount >= 50, 'power-seller');

  add(stats.commentCount >= 1, 'voz-retro');
  add(stats.commentCount >= 10, 'participante-activo');
  add(stats.commentCount >= 50, 'espiritu-comunitario');
  add(stats.likesGivenCount >= 1, 'apoyo-inicial');
  add(stats.likesGivenCount >= 100, 'fan-del-retro');

  add(stats.streakCurrent >= 7, 'constante');
  add(stats.streakCurrent >= 30, 'comprometido');
  add(stats.streakCurrent >= 100, 'adicto-al-pixel');

  add(stats.accountAgeDays >= 365, 'miembro-fundador');
  add(stats.accountAgeDays >= 365 * 3, 'icono-advanced-retro');

  add(stats.has0333Order, 'hora-misteriosa');
  add(stats.has64Order, 'nintendo-vibes');
  add(stats.hasMarathonOrder, 'maraton-gamer');
  add(stats.orderCount >= 5 && stats.cancelledOrderCount === 0, 'cliente-ejemplar');

  add(stats.level >= 20, 'nivel-20');
  add(stats.level >= 30, 'emblema-legendario');

  return [...badges];
}

async function syncUserBadges(options: {
  userId: string;
  level: number;
  userRow?: UserXpRow | null;
}): Promise<string[]> {
  if (!supabaseAdmin) return [];
  const userId = String(options.userId || '').trim();
  if (!userId) return [];

  const userRow = options.userRow || (await getUserXpRow(userId));
  if (!userRow) return [];

  const existing = normalizeBadgeKeys(userRow.badges);
  const stats = await collectBadgeStats(userId, userRow, options.level);
  const auto = collectAutomaticBadgeKeys(stats);
  let next = mergeUniqueBadges(existing, auto);

  if (String(userRow.role || '').toLowerCase() === 'admin') {
    next = mergeUniqueBadges(next, ALL_BADGE_KEYS);
  }

  next = sortBadgeKeys(next);

  if (getBadgeDiffCount(existing, next) > 0) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        badges: next,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (error && !hasMissingTableError(error) && !hasMissingColumnError(error)) {
      console.warn('Badge sync skipped:', error.message);
    }
  }

  return next;
}

async function unlockRewardsForLevel(userId: string, fromLevel: number, toLevel: number) {
  if (!supabaseAdmin || toLevel <= fromLevel) return;

  const unlocks = LEVEL_REWARDS.filter(
    (reward) => reward.levelRequired > fromLevel && reward.levelRequired <= toLevel
  );

  if (unlocks.length === 0) return;

  const rows = unlocks.map((reward) => ({
    user_id: userId,
    reward_key: reward.key,
    reward_label: reward.label,
    reward_type: reward.type,
    level_required: reward.levelRequired,
    metadata: {
      description: reward.description,
      badge_key: reward.badgeKey || null,
    },
  }));

  const { error: unlockError } = await supabaseAdmin
    .from('user_level_rewards')
    .upsert(rows, { onConflict: 'user_id,reward_key' });

  if (unlockError && !hasMissingTableError(unlockError)) {
    console.warn('Reward unlock insert skipped:', unlockError.message);
  }

  const badgeRewards = unlocks
    .map((reward) => reward.badgeKey)
    .filter((value): value is string => Boolean(value));

  if (badgeRewards.length === 0) return;
  const current = await getUserXpRow(userId);
  if (!current) return;
  const nextBadges = mergeUniqueBadges(current.badges, badgeRewards);
  await supabaseAdmin.from('users').update({ badges: nextBadges }).eq('id', userId);
}

export async function grantXpToUser(options: {
  userId: string;
  actionKey: GamificationActionKey;
  xpDelta?: number;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!supabaseAdmin) return { awarded: false, levelUp: false };
  const userId = String(options.userId || '').trim();
  if (!userId) return { awarded: false, levelUp: false };

  const actionKey = options.actionKey;
  const xpDelta = Math.max(
    -10000,
    Math.min(10000, Math.round(safeNumber(options.xpDelta, GAMIFICATION_ACTION_XP[actionKey] || 0)))
  );
  if (!xpDelta) return { awarded: false, levelUp: false };

  const dedupeKey = String(options.dedupeKey || '')
    .trim()
    .slice(0, 180);

  const before = await getUserXpRow(userId);
  if (!before) return { awarded: false, levelUp: false };
  const prevXp = Math.max(0, Math.floor(safeNumber(before.xp_total, 0)));
  const prevLevel = Math.max(1, Math.floor(safeNumber(before.level, getLevelFromXp(prevXp))));

  if (dedupeKey && (await hasXpEventWithDedupeKey(dedupeKey))) {
    return {
      awarded: false,
      levelUp: false,
      previousLevel: prevLevel,
      currentLevel: prevLevel,
      xpDelta: 0,
    };
  }

  const nextXp = Math.max(0, prevXp + xpDelta);
  const nextLevel = getLevelFromXp(nextXp);

  try {
    const insertPayload = {
      user_id: userId,
      action_key: actionKey,
      xp_delta: xpDelta,
      dedupe_key: dedupeKey || null,
      metadata: options.metadata || {},
    };

    const { error: eventError } = await supabaseAdmin.from('user_xp_events').insert(insertPayload);
    if (eventError) {
      const msg = String(eventError.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return {
          awarded: false,
          levelUp: false,
          previousLevel: prevLevel,
          currentLevel: prevLevel,
          xpDelta: 0,
        };
      }
      if (!hasMissingTableError(eventError)) {
        console.warn('XP event insert skipped:', eventError.message);
      }
    }
  } catch (error: any) {
    if (!hasMissingTableError(error)) {
      console.warn('XP event insert failed:', error?.message || error);
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      xp_total: nextXp,
      level: nextLevel,
      xp_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    if (!hasMissingTableError(updateError)) {
      console.warn('XP user update skipped:', updateError.message);
    }
    return { awarded: false, levelUp: false };
  }

  if (nextLevel > prevLevel) {
    await unlockRewardsForLevel(userId, prevLevel, nextLevel);
  }

  void syncUserBadges({
    userId,
    level: nextLevel,
    userRow: {
      ...before,
      level: nextLevel,
      xp_total: nextXp,
    },
  }).catch((error) => {
    console.warn('Async badge sync skipped:', error);
  });

  return {
    awarded: true,
    levelUp: nextLevel > prevLevel,
    previousLevel: prevLevel,
    currentLevel: nextLevel,
    xpDelta,
  };
}

export async function awardDailyLoginXpIfNeeded(userId: string) {
  if (!supabaseAdmin) return;
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return;

  const now = new Date();
  const today = toMadridIsoDate(now);
  const yesterday = toMadridIsoDate(new Date(now.getTime() - 86_400_000));

  const { data: row, error } = await supabaseAdmin
    .from('user_login_streaks')
    .select('user_id,streak_count,longest_streak,last_login_on')
    .eq('user_id', normalizedUserId)
    .maybeSingle();

  if (error && !hasMissingTableError(error)) {
    console.warn('Login streak read skipped:', error.message);
  }

  const lastLoginOn = String((row as any)?.last_login_on || '').trim();
  if (lastLoginOn === today) return;

  const previousStreak = Math.max(0, Math.floor(safeNumber((row as any)?.streak_count, 0)));
  const nextStreak = lastLoginOn === yesterday ? previousStreak + 1 : 1;
  const longest = Math.max(nextStreak, Math.floor(safeNumber((row as any)?.longest_streak, 0)));

  const { error: upsertError } = await supabaseAdmin.from('user_login_streaks').upsert(
    {
      user_id: normalizedUserId,
      streak_count: nextStreak,
      longest_streak: longest,
      last_login_on: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (upsertError && !hasMissingTableError(upsertError)) {
    console.warn('Login streak upsert skipped:', upsertError.message);
  }

  await grantXpToUser({
    userId: normalizedUserId,
    actionKey: 'daily_login',
    dedupeKey: `daily-login:${normalizedUserId}:${today}`,
    metadata: { day: today, streak: nextStreak },
  });

  if (nextStreak % 7 === 0) {
    await grantXpToUser({
      userId: normalizedUserId,
      actionKey: 'daily_streak_bonus_7',
      dedupeKey: `daily-streak7:${normalizedUserId}:${today}:${nextStreak}`,
      metadata: { day: today, streak: nextStreak },
    });
  }
}

export async function awardProfileMilestones(options: {
  userId: string;
  profile: {
    name?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    bio?: string | null;
    tagline?: string | null;
    favorite_console?: string | null;
    shipping_address?: unknown;
  };
}) {
  const userId = String(options.userId || '').trim();
  if (!userId) return;

  const profile = options.profile;
  if (isProfileCompletionEligible(profile)) {
    await grantXpToUser({
      userId,
      actionKey: 'profile_completed',
      dedupeKey: `profile-completed:${userId}:v1`,
      metadata: { source: 'profile_save' },
    });
  }

  const shipping = profile.shipping_address as Record<string, unknown> | null | undefined;
  const hasShipping =
    shipping &&
    typeof shipping === 'object' &&
    String(shipping.full_name || '').trim().length > 0 &&
    String(shipping.line1 || '').trim().length > 0 &&
    String(shipping.city || '').trim().length > 0 &&
    String(shipping.postal_code || '').trim().length > 0 &&
    String(shipping.country || '').trim().length > 0;

  if (hasShipping) {
    await grantXpToUser({
      userId,
      actionKey: 'address_added',
      dedupeKey: `address-added:${userId}:v1`,
      metadata: { source: 'profile_save' },
    });
  }
}

export async function getGamificationSnapshot(userId: string) {
  const base = {
    xp_total: 0,
    level: 1,
    progress: getLevelProgress(0),
    frame: getAvatarFrameByLevel(1),
    streak: {
      current: 0,
      longest: 0,
      last_login_on: null as string | null,
    },
    rewards: [] as RewardRow[],
    recent: [] as Array<{
      type: 'xp' | 'reward';
      title: string;
      subtitle: string;
      xp_delta?: number;
      created_at: string;
    }>,
  };

  if (!supabaseAdmin) return base;
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return base;

  const userRow = await getUserXpRow(normalizedUserId);
  const xpTotal = Math.max(0, Math.floor(safeNumber(userRow?.xp_total, 0)));
  const level = Math.max(1, Math.floor(safeNumber(userRow?.level, getLevelFromXp(xpTotal))));

  await syncUserBadges({
    userId: normalizedUserId,
    level,
    userRow,
  });

  const progress = getLevelProgress(xpTotal);
  const frame = getAvatarFrameByLevel(level);

  const [streakRes, rewardsRes, eventsRes] = await Promise.all([
    supabaseAdmin
      .from('user_login_streaks')
      .select('streak_count,longest_streak,last_login_on')
      .eq('user_id', normalizedUserId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_level_rewards')
      .select('reward_key,reward_label,reward_type,level_required,metadata,unlocked_at')
      .eq('user_id', normalizedUserId)
      .order('unlocked_at', { ascending: false })
      .limit(60),
    supabaseAdmin
      .from('user_xp_events')
      .select('action_key,xp_delta,metadata,created_at')
      .eq('user_id', normalizedUserId)
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  const streak = {
    current: Math.max(0, Math.floor(safeNumber((streakRes.data as any)?.streak_count, 0))),
    longest: Math.max(0, Math.floor(safeNumber((streakRes.data as any)?.longest_streak, 0))),
    last_login_on: (streakRes.data as any)?.last_login_on || null,
  };

  const rewardsRows = Array.isArray(rewardsRes.data) ? (rewardsRes.data as RewardRow[]) : [];
  const fallbackRewards = getRewardsUnlockedForLevel(level)
    .map((reward) => ({
      reward_key: reward.key,
      reward_label: reward.label,
      reward_type: reward.type,
      level_required: reward.levelRequired,
      metadata: { description: reward.description, badge_key: reward.badgeKey || null },
      unlocked_at: '',
    }))
    .filter((reward) => !rewardsRows.some((row) => row.reward_key === reward.reward_key));
  const rewards = [...rewardsRows, ...fallbackRewards]
    .sort((a, b) => Number(b.level_required || 0) - Number(a.level_required || 0))
    .slice(0, 24);

  const eventRows = Array.isArray(eventsRes.data) ? (eventsRes.data as EventRow[]) : [];
  const recentXp = eventRows.map((event) => ({
    type: 'xp' as const,
    title: getActionLabel(String(event.action_key || '')),
    subtitle: `${event.xp_delta >= 0 ? '+' : ''}${event.xp_delta} XP`,
    xp_delta: Number(event.xp_delta || 0),
    created_at: String(event.created_at || ''),
  }));
  const recentRewards = rewardsRows.map((reward) => ({
    type: 'reward' as const,
    title: reward.reward_label,
    subtitle: `Recompensa desbloqueada (Nivel ${reward.level_required})`,
    created_at: String(reward.unlocked_at || ''),
  }));

  const recent = [...recentXp, ...recentRewards]
    .filter((item) => Boolean(item.created_at))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 14);

  return {
    xp_total: xpTotal,
    level,
    progress,
    frame,
    streak,
    rewards,
    recent,
  };
}
