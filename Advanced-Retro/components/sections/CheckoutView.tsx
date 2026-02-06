'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { stripePromise } from '@/lib/stripe';
import toast from 'react-hot-toast';

export default function CheckoutView() {
  const { items, clear } = useCartStore();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
        <div className="glass p-6">
          <p className="text-textMuted mb-4">Stripe Checkout con Apple Pay y Google Pay.</p>
          <button className="button-primary" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Procesando...' : 'Pagar ahora'}
          </button>
        </div>
      </div>
    </section>
  );
}
