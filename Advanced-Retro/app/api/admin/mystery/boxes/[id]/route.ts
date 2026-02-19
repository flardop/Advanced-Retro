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

    const boxId = String(params?.id || '').trim();
    if (!boxId) return NextResponse.json({ error: 'Box id required' }, { status: 400 });

    const body = await req.json().catch(() => null);
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.active === 'boolean') payload.is_active = body.active;
    if (typeof body?.name === 'string' && body.name.trim()) payload.name = body.name.trim().slice(0, 120);
    if (typeof body?.description === 'string') payload.description = body.description.trim().slice(0, 500);
    if (typeof body?.image === 'string') payload.image = body.image.trim();
    if (typeof body?.ticket_price === 'number') payload.ticket_price = Math.max(1, Math.round(body.ticket_price));

    if (Object.keys(payload).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('mystery_boxes')
      .update(payload)
      .eq('id', boxId)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Mystery box no encontrada' }, { status: 400 });
    }

    return NextResponse.json({ box: data });
  } catch (error: any) {
    return handleError(error);
  }
}
