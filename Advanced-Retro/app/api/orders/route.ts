import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { items } = body;

  const total = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: user.id,
      total,
      status: 'pending',
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('order_items').insert(
    items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.price,
    }))
  );

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map((i: any) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: i.name },
        unit_amount: i.price,
      },
      quantity: i.quantity,
    })),
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?orderId=${order.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/carrito`,
    metadata: { orderId: order.id },
  });

  return NextResponse.json({ sessionId: session.id });
}
