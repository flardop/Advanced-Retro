import type { Metadata } from 'next';
import RetroStorageAuctionsHub from '@/components/auctions/RetroStorageAuctionsHub';
import {
  getAuctionLeaderboardSource,
  getRetroStorageAuctionBlueprintSummary,
  listRetroStorageAuctions,
} from '@/lib/retroStorageAuctions';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Subastas retro verificadas | Retro Storage Auctions',
  description:
    'Lotes retro verificados con puja, apertura publica, recordatorios y trazabilidad dentro de Advanced Retro.',
  path: '/subastas',
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
  const initialData = {
    auctions,
    leaderboard: getAuctionLeaderboardSource(auctions).slice(0, 5),
    summary: getRetroStorageAuctionBlueprintSummary(),
    currentUserId: null,
    isAuthenticated: false,
  };

  return <RetroStorageAuctionsHub initialData={initialData} />;
}
