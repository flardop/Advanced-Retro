import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { normalizeCouponCode, validateCouponForCheckout } from '@/lib/coupons';
import { applyPaidOrderWithStockUpdate } from '@/lib/orderSettlement';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

type ShippingAddress = {
  full_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
};

function normalizeShippingAddress(input: any): ShippingAddress | null {
  const payload: ShippingAddress = {
    full_name: String(input?.full_name || '').trim().slice(0, 120),
    line1: String(input?.line1 || '').trim().slice(0, 200),
    line2: String(input?.line2 || '').trim().slice(0, 200),
    city: String(input?.city || '').trim().slice(0, 120),
    state: String(input?.state || '').trim().slice(0, 120),
    postal_code: String(input?.postal_code || '').trim().slice(0, 30),
    country: String(input?.country || '').trim().slice(0, 80),
    phone: String(input?.phone || '').trim().slice(0, 50),
  };

  if (!payload.full_name || !payload.line1 || !payload.city || !payload.postal_code || !payload.country) {
    return null;
  }

  return payload;
}

function toAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num));
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Invalid items payload' }, { status: 400 });
  }

  const shippingAddress = normalizeShippingAddress(body?.shippingAddress);
  if (!shippingAddress) {
    return NextResponse.json(
      { error: 'Faltan datos de envío (nombre, dirección, ciudad, CP y país)' },
      { status: 400 }
    );
  }

  const shippingMethod = String(body?.shippingMethod || 'envio-estandar').trim().slice(0, 80);
  const shippingCost = toAmount(body?.shippingCost);
  const couponCode = normalizeCouponCode(body?.couponCode);

  const itemQuantities = new Map<string, number>();
  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== 'object') {
      return NextResponse.json({ error: 'Invalid item format' }, { status: 400 });
    }

    const item = rawItem as Record<string, unknown>;
    const productId = item.product_id;
    const quantity = Number(item.quantity);

    if (typeof productId !== 'string' || !productId.trim()) {
      return NextResponse.json({ error: 'Invalid product_id' }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    itemQuantities.set(productId, (itemQuantities.get(productId) ?? 0) + quantity);
  }

  const productIds = [...itemQuantities.keys()];

  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock')
    .in('id', productIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }
  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: 'Some products no longer exist' }, { status: 400 });
  }

  const productById = new Map(products.map((product) => [product.id, product]));

  let subtotal = 0;
  const orderItems: Array<{ order_id: string; product_id: string; quantity: number; unit_price: number }> = [];
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const [productId, quantity] of itemQuantities) {
    const product = productById.get(productId);
    if (!product) {
      return NextResponse.json({ error: 'Invalid product selection' }, { status: 400 });
    }

    if (!Number.isInteger(product.price) || product.price < 0) {
      return NextResponse.json({ error: `Invalid price for ${product.name}` }, { status: 500 });
    }

    if (!Number.isInteger(product.stock) || product.stock < quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${product.name}"` },
        { status: 409 }
      );
    }

    subtotal += product.price * quantity;
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: product.name },
        unit_amount: product.price,
      },
      quantity,
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'No valid items to checkout' }, { status: 400 });
  }

  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'Envío' },
        unit_amount: shippingCost,
      },
      quantity: 1,
    });
  }

  let couponValidation: Awaited<ReturnType<typeof validateCouponForCheckout>> = null;
  let couponDiscount = 0;

  const checkoutSubtotal = subtotal + shippingCost;
  if (couponCode) {
    couponValidation = await validateCouponForCheckout({
      supabaseAdmin,
      code: couponCode,
      userId: user.id,
      subtotalCents: checkoutSubtotal,
    });

    if (!couponValidation) {
      return NextResponse.json({ error: 'Cupón no válido o agotado' }, { status: 400 });
    }

    couponDiscount = couponValidation.discountCents;
  }

  const total = Math.max(0, checkoutSubtotal - couponDiscount);

  const orderPayload: Record<string, unknown> = {
    user_id: user.id,
    total,
    status: 'pending',
    shipping_address: shippingAddress,
    shipping_method: shippingMethod || null,
    shipping_cost: shippingCost,
    coupon_code: couponValidation?.coupon?.code || null,
    coupon_id: couponValidation?.coupon?.id || null,
    coupon_discount: couponDiscount,
    updated_at: new Date().toISOString(),
  };

  let order: any = null;
  let orderError: any = null;

  const insertAttempt = await supabaseAdmin
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single();

  order = insertAttempt.data;
  orderError = insertAttempt.error;

  if (orderError && String(orderError.message || '').toLowerCase().includes('column')) {
    const fallbackAttempt = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        total,
        status: 'pending',
      })
      .select('id')
      .single();
    order = fallbackAttempt.data;
    orderError = fallbackAttempt.error;
  }

  if (orderError || !order) return NextResponse.json({ error: orderError?.message || 'Could not create order' }, { status: 500 });

  for (const [productId, quantity] of itemQuantities) {
    const product = productById.get(productId);
    if (!product) continue;
    orderItems.push({
      order_id: order.id,
      product_id: product.id,
      quantity,
      unit_price: product.price,
    });
  }

  const { error: orderItemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
  if (orderItemsError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: orderItemsError.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  if (total <= 0) {
    try {
      await applyPaidOrderWithStockUpdate({
        supabaseAdmin,
        orderId: order.id,
      });
      return NextResponse.json({
        success: true,
        directSuccess: true,
        orderId: order.id,
        redirectUrl: `${siteUrl}/success?orderId=${order.id}`,
      });
    } catch (settlementError: any) {
      return NextResponse.json(
        { error: settlementError?.message || 'No se pudo liquidar el pedido con cupón' },
        { status: 500 }
      );
    }
  }

  let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (couponValidation) {
    const couponType = String(couponValidation.coupon.type || 'percent');
    const couponValue = Number(couponValidation.coupon.value || 0);

    const stripeCoupon =
      couponType === 'fixed'
        ? await stripe.coupons.create({
            amount_off: Math.max(0, couponValidation.discountCents),
            currency: 'eur',
            duration: 'once',
            name: couponValidation.coupon.code,
          })
        : await stripe.coupons.create({
            percent_off: couponType === 'free_order' ? 100 : Math.max(0, Math.min(100, couponValue)),
            duration: 'once',
            name: couponValidation.coupon.code,
          });

    stripeDiscounts = [{ coupon: stripeCoupon.id }];
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      discounts: stripeDiscounts,
      success_url: `${siteUrl}/success?orderId=${order.id}`,
      cancel_url: `${siteUrl}/carrito`,
      metadata: { orderId: order.id },
    });
  } catch (stripeError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    const message = stripeError instanceof Error ? stripeError.message : 'Error creating checkout session';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ sessionId: session.id, orderId: order.id });
}
