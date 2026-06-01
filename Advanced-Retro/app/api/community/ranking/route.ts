import { NextResponse } from 'next/server';
import {
  COMMUNITY_MARKETPLACE_DISABLED_MESSAGE,
  COMMUNITY_MARKETPLACE_ENABLED,
  getCommunitySellerRanking,
  type CommunitySellerRankingPeriod,
} from '@/lib/userListings';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || 8);
    const periodRaw = String(url.searchParams.get('period') || 'historical').trim().toLowerCase();
    const period: CommunitySellerRankingPeriod =
      periodRaw === 'today' || periodRaw === '7d' ? (periodRaw as CommunitySellerRankingPeriod) : 'historical';
    const ranking = await getCommunitySellerRanking(limit, period);
    return NextResponse.json({
      period,
      marketplace_enabled: COMMUNITY_MARKETPLACE_ENABLED,
      disabled_message: COMMUNITY_MARKETPLACE_DISABLED_MESSAGE,
      ranking,
      total: ranking.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo cargar el ranking de vendedores' },
      { status: 500 }
    );
  }
}
