import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type MembershipTier = 'explorer' | 'collector' | 'vip';
export type BillingPeriod = 'monthly' | 'yearly';

export type MembershipBenefit = {
  label: string;
  emphasized?: boolean;
};

export type MembershipPlan = {
  tier: MembershipTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  accent: string;
  badge?: string;
  description: string;
  benefits: MembershipBenefit[];
};

export type UserMembership = {
  userId: string | null;
  tier: MembershipTier;
  billingPeriod: BillingPeriod;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  stripeSubscriptionId?: string | null;
  source: 'default' | 'database' | 'admin';
};

const TIER_ORDER: Record<MembershipTier, number> = {
  explorer: 0,
  collector: 1,
  vip: 2,
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: 'explorer',
    name: 'Explorador',
    tagline: 'Entrada abierta al ecosistema',
    monthlyPrice: 0,
    yearlyPrice: 0,
    accent: 'from-slate-400/45 via-slate-100/12 to-white/5',
    description:
      'Para descubrir la tienda oficial, la comunidad y el contenido editorial de AdvancedRetro sin pagar nada.',
    benefits: [
      { label: 'Acceso a la tienda oficial y al catálogo completo' },
      { label: 'Participación básica en comunidad' },
      { label: 'Acceso al blog y al universo Retroville' },
      { label: '1 participación al mes en ruleta' },
      { label: 'Avisos por email de nuevos productos' },
    ],
  },
  {
    tier: 'collector',
    name: 'Coleccionista',
    tagline: 'Más acceso, más ventaja, más presencia',
    monthlyPrice: 4.99,
    yearlyPrice: 49,
    accent: 'from-sky-400/70 via-cyan-300/30 to-indigo-500/18',
    badge: 'POPULAR',
    description:
      'Pensado para quien compra con frecuencia, quiere acceso preferente y además quiere empezar a vender con una tienda propia dentro de AdvancedRetro.',
    benefits: [
      { label: 'Todo lo de Explorador' },
      { label: '5% de descuento en tienda oficial', emphasized: true },
      { label: 'Acceso 24h antes a nuevos drops y reposiciones' },
      { label: 'Prioridad en la lista de Mystery Boxes' },
      { label: '3 participaciones al mes en ruleta' },
      { label: 'Sala Coleccionista dentro de comunidad' },
      { label: 'Badge verificado en tu perfil' },
      { label: 'Tienda personal con hasta 10 productos', emphasized: true },
      { label: 'Marca visible “Made with AdvancedRetro” en tu tienda' },
      { label: 'Soporte prioritario por ticket' },
    ],
  },
  {
    tier: 'vip',
    name: 'VIP Retro',
    tagline: 'La capa premium del ecosistema',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    accent: 'from-amber-300/80 via-yellow-300/35 to-orange-500/25',
    description:
      'Para usuarios que quieren comprar antes, vender más y tener una tienda mucho más libre, con presencia propia y menos huella visible de plataforma.',
    benefits: [
      { label: 'Todo lo de Coleccionista' },
      { label: '10% de descuento en tienda oficial', emphasized: true },
      { label: 'Acceso VIP 72h antes a drops destacados' },
      { label: '20% de descuento en Mystery Box mensual' },
      { label: 'Participaciones ilimitadas en ruleta' },
      { label: 'Acceso prioritario a subastas y señales previas' },
      { label: 'Tienda personal con productos ilimitados', emphasized: true },
      { label: 'Panel con analytics básicos de su tienda' },
      { label: 'Presentación sin branding visible de AdvancedRetro', emphasized: true },
      { label: 'Acceso prioritario a la beta de Retroville' },
      { label: 'Soporte directo en menos de 24h' },
    ],
  },
];

export function normalizeMembershipTier(value: unknown): MembershipTier {
  const safe = String(value || '').trim().toLowerCase();
  if (safe === 'collector') return 'collector';
  if (safe === 'vip' || safe === 'vip-retro') return 'vip';
  return 'explorer';
}

export function normalizeBillingPeriod(value: unknown): BillingPeriod {
  return String(value || '').trim().toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
}

export function getMembershipPlan(tier: MembershipTier) {
  return MEMBERSHIP_PLANS.find((plan) => plan.tier === tier) || MEMBERSHIP_PLANS[0];
}

export function getMembershipDisplayName(tier: MembershipTier) {
  return getMembershipPlan(tier).name;
}

export function hasRequiredTier(current: MembershipTier, required: MembershipTier) {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

export function getMembershipDiscount(tier: MembershipTier) {
  if (tier === 'vip') return 10;
  if (tier === 'collector') return 5;
  return 0;
}

export function getStoreProductLimit(tier: MembershipTier) {
  if (tier === 'vip') return null;
  if (tier === 'collector') return 10;
  return 0;
}

export function isWhiteLabelStorefront(tier: MembershipTier) {
  return tier === 'vip';
}

function defaultMembership(userId: string | null): UserMembership {
  return {
    userId,
    tier: 'explorer',
    billingPeriod: 'monthly',
    startDate: null,
    endDate: null,
    isActive: true,
    stripeSubscriptionId: null,
    source: 'default',
  };
}

async function userIsAdmin(userId: string) {
  if (!supabaseAdmin) return false;

  const [profilesRes, usersRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('role').eq('id', userId).maybeSingle(),
    supabaseAdmin.from('users').select('role').eq('id', userId).maybeSingle(),
  ]);

  const profileRole = String(profilesRes.data?.role || '').trim().toLowerCase();
  const userRole = String(usersRes.data?.role || '').trim().toLowerCase();
  return profileRole === 'admin' || userRole === 'admin';
}

export async function getUserMembership(userId: string | null): Promise<UserMembership> {
  if (!userId) return defaultMembership(null);

  if (!supabaseAdmin) {
    return defaultMembership(userId);
  }

  try {
    if (await userIsAdmin(userId)) {
      return {
        userId,
        tier: 'vip',
        billingPeriod: 'yearly',
        startDate: null,
        endDate: null,
        isActive: true,
        stripeSubscriptionId: null,
        source: 'admin',
      };
    }

    const { data, error } = await supabaseAdmin
      .from('user_memberships')
      .select('user_id,tier,billing_period,start_date,end_date,is_active,stripe_subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('end_date', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return defaultMembership(userId);
    }

    return {
      userId,
      tier: normalizeMembershipTier((data as any).tier),
      billingPeriod: normalizeBillingPeriod((data as any).billing_period),
      startDate: typeof (data as any).start_date === 'string' ? (data as any).start_date : null,
      endDate: typeof (data as any).end_date === 'string' ? (data as any).end_date : null,
      isActive: Boolean((data as any).is_active),
      stripeSubscriptionId:
        typeof (data as any).stripe_subscription_id === 'string'
          ? (data as any).stripe_subscription_id
          : null,
      source: 'database',
    };
  } catch {
    return defaultMembership(userId);
  }
}

export async function checkMembershipAccess(userId: string | null, requiredTier: MembershipTier) {
  const membership = await getUserMembership(userId);
  return hasRequiredTier(membership.tier, requiredTier);
}
