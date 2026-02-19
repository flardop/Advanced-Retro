import { NextResponse } from 'next/server';
import { getPublicApprovedListings } from '@/lib/userListings';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get('limit') || 24);
    const listings = await getPublicApprovedListings(limitRaw);
    return NextResponse.json({
      policy: {
        publish_fee_cents: 0,
        commission_rate: 10,
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
