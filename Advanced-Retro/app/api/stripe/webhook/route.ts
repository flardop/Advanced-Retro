import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { applyPaidOrderWithStockUpdate } from '@/lib/orderSettlement';
import { computeCommission, type CommissionSource } from '@/lib/commissions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

function safeInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function safeCommissionSource(value: unknown): CommissionSource {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'mystery') return 'mystery';
  if (normalized === 'community') return 'community';
  return 'catalog';
}

function isMissingColumnError(error: unknown): boolean {
  const message = String((error as any)?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
}

async function resolveChargeIdFromPaymentIntent(paymentIntentId: string): Promise<string | null> {
  // Se expande latest_charge para guardar el ID de cargo final en orders
  // y facilitar conciliación con Stripe Dashboard.
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });
    const latestCharge = intent.latest_charge;
    if (typeof latestCharge === 'string' && latestCharge.trim()) return latestCharge;
    if (latestCharge && typeof latestCharge === 'object' && typeof latestCharge.id === 'string') {
      return latestCharge.id;
    }
  } catch (error) {
    console.warn('Stripe charge resolution skipped:', error);
  }
  return null;
}

async function updateOrderStripeSettlement(options: {
  orderId: string;
  session: Stripe.Checkout.Session;
}) {
  if (!supabaseAdmin) return;

  // Metadata llega de la creación del Checkout Session.
  // Si falta algún dato, se recalcula con fallback seguro.
  const metadata = options.session.metadata || {};
  const source = safeCommissionSource(metadata.commissionSource);
  const amountTotal = Math.max(0, safeInt(options.session.amount_total) || 0);

  const baseFromMetadata = safeInt(metadata.commissionBaseCents);
  const amountFromMetadata = safeInt(metadata.commissionAmountCents);
  const rateFromMetadata = Number(metadata.commissionRate);

  const computedFallback = computeCommission({
    source,
    baseCents: Math.max(0, amountTotal),
    grossCents: amountTotal,
  });

  const commissionBaseCents =
    baseFromMetadata !== null && baseFromMetadata >= 0 ? baseFromMetadata : computedFallback.baseCents;
  const commissionAmountCents =
    amountFromMetadata !== null && amountFromMetadata >= 0
      ? Math.max(0, Math.min(amountFromMetadata, amountTotal))
      : computedFallback.amountCents;
  const commissionRate =
    Number.isFinite(rateFromMetadata) && rateFromMetadata >= 0 ? Math.min(100, rateFromMetadata) : computedFallback.ratePercent;

  const paymentIntentId =
    typeof options.session.payment_intent === 'string' ? options.session.payment_intent : null;
  const chargeId = paymentIntentId ? await resolveChargeIdFromPaymentIntent(paymentIntentId) : null;

  // Persistimos todo el contexto de pago + comisión para reporting y auditoría.
  const fullPayload: Record<string, unknown> = {
    stripe_session_id: options.session.id,
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: chargeId,
    stripe_currency: typeof options.session.currency === 'string' ? options.session.currency : 'eur',
    commission_source: source,
    commission_rate: commissionRate,
    commission_base_cents: commissionBaseCents,
    commission_amount_cents: commissionAmountCents,
    gross_amount_cents: amountTotal,
    net_amount_cents: Math.max(0, amountTotal - commissionAmountCents),
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabaseAdmin.from('orders').update(fullPayload).eq('id', options.orderId);
  if (!updateError) return;

  if (isMissingColumnError(updateError)) {
    // Compatibilidad con esquemas aún no migrados: al menos guardamos session id.
    await supabaseAdmin
      .from('orders')
      .update({
        stripe_session_id: options.session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.orderId);
    return;
  }

  throw updateError;
}

async function markOrderPaymentFailureByIntent(paymentIntentId: string) {
  if (!supabaseAdmin) return;
  const timestamp = new Date().toISOString();

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id,status')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (!order?.id) return;

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'failed',
      updated_at: timestamp,
    })
    .eq('id', order.id);

  await supabaseAdmin.from('order_status_history').insert({
    order_id: order.id,
    from_status: typeof order.status === 'string' ? order.status : null,
    to_status: typeof order.status === 'string' ? order.status : 'pending',
    note: 'Stripe notificó un payment_intent.payment_failed',
    created_at: timestamp,
  });
}

async function markOrderRefundedByIntent(paymentIntentId: string) {
  if (!supabaseAdmin) return;
  const timestamp = new Date().toISOString();

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id,status')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (!order?.id) return;

  await supabaseAdmin
    .from('orders')
    .update({
      status: 'refunded',
      payment_status: 'refunded',
      updated_at: timestamp,
    })
    .eq('id', order.id);

  await supabaseAdmin.from('order_status_history').insert({
    order_id: order.id,
    from_status: typeof order.status === 'string' ? order.status : null,
    to_status: 'refunded',
    note: 'Stripe notificó un reembolso',
    created_at: timestamp,
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Invalid Stripe signature' },
      { status: 400 }
    );
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId in Stripe session metadata' }, { status: 400 });
      }

      // 1) Guarda datos de pago/comisión.
      await updateOrderStripeSettlement({
        orderId,
        session,
      });
      // 2) Liquida pedido (stock, estado paid, tickets, etc.).
      await applyPaidOrderWithStockUpdate({
        supabaseAdmin,
        orderId,
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.id) {
        await markOrderPaymentFailureByIntent(paymentIntent.id);
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      if (typeof charge.payment_intent === 'string' && charge.payment_intent) {
        await markOrderRefundedByIntent(charge.payment_intent);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({
      received: true,
      handled: false,
      error: err.message || 'Webhook processing failed',
    });
  }
}
