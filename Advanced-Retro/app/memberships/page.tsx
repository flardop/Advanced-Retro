import Link from 'next/link';
import MembershipPlans from '@/components/memberships/MembershipPlans';
import StructuredData from '@/components/StructuredData';
import { MEMBERSHIP_PLANS } from '@/lib/membership';
import { buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';

export const metadata = buildPageMetadata({
  title: 'Planes de membresía',
  description:
    'Elige tu nivel dentro del ecosistema AdvancedRetro: acceso anticipado, descuentos, tienda personal y ventajas para comunidad, subastas y Retroville.',
  path: '/memberships',
  keywords: ['membresía retro', 'suscripción gaming', 'AdvancedRetro memberships', 'crear tienda retro'],
});

export default function MembershipsPage() {
  const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Planes de membresía AdvancedRetro',
    itemListElement: MEMBERSHIP_PLANS.map((plan, index) => ({
      '@type': 'Offer',
      position: index + 1,
      name: plan.name,
      description: plan.description,
      priceCurrency: 'EUR',
      price: plan.monthlyPrice,
      url: absoluteUrl('/memberships'),
    })),
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,177,255,0.12),transparent_22%),linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
      <StructuredData id="memberships-schema" data={offerSchema} />
      <div className="mx-auto max-w-7xl space-y-8">
        <MembershipPlans />
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.88),rgba(8,12,20,0.94))] p-6 text-center sm:p-8">
          <p className="text-sm leading-8 text-slate-300">
            ¿Quieres lanzar tu propia tienda dentro del ecosistema? Empieza desde el nivel Coleccionista o sube a VIP Retro para tener productos ilimitados y una experiencia mucho más libre.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/crear-tienda" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.22)] transition hover:brightness-110">
              Ir al creador de tiendas
            </Link>
            <Link href="/memberships/manage" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/[0.08]">
              Gestionar mi plan
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
