import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { updateListingStatus } from '@/lib/userListings';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendCommunityListingReviewEmail } from '@/lib/orderEmails';

export const dynamic = 'force-dynamic';

async function sendListingReviewEmailBestEffort(listing: any) {
  if (!supabaseAdmin) return;
  const userId = String(listing?.user_id || '').trim();
  if (!userId) return;

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  const email = typeof userRow?.email === 'string' ? userRow.email.trim() : '';
  if (!email) return;

  try {
    await sendCommunityListingReviewEmail({
      to: email,
      listingTitle: String(listing?.title || 'Producto comunidad'),
      status: listing?.status === 'approved' || listing?.status === 'rejected' ? listing.status : 'pending_review',
      priceCents: Number(listing?.price || 0),
      commissionCents: Number(listing?.commission_cents || 0),
      listingFeeCents: Number(listing?.listing_fee_cents || 0),
      adminNotes: listing?.admin_notes ? String(listing.admin_notes) : null,
    });
  } catch (error) {
    console.warn('Community listing review email skipped:', error);
  }
}

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

    await sendListingReviewEmailBestEffort(listing);
    return NextResponse.json({ listing });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
