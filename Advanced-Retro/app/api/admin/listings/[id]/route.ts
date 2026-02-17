import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { updateListingStatus } from '@/lib/userListings';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAdminContext();

    const listingId = String(params?.id || '').trim();
    if (!listingId) {
      return NextResponse.json({ error: 'Listing id required' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const status = String(body?.status || '').trim();
    const adminNotes = String(body?.admin_notes || '').trim();

    if (!['pending_review', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const listing = await updateListingStatus({
      listingId,
      status: status as any,
      adminId: user.id,
      adminNotes,
    });

    return NextResponse.json({ listing });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
