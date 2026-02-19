import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMysterySetupErrorMessage, isMysterySetupMissing } from '@/lib/mysterySetup';

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

    const { data: boxes, error: boxError } = await supabaseAdmin
      .from('mystery_boxes')
      .select('*')
      .order('ticket_price', { ascending: true })
      .limit(200);

    if (boxError) throw boxError;

    const boxIds = (boxes || []).map((box) => String(box.id));
    const { data: prizes, error: prizeError } = boxIds.length
      ? await supabaseAdmin
          .from('mystery_box_prizes')
          .select('*')
          .in('box_id', boxIds)
          .order('probability', { ascending: false })
          .limit(1000)
      : { data: [] as any[], error: null as any };

    if (prizeError) throw prizeError;

    const enrichedBoxes = (boxes || []).map((box) => ({
      ...box,
      prizes: (prizes || []).filter((prize) => String(prize.box_id) === String(box.id)),
    }));

    return NextResponse.json({ boxes: enrichedBoxes });
  } catch (error: any) {
    if (isMysterySetupMissing(error)) {
      return NextResponse.json(
        {
          error: getMysterySetupErrorMessage(),
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const body = await req.json().catch(() => null);
    if (typeof body?.active !== 'boolean') {
      return NextResponse.json({ error: 'active boolean required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('mystery_boxes')
      .update({
        is_active: body.active,
        updated_at: new Date().toISOString(),
      })
      .gt('ticket_price', 0);

    if (error) throw error;

    return NextResponse.json({ success: true, active: body.active });
  } catch (error: any) {
    return handleError(error);
  }
}
