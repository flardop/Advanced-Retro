import { NextResponse } from 'next/server';
import {
  COMMUNITY_COMMISSION_RATE,
  COMMUNITY_FEATURED_FEE_PER_DAY_CENTS,
  COMMUNITY_SHOWCASE_FEE_PER_DAY_CENTS,
  getPublicApprovedListings,
} from '@/lib/userListings';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get('limit') || 24);
    const listings = await getPublicApprovedListings(limitRaw);
    return NextResponse.json({
      policy: {
        publish_fee_cents: 0,
        commission_rate: COMMUNITY_COMMISSION_RATE,
        featured_fee_per_day_cents: COMMUNITY_FEATURED_FEE_PER_DAY_CENTS,
        showcase_fee_per_day_cents: COMMUNITY_SHOWCASE_FEE_PER_DAY_CENTS,
      },
      listings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudieron cargar publicaciones de comunidad' },
      { status: 500 }
    );
  }
}
