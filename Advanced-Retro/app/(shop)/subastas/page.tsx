import type { Metadata } from 'next';
import RetroStorageAuctionsHub from '@/components/auctions/RetroStorageAuctionsHub';
import {
  getAuctionLeaderboardSource,
  getRetroStorageAuctionBlueprintSummary,
  listRetroStorageAuctions,
} from '@/lib/retroStorageAuctions';
import { buildCollectionPageJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Subastas retro verificadas | Retro Storage Auctions',
  description:
    'Lotes retro verificados con puja, apertura publica, recordatorios y trazabilidad dentro de Advanced Retro.',
  path: '/subastas',
  image: '/images/auctions/vault-kanto-07.svg',
  keywords: [
    'subastas retro',
    'subastas videojuegos retro',
    'retro storage auctions',
    'subasta pokemon game boy',
    'advanced retro subastas',
  ],
});

export default async function AuctionsPage() {
  const auctions = await listRetroStorageAuctions(null);
  const collectionSchema = buildCollectionPageJsonLd({
    name: 'Retro Storage Auctions',
    path: '/subastas',
    description:
      'Subastas retro verificadas con lotes documentados, recordatorios, apertura pública y trazabilidad dentro de Advanced Retro.',
    image: '/images/auctions/vault-kanto-07.svg',
    about: ['subastas retro', 'videojuegos retro', 'coleccionismo verificado'],
  });
  const itemListSchema = buildItemListJsonLd(
    auctions.map((auction) => ({
      name: auction.title,
      path: `/subastas/${auction.slug}`,
      image: auction.image,
      description: `${auction.subtitle}. ${auction.guaranteedMinimum}`,
    })),
    'Lotes verificados de Advanced Retro'
  );
  const initialData = {
    auctions,
    leaderboard: getAuctionLeaderboardSource(auctions).slice(0, 5),
    summary: getRetroStorageAuctionBlueprintSummary(),
    currentUserId: null,
    isAuthenticated: false,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <RetroStorageAuctionsHub initialData={initialData} />
    </>
  );
}
