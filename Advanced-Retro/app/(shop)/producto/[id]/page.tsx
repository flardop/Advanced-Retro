import type { Metadata } from 'next';
import ProductDetail from '@/components/sections/ProductDetail';
import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductHref, getProductRouteSegment, parseProductRouteParam } from '@/lib/productUrl';
import { sampleProducts } from '@/lib/sampleData';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { permanentRedirect } from 'next/navigation';

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
      .maybeSingle();
    if (!error && data) return data;
  }

  return null;
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

  const title = `${String(product.name || '').trim()} | Producto retro`;
  const description = String(product.description || 'Producto de coleccionismo retro disponible en AdvancedRetro.es.');
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
    },
  };

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/tienda' },
    { name: productName, path: canonicalPath },
  ]);

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
      <ProductDetail productId={productId} prefillComplete={prefillComplete} />
    </>
  );
}
