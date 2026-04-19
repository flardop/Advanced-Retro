import { NextRequest, NextResponse } from 'next/server';
import {
  getAuctionLeaderboardSource,
  getRetroStorageAuctionBlueprintSummary,
  listRetroStorageAuctions,
} from '@/lib/retroStorageAuctions';
import { getOptionalAuctionRouteUser, handleAuctionRouteError } from '@/lib/retroStorageAuctionRouteUtils';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const user = await getOptionalAuctionRouteUser();
    const auctions = await listRetroStorageAuctions(user?.id || null);
    const leaderboard = getAuctionLeaderboardSource(auctions).slice(0, 5);
    const summary = getRetroStorageAuctionBlueprintSummary();

    return NextResponse.json({
      auctions,
      leaderboard,
      summary,
      currentUserId: user?.id || null,
      isAuthenticated: Boolean(user?.id),
    });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudieron cargar las subastas');
  }
}
