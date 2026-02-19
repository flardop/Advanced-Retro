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

    const prizeId = String(params?.id || '').trim();
    if (!prizeId) return NextResponse.json({ error: 'Prize id required' }, { status: 400 });

    const body = await req.json().catch(() => null);
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.active === 'boolean') payload.is_active = body.active;
    if (typeof body?.label === 'string' && body.label.trim()) payload.label = body.label.trim().slice(0, 180);
    if (typeof body?.probability === 'number') payload.probability = Math.max(0, Number(body.probability));
    if (body?.stock === null) payload.stock = null;
    if (typeof body?.stock === 'number') payload.stock = Math.max(0, Math.round(body.stock));

    if (Object.keys(payload).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('mystery_box_prizes')
      .update(payload)
      .eq('id', prizeId)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Premio no encontrado' }, { status: 400 });
    }

    return NextResponse.json({ prize: data });
  } catch (error: any) {
    return handleError(error);
  }
}
