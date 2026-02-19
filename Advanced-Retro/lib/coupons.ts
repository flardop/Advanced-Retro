import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CouponType = 'percent' | 'fixed' | 'free_order';

export type CouponValidationResult = {
  coupon: any;
  discountCents: number;
};

function normalizeCode(input: unknown): string {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '');
}

function isExpired(iso: unknown): boolean {
  if (typeof iso !== 'string' || !iso.trim()) return false;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
}

function sanitizeType(input: unknown): CouponType {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'fixed') return 'fixed';
  if (value === 'free_order') return 'free_order';
  return 'percent';
}

function computeDiscount(type: CouponType, value: number, subtotalCents: number): number {
  const subtotal = Math.max(0, Math.round(Number(subtotalCents || 0)));
  if (subtotal <= 0) return 0;

  if (type === 'fixed') {
    const amount = Math.max(0, Math.round(Number(value || 0)));
    return Math.min(subtotal, amount);
  }

  if (type === 'free_order') {
    return subtotal;
  }

  const percent = Math.max(0, Math.min(100, Number(value || 0)));
  return Math.min(subtotal, Math.round((subtotal * percent) / 100));
}

export async function validateCouponForCheckout(options: {
  supabaseAdmin: SupabaseClient;
  code: string;
  userId: string;
  subtotalCents: number;
}): Promise<CouponValidationResult | null> {
  const safeCode = normalizeCode(options.code);
  if (!safeCode) return null;

  const { data: coupon, error } = await options.supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', safeCode)
    .maybeSingle();

  if (error || !coupon) return null;
  if (!coupon.active) return null;
  if (isExpired(coupon.expires_at)) return null;

  const maxUses = Number.isInteger(coupon.max_uses) ? coupon.max_uses : 1;
  const usedCount = Number.isInteger(coupon.used_count) ? coupon.used_count : 0;
  if (usedCount >= maxUses) return null;

  if (coupon.user_id && String(coupon.user_id) !== String(options.userId)) {
    return null;
  }

  const type = sanitizeType(coupon.type);
  const value = Number(coupon.value || 0);
  const discountCents = computeDiscount(type, value, options.subtotalCents);
  if (discountCents <= 0) return null;

  return { coupon, discountCents };
}

export async function redeemCouponForOrder(options: {
  supabaseAdmin: SupabaseClient;
  couponId: string;
  orderId: string;
  userId: string;
  amountDiscountCents: number;
}): Promise<void> {
  const amountDiscount = Math.max(0, Math.round(Number(options.amountDiscountCents || 0)));
  if (!options.couponId || amountDiscount <= 0) return;

  const { data: coupon, error: couponError } = await options.supabaseAdmin
    .from('coupons')
    .select('id,max_uses,used_count')
    .eq('id', options.couponId)
    .maybeSingle();

  if (couponError || !coupon) {
    throw new Error(couponError?.message || 'Coupon not found');
  }

  const maxUses = Number.isInteger(coupon.max_uses) ? coupon.max_uses : 1;
  const usedCount = Number.isInteger(coupon.used_count) ? coupon.used_count : 0;

  if (usedCount >= maxUses) {
    throw new Error('Coupon already exhausted');
  }

  const { error: redemptionError } = await options.supabaseAdmin
    .from('coupon_redemptions')
    .insert({
      coupon_id: coupon.id,
      user_id: options.userId,
      order_id: options.orderId,
      amount_discount: amountDiscount,
    });

  if (redemptionError) {
    const message = String(redemptionError.message || '').toLowerCase();
    if (!message.includes('duplicate') && !message.includes('unique')) {
      throw new Error(redemptionError.message);
    }
    return;
  }

  const { error: useError } = await options.supabaseAdmin
    .from('coupons')
    .update({
      used_count: usedCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', coupon.id)
    .eq('used_count', usedCount);

  if (useError) {
    throw new Error(useError.message);
  }
}

function randomCodePart(length: number): string {
  return randomUUID().replace(/-/g, '').slice(0, length).toUpperCase();
}

export function buildCouponCode(prefix = 'AR'): string {
  return `${prefix}-${randomCodePart(4)}-${randomCodePart(4)}`;
}

export async function createUserSingleUseCoupon(options: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  type: CouponType;
  value: number;
  metadata?: Record<string, unknown>;
  prefix?: string;
}): Promise<any> {
  const safeType = sanitizeType(options.type);
  const safeValue = Math.max(0, Math.round(Number(options.value || 0)));

  let attempts = 0;
  while (attempts < 5) {
    attempts += 1;
    const code = buildCouponCode(options.prefix || 'AR');
    const { data, error } = await options.supabaseAdmin
      .from('coupons')
      .insert({
        code,
        type: safeType,
        value: safeValue,
        max_uses: 1,
        used_count: 0,
        active: true,
        user_id: options.userId,
        metadata: options.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (!error && data) return data;

    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('duplicate') && !message.includes('unique')) {
      throw new Error(error?.message || 'Could not create coupon');
    }
  }

  throw new Error('Could not allocate unique coupon code');
}

export function normalizeCouponCode(input: unknown): string {
  return normalizeCode(input);
}
