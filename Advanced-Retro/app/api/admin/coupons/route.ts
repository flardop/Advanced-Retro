import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { buildCouponCode } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json({ coupons: data || [] });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireAdminContext();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const body = await req.json().catch(() => null);
    const type = String(body?.type || '').trim().toLowerCase();
    if (!['percent', 'fixed', 'free_order'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de cupón no válido' }, { status: 400 });
    }

    const value = Math.max(0, Math.round(Number(body?.value || 0)));
    const maxUses = Math.max(1, Math.round(Number(body?.max_uses || 1)));
    const rawCode = String(body?.code || '').trim().toUpperCase();
    const code = rawCode ? rawCode.replace(/[^A-Z0-9_-]+/g, '') : buildCouponCode('AR');

    if (!code) {
      return NextResponse.json({ error: 'Código de cupón inválido' }, { status: 400 });
    }

    const expiresAt = body?.expires_at ? new Date(body.expires_at).toISOString() : null;

    const payload = {
      code,
      type,
      value,
      max_uses: maxUses,
      used_count: 0,
      active: Boolean(body?.active ?? true),
      user_id: body?.user_id ? String(body.user_id) : null,
      created_by_user_id: user.id,
      expires_at: expiresAt,
      metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert(payload)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'No se pudo crear cupón' }, { status: 400 });
    }

    return NextResponse.json({ coupon: data });
  } catch (error: any) {
    return handleError(error);
  }
}
