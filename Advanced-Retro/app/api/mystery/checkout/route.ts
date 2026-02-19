import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMysterySetupErrorMessage, isMysterySetupMissing } from '@/lib/mysterySetup';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }
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

    const { data: box, error: boxError } = await supabaseAdmin
      .from('mystery_boxes')
      .select('*')
      .eq('id', boxId)
      .eq('is_active', true)
      .maybeSingle();

    if (boxError || !box) {
      return NextResponse.json({ error: boxError?.message || 'Mystery box not found' }, { status: 404 });
    }

    const ticketPrice = Math.max(1, Math.round(Number(box.ticket_price || 0)));

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        total: ticketPrice,
        status: 'pending',
        mystery_box_id: box.id,
        mystery_ticket_units: 1,
        coupon_discount: 0,
      })
      .select('id,total')
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Could not create order' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Tirada ${box.name}`,
              description: 'Ticket para ruleta mystery box',
            },
            unit_amount: ticketPrice,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/ruleta?purchase=success&orderId=${order.id}`,
      cancel_url: `${siteUrl}/ruleta?purchase=cancelled`,
      metadata: {
        orderId: order.id,
        mysteryBoxId: box.id,
      },
    });

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error: any) {
    if (isMysterySetupMissing(error)) {
      return NextResponse.json(
        { error: getMysterySetupErrorMessage(), setupRequired: true },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'No se pudo crear el checkout de mystery box' },
      { status: 500 }
    );
  }
}
