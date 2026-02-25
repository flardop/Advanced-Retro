import { NextResponse } from 'next/server';
import { getCommunitySellerRanking } from '@/lib/userListings';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || 8);
    const ranking = await getCommunitySellerRanking(limit);
    return NextResponse.json({
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

