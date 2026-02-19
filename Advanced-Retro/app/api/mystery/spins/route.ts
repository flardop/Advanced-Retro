import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMysterySetupErrorMessage, isMysterySetupMissing } from '@/lib/mysterySetup';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const { data: spins, error } = await supabaseAdmin
      .from('mystery_spins')
      .select('id,box_id,prize_id,prize_label,coupon_id,status,metadata,created_at,redeemed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(120);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const couponIds = [...new Set((spins || []).map((spin) => spin.coupon_id).filter(Boolean))];
    const { data: coupons } = couponIds.length
      ? await supabaseAdmin
          .from('coupons')
          .select('id,code,type,value,active,used_count,max_uses,expires_at')
          .in('id', couponIds)
      : { data: [] as any[] };

    const couponMap = new Map<string, any>((coupons || []).map((coupon) => [String(coupon.id), coupon]));

    const enriched = (spins || []).map((spin) => ({
      ...spin,
      coupon: spin.coupon_id ? couponMap.get(String(spin.coupon_id)) || null : null,
    }));

    return NextResponse.json({ success: true, spins: enriched });
  } catch (error: any) {
    if (isMysterySetupMissing(error)) {
      return NextResponse.json(
        { error: getMysterySetupErrorMessage(), setupRequired: true },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'No se pudo cargar el historial de tiradas' },
      { status: 500 }
    );
  }
}
