import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeCouponCode, validateCouponForCheckout } from '@/lib/coupons';
import { applyPaidOrderWithStockUpdate } from '@/lib/orderSettlement';
import { calculateShippingQuoteFromArenys } from '@/lib/shipping';
import { computeCommission } from '@/lib/commissions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export type CheckoutUiMode = 'hosted' | 'embedded';

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

type CheckoutPayload = {
  items: unknown;
  shippingAddress: unknown;
  couponCode?: unknown;
  customerEmail?: string | null;
};

type DirectSuccessResult = {
  mode: 'direct';
  orderId: string;
  redirectUrl: string;
};

type HostedCheckoutResult = {
  mode: 'hosted';
  orderId: string;
  sessionId: string;
};

type EmbeddedCheckoutResult = {
  mode: 'embedded';
  orderId: string;
  sessionId: string;
  clientSecret: string;
};

export type CheckoutCreationResult = DirectSuccessResult | HostedCheckoutResult | EmbeddedCheckoutResult;

function normalizeShippingAddress(input: unknown): ShippingAddress | null {
  const payload = {
    full_name: String((input as any)?.full_name || '').trim().slice(0, 120),
    line1: String((input as any)?.line1 || '').trim().slice(0, 200),
    line2: String((input as any)?.line2 || '').trim().slice(0, 200),
    city: String((input as any)?.city || '').trim().slice(0, 120),
    state: String((input as any)?.state || '').trim().slice(0, 120),
    postal_code: String((input as any)?.postal_code || '').trim().slice(0, 30),
    country: String((input as any)?.country || '').trim().slice(0, 80),
    phone: String((input as any)?.phone || '').trim().slice(0, 50),
  };

  if (!payload.full_name || !payload.line1 || !payload.city || !payload.postal_code || !payload.country) {
    return null;
  }

  return payload;
}

export async function createOrderCheckoutSession(input: {
  payload: CheckoutPayload;
  siteUrl: string;
  userId: string;
  uiMode: CheckoutUiMode;
}): Promise<CheckoutCreationResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured');
  }
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { payload, siteUrl, userId, uiMode } = input;
  const items = payload?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Invalid items payload');
  }

  const shippingAddress = normalizeShippingAddress(payload?.shippingAddress);
  if (!shippingAddress) {
    throw new Error('Faltan datos de envío (nombre, dirección, ciudad, CP y país)');
  }

  const shippingQuote = calculateShippingQuoteFromArenys(shippingAddress);
  const shippingMethod = shippingQuote.method;
  const shippingCost = shippingQuote.costCents;
  const couponCode = normalizeCouponCode(payload?.couponCode);

  const itemQuantities = new Map<string, number>();
  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== 'object') {
      throw new Error('Invalid item format');
    }

    const item = rawItem as Record<string, unknown>;
    const productId = item.product_id;
    const quantity = Number(item.quantity);

    if (typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Invalid product_id');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error('Invalid quantity');
    }

    itemQuantities.set(productId, (itemQuantities.get(productId) ?? 0) + quantity);
  }

  const productIds = [...itemQuantities.keys()];
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock, image')
    .in('id', productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }
  if (!products || products.length !== productIds.length) {
    throw new Error('Some products no longer exist');
  }

  const productById = new Map(products.map((product) => [product.id, product]));

  let subtotal = 0;
  const orderItems: Array<{ order_id: string; product_id: string; quantity: number; unit_price: number }> = [];
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const [productId, quantity] of itemQuantities) {
    const product = productById.get(productId);
    if (!product) {
      throw new Error('Invalid product selection');
    }

    if (!Number.isInteger(product.price) || product.price < 0) {
      throw new Error(`Invalid price for ${product.name}`);
    }

    if (!Number.isInteger(product.stock) || product.stock < quantity) {
      throw new Error(`Stock insuficiente para "${product.name}"`);
    }

    subtotal += product.price * quantity;
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: product.name,
          images: product.image ? [String(product.image)] : undefined,
          metadata: { productId: product.id },
        },
        unit_amount: product.price,
      },
      quantity,
    });
  }

  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'Envío estándar' },
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
      userId,
      subtotalCents: checkoutSubtotal,
    });

    if (!couponValidation) {
      throw new Error('Cupón no válido o agotado');
    }

    couponDiscount = couponValidation.discountCents;
  }

  const total = Math.max(0, checkoutSubtotal - couponDiscount);
  const commission = computeCommission({
    source: 'catalog',
    baseCents: Math.max(0, total - shippingCost),
    grossCents: total,
  });

  const legacyItems = [...itemQuantities.entries()]
    .map(([productId, quantity]) => {
      const product = productById.get(productId);
      if (!product) return null;
      return {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        price: product.price,
      };
    })
    .filter(Boolean);

  const orderPayload: Record<string, unknown> = {
    user_id: userId,
    items: legacyItems,
    total,
    status: 'pending',
    shipping_address: shippingAddress,
    shipping_method: shippingMethod || null,
    shipping_cost: shippingCost,
    coupon_code: couponValidation?.coupon?.code || null,
    coupon_id: couponValidation?.coupon?.id || null,
    coupon_discount: couponDiscount,
    commission_source: commission.source,
    commission_rate: commission.ratePercent,
    commission_base_cents: commission.baseCents,
    commission_amount_cents: commission.amountCents,
    gross_amount_cents: commission.grossCents,
    net_amount_cents: commission.netCents,
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
        user_id: userId,
        items: legacyItems,
        total,
        status: 'pending',
      })
      .select('id')
      .single();
    order = fallbackAttempt.data;
    orderError = fallbackAttempt.error;
  }

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Could not create order');
  }

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
    throw new Error(orderItemsError.message);
  }

  if (total <= 0) {
    try {
      await applyPaidOrderWithStockUpdate({
        supabaseAdmin,
        orderId: order.id,
      });
      return {
        mode: 'direct',
        orderId: order.id,
        redirectUrl: `${siteUrl}/success?orderId=${order.id}`,
      };
    } catch (settlementError: any) {
      throw new Error(settlementError?.message || 'No se pudo liquidar el pedido con cupón');
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

  const metadata = {
    orderId: order.id,
    commissionSource: commission.source,
    commissionRate: String(commission.ratePercent),
    commissionBaseCents: String(commission.baseCents),
    commissionAmountCents: String(commission.amountCents),
  };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: lineItems,
    discounts: stripeDiscounts,
    locale: 'es',
    metadata,
    client_reference_id: userId,
    customer_email: payload.customerEmail || undefined,
  };

  if (uiMode === 'embedded') {
    sessionParams.ui_mode = 'embedded';
    sessionParams.return_url = `${siteUrl}/pedido/confirmacion?session_id={CHECKOUT_SESSION_ID}`;
    sessionParams.redirect_on_completion = 'always';
    sessionParams.payment_method_types = ['card', 'sepa_debit'];
  } else {
    sessionParams.payment_method_types = ['card'];
    sessionParams.success_url = `${siteUrl}/success?orderId=${order.id}`;
    sessionParams.cancel_url = `${siteUrl}/carrito`;
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (stripeError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    const message = stripeError instanceof Error ? stripeError.message : 'Error creating checkout session';
    throw new Error(message);
  }

  const { error: stripeSessionUpdateError } = await supabaseAdmin
    .from('orders')
    .update({
      stripe_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);
  if (stripeSessionUpdateError) {
    console.warn('Order stripe_session_id update skipped:', stripeSessionUpdateError);
  }

  if (uiMode === 'embedded') {
    if (!session.client_secret) {
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error('Stripe no devolvió client secret para el checkout embebido');
    }

    return {
      mode: 'embedded',
      orderId: order.id,
      sessionId: session.id,
      clientSecret: session.client_secret,
    };
  }

  return {
    mode: 'hosted',
    orderId: order.id,
    sessionId: session.id,
  };
}
