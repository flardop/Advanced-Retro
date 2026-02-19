import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import {
  COMMUNITY_COMMISSION_RATE,
  COMMUNITY_LISTING_FEE_CENTS,
  createUserListing,
  getUserListings,
  validateListingInput,
} from '@/lib/userListings';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function GET() {
  try {
    const { user } = await requireUserContext();
    const listings = await getUserListings(user.id);
    return NextResponse.json({
      policy: {
        listing_fee_cents: COMMUNITY_LISTING_FEE_CENTS,
        commission_rate: COMMUNITY_COMMISSION_RATE,
      },
      listings,
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { user, profile } = await requireUserContext();

    if (!profile.is_verified_seller && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Tu cuenta aun no esta verificada para publicar productos' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const payload = validateListingInput(body);
    const listing = await createUserListing(user.id, payload);
    return NextResponse.json({
      policy: {
        listing_fee_cents: COMMUNITY_LISTING_FEE_CENTS,
        commission_rate: COMMUNITY_COMMISSION_RATE,
      },
      listing,
    });
  } catch (error: any) {
    return handleError(error);
  }
}
