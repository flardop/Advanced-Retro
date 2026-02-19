import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { spinMysteryBox } from '@/lib/mysteryBox';

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
    const boxId = String(body?.boxId || '').trim();
    if (!boxId) {
      return NextResponse.json({ error: 'boxId is required' }, { status: 400 });
    }

    const result = await spinMysteryBox({
      supabaseAdmin,
      userId: user.id,
      boxId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo completar la tirada' },
      { status: 400 }
    );
  }
}
