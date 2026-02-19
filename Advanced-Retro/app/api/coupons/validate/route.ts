import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeCouponCode, validateCouponForCheckout } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const code = normalizeCouponCode(body?.code);
    const subtotalCents = Math.max(0, Math.round(Number(body?.subtotalCents || 0)));

    if (!code) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    const found = await validateCouponForCheckout({
      supabaseAdmin,
      code,
      userId: user.id,
      subtotalCents,
    });

    if (!found) {
      return NextResponse.json({ error: 'Cupón no válido o sin disponibilidad' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: found.coupon.id,
        code: found.coupon.code,
        type: found.coupon.type,
        value: found.coupon.value,
      },
      discountCents: found.discountCents,
      subtotalAfterDiscount: Math.max(0, subtotalCents - found.discountCents),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error validando cupón' }, { status: 500 });
  }
}
