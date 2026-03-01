export type GamificationActionKey =
  | 'account_created'
  | 'profile_completed'
  | 'address_added'
  | 'order_paid'
  | 'mystery_box_purchased'
  | 'community_listing_created'
  | 'community_listing_sold'
  | 'comment_posted'
  | 'daily_login'
  | 'daily_streak_bonus_7';

export type LevelRewardDefinition = {
  key: string;
  label: string;
  description: string;
  levelRequired: number;
  type: 'frame' | 'profile_background' | 'badge' | 'access' | 'name_color' | 'cosmetic';
  badgeKey?: string;
};

export type AvatarFrameDefinition = {
  id: string;
  label: string;
  minLevel: number;
  maxLevel: number | null;
  ringClassName: string;
  badgeClassName: string;
};

export const GAMIFICATION_ACTION_XP: Record<GamificationActionKey, number> = {
  account_created: 50,
  profile_completed: 30,
  address_added: 20,
  order_paid: 100,
  mystery_box_purchased: 150,
  community_listing_created: 40,
  community_listing_sold: 120,
  comment_posted: 10,
  daily_login: 5,
  daily_streak_bonus_7: 100,
};

export const GAMIFICATION_ACTION_LABELS: Record<GamificationActionKey, string> = {
  account_created: 'Cuenta creada',
  profile_completed: 'Perfil completo',
  address_added: 'Dirección añadida',
  order_paid: 'Pedido confirmado',
  mystery_box_purchased: 'Caja misteriosa comprada',
  community_listing_created: 'Producto publicado en comunidad',
  community_listing_sold: 'Producto vendido en comunidad',
  comment_posted: 'Comentario publicado',
  daily_login: 'Login diario',
  daily_streak_bonus_7: 'Bonus racha 7 días',
};

export const LEVEL_REWARDS: LevelRewardDefinition[] = [
  {
    key: 'frame_bronze_pixel',
    label: 'Marco bronce pixel',
    description: 'Marco de perfil bronce para destacar tu avatar.',
    levelRequired: 5,
    type: 'frame',
  },
  {
    key: 'frame_silver_glow',
    label: 'Marco plata glow',
    description: 'Marco plateado con brillo retro.',
    levelRequired: 10,
    type: 'frame',
  },
  {
    key: 'profile_bg_arcade',
    label: 'Fondo arcade exclusivo',
    description: 'Fondo de perfil exclusivo desbloqueado.',
    levelRequired: 15,
    type: 'profile_background',
  },
  {
    key: 'badge_level_20',
    label: 'Insignia Nivel 20',
    description: 'Insignia pública visible en tu perfil.',
    levelRequired: 20,
    type: 'badge',
    badgeKey: 'nivel-20',
  },
  {
    key: 'access_mystery_premium',
    label: 'Acceso a mystery premium',
    description: 'Acceso a cajas misteriosas premium.',
    levelRequired: 25,
    type: 'access',
  },
  {
    key: 'badge_legend_emblem',
    label: 'Emblema legendario',
    description: 'Emblema legendario de coleccionista.',
    levelRequired: 30,
    type: 'badge',
    badgeKey: 'emblema-legendario',
  },
  {
    key: 'name_color_neon',
    label: 'Color especial de nombre',
    description: 'Color distintivo del nombre en comunidad.',
    levelRequired: 40,
    type: 'name_color',
  },
  {
    key: 'frame_epic_arcade',
    label: 'Marco épico animado',
    description: 'Marco exclusivo de alto nivel tipo arcade.',
    levelRequired: 50,
    type: 'frame',
  },
];

export const AVATAR_FRAMES: AvatarFrameDefinition[] = [
  {
    id: 'no-frame',
    label: 'Sin marco',
    minLevel: 1,
    maxLevel: 4,
    ringClassName: 'border-white/35 shadow-[0_0_24px_rgba(148,163,184,0.22)]',
    badgeClassName: 'border-white/25 text-white/85',
  },
  {
    id: 'bronze-pixel',
    label: 'Marco bronce pixel',
    minLevel: 5,
    maxLevel: 9,
    ringClassName: 'border-amber-500/70 shadow-[0_0_24px_rgba(217,119,6,0.45)]',
    badgeClassName: 'border-amber-400/60 text-amber-200',
  },
  {
    id: 'silver-glow',
    label: 'Marco plata glow',
    minLevel: 10,
    maxLevel: 19,
    ringClassName: 'border-slate-300/80 shadow-[0_0_26px_rgba(203,213,225,0.55)]',
    badgeClassName: 'border-slate-300/70 text-slate-100',
  },
  {
    id: 'gold-arcade',
    label: 'Marco oro arcade',
    minLevel: 20,
    maxLevel: 29,
    ringClassName: 'border-yellow-400/85 shadow-[0_0_30px_rgba(250,204,21,0.5)]',
    badgeClassName: 'border-yellow-300/70 text-yellow-100',
  },
  {
    id: 'neon-arcade',
    label: 'Marco neón arcade',
    minLevel: 30,
    maxLevel: 39,
    ringClassName: 'border-fuchsia-400/80 shadow-[0_0_32px_rgba(217,70,239,0.5)]',
    badgeClassName: 'border-fuchsia-300/70 text-fuchsia-100',
  },
  {
    id: 'fire-pixel',
    label: 'Marco fuego pixel',
    minLevel: 40,
    maxLevel: 49,
    ringClassName: 'border-orange-400/85 shadow-[0_0_34px_rgba(251,146,60,0.52)]',
    badgeClassName: 'border-orange-300/70 text-orange-100',
  },
  {
    id: 'legendary-arcade',
    label: 'Marco legendario',
    minLevel: 50,
    maxLevel: null,
    ringClassName: 'border-cyan-300/90 shadow-[0_0_38px_rgba(34,211,238,0.65)]',
    badgeClassName: 'border-cyan-300/80 text-cyan-100',
  },
];

const BASE_LEVEL_XP = [0, 200, 500, 900, 1500] as const;
const BASE_LEVELS = BASE_LEVEL_XP.length;

function clampLevel(input: number): number {
  if (!Number.isFinite(input)) return 1;
  return Math.max(1, Math.min(500, Math.floor(input)));
}

export function getRequiredXpForLevel(levelInput: number): number {
  const level = clampLevel(levelInput);
  if (level <= BASE_LEVELS) return BASE_LEVEL_XP[level - 1];

  if (level <= 20) {
    const startXp = BASE_LEVEL_XP[BASE_LEVELS - 1]; // lvl 5
    const spanLevels = 20 - BASE_LEVELS;
    const normalized = (level - BASE_LEVELS) / spanLevels;
    const curve = Math.pow(normalized, 1.18);
    return Math.round(startXp + curve * (15000 - startXp));
  }

  if (level <= 50) {
    const normalized = (level - 20) / 30;
    return Math.round(15000 + Math.pow(normalized, 1.42) * (100000 - 15000));
  }

  const normalized = (level - 50) / 50;
  return Math.round(100000 + Math.pow(normalized, 1.58) * (340000 - 100000));
}

export function getLevelFromXp(xpInput: number): number {
  const xp = Math.max(0, Math.floor(Number(xpInput || 0)));
  let level = 1;
  while (level < 500 && getRequiredXpForLevel(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

export function getLevelProgress(xpInput: number) {
  const xpTotal = Math.max(0, Math.floor(Number(xpInput || 0)));
  const level = getLevelFromXp(xpTotal);
  const currentLevelXp = getRequiredXpForLevel(level);
  const nextLevel = Math.min(500, level + 1);
  const nextLevelXp = getRequiredXpForLevel(nextLevel);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const progressInsideLevel = Math.max(0, xpTotal - currentLevelXp);
  const progressPercent = Math.max(0, Math.min(100, (progressInsideLevel / span) * 100));

  return {
    xpTotal,
    level,
    nextLevel,
    currentLevelXp,
    nextLevelXp,
    xpToNextLevel: Math.max(0, nextLevelXp - xpTotal),
    progressInsideLevel,
    progressPercent,
  };
}

export function getAvatarFrameByLevel(levelInput: number): AvatarFrameDefinition {
  const level = clampLevel(levelInput);
  for (const frame of AVATAR_FRAMES) {
    const withinMin = level >= frame.minLevel;
    const withinMax = frame.maxLevel == null ? true : level <= frame.maxLevel;
    if (withinMin && withinMax) return frame;
  }
  return AVATAR_FRAMES[0];
}

export function getRewardsUnlockedForLevel(levelInput: number): LevelRewardDefinition[] {
  const level = clampLevel(levelInput);
  return LEVEL_REWARDS.filter((reward) => level >= reward.levelRequired);
}

export function isProfileCompletionEligible(input: {
  name?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  tagline?: string | null;
  favorite_console?: string | null;
  shipping_address?: unknown;
}): boolean {
  const hasName = String(input.name || '').trim().length >= 2;
  const hasAvatar = String(input.avatar_url || '').trim().length >= 8;
  const hasBanner = String(input.banner_url || '').trim().length >= 8;
  const hasBio = String(input.bio || '').trim().length >= 20;
  const hasTagline = String(input.tagline || '').trim().length >= 8;
  const hasConsole = String(input.favorite_console || '').trim().length >= 3;
  const shipping = input.shipping_address as Record<string, unknown> | null | undefined;
  const hasShipping =
    shipping &&
    typeof shipping === 'object' &&
    String(shipping.full_name || '').trim().length >= 3 &&
    String(shipping.line1 || '').trim().length >= 4 &&
    String(shipping.city || '').trim().length >= 2 &&
    String(shipping.postal_code || '').trim().length >= 3 &&
    String(shipping.country || '').trim().length >= 2;

  return Boolean(hasName && hasAvatar && hasBanner && hasBio && hasTagline && hasConsole && hasShipping);
}

export function getActionLabel(actionKey: string): string {
  const key = String(actionKey || '').trim() as GamificationActionKey;
  return GAMIFICATION_ACTION_LABELS[key] || key || 'Actividad';
}
