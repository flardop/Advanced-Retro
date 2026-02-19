import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const couponId = String(params?.id || '').trim();
    if (!couponId) {
      return NextResponse.json({ error: 'Coupon id required' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.active === 'boolean') payload.active = body.active;
    if (typeof body?.max_uses === 'number') payload.max_uses = Math.max(1, Math.round(body.max_uses));
    if (typeof body?.expires_at === 'string') payload.expires_at = new Date(body.expires_at).toISOString();

    if (Object.keys(payload).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(payload)
      .eq('id', couponId)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Cupón no encontrado' }, { status: 400 });
    }

    return NextResponse.json({ coupon: data });
  } catch (error: any) {
    return handleError(error);
  }
}
