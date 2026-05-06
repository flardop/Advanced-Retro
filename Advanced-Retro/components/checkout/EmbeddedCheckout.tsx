'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

type CartCheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

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

type EmbeddedCheckoutProps = {
  cartItems: CartCheckoutItem[];
  couponCode?: string;
  shippingAddress: ShippingAddress;
  onClose: () => void;
};

export default function EmbeddedCheckoutModal({
  cartItems,
  couponCode,
  shippingAddress,
  onClose,
}: EmbeddedCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      items: cartItems.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      couponCode: couponCode || '',
      shippingAddress,
    }),
    [cartItems, couponCode, shippingAddress]
  );

  const fetchClientSecret = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (data?.directSuccess && data?.redirectUrl) {
        window.location.href = String(data.redirectUrl);
        return;
      }

      if (!response.ok || !data?.clientSecret) {
        throw new Error(data?.error || 'No se pudo iniciar el proceso de pago.');
      }

      setClientSecret(String(data.clientSecret));
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar el proceso de pago. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [payload]);

  useEffect(() => {
    void fetchClientSecret();
  }, [fetchClientSecret]);

  return (
    <div
      className="fixed inset-0 z-[120] bg-[rgba(4,8,14,0.78)] backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-line bg-[linear-gradient(180deg,rgba(12,20,33,.98),rgba(8,13,24,.98))] shadow-glow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-[rgba(9,14,24,.92)] text-textMuted hover:text-text"
          aria-label="Cerrar checkout"
        >
          ×
        </button>

        <div className="border-b border-line px-6 py-5 pr-16">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Pago seguro</p>
          <h2 className="title-display mt-2 text-2xl">Finalizar compra dentro de Advanced Retro</h2>
          <p className="mt-2 text-sm text-textMuted">
            El pago se procesa sin salir de la tienda. Si necesitas cerrar esta ventana, tu carrito seguirá intacto.
          </p>
        </div>

        <div className="max-h-[calc(92vh-92px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {loading ? (
            <div className="glass p-10 text-center text-textMuted">Preparando el pago seguro...</div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {clientSecret ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : null}
        </div>
      </div>
    </div>
  );
}
