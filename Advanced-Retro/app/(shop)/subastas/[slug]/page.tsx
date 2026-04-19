import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RetroStorageAuctionDetailView from '@/components/auctions/RetroStorageAuctionDetailView';
import {
  getRetroStorageAuctionDetail,
  getRetroStorageAuctionSeed,
  hasRetroStorageAuctionSeed,
} from '@/lib/retroStorageAuctions';
import { buildPageMetadata } from '@/lib/seo';

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

  return <RetroStorageAuctionDetailView slug={params.slug} initialAuction={initialAuction} />;
}
