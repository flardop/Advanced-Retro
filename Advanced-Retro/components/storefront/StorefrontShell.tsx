import Image from 'next/image';
import Link from 'next/link';
import type { StorefrontRecord } from '@/lib/storefronts';
import { buildStoreThemeStyle } from '@/lib/storefronts';
import { isWhiteLabelStorefront } from '@/lib/membership';

function getStoreInitials(name: string) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();
}

export default function StorefrontShell({
  store,
  previewMode = false,
}: {
  store: StorefrontRecord;
  previewMode?: boolean;
}) {
  const themeStyle = buildStoreThemeStyle(store);
  const whiteLabel = !store.official && isWhiteLabelStorefront(store.membershipTier);
  const showAdvancedRetroAttribution = store.official || !whiteLabel;

  return (
    <main
      className="min-h-screen text-[color:var(--store-text)]"
      style={{
        ...themeStyle,
        background: 'var(--store-bg)',
      }}
    >
      <section className="border-b bg-black/10" style={{ borderColor: 'var(--store-border)' }}>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {showAdvancedRetroAttribution ? (
                  <span className="rounded-full border border-[color:var(--store-border)] bg-[color:var(--store-surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--store-accent)]">
                    {store.official ? 'Tienda oficial AdvancedRetro' : 'Made with AdvancedRetro'}
                  </span>
                ) : (
                  <span className="rounded-full border border-[color:var(--store-border)] bg-[color:var(--store-surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--store-accent)]">
                    Storefront premium
                  </span>
                )}
                <span className="rounded-full border border-[color:var(--store-border)] bg-[color:var(--store-surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--store-text)]/72">
                  {store.category}
                </span>
                {previewMode ? (
                  <span className="rounded-full border border-[color:var(--store-border)] bg-[color:var(--store-surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--store-text)]/72">
                    Preview privada
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex items-start gap-4">
                <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] text-xl font-black text-[color:var(--store-text)] shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                  {store.logoUrl ? (
                    <Image src={store.logoUrl} alt={store.name} width={72} height={72} className="h-full w-full object-cover" />
                  ) : (
                    <span>{getStoreInitials(store.name) || 'AR'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{store.name}</h1>
                  <p className="mt-4 max-w-[42rem] text-base leading-8 text-[color:var(--store-muted)] sm:text-lg">
                    {store.shortDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--store-accent)]">
                {whiteLabel ? 'Identidad de tienda' : 'Datos de tienda'}
              </p>
              <div className="mt-4 space-y-3 text-sm text-[color:var(--store-muted)]">
                {store.contactEmail ? <p>{store.contactEmail}</p> : null}
                {store.instagram ? <p>Instagram: @{store.instagram}</p> : null}
                {store.twitter ? <p>X: @{store.twitter}</p> : null}
                <p>{store.views.toLocaleString('es-ES')} visitas registradas</p>
              </div>
              {showAdvancedRetroAttribution ? (
                <Link href="/" className="mt-5 inline-flex rounded-full border border-[color:var(--store-border)] px-4 py-2 text-sm font-semibold text-[color:var(--store-text)] transition hover:brightness-110">
                  Volver a AdvancedRetro
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)] lg:px-10">
        <div className="rounded-[2rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">Sobre esta tienda</p>
          <p className="mt-5 text-base leading-8 text-[color:var(--store-muted)] sm:text-lg">
            {store.longDescription || 'Esta tienda aún está construyendo su historia pública. Muy pronto tendrá manifiesto, selección y contexto propios.'}
          </p>
        </div>

        <div className="space-y-5">
          <aside className="rounded-[2rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">Estado</p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--store-muted)]">
              {store.state === 'active'
                ? 'Tienda pública activa y visible.'
                : store.state === 'paused'
                  ? 'Tienda pausada temporalmente.'
                  : 'Tienda en revisión o en fase de preparación.'}
            </p>
          </aside>

          <aside className="rounded-[2rem] border border-[color:var(--store-border)] bg-[color:var(--store-surface)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">Catálogo</p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--store-muted)]">
              {store.products.length > 0
                ? `${store.products.length} productos visibles en esta primera versión de la tienda.`
                : 'Todavía no hay productos públicos, pero la estructura de la tienda ya está lista.'}
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--store-accent)]">Productos</p>
            <h2 className="mt-3 text-3xl font-black text-[color:var(--store-text)]">Selección de la tienda</h2>
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
                  <p className="mt-5 text-lg font-semibold text-[color:var(--store-text)]">
                    {product.price > 0 ? `${product.price.toFixed(2).replace('.', ',')} €` : 'Consultar'}
                  </p>
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
        {showAdvancedRetroAttribution ? (
          <p>
            {store.official ? 'Tienda oficial AdvancedRetro.' : 'Made with AdvancedRetro.'}{' '}
            <Link href="/" className="font-semibold text-[color:var(--store-text)]">Volver a la homepage</Link>
          </p>
        ) : (
          <p>© {store.name}</p>
        )}
      </footer>
    </main>
  );
}
