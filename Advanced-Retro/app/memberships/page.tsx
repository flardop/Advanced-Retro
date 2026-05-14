import Link from 'next/link';
import MembershipPlans from '@/components/memberships/MembershipPlans';
import StructuredData from '@/components/StructuredData';
import { MEMBERSHIP_PLANS } from '@/lib/membership';
import { buildPageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteConfig';

export const metadata = buildPageMetadata({
  title: 'Membresías del ecosistema',
  description:
    'Descubre los tres niveles de AdvancedRetro: acceso libre, ventajas para compradores frecuentes y una capa premium con tienda propia y acceso preferente.',
  path: '/memberships',
  keywords: ['membresía advancedretro', 'suscripción retro', 'tienda propia retro', 'coleccionista vip'],
});

export default function MembershipsPage() {
  const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Membresías AdvancedRetro',
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

        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.88),rgba(8,12,20,0.94))] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Más que descuentos</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Una membresía pensada para quien participa de verdad</h2>
              <p className="mt-4 max-w-[40rem] text-base leading-8 text-slate-300">
                No se trata solo de pagar menos. Se trata de entrar antes, tener prioridad real y, si quieres, abrir tu propia tienda dentro del universo AdvancedRetro con una presencia más fuerte.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm leading-7 text-slate-300">
                Si tu objetivo es comprar mejor, estar más cerca de los drops o empezar a construir algo propio, aquí es donde empieza esa capa nueva del proyecto.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/crear-tienda" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.22)] transition hover:brightness-110">
                  Crear mi tienda
                </Link>
                <Link href="/memberships/manage" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/[0.08]">
                  Gestionar mi plan
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
