import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Catalog from '@/components/sections/Catalog';
import HypeLockboard from '@/components/sections/HypeLockboard';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sampleProducts } from '@/lib/sampleData';
import { getProductHref } from '@/lib/productUrl';
import { getPlatformLandingConfig, PLATFORM_LANDING_SLUGS } from '@/lib/platformSeo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Tienda retro | Catálogo completo de juegos y consolas',
  description:
    'Explora el catálogo retro de AdvancedRetro.es con filtros por consola, precio, stock y favoritos. Juegos, consolas y accesorios para coleccionismo.',
  path: '/tienda',
  keywords: [
    'catalogo retro',
    'comprar consolas retro',
    'comprar juegos game boy',
    'comprar juegos super nintendo',
    'comprar juegos gamecube',
  ],
});

export default async function StorePage() {
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/tienda' },
  ]);

  const faqSchema = buildFaqJsonLd([
    {
      question: '¿Cómo filtrar juegos retro en la tienda?',
      answer:
        'Puedes filtrar por consola, rango de precio, stock, favoritos y orden de catálogo para encontrar piezas concretas más rápido.',
    },
    {
      question: '¿Hay componentes para completar juego completo?',
      answer:
        'Sí, en productos compatibles verás opciones de caja, manual, insert y protectores para completar colección.',
    },
    {
      question: '¿Puedo guardar favoritos para revisarlos luego?',
      answer:
        'Sí. Si inicias sesión puedes marcar favoritos y reutilizarlos como filtro dentro del catálogo.',
    },
  ]);

  const featuredProducts = (() => {
    const mapItem = (product: any) => ({
      name: String(product?.name || 'Producto retro'),
      path: getProductHref(product),
      image: String(product?.image || '/logo.png'),
      description: String(product?.description || '').slice(0, 180),
    });

    if (!supabaseAdmin) {
      return sampleProducts.slice(0, 12).map(mapItem);
    }

    return null;
  })();

  let itemListItems = featuredProducts;
  if (!itemListItems && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id,name,slug,price,image,description,stock,status,category,platform,is_mystery_box')
      .gt('price', 0)
      .order('updated_at', { ascending: false })
      .limit(24);

    itemListItems = (data || []).map((product: any) => ({
      name: String(product?.name || 'Producto retro'),
      path: getProductHref(product),
      image: String(product?.image || '/logo.png'),
      description: String(product?.description || '').slice(0, 180),
    }));
  }

  const itemListSchema = buildItemListJsonLd(itemListItems || [], 'Catálogo de tienda retro');
  const platformLandingLinks = PLATFORM_LANDING_SLUGS.map((slug) => getPlatformLandingConfig(slug)).filter(
    (landing): landing is NonNullable<ReturnType<typeof getPlatformLandingConfig>> => Boolean(landing)
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <section className="section pb-0">
        <div className="container">
          <BreadcrumbsNav items={[{ name: 'Inicio', href: '/' }, { name: 'Tienda' }]} />
        </div>
      </section>
      <section className="section pt-0">
        <div className="container glass p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="title-display text-xl">Catálogo por plataforma</h2>
            <Link href="/blog" className="chip">
              Ver guías de compra
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {platformLandingLinks.map((landing) => (
              <Link
                key={`platform-link-${landing.slug}`}
                href={`/tienda/${landing.slug}`}
                className="chip border-primary/40 text-primary"
              >
                {landing.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Suspense
        fallback={
          <section className="section">
            <div className="container">
              <div className="glass p-6 text-textMuted min-h-[420px]">Cargando catálogo...</div>
            </div>
          </section>
        }
      >
        <Catalog />
      </Suspense>
      <HypeLockboard compact />
      <section className="section pt-0">
        <details className="container group glass p-6 sm:p-8">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Ayuda de compra</p>
              <h2 className="title-display text-2xl">Guía de compra retro</h2>
              <p className="text-sm text-textMuted mt-1">
                Catálogo, estado, componentes y consejos antes de comprar.
              </p>
            </div>
            <span className="chip group-open:border-primary group-open:text-primary">Mostrar guía</span>
          </summary>

          <div className="mt-5 space-y-4 text-textMuted leading-relaxed">
            <p>
              Advanced Retro está organizada por plataforma (Game Boy, GBC, GBA, Super Nintendo y GameCube) para que puedas localizar
              rápido juegos, consolas y componentes.
            </p>
            <p>
              En cada ficha revisa tres cosas: estado real, completitud (cartucho/caja/manual/insert/protector) y rango de precio.
              Los filtros avanzados te permiten quedarte solo con lo que buscas.
            </p>
            <p>
              Si necesitas una pieza difícil, usa el servicio de encargo con seguimiento por ticket. Si prefieres explorar opciones
              de otros coleccionistas, entra en comunidad.
            </p>

            <div className="rounded-xl border border-line p-4 bg-[rgba(10,20,34,0.64)]">
              <p className="text-sm font-semibold text-primary mb-2">Accesos directos</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/tienda" className="chip border-primary/40 text-primary">Ver catálogo completo</Link>
                <Link href="/servicio-compra" className="chip">Solicitar encargo</Link>
                <Link href="/ruleta" className="chip">Ruleta y mystery</Link>
                <Link href="/comunidad" className="chip">Comunidad de venta</Link>
                <Link href="/contacto" className="chip">Contacto y soporte</Link>
              </div>
            </div>
          </div>
        </details>
      </section>
    </>
  );
}
