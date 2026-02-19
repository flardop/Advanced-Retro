import type { Metadata } from 'next';
import ProductDetail from '@/components/sections/ProductDetail';
import { absoluteUrl } from '@/lib/siteConfig';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function parseBooleanQuery(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return parseBooleanQuery(value[0]);
  }
  if (!value) return false;
  const safe = String(value).trim().toLowerCase();
  return safe === '1' || safe === 'true' || safe === 'yes';
}

type ProductPageProps = {
  params: { id: string };
  searchParams?: { complete?: string | string[] };
};

async function getProductById(id: string) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('products')
    .select('id, name, description, image, updated_at')
    .eq('id', id)
    .maybeSingle();

  return data || null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) {
    return {
      title: 'Producto retro',
      description: 'Ficha de producto en AdvancedRetro.es',
      alternates: {
        canonical: `/producto/${params.id}`,
      },
    };
  }

  const title = `${String(product.name || '').trim()} | Producto retro`;
  const description = String(product.description || 'Producto de coleccionismo retro disponible en AdvancedRetro.es.');
  const imageUrl = String(product.image || absoluteUrl('/logo.png'));

  return {
    title,
    description,
    alternates: {
      canonical: `/producto/${params.id}`,
    },
    openGraph: {
      title,
      description,
      url: `/producto/${params.id}`,
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

export default function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const prefillComplete = parseBooleanQuery(searchParams?.complete);
  return <ProductDetail productId={params.id} prefillComplete={prefillComplete} />;
}
