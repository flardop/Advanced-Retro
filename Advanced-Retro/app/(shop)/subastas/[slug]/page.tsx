import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RetroStorageAuctionDetailView from '@/components/auctions/RetroStorageAuctionDetailView';
import {
  getRetroStorageAuctionDetail,
  getRetroStorageAuctionSeed,
  hasRetroStorageAuctionSeed,
} from '@/lib/retroStorageAuctions';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildPageMetadata } from '@/lib/seo';

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const seed = getRetroStorageAuctionSeed(params.slug);
  if (!seed) {
    return buildPageMetadata({
      title: 'Subasta no encontrada | Advanced Retro',
      description: 'El lote que buscas no esta disponible.',
      path: `/subastas/${params.slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${seed.title} | Subastas retro verificadas`,
    description: `${seed.subtitle}. ${seed.guaranteedMinimum}.`,
    path: `/subastas/${seed.slug}`,
    image: seed.image,
    keywords: [
      'retro storage auctions',
      seed.category,
      seed.title,
      'subasta retro verificada',
    ],
  });
}

export default async function AuctionDetailPage({ params }: PageProps) {
  if (!hasRetroStorageAuctionSeed(params.slug)) {
    notFound();
  }

  const initialAuction = await getRetroStorageAuctionDetail(params.slug, null);
  if (!initialAuction) {
    notFound();
  }

  const collectionSchema = buildCollectionPageJsonLd({
    name: initialAuction.title,
    path: `/subastas/${initialAuction.slug}`,
    description: `${initialAuction.subtitle}. ${initialAuction.guaranteedMinimum}`,
    image: initialAuction.image,
    about: [initialAuction.category, initialAuction.rarityLabel, 'subasta retro verificada'],
  });
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Subastas', path: '/subastas' },
    { name: initialAuction.title, path: `/subastas/${initialAuction.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <RetroStorageAuctionDetailView slug={params.slug} initialAuction={initialAuction} />
    </>
  );
}
