import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { getAdminListings } from '@/lib/userListings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminContext();
    const listings = await getAdminListings();
    return NextResponse.json({ listings });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
