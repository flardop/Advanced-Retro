import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

type StockUpdate = {
  productId: string;
  quantity: number;
  originalStock: number;
};

async function rollbackStock(updates: StockUpdate[]) {
  if (!supabaseAdmin) return;
  for (const update of [...updates].reverse()) {
    await supabaseAdmin
      .from('products')
      .update({ stock: update.originalStock })
      .eq('id', update.productId)
      .eq('stock', update.originalStock - update.quantity);
  }
}

async function restoreOrderToPending(orderId: string) {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from('orders')
    .update({ status: 'pending' })
    .eq('id', orderId)
    .eq('status', 'processing');
}

async function applyPaidOrderWithStockUpdate(orderId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  // Idempotency guard: only one request can claim a pending order.
  const { data: claimedOrder, error: claimError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'processing' })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (claimError) throw claimError;

  if (!claimedOrder) {
    const { data: existingOrder, error: orderStatusError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .maybeSingle();

    if (orderStatusError) throw orderStatusError;
    if (!existingOrder) throw new Error(`Order ${orderId} not found`);
    if (existingOrder.status === 'paid' || existingOrder.status === 'processing') return;
    throw new Error(`Order ${orderId} is in unexpected status "${existingOrder.status}"`);
  }

  const { data: rawOrderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (orderItemsError) {
    await restoreOrderToPending(orderId);
    throw orderItemsError;
  }

  if (!rawOrderItems || rawOrderItems.length === 0) {
    await restoreOrderToPending(orderId);
    throw new Error(`Order ${orderId} has no items`);
  }

  const quantitiesByProduct = new Map<string, number>();
  for (const item of rawOrderItems) {
    const productId = item.product_id;
    const quantity = Number(item.quantity);
    if (typeof productId !== 'string' || !Number.isInteger(quantity) || quantity <= 0) {
      await restoreOrderToPending(orderId);
      throw new Error(`Order ${orderId} contains invalid items`);
    }
    quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) ?? 0) + quantity);
  }

  const productIds = [...quantitiesByProduct.keys()];
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, stock')
    .in('id', productIds);

  if (productsError) {
    await restoreOrderToPending(orderId);
    throw productsError;
  }

  if (!products || products.length !== productIds.length) {
    await restoreOrderToPending(orderId);
    throw new Error(`Order ${orderId} has missing products`);
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const updates: StockUpdate[] = [];

  try {
    for (const [productId, quantity] of quantitiesByProduct) {
      const product = productById.get(productId);
      if (!product) throw new Error(`Missing product ${productId}`);
      if (!Number.isInteger(product.stock) || product.stock < quantity) {
        throw new Error(`Insufficient stock for "${product.name}"`);
      }

      const { data: updatedProduct, error: updateError } = await supabaseAdmin
        .from('products')
        .update({ stock: product.stock - quantity })
        .eq('id', productId)
        .eq('stock', product.stock)
        .select('id')
        .single();

      if (updateError || !updatedProduct) {
        throw new Error(updateError?.message || `Could not update stock for "${product.name}"`);
      }

      updates.push({
        productId,
        quantity,
        originalStock: product.stock,
      });
    }
  } catch (error) {
    await rollbackStock(updates);
    await restoreOrderToPending(orderId);
    throw error;
  }

  const { data: paidOrder, error: markPaidError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle();

  if (markPaidError || !paidOrder) {
    await rollbackStock(updates);
    await restoreOrderToPending(orderId);
    throw new Error(markPaidError?.message || `Could not mark order ${orderId} as paid`);
  }
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
      await applyPaidOrderWithStockUpdate(orderId);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
