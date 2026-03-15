import type { Metadata } from 'next';
import Link from 'next/link';
import {
  KICKSTARTER_CAMPAIGN,
  getKickstarterPublicDonors,
  type KickstarterMilestone,
  type KickstarterTier,
} from '@/lib/kickstarterCampaign';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata, buildItemListJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Kickstarter Advanced Retro | Donaciones y recompensas',
  description:
    'Campaña Kickstarter de Advanced Retro para financiar catálogo, comunidad y herramientas de coleccionismo con recompensas por niveles.',
  path: '/kickstarter',
  keywords: ['kickstarter advanced retro', 'donaciones retro', 'crowdfunding tienda retro', 'recompensas backers'],
});

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(cents || 0)) / 100);
}

function relativeDate(value: string | null): string {
  if (!value) return 'Hace poco';
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return 'Hace poco';
  const hours = Math.floor((Date.now() - ts) / (1000 * 60 * 60));
  if (hours < 1) return 'Hace menos de 1h';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return new Date(ts).toLocaleDateString('es-ES');
}

function progressPercent(raised: number, goal: number): number {
  const safeGoal = Math.max(1, Number(goal || 0));
  const pct = (Math.max(0, Number(raised || 0)) / safeGoal) * 100;
  return Math.max(0, Math.min(100, Number(pct.toFixed(2))));
}

function isMilestoneReached(raised: number, milestone: KickstarterMilestone): boolean {
  return Number(raised || 0) >= Number(milestone.targetCents || 0);
}

function tierSchemaItem(tier: KickstarterTier) {
  return {
    name: tier.title,
    path: '/kickstarter',
    description: `${toEuro(tier.amountCents)} · ${tier.description}`,
  };
}

export default async function KickstarterPage() {
  const donorsData = await getKickstarterPublicDonors(24);
  const goalCents = Number(KICKSTARTER_CAMPAIGN.goalCents || 0);
  const raisedCents = Math.max(0, Number(donorsData.raisedCents || 0));
  const pct = progressPercent(raisedCents, goalCents);
  const remainingCents = Math.max(0, goalCents - raisedCents);
  const topDonor = donorsData.donors.reduce((max, donor) => {
    if (!max) return donor;
    return donor.amountCents > max.amountCents ? donor : max;
  }, donorsData.donors[0]);

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Kickstarter', path: '/kickstarter' },
  ]);

  const faqSchema = buildFaqJsonLd([
    {
      question: '¿Para qué se usarán los fondos de Kickstarter?',
      answer:
        'Los fondos se destinan a escalar catálogo retro, mejorar infraestructura, reforzar seguridad de comunidad y optimizar operación logística.',
    },
    {
      question: '¿Las recompensas tienen unidades limitadas?',
      answer:
        'Sí. Algunos niveles tienen cupos para mantener sostenibilidad de entrega y calidad del soporte.',
    },
    {
      question: '¿Dónde se publicará el avance de la campaña?',
      answer:
        'En esta página y en los canales oficiales de Advanced Retro con actualizaciones de hitos, entregas y roadmap.',
    },
  ]);

  const rewardListSchema = buildItemListJsonLd(
    KICKSTARTER_CAMPAIGN.rewards.map((tier) => tierSchemaItem(tier)),
    'Niveles de recompensa Kickstarter Advanced Retro'
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(rewardListSchema) }} />

      <section className="section">
        <div className="container space-y-6">
          <div className="glass p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Kickstarter · crowdfunding</p>
            <h1 className="title-display text-3xl sm:text-4xl mt-2">{KICKSTARTER_CAMPAIGN.projectName}</h1>
            <p className="text-text mt-3">{KICKSTARTER_CAMPAIGN.subtitle}</p>
            <p className="text-textMuted mt-3 leading-relaxed">{KICKSTARTER_CAMPAIGN.teaser}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.45)]">
                <p className="text-xs text-textMuted">Objetivo</p>
                <p className="text-2xl font-semibold text-primary mt-1">{toEuro(goalCents)}</p>
              </div>
              <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.45)]">
                <p className="text-xs text-textMuted">Recaudado</p>
                <p className="text-2xl font-semibold text-primary mt-1">{toEuro(raisedCents)}</p>
              </div>
              <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.45)]">
                <p className="text-xs text-textMuted">Falta</p>
                <p className="text-2xl font-semibold text-primary mt-1">{toEuro(remainingCents)}</p>
              </div>
              <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.45)]">
                <p className="text-xs text-textMuted">Lanzamiento previsto</p>
                <p className="text-2xl font-semibold text-primary mt-1">{KICKSTARTER_CAMPAIGN.launchTarget}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="h-3 rounded-full border border-line bg-[rgba(8,16,28,0.6)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-cyan-300 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-textMuted">{pct}% del objetivo</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={KICKSTARTER_CAMPAIGN.campaignUrl || '/contacto'}
                className="button-primary"
                target={KICKSTARTER_CAMPAIGN.campaignUrl ? '_blank' : undefined}
                rel={KICKSTARTER_CAMPAIGN.campaignUrl ? 'noopener noreferrer' : undefined}
              >
                {KICKSTARTER_CAMPAIGN.campaignUrl ? 'Ir a la campaña' : 'Pedir enlace de campaña'}
              </Link>
              <Link href="/contacto" className="button-secondary">
                Resolver dudas
              </Link>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="glass p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="title-display text-2xl">Niveles de recompensa</h2>
                <span className="chip">{KICKSTARTER_CAMPAIGN.rewards.length} niveles</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {KICKSTARTER_CAMPAIGN.rewards.map((tier) => (
                  <article key={tier.id} className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.48)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-primary">{tier.title}</p>
                    <p className="text-2xl font-semibold mt-2">{toEuro(tier.amountCents)}</p>
                    <p className="text-sm text-textMuted mt-2">{tier.description}</p>
                    <ul className="mt-3 space-y-1 text-sm text-text">
                      {tier.includes.map((line) => (
                        <li key={`${tier.id}-${line}`}>• {line}</li>
                      ))}
                    </ul>
                    {typeof tier.limitedUnits === 'number' ? (
                      <p className="mt-3 text-xs text-warning">Cupos limitados: {tier.limitedUnits}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass p-6">
                <h2 className="title-display text-2xl">Donadores</h2>
                <p className="text-sm text-textMuted mt-2">
                  Ranking público de apoyo. Se muestran solo aportes marcados como públicos.
                </p>
                <div className="mt-4 grid gap-3">
                  {donorsData.donors.length === 0 ? (
                    <div className="rounded-xl border border-line p-4 text-textMuted bg-[rgba(8,16,28,0.42)]">
                      Aún no hay donadores públicos visibles. Sé el primero en apoyar la campaña.
                    </div>
                  ) : (
                    donorsData.donors.map((donor) => (
                      <article key={donor.id} className="rounded-xl border border-line p-3 bg-[rgba(8,16,28,0.42)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold line-clamp-1">{donor.name}</p>
                            <p className="text-xs text-textMuted mt-1">{relativeDate(donor.createdAt)}</p>
                            {donor.message ? <p className="text-sm text-text mt-2 line-clamp-2">{donor.message}</p> : null}
                          </div>
                          <span className="chip text-primary border-primary whitespace-nowrap">{toEuro(donor.amountCents)}</span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
                {topDonor ? (
                  <p className="mt-4 text-xs text-textMuted">
                    Top aporte actual: <span className="text-primary">{topDonor.name}</span> · {toEuro(topDonor.amountCents)}
                  </p>
                ) : null}
              </div>

              <div className="glass p-6">
                <h2 className="title-display text-2xl">Uso de fondos</h2>
                <div className="mt-4 space-y-3">
                  {KICKSTARTER_CAMPAIGN.fundSplit.map((slice) => (
                    <div key={slice.label}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-text">{slice.label}</span>
                        <span className="text-primary font-semibold">{slice.percentage}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full border border-line bg-[rgba(8,16,28,0.6)] overflow-hidden">
                        <div className="h-full bg-primary/80" style={{ width: `${slice.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-6 sm:p-7">
            <h2 className="title-display text-2xl">Roadmap de hitos</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {KICKSTARTER_CAMPAIGN.milestones.map((milestone) => {
                const reached = isMilestoneReached(raisedCents, milestone);
                return (
                  <article
                    key={milestone.id}
                    className={`rounded-2xl border p-4 ${
                      reached
                        ? 'border-primary/60 bg-[rgba(75,228,214,0.12)]'
                        : 'border-line bg-[rgba(8,16,28,0.42)]'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-primary">{toEuro(milestone.targetCents)}</p>
                    <p className="font-semibold mt-2">{milestone.title}</p>
                    <p className="text-sm text-textMuted mt-2">{milestone.description}</p>
                    <p className={`mt-3 text-xs ${reached ? 'text-primary' : 'text-textMuted'}`}>
                      {reached ? 'Hito alcanzado' : 'Pendiente'}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

