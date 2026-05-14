import Link from 'next/link';
import StoreDashboardManager from '@/components/storefront/StoreDashboardManager';
import { getUserMembership, hasRequiredTier } from '@/lib/membership';
import { getPreviewStorefrontFromCookies, getStoredStorefrontByUserId } from '@/lib/storefronts';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Mi tienda',
  description: 'Panel privado para gestionar la tienda personal dentro del ecosistema AdvancedRetro.',
  path: '/dashboard/mi-tienda',
  noIndex: true,
  keywords: ['dashboard tienda', 'mi tienda advancedretro'],
});

export default async function MyStoreDashboardPage() {
  let userId: string | null = null;

  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id || null;
  } catch {
    userId = null;
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-8 text-center">
          <h1 className="text-4xl font-black text-white">Tu dashboard vive detrás de tu sesión</h1>
          <p className="mt-5 text-base leading-8 text-slate-300">Inicia sesión para gestionar la tienda personal asociada a tu perfil.</p>
          <Link href="/login" className="mt-8 inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950">
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  const membership = await getUserMembership(userId);
  if (!hasRequiredTier(membership.tier, 'collector')) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Acceso restringido</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Sube de nivel para activar tu tienda</h1>
          <p className="mt-5 text-base leading-8 text-slate-300">Tu dashboard personal queda desbloqueado desde Coleccionista. Es la forma de mantener el ecosistema útil para quien de verdad compra, participa y vende dentro de AdvancedRetro.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/memberships" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950">
              Ver planes
            </Link>
            <Link href="/memberships/manage" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white">
              Mi membresía
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const storedStore = await getStoredStorefrontByUserId(userId);
  const previewStore = getPreviewStorefrontFromCookies();
  const store = storedStore || (previewStore?.ownerId === userId || !storedStore ? previewStore : null);

  if (!store) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,177,255,0.12),transparent_24%),linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Mi tienda</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Aún no has creado tu escaparate</h1>
          <p className="mt-5 text-base leading-8 text-slate-300">Tu membresía ya lo permite. El siguiente paso es lanzar la primera versión de tu tienda con el wizard y luego ajustar diseño, historia y datos desde este panel.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/crear-tienda" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950">
              Crear mi tienda
            </Link>
            <Link href="/tiendas" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white">
              Ver tiendas del ecosistema
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,177,255,0.12),transparent_24%),linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <StoreDashboardManager initialStore={store} membershipTier={membership.tier} />
      </div>
    </main>
  );
}
