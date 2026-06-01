import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import {
  COMMUNITY_COMMISSION_RATE,
  COMMUNITY_FEATURED_FEE_PER_DAY_CENTS,
  COMMUNITY_LISTING_FEE_CENTS,
  COMMUNITY_MARKETPLACE_DISABLED_MESSAGE,
  COMMUNITY_MARKETPLACE_ENABLED,
  COMMUNITY_MAX_IMAGES,
  COMMUNITY_MIN_IMAGES,
  COMMUNITY_SHOWCASE_FEE_PER_DAY_CENTS,
  createUserListing,
  getUserListings,
  validateListingInput,
} from '@/lib/userListings';
import { grantXpToUser } from '@/lib/gamificationServer';

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
        marketplace_enabled: COMMUNITY_MARKETPLACE_ENABLED,
        disabled_message: COMMUNITY_MARKETPLACE_DISABLED_MESSAGE,
        commission_rate: COMMUNITY_COMMISSION_RATE,
        featured_fee_per_day_cents: COMMUNITY_FEATURED_FEE_PER_DAY_CENTS,
        showcase_fee_per_day_cents: COMMUNITY_SHOWCASE_FEE_PER_DAY_CENTS,
        min_images: COMMUNITY_MIN_IMAGES,
        max_images: COMMUNITY_MAX_IMAGES,
      },
      listings,
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    if (!COMMUNITY_MARKETPLACE_ENABLED) {
      return NextResponse.json({ error: COMMUNITY_MARKETPLACE_DISABLED_MESSAGE }, { status: 403 });
    }

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

    void grantXpToUser({
      userId: user.id,
      actionKey: 'community_listing_created',
      dedupeKey: `community-listing-created:${listing.id}`,
      metadata: {
        listing_id: listing.id,
        title: listing.title,
      },
    });

    return NextResponse.json({
      policy: {
        listing_fee_cents: COMMUNITY_LISTING_FEE_CENTS,
        commission_rate: COMMUNITY_COMMISSION_RATE,
        featured_fee_per_day_cents: COMMUNITY_FEATURED_FEE_PER_DAY_CENTS,
        showcase_fee_per_day_cents: COMMUNITY_SHOWCASE_FEE_PER_DAY_CENTS,
        min_images: COMMUNITY_MIN_IMAGES,
        max_images: COMMUNITY_MAX_IMAGES,
      },
      listing,
    });
  } catch (error: any) {
    return handleError(error);
  }
}
