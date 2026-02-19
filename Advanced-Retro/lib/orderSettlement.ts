import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureTicketForOrder } from '@/lib/supportTickets';
import { redeemCouponForOrder } from '@/lib/coupons';
import { grantMysteryTicketsFromOrder } from '@/lib/mysteryBox';
import { sendOrderPaidEmail } from '@/lib/orderEmails';

type StockUpdate = {
  productId: string;
  quantity: number;
  originalStock: number;
};

async function rollbackStock(supabaseAdmin: SupabaseClient, updates: StockUpdate[]) {
  for (const update of [...updates].reverse()) {
    await supabaseAdmin
      .from('products')
      .update({ stock: update.originalStock })
      .eq('id', update.productId)
      .eq('stock', update.originalStock - update.quantity);
  }
}

async function restoreOrderToPending(supabaseAdmin: SupabaseClient, orderId: string) {
  await supabaseAdmin
    .from('orders')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'processing');
}

async function sendOrderPaidEmailBestEffort(options: {
  supabaseAdmin: SupabaseClient;
  orderId: string;
  userId: string;
  total: number;
}) {
  const { data: userRow } = await options.supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', options.userId)
    .maybeSingle();

  const email = typeof userRow?.email === 'string' ? userRow.email.trim() : '';
  if (!email) return;

  try {
    await sendOrderPaidEmail({
      to: email,
      orderId: options.orderId,
      totalCents: Number(options.total || 0),
    });
  } catch (error) {
    console.warn('Email notification skipped:', error);
  }
}

export async function applyPaidOrderWithStockUpdate(options: {
  supabaseAdmin: SupabaseClient;
  orderId: string;
}) {
  const { supabaseAdmin, orderId } = options;

  const { data: claimedOrder, error: claimError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id,user_id,total,mystery_box_id,mystery_ticket_units,coupon_id,coupon_discount')
    .maybeSingle();

  if (claimError) throw claimError;

  if (!claimedOrder) {
    const { data: existingOrder, error: existingError } = await supabaseAdmin
      .from('orders')
      .select('id,status,user_id,total,mystery_box_id,mystery_ticket_units,coupon_id,coupon_discount')
      .eq('id', orderId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existingOrder) throw new Error(`Order ${orderId} not found`);

    if (existingOrder.status === 'paid') {
      try {
        await ensureTicketForOrder({
          orderId,
          userId: existingOrder.user_id,
          orderTotalCents: existingOrder.total,
        });
      } catch (ticketError) {
        console.warn('Ticket creation skipped:', ticketError);
      }
      return;
    }

    if (existingOrder.status === 'processing') return;
    throw new Error(`Order ${orderId} is in unexpected status "${existingOrder.status}"`);
  }

  const { data: rawOrderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (orderItemsError) {
    await restoreOrderToPending(supabaseAdmin, orderId);
    throw orderItemsError;
  }

  const isMysteryOnlyOrder =
    (rawOrderItems || []).length === 0 &&
    Boolean(claimedOrder.mystery_box_id) &&
    Number(claimedOrder.mystery_ticket_units || 0) > 0;

  if (!isMysteryOnlyOrder && (!rawOrderItems || rawOrderItems.length === 0)) {
    await restoreOrderToPending(supabaseAdmin, orderId);
    throw new Error(`Order ${orderId} has no items`);
  }

  const quantitiesByProduct = new Map<string, number>();
  for (const item of rawOrderItems || []) {
    const productId = item.product_id;
    const quantity = Number(item.quantity);
    if (typeof productId !== 'string' || !Number.isInteger(quantity) || quantity <= 0) {
      await restoreOrderToPending(supabaseAdmin, orderId);
      throw new Error(`Order ${orderId} contains invalid items`);
    }
    quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) ?? 0) + quantity);
  }

  const updates: StockUpdate[] = [];

  if (!isMysteryOnlyOrder && quantitiesByProduct.size > 0) {
    const productIds = [...quantitiesByProduct.keys()];
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);

    if (productsError) {
      await restoreOrderToPending(supabaseAdmin, orderId);
      throw productsError;
    }

    if (!products || products.length !== productIds.length) {
      await restoreOrderToPending(supabaseAdmin, orderId);
      throw new Error(`Order ${orderId} has missing products`);
    }

    const productById = new Map(products.map((product) => [product.id, product]));

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
      await rollbackStock(supabaseAdmin, updates);
      await restoreOrderToPending(supabaseAdmin, orderId);
      throw error;
    }
  }

  const { data: paidOrder, error: markPaidError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle();

  if (markPaidError || !paidOrder) {
    await rollbackStock(supabaseAdmin, updates);
    await restoreOrderToPending(supabaseAdmin, orderId);
    throw new Error(markPaidError?.message || `Could not mark order ${orderId} as paid`);
  }

  try {
    await ensureTicketForOrder({
      orderId,
      userId: claimedOrder.user_id,
      orderTotalCents: claimedOrder.total,
    });
  } catch (ticketError) {
    console.warn('Ticket creation skipped:', ticketError);
  }

  if (claimedOrder.mystery_box_id && Number(claimedOrder.mystery_ticket_units || 0) > 0) {
    try {
      await grantMysteryTicketsFromOrder({
        supabaseAdmin,
        orderId,
        userId: claimedOrder.user_id,
        boxId: claimedOrder.mystery_box_id,
        units: Number(claimedOrder.mystery_ticket_units || 0),
      });
    } catch (mysteryError) {
      console.warn('Mystery ticket grant skipped:', mysteryError);
    }
  }

  if (claimedOrder.coupon_id && Number(claimedOrder.coupon_discount || 0) > 0) {
    try {
      await redeemCouponForOrder({
        supabaseAdmin,
        couponId: claimedOrder.coupon_id,
        orderId,
        userId: claimedOrder.user_id,
        amountDiscountCents: Number(claimedOrder.coupon_discount || 0),
      });
    } catch (couponError) {
      console.warn('Coupon redemption skipped:', couponError);
    }
  }

  await sendOrderPaidEmailBestEffort({
    supabaseAdmin,
    orderId,
    userId: claimedOrder.user_id,
    total: Number(claimedOrder.total || 0),
  });
}
