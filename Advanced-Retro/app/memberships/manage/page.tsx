import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getMembershipDiscount, getMembershipPlan, getUserMembership } from '@/lib/membership';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Gestionar membresía',
  description: 'Gestiona tu nivel de acceso, tu facturación y tus ventajas dentro del ecosistema AdvancedRetro.',
  path: '/memberships/manage',
  noIndex: true,
  keywords: ['panel membresía', 'membership manage'],
});

export default async function MembershipManagePage() {
  let userId: string | null = null;
  let email: string | null = null;

  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id || null;
    email = user?.email || null;
  } catch {
    userId = null;
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Acceso requerido</p>
          <h1 className="mt-4 text-4xl font-black text-white">Inicia sesión para gestionar tu nivel</h1>
          <p className="mt-5 text-base leading-8 text-slate-300">Tu panel de membresía está vinculado a tu cuenta. Cuando entres, podrás ver tus ventajas activas y acceder a crear tu propia tienda si tu plan lo permite.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950">
              Iniciar sesión
            </Link>
            <Link href="/memberships" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white">
              Ver planes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const membership = await getUserMembership(userId);
  const plan = getMembershipPlan(membership.tier);
  const discount = getMembershipDiscount(membership.tier);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,177,255,0.12),transparent_22%),linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Mi membresía</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black text-white sm:text-5xl">{plan.name}</h1>
              <p className="mt-4 max-w-[42rem] text-base leading-8 text-slate-300">{plan.description}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
              <p><span className="text-white">Cuenta:</span> {email}</p>
              <p className="mt-2"><span className="text-white">Periodo:</span> {membership.billingPeriod === 'yearly' ? 'Anual' : 'Mensual'}</p>
              <p className="mt-2"><span className="text-white">Descuento activo:</span> {discount}%</p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <article className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Estado</p>
            <p className="mt-3 text-2xl font-black text-white">{membership.isActive ? 'Activa' : 'Inactiva'}</p>
          </article>
          <article className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Facturación</p>
            <p className="mt-3 text-2xl font-black text-white">{membership.billingPeriod === 'yearly' ? 'Anual' : 'Mensual'}</p>
          </article>
          <article className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Crear tienda</p>
            <p className="mt-3 text-2xl font-black text-white">{membership.tier === 'explorer' ? 'Bloqueado' : 'Disponible'}</p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.88),rgba(8,12,20,0.94))] p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white">Qué puedes hacer ahora</h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            {plan.benefits.map((benefit) => (
              <li key={benefit.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                {benefit.label}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/memberships" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white">
              Cambiar de plan
            </Link>
            <Link href="/crear-tienda" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950">
              Abrir creador de tiendas
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
