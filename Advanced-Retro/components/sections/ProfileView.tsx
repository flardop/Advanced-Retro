'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ProfileView() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const client = supabaseClient;
    if (!client) return;
    const load = async () => {
      const { data } = await client.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: ordersData } = await client
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', data.user.id)
          .order('created_at', { ascending: false });
        setOrders(ordersData || []);
      }
    };
    load();
  }, []);

  if (!supabaseClient) {
    return (
      <section className="section">
        <div className="container">Configura Supabase en `.env.local` para usar el perfil.</div>
      </section>
    );
  }

  if (user === null) {
    return (
      <section className="section">
        <div className="container"><p className="text-textMuted">Cargando perfil...</p></div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="title-display text-3xl mb-6">Perfil</h1>
        <div className="glass p-6 mb-6">
          <p className="text-textMuted">Email</p>
          <p className="text-text">{user?.email ?? '—'}</p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin" className="button-secondary">Panel admin</Link>
            <button
              className="button-secondary"
              onClick={() => supabaseClient?.auth.signOut()}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <div className="glass p-6">
          <h2 className="title-display text-xl mb-4">Historial de pedidos</h2>
          {orders.length === 0 ? (
            <p className="text-textMuted">Sin pedidos aún.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-line p-4">
                  <p className="text-primary font-mono text-xs">#{order.id}</p>
                  <p className="text-textMuted text-sm">Estado: {order.status}</p>
                  <p className="text-textMuted text-sm">
                    Total: {(order.total / 100).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
