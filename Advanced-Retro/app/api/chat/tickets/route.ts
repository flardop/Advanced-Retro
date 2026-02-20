import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createUserTicket,
  getSupportSetupErrorMessage,
  isSupportSetupMissing,
  listUserTickets,
} from '@/lib/supportTickets';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (isSupportSetupMissing(error)) {
    return NextResponse.json(
      {
        error: getSupportSetupErrorMessage(),
        setupRequired: true,
      },
      { status: 503 }
    );
  }
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function GET() {
  try {
    const { user } = await requireUserContext();
    const tickets = await listUserTickets(user.id);
    return NextResponse.json({ tickets });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const subject = String(body?.subject || '').trim();
    const firstMessage = String(body?.message || '').trim();
    const rawOrderId = String(body?.orderId || '').trim();

    if (subject.length < 4) {
      return NextResponse.json({ error: 'El asunto debe tener al menos 4 caracteres' }, { status: 400 });
    }

    if (firstMessage.length < 2) {
      return NextResponse.json({ error: 'El mensaje debe tener al menos 2 caracteres' }, { status: 400 });
    }

    let orderId: string | null = null;
    if (rawOrderId) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('id', rawOrderId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (orderError || !order) {
        return NextResponse.json({ error: 'Pedido no valido para este usuario' }, { status: 400 });
      }
      orderId = order.id;
    }

    const ticket = await createUserTicket({
      userId: user.id,
      subject,
      firstMessage,
      orderId,
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return handleError(error);
  }
}
