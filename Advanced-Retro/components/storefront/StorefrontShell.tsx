import Image from 'next/image';
import Link from 'next/link';
import type { StorefrontRecord } from '@/lib/storefronts';
import { buildStoreThemeStyle } from '@/lib/storefronts';

export default function StorefrontShell({
  store,
  previewMode = false,
}: {
  store: StorefrontRecord;
  previewMode?: boolean;
}) {
  const themeStyle = buildStoreThemeStyle(store);

  return (
    <main
      className="min-h-screen text-[color:var(--store-text)]"
      style={{
        ...themeStyle,
        background: 'var(--store-bg)',
      }}
    >
      <section className="border-b bg-black/10" style={{ borderColor: 'var(--store-border)' }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">
              {store.official ? 'Tienda oficial del ecosistema' : 'Tienda de la comunidad'}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{store.name}</h1>
            <p className="mt-4 max-w-[42rem] text-base leading-8 text-[color:var(--store-muted)] sm:text-lg">
              {store.shortDescription}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-[color:var(--store-border)] bg-[color:var(--store-surface)] px-3 py-2 text-[color:var(--store-text)]">
                {store.category}
              </span>
              <span className="rounded-full border border-[color:var(--store-border)] bg-[color:var(--store-surface)] px-3 py-2 text-[color:var(--store-text)]">
                {store.membershipTier === 'vip' ? 'VIP Retro' : store.membershipTier === 'collector' ? 'Coleccionista' : 'Explorador'}
              </span>
              {previewMode ? (
                <span className="rounded-full border border-[color:var(--store-border)] bg-[color:var(--store-surface)] px-3 py-2 text-[color:var(--store-text)]">
                  Preview personal
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[color:var(--store-muted)] lg:justify-end">
            {store.instagram ? <span>Instagram: @{store.instagram}</span> : null}
            {store.twitter ? <span>X: @{store.twitter}</span> : null}
            {store.contactEmail ? <span>{store.contactEmail}</span> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)] lg:px-10">
        <div className="rounded-[2rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">Sobre esta tienda</p>
          <p className="mt-5 text-base leading-8 text-[color:var(--store-muted)] sm:text-lg">{store.longDescription || 'Esta tienda aún está construyendo su historia pública. Muy pronto tendrá manifiesto, selección y contexto propios.'}</p>
        </div>
        <div className="rounded-[2rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">Vinculada al ecosistema</p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--store-muted)]">Esta tienda vive dentro del universo AdvancedRetro, pero conserva su personalidad, narrativa y catálogo propios.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full border border-[color:var(--store-border)] px-4 py-2 text-sm font-semibold text-[color:var(--store-text)] transition hover:brightness-110">
            Volver a AdvancedRetro
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">Productos</p>
            <h2 className="mt-3 text-3xl font-black text-[color:var(--store-text)]">Catálogo de la tienda</h2>
          </div>
          <p className="text-sm text-[color:var(--store-muted)]">{store.products.length} productos visibles</p>
        </div>

        {store.products.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {store.products.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-[1.8rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                <div className="relative aspect-[4/3] overflow-hidden border-b" style={{ borderColor: 'var(--store-border)' }}>
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-[color:var(--store-text)]">{product.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--store-muted)]">{product.description}</p>
                  <p className="mt-5 text-lg font-semibold text-[color:var(--store-text)]">{product.price > 0 ? `${product.price.toFixed(2).replace('.', ',')} €` : 'Consultar'}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.9rem] border border-dashed border-[color:var(--store-border)] bg-[color:var(--store-surface)] p-8 text-center text-[color:var(--store-muted)]">
            <p className="text-lg font-semibold text-[color:var(--store-text)]">Todavía no hay productos publicados</p>
            <p className="mt-3 text-sm leading-7">Añade tus primeras piezas desde el dashboard para activar el escaparate público de esta tienda.</p>
            <Link href="/dashboard/mi-tienda" className="mt-6 inline-flex rounded-full border border-[color:var(--store-border)] px-4 py-2 text-sm font-semibold text-[color:var(--store-text)]">
              Abrir dashboard
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t px-5 py-8 text-center text-sm text-[color:var(--store-muted)]" style={{ borderColor: 'var(--store-border)' }}>
        <p>
          {store.official ? 'Tienda oficial AdvancedRetro.' : 'Parte del ecosistema AdvancedRetro.'} <Link href="/" className="font-semibold text-[color:var(--store-text)]">Volver a la homepage</Link>
        </p>
      </footer>
    </main>
  );
}
