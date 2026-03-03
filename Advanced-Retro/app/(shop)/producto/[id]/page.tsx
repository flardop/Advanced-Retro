import type { Metadata } from 'next';
import ProductDetail from '@/components/sections/ProductDetail';
import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProductHref, parseProductRouteParam } from '@/lib/productUrl';
import { sampleProducts } from '@/lib/sampleData';

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
    return {
      title: 'Producto retro',
      description: 'Ficha de producto en AdvancedRetro.es',
      alternates: {
        canonical: `/producto/${encodeURIComponent(resolvedParams.id)}`,
      },
    };
  }

  const title = `${String(product.name || '').trim()} | Producto retro`;
  const description = String(product.description || 'Producto de coleccionismo retro disponible en AdvancedRetro.es.');
  const imageUrl = String(product.image || absoluteUrl('/logo.png'));
  const canonicalPath = getProductHref(product);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const prefillComplete = parseBooleanQuery(resolvedSearchParams?.complete);
  const product = await getProductByIdentifier(resolvedParams.id);
  const productId =
    String((product as any)?.id || '').trim() || parseProductRouteParam(resolvedParams.id).idCandidate || resolvedParams.id;
  return <ProductDetail productId={productId} prefillComplete={prefillComplete} />;
}
