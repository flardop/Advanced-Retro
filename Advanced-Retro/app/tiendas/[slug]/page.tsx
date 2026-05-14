import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import StorefrontShell from '@/components/storefront/StorefrontShell';
import StructuredData from '@/components/StructuredData';
import { isWhiteLabelStorefront } from '@/lib/membership';
import { findSampleStorefront, getPreviewStorefrontFromCookies, getStoredStorefrontBySlug } from '@/lib/storefronts';
import { absoluteUrl } from '@/lib/siteConfig';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

async function resolveStore(slug: string) {
  const sampleStore = findSampleStorefront(slug);
  if (sampleStore) return { store: sampleStore, previewMode: false };

  const storedStore = await getStoredStorefrontBySlug(slug);
  if (storedStore) return { store: storedStore, previewMode: false };

  const previewStore = getPreviewStorefrontFromCookies();
  if (previewStore?.slug === slug) return { store: previewStore, previewMode: true };

  return { store: null, previewMode: false };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { store } = await resolveStore(resolvedParams.slug);

  if (!store) {
    return {
      title: 'Tienda no encontrada | AdvancedRetro.es',
      robots: { index: false, follow: false },
    };
  }

  const whiteLabel = !store.official && isWhiteLabelStorefront(store.membershipTier);
  const pageTitle = whiteLabel ? store.name : `${store.name} | AdvancedRetro.es`;

  return {
    title: pageTitle,
    description: store.shortDescription,
    alternates: {
      canonical: `/tiendas/${store.slug}`,
    },
    openGraph: {
      title: pageTitle,
      description: store.shortDescription,
      url: absoluteUrl(`/tiendas/${store.slug}`),
      siteName: 'AdvancedRetro.es',
      type: 'website',
      images: [
        {
          url: absoluteUrl(store.products[0]?.image || '/logo.png'),
          width: 1200,
          height: 630,
          alt: store.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: store.shortDescription,
      images: [absoluteUrl(store.products[0]?.image || '/logo.png')],
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const resolvedParams = await params;
  const { store, previewMode } = await resolveStore(resolvedParams.slug);

  if (!store) {
    notFound();
  }

  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    url: absoluteUrl(`/tiendas/${store.slug}`),
    description: store.shortDescription,
    image: absoluteUrl(store.products[0]?.image || '/logo.png'),
  };

  return (
    <>
      <StructuredData id={`storefront-${store.slug}-schema`} data={storeSchema} />
      <StorefrontShell store={store} previewMode={previewMode} />
    </>
  );
}
