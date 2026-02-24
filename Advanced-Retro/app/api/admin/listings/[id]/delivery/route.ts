import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { sendCommunityDeliveryEmail } from '@/lib/orderEmails';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getListingById, updateCommunityListingDelivery } from '@/lib/userListings';
import { creditCommunitySaleToSellerIfDelivered } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

async function resolveDeliveryTargetEmail(listing: any): Promise<string> {
  const buyerEmail = String(listing?.buyer_email || '').trim();
  if (buyerEmail) return buyerEmail;
  if (!supabaseAdmin) return '';

  const userId = String(listing?.user_id || '').trim();
  if (!userId) return '';

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  return typeof userRow?.email === 'string' ? userRow.email.trim() : '';
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAdminContext();

    const listingId = String(params?.id || '').trim();
    if (!listingId) {
      return NextResponse.json({ error: 'Listing id required' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const listing = await updateCommunityListingDelivery({
      listingId,
      adminId: user.id,
      buyerEmail: typeof body?.buyer_email === 'string' ? body.buyer_email : undefined,
      deliveryStatus: typeof body?.delivery_status === 'string' ? body.delivery_status : undefined,
      trackingCode: typeof body?.shipping_tracking_code === 'string' ? body.shipping_tracking_code : undefined,
      shippingCarrier: typeof body?.shipping_carrier === 'string' ? body.shipping_carrier : undefined,
      shippingNotes: typeof body?.shipping_notes === 'string' ? body.shipping_notes : undefined,
    });

    const enriched = await getListingById(listing.id);
    const targetEmail = await resolveDeliveryTargetEmail(enriched);
    if (targetEmail) {
      try {
        await sendCommunityDeliveryEmail({
          to: targetEmail,
          listingTitle: String(enriched?.title || 'Producto comunidad'),
          deliveryStatus: String(enriched?.delivery_status || 'pending'),
          trackingCode: typeof enriched?.shipping_tracking_code === 'string' ? enriched.shipping_tracking_code : null,
          shippingCarrier: typeof enriched?.shipping_carrier === 'string' ? enriched.shipping_carrier : null,
          shippingNotes: typeof enriched?.shipping_notes === 'string' ? enriched.shipping_notes : null,
        });
      } catch (error) {
        console.warn('Community delivery email skipped:', error);
      }
    }

    let walletCredit: any = null;
    try {
      walletCredit = await creditCommunitySaleToSellerIfDelivered({
        listing: enriched,
        adminId: user.id,
      });
    } catch (walletError: any) {
      walletCredit = {
        credited: false,
        error: walletError?.message || 'No se pudo procesar el abono en cartera',
      };
    }

    return NextResponse.json({ listing: enriched, wallet_credit: walletCredit });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
