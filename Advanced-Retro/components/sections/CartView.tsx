'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function CartView() {
  const { items, update, remove } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <section className="section">
      <div className="container">
        <h1 className="title-display text-3xl mb-6">Carrito</h1>
        {items.length === 0 ? (
          <div className="glass p-8">
            <p className="text-textMuted">Tu carrito está vacío.</p>
            <Link href="/tienda" className="button-primary mt-4 inline-flex">Ir a tienda</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 glass p-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-textMuted text-sm">{(item.price / 100).toFixed(2)} €</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      className="w-20 bg-transparent border border-line px-3 py-2"
                      value={item.quantity}
                      onChange={(e) => update(item.id, Number(e.target.value))}
                    />
                    <button className="chip" onClick={() => remove(item.id)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass p-6">
              <p className="text-textMuted">Total</p>
              <p className="text-2xl text-primary font-semibold">{(total / 100).toFixed(2)} €</p>
              <Link href="/checkout" className="button-primary w-full mt-4">Continuar</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
