import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type KickstarterTier = {
  id: string;
  title: string;
  amountCents: number;
  description: string;
  includes: string[];
  limitedUnits?: number;
};

export type KickstarterMilestone = {
  id: string;
  targetCents: number;
  title: string;
  description: string;
};

export type KickstarterDonor = {
  id: string;
  name: string;
  amountCents: number;
  message: string | null;
  createdAt: string | null;
};

export const KICKSTARTER_CAMPAIGN = {
  projectName: 'Advanced Retro',
  subtitle: 'Marketplace retro verificado + comunidad de coleccionistas',
  goalCents: 4500000,
  teaser:
    'Financiación para escalar catálogo, trazabilidad de autenticidad, comunidad de venta segura y herramientas pro de coleccionismo.',
  launchTarget: 'Q2 2026',
  campaignUrl: process.env.NEXT_PUBLIC_KICKSTARTER_URL || '',
  rewards: [
    {
      id: 'tier-support',
      title: 'Apoyo Digital',
      amountCents: 500,
      description: 'Apareces como backer fundador en la página de agradecimientos.',
      includes: ['Mención en hall of supporters', 'Rol fundador en perfil'],
    },
    {
      id: 'tier-starter',
      title: 'Pack Coleccionista Starter',
      amountCents: 2500,
      description: 'Pack digital + prioridad para drops de lanzamiento.',
      includes: ['Agradecimiento fundador', 'Acceso anticipado a drops', 'Insignia Kickstarter'],
    },
    {
      id: 'tier-pro',
      title: 'Coleccionista PRO',
      amountCents: 6500,
      description: 'Incluye ventajas premium de comunidad y soporte ampliado.',
      includes: ['Todo lo anterior', 'Destacado en comunidad 30 días', 'Soporte priorizado'],
      limitedUnits: 250,
    },
    {
      id: 'tier-legend',
      title: 'Founder Legend',
      amountCents: 15000,
      description: 'Nivel máximo para apoyar infraestructura y expansión del proyecto.',
      includes: [
        'Todo lo anterior',
        'Insignia legendaria limitada',
        'Crédito especial en página Kickstarter',
        'Sesión 1:1 de estrategia de colección',
      ],
      limitedUnits: 100,
    },
  ] as KickstarterTier[],
  milestones: [
    {
      id: 'm1',
      targetCents: 4500000,
      title: 'MVP financiado',
      description: 'Escalado de catálogo, mejora de perfiles y base de comunidad.',
    },
    {
      id: 'm2',
      targetCents: 6000000,
      title: 'Verificación avanzada',
      description: 'Flujos de revisión de autenticidad más rápidos y trazables.',
    },
    {
      id: 'm3',
      targetCents: 8000000,
      title: 'Motor social + reputación',
      description: 'Ranking de vendedores, reputación detallada y feed avanzado.',
    },
    {
      id: 'm4',
      targetCents: 10000000,
      title: 'Internacionalización',
      description: 'Escalado multidioma y pipeline de envíos optimizado.',
    },
  ] as KickstarterMilestone[],
  fundSplit: [
    { label: 'Catálogo e imágenes de producto', percentage: 35 },
    { label: 'Infraestructura y rendimiento', percentage: 25 },
    { label: 'Comunidad, moderación y seguridad', percentage: 20 },
    { label: 'Operación y logística inicial', percentage: 15 },
    { label: 'Contingencia', percentage: 5 },
  ],
};

function isMissingTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    (message.includes('relation') && message.includes('does not exist')) ||
    (message.includes('could not find') && message.includes('schema cache'))
  );
}

export async function getKickstarterPublicDonors(limit = 30): Promise<{
  available: boolean;
  donors: KickstarterDonor[];
  totalDonors: number;
  raisedCents: number;
}> {
  const fallbackRaised = Number(process.env.NEXT_PUBLIC_KICKSTARTER_RAISED_CENTS || 0);
  if (!supabaseAdmin) {
    return {
      available: false,
      donors: [],
      totalDonors: 0,
      raisedCents: Number.isFinite(fallbackRaised) ? Math.max(0, fallbackRaised) : 0,
    };
  }

  const safeLimit = Math.min(Math.max(Number(limit || 0), 1), 80);
  const donorsRes = await supabaseAdmin
    .from('kickstarter_donations')
    .select('id, donor_name, amount_cents, message, created_at, is_public')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (donorsRes.error) {
    if (isMissingTableError(donorsRes.error)) {
      return {
        available: false,
        donors: [],
        totalDonors: 0,
        raisedCents: Number.isFinite(fallbackRaised) ? Math.max(0, fallbackRaised) : 0,
      };
    }
    throw new Error(donorsRes.error.message || 'No se pudieron cargar donadores Kickstarter');
  }

  const donorsRows = Array.isArray(donorsRes.data) ? donorsRes.data : [];
  const donors: KickstarterDonor[] = donorsRows.map((row: any) => ({
    id: String(row?.id || `donor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    name: String(row?.donor_name || 'Backer anónimo').trim() || 'Backer anónimo',
    amountCents: Number(row?.amount_cents || 0),
    message: row?.message ? String(row.message) : null,
    createdAt: row?.created_at ? String(row.created_at) : null,
  }));

  const totalsRes = await supabaseAdmin
    .from('kickstarter_donations')
    .select('amount_cents')
    .eq('is_public', true)
    .limit(10000);

  let raisedCents = 0;
  if (!totalsRes.error && Array.isArray(totalsRes.data)) {
    raisedCents = totalsRes.data.reduce((acc: number, row: any) => acc + Number(row?.amount_cents || 0), 0);
  } else if (Number.isFinite(fallbackRaised)) {
    raisedCents = Math.max(0, fallbackRaised);
  }

  return {
    available: true,
    donors,
    totalDonors: donors.length,
    raisedCents: Math.max(0, raisedCents),
  };
}
