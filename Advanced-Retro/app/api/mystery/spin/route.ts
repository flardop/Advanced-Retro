import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { spinMysteryBox } from '@/lib/mysteryBox';
import { getMysterySetupErrorMessage, isMysterySetupMissing } from '@/lib/mysterySetup';
import { checkRateLimit } from '@/lib/rateLimit';

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

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';

    const byUser = checkRateLimit({
      key: `mystery-spin:user:${user.id}`,
      maxRequests: 20,
      windowMs: 60_000,
    });
    const byIp = checkRateLimit({
      key: `mystery-spin:ip:${ip}`,
      maxRequests: 40,
      windowMs: 60_000,
    });

    if (!byUser.allowed || !byIp.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas tiradas en poco tiempo. Espera un minuto e inténtalo de nuevo.' },
        { status: 429 }
      );
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

    return NextResponse.json({
      success: true,
      spin: result.spin,
      box: result.box,
      prize: result.prize
        ? {
            id: result.prize.id,
            label: result.prize.label,
            prize_type: result.prize.prize_type,
            stock: result.prize.stock ?? null,
            metadata: result.prize.metadata && typeof result.prize.metadata === 'object' ? result.prize.metadata : {},
          }
        : null,
      coupon: result.coupon,
      remainingTickets: result.remainingTickets,
    });
  } catch (error: any) {
    if (isMysterySetupMissing(error)) {
      return NextResponse.json(
        { error: getMysterySetupErrorMessage(), setupRequired: true },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'No se pudo completar la tirada' },
      { status: 400 }
    );
  }
}
