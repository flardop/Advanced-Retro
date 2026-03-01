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

type UserXpRow = {
  id: string;
  xp_total: number | null;
  level: number | null;
  badges?: unknown;
  name?: string | null;
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

function hasMissingTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
}

function safeNumber(input: unknown, fallback = 0): number {
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function mergeUniqueBadges(existing: unknown, newBadges: string[]): string[] {
  const base = Array.isArray(existing)
    ? existing.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
  const merged = [...base];
  for (const badge of newBadges) {
    const normalized = String(badge || '').trim();
    if (!normalized) continue;
    if (!merged.includes(normalized)) merged.push(normalized);
  }
  return merged.slice(0, 24);
}

async function getUserXpRow(userId: string): Promise<UserXpRow | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id,name,badges,xp_total,level')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserXpRow;
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

  const today = toIsoDate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = toIsoDate(yesterdayDate);

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
