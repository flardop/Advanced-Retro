import type { Metadata } from 'next';
import ProductDetail from '@/components/sections/ProductDetail';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import SafeImage from '@/components/SafeImage';
import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductHref, getProductRouteSegment, parseProductRouteParam } from '@/lib/productUrl';
import { sampleProducts } from '@/lib/sampleData';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata, buildProductSeoDescription } from '@/lib/seo';
import { getProductReviewsSql } from '@/lib/productSocialSql';
import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';

function parseBooleanQuery(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return parseBooleanQuery(value[0]);
  }
  if (!value) return false;
  const safe = String(value).trim().toLowerCase();
  return safe === '1' || safe === 'true' || safe === 'yes';
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ complete?: string | string[] }>;
};

async function getProductByIdentifier(identifier: string) {
  const parsed = parseProductRouteParam(identifier);

  if (!supabaseAdmin) {
    const byId = parsed.idCandidate
      ? sampleProducts.find((p: any) => String(p?.id || '') === parsed.idCandidate)
      : null;
    if (byId) return byId;

    if (parsed.slugCandidate) {
      const bySlug = sampleProducts.find((p: any) => {
        const slug = String((p as any)?.slug || '')
          .trim()
          .toLowerCase();
        return slug && slug === parsed.slugCandidate;
      });
      if (bySlug) return bySlug;
    }
    return null;
  }

  if (parsed.idCandidate) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', parsed.idCandidate)
      .maybeSingle();
    if (data) return data;
  }

  if (parsed.idPrefixCandidate) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .ilike('id', `${parsed.idPrefixCandidate}%`)
      .limit(2);

    if (!error && Array.isArray(data) && data.length === 1) {
      return data[0];
    }
  }

  if (parsed.slugCandidate) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('slug', parsed.slugCandidate)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (!error && Array.isArray(data) && data.length > 0) return data[0];
  }

  return null;
}

async function getProductSocialSummary(productId: string) {
  if (!supabaseAdmin || !productId) return null;
  const { data, error } = await supabaseAdmin
    .from('product_social_summary')
    .select('reviews_count,rating_average')
    .eq('product_id', productId)
    .maybeSingle();

  if (error || !data) return null;
  const reviewsCount = Number((data as any).reviews_count || 0);
  const ratingAverage = Number((data as any).rating_average || 0);
  if (!Number.isFinite(reviewsCount) || !Number.isFinite(ratingAverage)) return null;
  return {
    reviewsCount: Math.max(0, Math.round(reviewsCount)),
    ratingAverage: Math.max(0, Number(ratingAverage.toFixed(2))),
  };
}

async function getRelatedProducts(product: any, limit = 6) {
  const productId = String(product?.id || '').trim();
  const productCategory = String(product?.category || '').trim();
  const productPlatform = String(product?.platform || '').trim();

  if (!productId) return [];

  if (!supabaseAdmin) {
    return sampleProducts
      .filter((candidate: any) => {
        if (!candidate || String(candidate?.id || '') === productId) return false;
        if (Number(candidate?.price || 0) <= 0) return false;
        const sameCategory = productCategory && String(candidate?.category || '') === productCategory;
        const samePlatform =
          productPlatform &&
          String(candidate?.platform || '')
            .trim()
            .toLowerCase() === productPlatform.toLowerCase();
        return sameCategory || samePlatform;
      })
      .slice(0, limit);
  }

  const selectColumns = 'id,name,slug,image,price,stock,category,platform,updated_at,created_at';
  const relatedMap = new Map<string, any>();

  if (productCategory) {
    const { data } = await supabaseAdmin
      .from('products')
      .select(selectColumns)
      .eq('category', productCategory)
      .gt('price', 0)
      .neq('id', productId)
      .order('updated_at', { ascending: false })
      .limit(limit * 3);

    for (const row of data || []) {
      relatedMap.set(String((row as any)?.id || ''), row);
    }
  }

  if (relatedMap.size < limit && productPlatform) {
    const { data } = await supabaseAdmin
      .from('products')
      .select(selectColumns)
      .ilike('platform', productPlatform)
      .gt('price', 0)
      .neq('id', productId)
      .order('updated_at', { ascending: false })
      .limit(limit * 3);

    for (const row of data || []) {
      relatedMap.set(String((row as any)?.id || ''), row);
    }
  }

  return [...relatedMap.values()].slice(0, limit);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductByIdentifier(resolvedParams.id);
  if (!product) {
    return buildPageMetadata({
      title: 'Producto retro',
      description: 'Ficha de producto en AdvancedRetro.es',
      path: `/producto/${encodeURIComponent(resolvedParams.id)}`,
      keywords: ['producto retro'],
    });
  }

  const title = `${String(product.name || '').trim()} | Comprar producto retro`;
  const description = buildProductSeoDescription({
    name: String(product.name || ''),
    shortDescription:
      String((product as any)?.long_description || '').trim() ||
      String(product.description || '').trim(),
    category: String((product as any)?.category || ''),
    platform: String((product as any)?.platform || ''),
    priceCents: Number((product as any)?.price || 0),
    stock: Number((product as any)?.stock || 0),
  });
  const imageUrl = String(product.image || absoluteUrl('/logo.png'));
  const canonicalPath = getProductHref(product);

  return buildPageMetadata({
    title,
    description,
    path: canonicalPath,
    image: imageUrl,
    keywords: [
      String(product?.name || '').trim(),
      String(product?.platform || '').trim(),
      String(product?.category || '').trim(),
      'precio videojuego retro',
    ].filter(Boolean),
    type: 'article',
  });
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const prefillComplete = parseBooleanQuery(resolvedSearchParams?.complete);
  const product = await getProductByIdentifier(resolvedParams.id);
  const parsedRoute = parseProductRouteParam(resolvedParams.id);
  const productId =
    String((product as any)?.id || '').trim() ||
    parsedRoute.idCandidate ||
    resolvedParams.id;

  if (product) {
    const requestedSegment = decodeURIComponent(String(resolvedParams.id || '').trim());
    const expectedSegment = getProductRouteSegment(product);
    if (requestedSegment && expectedSegment && requestedSegment !== expectedSegment) {
      permanentRedirect(getProductHref(product, { complete: prefillComplete }));
    }
  }

  const canonicalPath = product ? getProductHref(product) : `/producto/${encodeURIComponent(resolvedParams.id)}`;
  const productName = String(product?.name || 'Producto retro').trim();
  const productDescription = String(product?.description || 'Producto de coleccionismo retro disponible en AdvancedRetro.es.');
  const productImage = absoluteUrl(String(product?.image || '/logo.png'));
  const priceCents = Number(product?.price || 0);
  const availability = Number(product?.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const socialSummary = await getProductSocialSummary(String((product as any)?.id || ''));
  const reviewCount = Number(socialSummary?.reviewsCount || 0);
  const ratingAverage = Number(socialSummary?.ratingAverage || 0);
  const reviewProductId = String((product as any)?.id || '').trim();
  const reviewRows = reviewProductId ? await getProductReviewsSql(reviewProductId, 3) : [];
  const reviewsSchema = reviewRows
    .filter((review) => Number(review?.rating || 0) > 0 && String(review?.comment || '').trim().length > 0)
    .slice(0, 3)
    .map((review) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Math.max(1, Math.min(5, Number(review.rating || 0))),
      },
      author: {
        '@type': 'Person',
        name: String(review.authorName || 'Coleccionista').trim().slice(0, 80),
      },
      reviewBody: String(review.comment || '').trim().slice(0, 600),
      datePublished: String(review.createdAt || '').slice(0, 10) || undefined,
    }));

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDescription,
    image: [productImage],
    sku: String(product?.id || productId),
    category: String(product?.category || 'retro-gaming'),
    brand: {
      '@type': 'Brand',
      name: 'AdvancedRetro.es',
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(canonicalPath),
      priceCurrency: 'EUR',
      price: (Math.max(0, priceCents) / 100).toFixed(2),
      availability,
      itemCondition: 'https://schema.org/UsedCondition',
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      shippingDetails: [
        {
          '@type': 'OfferShippingDetails',
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'ES',
          },
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0.00',
            currency: 'EUR',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 2,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 4,
              unitCode: 'DAY',
            },
          },
        },
      ],
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'ES',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
      seller: {
        '@type': 'Organization',
        name: 'AdvancedRetro.es',
      },
    },
    aggregateRating:
      reviewCount > 0 && ratingAverage > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(ratingAverage.toFixed(2)),
            reviewCount,
          }
        : undefined,
    review: reviewsSchema.length > 0 ? reviewsSchema : undefined,
  };

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/tienda' },
    { name: productName, path: canonicalPath },
  ]);
  const faqSchema = buildFaqJsonLd([
    {
      question: `¿El producto ${productName} está disponible para compra inmediata?`,
      answer:
        Number(product?.stock || 0) > 0
          ? `Sí. Actualmente hay stock de ${productName} y se puede comprar desde la ficha.`
          : `Ahora mismo ${productName} está sin stock. Puedes revisar alternativas relacionadas en esta misma página.`,
    },
    {
      question: `¿Qué incluye exactamente ${productName}?`,
      answer:
        'La ficha muestra precio, estado, imágenes reales y opciones adicionales (caja, manual, insert o protectores) cuando hay compatibilidad disponible.',
    },
    {
      question: '¿Cuál es el plazo y política de devolución?',
      answer:
        'La tienda trabaja con envío en España y política de devolución según condiciones publicadas, con ventana general de 14 días cuando aplique.',
    },
    {
      question: '¿Puedo comparar original vs repro antes de comprar?',
      answer:
        'Sí. En productos compatibles verás selección de componentes y edición para que puedas comprar con criterio de coleccionismo.',
    },
  ]);
  const relatedProducts = product ? await getRelatedProducts(product, 6) : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="section pb-0">
        <div className="container">
          <BreadcrumbsNav
            items={[
              { name: 'Inicio', href: '/' },
              { name: 'Tienda', href: '/tienda' },
              { name: productName },
            ]}
          />
        </div>
      </section>
      <ProductDetail
        productId={productId}
        prefillComplete={prefillComplete}
        initialProduct={product || null}
      />
      {relatedProducts.length > 0 ? (
        <section className="section pt-0">
          <div className="container">
            <div className="glass p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="title-display text-2xl">Productos relacionados</h2>
                <Link href="/tienda" className="chip">
                  Ver más en tienda
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {relatedProducts.map((item: any) => (
                  <Link
                    key={String(item?.id || '')}
                    href={getProductHref(item)}
                    className="glass p-3 sm:p-4 hover:shadow-glow transition-all group"
                  >
                    <div className="relative h-44 bg-surface border border-line rounded-xl overflow-hidden">
                      <SafeImage
                        src={String(item?.image || '/placeholder.svg')}
                        fallbackSrc="/placeholder.svg"
                        alt={String(item?.name || 'Producto relacionado')}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <h3 className="font-semibold text-text mt-3 line-clamp-2">{String(item?.name || '')}</h3>
                    <p className="text-primary font-semibold mt-2">
                      {(Math.max(0, Number(item?.price || 0)) / 100).toFixed(2)} €
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
