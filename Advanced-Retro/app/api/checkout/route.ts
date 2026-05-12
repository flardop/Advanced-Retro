import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createOrderCheckoutSession } from '@/lib/orderCheckoutSession';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let user: { id: string; email?: string | null } | null = null;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (bearerToken && supabaseAdmin) {
      const authRes = await supabaseAdmin.auth.getUser(bearerToken);
      user = authRes.data.user
        ? { id: authRes.data.user.id, email: authRes.data.user.email || null }
        : null;
    }

    if (!user) {
      const supabase = supabaseServer();
      const {
        data: { user: cookieUser },
      } = await supabase.auth.getUser();
      user = cookieUser ? { id: cookieUser.id, email: cookieUser.email || null } : null;
    }

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
      uiMode: 'embedded',
    });

    if (result.mode === 'direct') {
      return NextResponse.json({
        success: true,
        directSuccess: true,
        orderId: result.orderId,
        redirectUrl: result.redirectUrl,
      });
    }

    if (result.mode !== 'embedded') {
      return NextResponse.json({ error: 'Unexpected checkout mode' }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      sessionId: result.sessionId,
      orderId: result.orderId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
