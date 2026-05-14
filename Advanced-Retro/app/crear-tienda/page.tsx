import Link from 'next/link';
import StoreCreationWizard from '@/components/storefront/StoreCreationWizard';
import { getUserMembership, hasRequiredTier } from '@/lib/membership';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Crear mi tienda',
  description: 'Wizard conversacional para lanzar tu tienda personal dentro del ecosistema AdvancedRetro.',
  path: '/crear-tienda',
  noIndex: true,
  keywords: ['crear tienda retro', 'store builder'],
});

export default async function CreateStorePage() {
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
      <main className="min-h-screen bg-[linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Acceso requerido</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Primero necesitamos tu cuenta</h1>
          <p className="mt-5 text-base leading-8 text-slate-300">El creador de tiendas se apoya en tu perfil y en tu membresía. Entra primero y te llevamos después al asistente completo.</p>
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
  const allowed = hasRequiredTier(membership.tier, 'collector');

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Upgrade necesario</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Tu plan actual todavía no desbloquea tiendas personales</h1>
          <p className="mt-5 max-w-[48rem] text-base leading-8 text-slate-300">Ahora mismo tu cuenta ({email}) está en nivel Explorador. Para lanzar una tienda dentro del ecosistema necesitas subir como mínimo a Coleccionista.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/memberships" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950">
              Ver niveles y mejorar plan
            </Link>
            <Link href="/memberships/manage" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white">
              Gestionar membresía
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,177,255,0.12),transparent_24%),linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Store Builder</p>
              <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Tu tienda dentro de AdvancedRetro</h1>
              <p className="mt-5 max-w-[52rem] text-base leading-8 text-slate-300">Este asistente te ayuda a definir nombre, tono, categoría, color, historia y dirección visual de tu tienda. Después podrás entrar a tu dashboard y seguir afinándola.</p>
            </div>
            <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-300">
              <p>
                {membership.tier === 'vip'
                  ? 'Tu nivel VIP desbloquea catálogo ilimitado y una presentación sin branding visible de AdvancedRetro.'
                  : 'Tu nivel Coleccionista desbloquea una tienda propia con hasta 10 productos y branding “Made with AdvancedRetro”.'}
              </p>
            </div>
          </div>
        </section>

        <StoreCreationWizard membershipTier={membership.tier} />
      </div>
    </main>
  );
}
