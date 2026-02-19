import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { buildShippingLabelPdf } from '@/lib/shippingLabelPdf';

export const dynamic = 'force-dynamic';

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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const orderId = String(params?.id || '').trim();
    if (!orderId) {
      return NextResponse.json({ error: 'Order id required' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id,user_id,shipping_address,shipping_tracking_code')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Order not found' }, { status: 404 });
    }

    const address = order.shipping_address && typeof order.shipping_address === 'object'
      ? order.shipping_address
      : null;

    if (!address) {
      return NextResponse.json({ error: 'Pedido sin dirección de envío' }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email,name')
      .eq('id', order.user_id)
      .maybeSingle();

    const pdf = buildShippingLabelPdf({
      orderId,
      customerName: (address as any).full_name || user?.name || null,
      customerEmail: user?.email || null,
      addressLine1: String((address as any).line1 || ''),
      addressLine2: String((address as any).line2 || ''),
      postalCode: String((address as any).postal_code || ''),
      city: String((address as any).city || ''),
      state: String((address as any).state || ''),
      country: String((address as any).country || ''),
      phone: String((address as any).phone || ''),
      trackingCode: order.shipping_tracking_code || null,
    });

    await supabaseAdmin
      .from('orders')
      .update({
        shipping_label_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shipping-label-${orderId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'No se pudo generar etiqueta PDF' }, { status: 500 });
  }
}
