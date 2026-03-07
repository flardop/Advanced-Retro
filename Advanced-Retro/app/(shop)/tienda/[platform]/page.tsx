import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import SafeImage from '@/components/SafeImage';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';
import { getProductHref } from '@/lib/productUrl';
import { sampleProducts } from '@/lib/sampleData';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getPlatformLandingConfig,
  isSeoLandingProduct,
  PLATFORM_LANDING_SLUGS,
  type PlatformLandingSlug,
} from '@/lib/platformSeo';
import { notFound } from 'next/navigation';

type PlatformPageProps = {
  params: Promise<{ platform: string }>;
};

async function loadPlatformProducts(platform: PlatformLandingSlug) {
  if (!supabaseAdmin) {
    return sampleProducts.filter((product) => isSeoLandingProduct(product, platform)).slice(0, 36);
  }

  const { data } = await supabaseAdmin
    .from('products')
    .select('id,name,slug,description,price,image,stock,category,category_id,platform,is_mystery_box,component_type,updated_at,created_at,status')
    .gt('price', 0)
    .order('updated_at', { ascending: false })
    .limit(2500);

  return (data || []).filter((product: any) => isSeoLandingProduct(product, platform)).slice(0, 48);
}

export function generateStaticParams() {
  return PLATFORM_LANDING_SLUGS.map((platform) => ({ platform }));
}

export async function generateMetadata({ params }: PlatformPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const config = getPlatformLandingConfig(resolvedParams.platform);
  if (!config) {
    return buildPageMetadata({
      title: 'Catálogo retro',
      description: 'Catálogo de productos retro en AdvancedRetro.es',
      path: '/tienda',
    });
  }

  return buildPageMetadata({
    title: `${config.label}: ${config.title}`,
    description: config.description,
    path: `/tienda/${config.slug}`,
    keywords: config.keywords,
  });
}

export default async function PlatformStorePage({ params }: PlatformPageProps) {
  const resolvedParams = await params;
  const config = getPlatformLandingConfig(resolvedParams.platform);
  if (!config) notFound();

  const products = await loadPlatformProducts(config.slug);

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/tienda' },
    { name: config.label, path: `/tienda/${config.slug}` },
  ]);
  const faqSchema = buildFaqJsonLd(config.faq);
  const itemListSchema = buildItemListJsonLd(
    products.map((product: any) => ({
      name: String(product?.name || 'Producto retro'),
      path: getProductHref(product),
      image: String(product?.image || '/logo.png'),
      description: String(product?.description || '').slice(0, 180),
    })),
    `Catálogo ${config.label}`
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
          <BreadcrumbsNav
            items={[
              { name: 'Inicio', href: '/' },
              { name: 'Tienda', href: '/tienda' },
              { name: config.label },
            ]}
          />
        </div>
      </section>

      <section className="section pt-6">
        <div className="container glass p-6 sm:p-8 space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{config.label}</p>
          <h1 className="title-display text-3xl">{config.title}</h1>
          <p className="text-textMuted">{config.description}</p>
          {config.intro.map((paragraph, index) => (
            <p key={`${config.slug}-intro-${index}`} className="text-textMuted leading-relaxed">
              {paragraph}
            </p>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            {PLATFORM_LANDING_SLUGS.filter((slug) => slug !== config.slug).map((slug) => {
              const item = getPlatformLandingConfig(slug);
              if (!item) return null;
              return (
                <Link key={`landing-link-${slug}`} href={`/tienda/${slug}`} className="chip">
                  {item.label}
                </Link>
              );
            })}
            <Link href="/tienda" className="chip border-primary/40 text-primary">
              Ver catálogo general
            </Link>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container">
          <h2 className="title-display text-2xl mb-4">Productos de {config.label}</h2>
          {products.length === 0 ? (
            <div className="glass p-5">
              <p className="text-textMuted">No hay productos disponibles ahora mismo para esta plataforma.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product: any) => (
                <Link
                  key={String(product?.id || '')}
                  href={getProductHref(product)}
                  className="glass p-3 sm:p-4 hover:shadow-glow transition-all group"
                >
                  <div className="relative h-56 bg-surface border border-line rounded-xl overflow-hidden">
                    <SafeImage
                      src={String(product?.image || '/placeholder.svg')}
                      fallbackSrc="/placeholder.svg"
                      alt={String(product?.name || 'Producto retro')}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <h3 className="font-semibold text-text mt-3 line-clamp-2">{String(product?.name || '')}</h3>
                  <p className="text-textMuted text-sm line-clamp-2 mt-2">{String(product?.description || '')}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-primary font-semibold">{(Number(product?.price || 0) / 100).toFixed(2)} €</p>
                    <span className="chip">Stock: {Number(product?.stock || 0)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

