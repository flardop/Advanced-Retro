import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendOrderStatusEmail } from '@/lib/orderEmails';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set([
  'pending',
  'processing',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
]);

const requireAdmin = async () => {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Unauthorized');
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (userRow?.role !== 'admin') throw new Error('Forbidden');
};

async function sendOrderStatusEmailBestEffort(order: any) {
  const { data: userRow } = await supabaseAdmin!
    .from('users')
    .select('email')
    .eq('id', order.user_id)
    .maybeSingle();

  const email = typeof userRow?.email === 'string' ? userRow.email.trim() : '';
  if (!email) return;

  try {
    await sendOrderStatusEmail({
      to: email,
      orderId: String(order.id),
      status: String(order.status || ''),
      trackingCode: typeof order.shipping_tracking_code === 'string' ? order.shipping_tracking_code : null,
    });
  } catch (error) {
    console.warn('Status email skipped:', error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const body = await req.json().catch(() => null);
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.status === 'string') {
      const nextStatus = body.status.trim();
      if (!ALLOWED_STATUSES.has(nextStatus)) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
      }
      payload.status = nextStatus;
    }

    if (typeof body?.shipping_tracking_code === 'string') {
      payload.shipping_tracking_code = body.shipping_tracking_code.trim().slice(0, 120) || null;
    }

    if (Object.keys(payload).length === 1) {
      return NextResponse.json({ error: 'No hay cambios válidos' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(payload)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Pedido no encontrado' }, { status: 400 });
    }

    await sendOrderStatusEmailBestEffort(data);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
