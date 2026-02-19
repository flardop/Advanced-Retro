import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { listMysteryBoxes } from '@/lib/mysteryBox';
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

    const boxes = await listMysteryBoxes({
      supabaseAdmin,
      userId: user?.id || null,
    });

    return NextResponse.json({ success: true, boxes });
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
    return NextResponse.json(
      { error: error?.message || 'No se pudieron cargar las mystery boxes' },
      { status: 500 }
    );
  }
}
