'use client';

import { useMemo, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { stripePromise } from '@/lib/stripe';
import toast from 'react-hot-toast';

function toEuro(cents: number): string {
  return `${(Number(cents || 0) / 100).toFixed(2)} €`;
}

export default function CheckoutView() {
  const { items, clear } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponAppliedCode, setCouponAppliedCode] = useState('');

  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('España');
  const [phone, setPhone] = useState('');

  const shippingMethod = 'envio-estandar';
  const shippingCost = 450;

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  const totalBeforeCoupon = subtotal + shippingCost;
  const total = Math.max(0, totalBeforeCoupon - couponDiscount);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Escribe un cupón');
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          subtotalCents: totalBeforeCoupon,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Cupón inválido');

      setCouponDiscount(Number(data?.discountCents || 0));
      setCouponAppliedCode(String(data?.coupon?.code || couponCode).toUpperCase());
      toast.success('Cupón aplicado');
    } catch (error: any) {
      setCouponDiscount(0);
      setCouponAppliedCode('');
      toast.error(error?.message || 'No se pudo aplicar cupón');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    if (!fullName.trim() || !line1.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
      toast.error('Completa nombre, dirección, ciudad, código postal y país');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          couponCode: couponAppliedCode || couponCode,
          shippingMethod,
          shippingCost,
          shippingAddress: {
            full_name: fullName,
            line1,
            line2,
            city,
            state,
            postal_code: postalCode,
            country,
            phone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data?.directSuccess && data?.redirectUrl) {
        clear();
        window.location.href = data.redirectUrl;
        return;
      }

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });
      clear();
    } catch (error: any) {
      toast.error(error.message || 'Error en el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="title-display text-3xl mb-6">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="glass p-6 space-y-4">
            <h2 className="font-semibold">Dirección de envío</h2>

            <input className="w-full bg-transparent border border-line px-4 py-3" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input className="w-full bg-transparent border border-line px-4 py-3" placeholder="Dirección" value={line1} onChange={(e) => setLine1(e.target.value)} />
            <input className="w-full bg-transparent border border-line px-4 py-3" placeholder="Dirección 2 (opcional)" value={line2} onChange={(e) => setLine2(e.target.value)} />

            <div className="grid gap-3 sm:grid-cols-2">
              <input className="w-full bg-transparent border border-line px-4 py-3" placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="w-full bg-transparent border border-line px-4 py-3" placeholder="Provincia/Estado" value={state} onChange={(e) => setState(e.target.value)} />
              <input className="w-full bg-transparent border border-line px-4 py-3" placeholder="Código postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              <input className="w-full bg-transparent border border-line px-4 py-3" placeholder="País" value={country} onChange={(e) => setCountry(e.target.value)} />
              <input className="w-full bg-transparent border border-line px-4 py-3 sm:col-span-2" placeholder="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="border border-line p-3">
              <p className="text-sm text-textMuted">Método de envío</p>
              <p className="font-semibold">Envío estándar · {toEuro(shippingCost)}</p>
            </div>

            <div className="border border-line p-3 space-y-2">
              <p className="text-sm text-textMuted">Cupón</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-transparent border border-line px-3 py-2"
                  placeholder="Código de cupón"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button className="chip" onClick={validateCoupon} disabled={couponLoading}>
                  {couponLoading ? 'Validando...' : 'Aplicar'}
                </button>
              </div>
              {couponAppliedCode ? (
                <p className="text-xs text-primary">
                  Cupón activo: {couponAppliedCode} · Descuento {toEuro(couponDiscount)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="font-semibold mb-3">Resumen</h2>

            <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="border border-line p-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-textMuted">
                    {item.quantity} x {toEuro(item.price)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <p className="flex items-center justify-between"><span>Subtotal</span><span>{toEuro(subtotal)}</span></p>
              <p className="flex items-center justify-between"><span>Envío</span><span>{toEuro(shippingCost)}</span></p>
              <p className="flex items-center justify-between text-primary"><span>Descuento</span><span>-{toEuro(couponDiscount)}</span></p>
              <p className="flex items-center justify-between font-semibold text-lg pt-2 border-t border-line"><span>Total</span><span>{toEuro(total)}</span></p>
            </div>

            <p className="text-textMuted text-sm mt-4">Pago seguro con Stripe (tarjeta, Apple Pay y Google Pay).</p>
            <button className="button-primary w-full mt-4" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Procesando...' : 'Pagar ahora'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
