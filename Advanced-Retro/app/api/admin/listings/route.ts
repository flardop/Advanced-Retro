import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { COMMUNITY_COMMISSION_RATE, COMMUNITY_LISTING_FEE_CENTS, getAdminListings } from '@/lib/userListings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminContext();
    const listings = await getAdminListings();
    return NextResponse.json({
      policy: {
        listing_fee_cents: COMMUNITY_LISTING_FEE_CENTS,
        commission_rate: COMMUNITY_COMMISSION_RATE,
      },
      listings,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
