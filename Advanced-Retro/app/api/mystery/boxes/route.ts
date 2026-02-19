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

    const publicBoxes = (boxes || []).map((box: any) => ({
      ...box,
      prizes: (box?.prizes || []).map((prize: any) => ({
        id: prize.id,
        label: prize.label,
        prize_type: prize.prize_type,
        stock: prize.stock ?? null,
        metadata: prize.metadata && typeof prize.metadata === 'object' ? prize.metadata : {},
      })),
    }));

    const ticketsByPrice = new Map<number, number>();
    for (const box of publicBoxes) {
      const price = Math.round(Number(box?.ticket_price || 0));
      const available = Math.max(0, Number(box?.available_tickets || 0));
      if (price <= 0) continue;
      const prev = ticketsByPrice.get(price) || 0;
      if (available > prev) ticketsByPrice.set(price, available);
    }
    const totalTickets = [...ticketsByPrice.values()].reduce((sum, value) => sum + value, 0);

    return NextResponse.json({
      success: true,
      isAuthenticated: Boolean(user),
      totalTickets,
      boxes: publicBoxes,
    });
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
