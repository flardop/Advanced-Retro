'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmbeddedCheckoutModal from '@/components/checkout/EmbeddedCheckout';
import { calculateShippingQuoteFromArenys } from '@/lib/shipping';
import { useCartStore } from '@/store/cartStore';

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

function toEuro(cents: number): string {
  return `${(Number(cents || 0) / 100).toFixed(2)} €`;
}

function normalizeShippingAddress(input: unknown): ShippingAddress | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const source = input as Record<string, unknown>;
  const payload = {
    full_name: String(source.full_name || '').trim(),
    line1: String(source.line1 || '').trim(),
    line2: String(source.line2 || '').trim(),
    city: String(source.city || '').trim(),
    state: String(source.state || '').trim(),
    postal_code: String(source.postal_code || '').trim(),
    country: String(source.country || '').trim(),
    phone: String(source.phone || '').trim(),
  };

  if (!payload.full_name || !payload.line1 || !payload.city || !payload.postal_code || !payload.country) {
    return null;
  }

  return payload;
}

export default function CartView() {
  const { items, update, remove } = useCartStore();
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  const savedShippingQuote = useMemo(
    () =>
      savedAddress
        ? calculateShippingQuoteFromArenys(savedAddress)
        : { costCents: 0, etaLabel: 'Pendiente', method: 'standard' as const, zone: 'ES_PENINSULA' as const },
    [savedAddress]
  );

  const totalWithSavedAddress = subtotal + Number(savedShippingQuote.costCents || 0);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile', { cache: 'no-store', credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!mounted || !res.ok) return;

        const nextAddress = normalizeShippingAddress(data?.user?.profile?.shipping_address);
        setSavedAddress(nextAddress);
      } catch {
        if (mounted) setSavedAddress(null);
      } finally {
        if (mounted) setProfileLoaded(true);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const openQuickCheckout = () => {
    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }
    if (!savedAddress) {
      toast.error('Necesitas una dirección guardada para pagar desde el carrito');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Debes aceptar términos, privacidad y política de devoluciones para continuar');
      return;
    }

    setShowEmbeddedCheckout(true);
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="title-display mb-6 text-3xl">Carrito</h1>
        {items.length === 0 ? (
          <div className="glass p-8">
            <p className="text-textMuted">Tu carrito está vacío.</p>
            <Link href="/tienda" className="button-primary mt-4 inline-flex">Ir a tienda</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="glass space-y-4 p-6 lg:col-span-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-line pb-3">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-textMuted">{toEuro(item.price)}</p>
                    {item.optionType ? (
                      <p className="text-xs capitalize text-textMuted">Tipo: {item.optionType}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      className="w-20 border border-line bg-transparent px-3 py-2"
                      value={item.quantity}
                      onChange={(e) => update(item.id, Math.max(1, Number(e.target.value) || 1))}
                    />
                    <button className="chip" onClick={() => remove(item.id)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass p-6">
              <p className="text-textMuted">Subtotal</p>
              <p className="text-2xl font-semibold text-primary">{toEuro(subtotal)}</p>

              <div className="mt-5 rounded-2xl border border-line p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Dirección guardada</p>
                {!profileLoaded ? (
                  <p className="mt-3 text-sm text-textMuted">Cargando dirección de tu perfil...</p>
                ) : savedAddress ? (
                  <div className="mt-3 space-y-1 text-sm text-textMuted">
                    <p className="font-medium text-text">{savedAddress.full_name}</p>
                    <p>{savedAddress.line1}</p>
                    {savedAddress.line2 ? <p>{savedAddress.line2}</p> : null}
                    <p>
                      {savedAddress.postal_code} · {savedAddress.city}
                      {savedAddress.state ? ` · ${savedAddress.state}` : ''}
                    </p>
                    <p>{savedAddress.country}</p>
                    {savedAddress.phone ? <p>Tel: {savedAddress.phone}</p> : null}
                    <div className="mt-3 border-t border-line pt-3">
                      <p className="flex items-center justify-between">
                        <span>Envío estimado</span>
                        <span>{toEuro(savedShippingQuote.costCents)}</span>
                      </p>
                      <p className="mt-1 text-xs text-textMuted">Entrega estimada: {savedShippingQuote.etaLabel}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-textMuted">
                      No tienes una dirección completa guardada. Añádela una vez y podrás pagar directamente desde el carrito.
                    </p>
                    <Link href="/checkout" className="button-secondary inline-flex">
                      Añadir dirección
                    </Link>
                  </div>
                )}
              </div>

              {savedAddress ? (
                <div className="mt-4 rounded-xl border border-line p-3 text-xs text-textMuted space-y-2">
                  <p>
                    Información precontractual: precio final con impuestos, gastos de envío y condiciones
                    visibles antes de pagar.
                  </p>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Acepto{' '}
                      <Link href="/terminos" className="text-primary hover:underline">
                        términos y condiciones
                      </Link>
                      ,{' '}
                      <Link href="/privacidad" className="text-primary hover:underline">
                        privacidad
                      </Link>{' '}
                      y{' '}
                      <Link href="/cookies" className="text-primary hover:underline">
                        política de cookies
                      </Link>
                      .
                    </span>
                  </label>
                </div>
              ) : null}

              <div className="mt-5 space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{toEuro(subtotal)}</span>
                </p>
                {savedAddress ? (
                  <>
                    <p className="flex items-center justify-between">
                      <span>Envío</span>
                      <span>{toEuro(savedShippingQuote.costCents)}</span>
                    </p>
                    <p className="flex items-center justify-between border-t border-line pt-2 text-lg font-semibold">
                      <span>Total estimado</span>
                      <span>{toEuro(totalWithSavedAddress)}</span>
                    </p>
                  </>
                ) : null}
              </div>

              {savedAddress ? (
                <button className="button-primary mt-4 w-full" onClick={openQuickCheckout}>
                  Pagar ahora con dirección guardada
                </button>
              ) : null}

              <Link href="/checkout" className="button-secondary mt-4 inline-flex w-full justify-center">
                {savedAddress ? 'Revisar checkout completo' : 'Continuar'}
              </Link>
            </div>
          </div>
        )}

        {showEmbeddedCheckout && savedAddress ? (
          <EmbeddedCheckoutModal
            cartItems={items.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }))}
            shippingAddress={savedAddress}
            onClose={() => setShowEmbeddedCheckout(false)}
          />
        ) : null}
      </div>
    </section>
  );
}
