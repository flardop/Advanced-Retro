import Image from 'next/image';
import Link from 'next/link';
import StructuredData from '@/components/StructuredData';
import { DIRECTORY_STORES, getPreviewStorefrontFromCookies, getStorefrontDirectoryJsonLd } from '@/lib/storefronts';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Tiendas de la comunidad',
  description: 'Descubre la capa de tiendas personales dentro del ecosistema AdvancedRetro: identidades propias, catálogo independiente y una tienda oficial como referencia.',
  path: '/tiendas',
  keywords: ['tiendas comunidad retro', 'marketplace creadores', 'tiendas advancedretro'],
});

export default function CommunityStoresPage() {
  const previewStore = getPreviewStorefrontFromCookies();
  const stores = previewStore && !DIRECTORY_STORES.some((item) => item.slug === previewStore.slug)
    ? [previewStore, ...DIRECTORY_STORES]
    : DIRECTORY_STORES;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,177,255,0.12),transparent_24%),linear-gradient(180deg,#09101b_0%,#10131b_100%)] px-5 py-12 text-white sm:px-8 lg:px-10">
      <StructuredData id="community-stores-schema" data={getStorefrontDirectoryJsonLd(stores)} />
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Capa de creadores</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Tiendas dentro del ecosistema</h1>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)] lg:items-end">
            <p className="max-w-[48rem] text-base leading-8 text-slate-300">
              AdvancedRetro sigue siendo la tienda oficial, pero ahora puede convivir con escaparates personales creados por miembros. Cada tienda conserva su personalidad, su historia y su selección, sin romper la coherencia del conjunto.
            </p>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/crear-tienda" className="inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.22)] transition hover:brightness-110">
                Crear mi tienda
              </Link>
              <Link href="/memberships" className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/[0.08]">
                Ver membresías
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <article key={store.slug} className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.9),rgba(8,12,20,0.96))] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(103,177,255,0.14),transparent_35%),linear-gradient(180deg,#0d1323,#090d17)]">
                <Image src={store.products[0]?.image || '/logo.png'} alt={store.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover opacity-80" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">{store.name}</h2>
                    <p className="mt-2 text-sm text-slate-300">{store.shortDescription}</p>
                  </div>
                  {store.official ? (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-primary">
                      Oficial
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">{store.category}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">{store.views.toLocaleString('es-ES')} visitas</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                    {store.membershipTier === 'vip' ? 'VIP' : store.membershipTier === 'collector' ? 'Coleccionista' : 'Explorador'}
                  </span>
                </div>
                <Link href={`/tiendas/${store.slug}`} className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,#66c0f4,#8b5cf6)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(102,192,244,0.22)] transition hover:brightness-110">
                  Entrar en la tienda
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
