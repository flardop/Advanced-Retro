import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createOrderCheckoutSession } from '@/lib/orderCheckoutSession';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const result = await createOrderCheckoutSession({
      payload: {
        items: body?.items,
        shippingAddress: body?.shippingAddress,
        couponCode: body?.couponCode,
        customerEmail: user.email || null,
      },
      siteUrl,
      userId: user.id,
      uiMode: 'hosted',
    });

    if (result.mode === 'direct') {
      return NextResponse.json({
        success: true,
        directSuccess: true,
        orderId: result.orderId,
        redirectUrl: result.redirectUrl,
      });
    }

    return NextResponse.json({ sessionId: result.sessionId, orderId: result.orderId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
