export type ProfileHonorInput = {
  accountAgeDays: number;
  activeSeconds: number;
  sessionsCount: number;
  pageViews: number;
  paidOrdersCount: number;
  deliveredOrdersCount: number;
  totalSpendCents: number;
  badgesCount: number;
  helperReputation: number;
  xpTotal: number;
};

export type ProfileHonorTier = {
  id: 'recruit' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
  label: string;
  shortLabel: string;
  minScore: number;
  glowClassName: string;
  accentClassName: string;
};

export type ProfileHonorBreakdown = {
  label: string;
  points: number;
  note: string;
};

export type ProfileHonorSnapshot = {
  score: number;
  maxScore: number;
  tier: ProfileHonorTier;
  nextTier: ProfileHonorTier | null;
  progressPercent: number;
  breakdown: ProfileHonorBreakdown[];
  highlights: string[];
};

const HONOR_TIERS: ProfileHonorTier[] = [
  {
    id: 'recruit',
    label: 'Recluta Pixel',
    shortLabel: 'Rookie',
    minScore: 0,
    glowClassName: 'border-white/25 shadow-[0_0_24px_rgba(148,163,184,0.18)]',
    accentClassName: 'text-white/90',
  },
  {
    id: 'bronze',
    label: 'Bronce Retro',
    shortLabel: 'Bronce',
    minScore: 120,
    glowClassName: 'border-amber-500/60 shadow-[0_0_26px_rgba(217,119,6,0.34)]',
    accentClassName: 'text-amber-200',
  },
  {
    id: 'silver',
    label: 'Plata Arcade',
    shortLabel: 'Plata',
    minScore: 260,
    glowClassName: 'border-slate-300/65 shadow-[0_0_28px_rgba(203,213,225,0.34)]',
    accentClassName: 'text-slate-100',
  },
  {
    id: 'gold',
    label: 'Oro Verified',
    shortLabel: 'Oro',
    minScore: 430,
    glowClassName: 'border-yellow-400/70 shadow-[0_0_32px_rgba(250,204,21,0.36)]',
    accentClassName: 'text-yellow-100',
  },
  {
    id: 'platinum',
    label: 'Platino Vault',
    shortLabel: 'Platino',
    minScore: 620,
    glowClassName: 'border-cyan-300/75 shadow-[0_0_34px_rgba(34,211,238,0.38)]',
    accentClassName: 'text-cyan-100',
  },
  {
    id: 'diamond',
    label: 'Diamante Legacy',
    shortLabel: 'Diamante',
    minScore: 820,
    glowClassName: 'border-fuchsia-300/80 shadow-[0_0_38px_rgba(232,121,249,0.42)]',
    accentClassName: 'text-fuchsia-100',
  },
  {
    id: 'legend',
    label: 'Leyenda Advanced Retro',
    shortLabel: 'Leyenda',
    minScore: 960,
    glowClassName: 'border-emerald-300/80 shadow-[0_0_40px_rgba(52,211,153,0.42)]',
    accentClassName: 'text-emerald-100',
  },
];

function clampNumber(value: unknown): number {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function buildHighlights(input: ProfileHonorInput): string[] {
  const highlights: string[] = [];
  if (input.deliveredOrdersCount >= 10) highlights.push('Historial sólido de entregas');
  if (input.totalSpendCents >= 150000) highlights.push('Comprador de alto compromiso');
  if (input.activeSeconds >= 60 * 60 * 20) highlights.push('Uso recurrente de la plataforma');
  if (input.badgesCount >= 6) highlights.push('Perfil implicado y coleccionista visible');
  if (input.helperReputation >= 10) highlights.push('Aporta valor a la comunidad');
  if (highlights.length === 0) highlights.push('Cuenta en progreso dentro de Advanced Retro');
  return highlights.slice(0, 3);
}

export function buildProfileHonorSnapshot(input: ProfileHonorInput): ProfileHonorSnapshot {
  const agePoints = Math.min(140, Math.floor(clampNumber(input.accountAgeDays) / 5));
  const activePoints = Math.min(180, Math.floor(clampNumber(input.activeSeconds) / 7200));
  const consistencyPoints = Math.min(
    140,
    Math.floor(clampNumber(input.sessionsCount) * 3 + clampNumber(input.pageViews) * 0.2)
  );
  const commercePoints = Math.min(
    220,
    Math.floor(clampNumber(input.paidOrdersCount) * 16 + clampNumber(input.deliveredOrdersCount) * 12)
  );
  const spendPoints = Math.min(120, Math.floor(clampNumber(input.totalSpendCents) / 2000));
  const prestigePoints = Math.min(
    180,
    Math.floor(clampNumber(input.badgesCount) * 8 + clampNumber(input.helperReputation) * 3 + clampNumber(input.xpTotal) / 250)
  );

  const breakdown: ProfileHonorBreakdown[] = [
    {
      label: 'Antigüedad',
      points: agePoints,
      note: 'Cuánto tiempo lleva activa la cuenta dentro de la plataforma.',
    },
    {
      label: 'Tiempo real de uso',
      points: activePoints,
      note: 'Tiempo consolidado navegando, gestionando y explorando la tienda.',
    },
    {
      label: 'Constancia',
      points: consistencyPoints,
      note: 'Sesiones y páginas vistas que indican recurrencia de uso.',
    },
    {
      label: 'Confianza comercial',
      points: commercePoints,
      note: 'Pedidos válidos y entregas cerradas con normalidad.',
    },
    {
      label: 'Gasto verificado',
      points: spendPoints,
      note: 'Euros realmente movidos dentro de Advanced Retro.',
    },
    {
      label: 'Prestigio',
      points: prestigePoints,
      note: 'XP, insignias y reputación de ayuda a otros usuarios.',
    },
  ];

  const maxScore = 980;
  const score = breakdown.reduce((total, item) => total + item.points, 0);
  const tier =
    [...HONOR_TIERS].reverse().find((entry) => score >= entry.minScore) || HONOR_TIERS[0];
  const tierIndex = HONOR_TIERS.findIndex((entry) => entry.id === tier.id);
  const nextTier = tierIndex >= 0 && tierIndex < HONOR_TIERS.length - 1 ? HONOR_TIERS[tierIndex + 1] : null;
  const currentFloor = tier.minScore;
  const nextFloor = nextTier ? nextTier.minScore : maxScore;
  const progressPercent = nextTier
    ? Math.max(0, Math.min(100, ((score - currentFloor) / Math.max(1, nextFloor - currentFloor)) * 100))
    : 100;

  return {
    score,
    maxScore,
    tier,
    nextTier,
    progressPercent,
    breakdown,
    highlights: buildHighlights(input),
  };
}
