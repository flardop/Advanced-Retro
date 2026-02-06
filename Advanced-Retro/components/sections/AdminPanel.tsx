'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [tab, setTab] = useState<'products' | 'orders' | 'users'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: '',
    slug: '',
    price: 0,
    status: 'new',
    stock: 0,
    category_id: '',
    description: '',
    long_description: '',
    curiosities: [],
    tips: [],
    images: [],
  });

  const load = async () => {
    setErrorMessage(null);
    const [pRes, oRes, uRes] = await Promise.all([
      fetch('/api/admin/products'),
      fetch('/api/admin/orders'),
      fetch('/api/admin/users'),
    ]);

    if (!pRes.ok || !oRes.ok || !uRes.ok) {
      setErrorMessage('Acceso denegado. Inicia sesión con un usuario admin y configura Supabase.');
      return;
    }

    const [p, o, u] = await Promise.all([pRes.json(), oRes.json(), uRes.json()]);
    setProducts(Array.isArray(p) ? p : []);
    setOrders(Array.isArray(o) ? o : []);
    setUsers(Array.isArray(u) ? u : []);
  };

  useEffect(() => {
    load();
  }, []);

  const createProduct = async () => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error('Error al crear producto');
      return;
    }
    toast.success('Producto creado');
    load();
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) toast.error('Error al eliminar');
    else toast.success('Eliminado');
    load();
  };

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-primary font-mono text-xs">ADVANCED RETRO ADMIN</p>
            <h1 className="title-display text-3xl mt-2">Panel de administración</h1>
            <p className="text-textMuted mt-1">Gestión profesional de productos, pedidos y usuarios.</p>
          </div>
          <div className="flex gap-3">
            <div className="glass px-4 py-3 text-center min-w-[120px]">
              <p className="text-xs text-textMuted">Productos</p>
              <p className="text-primary text-lg font-semibold">{products.length}</p>
            </div>
            <div className="glass px-4 py-3 text-center min-w-[120px]">
              <p className="text-xs text-textMuted">Pedidos</p>
              <p className="text-primary text-lg font-semibold">{orders.length}</p>
            </div>
            <div className="glass px-4 py-3 text-center min-w-[120px]">
              <p className="text-xs text-textMuted">Usuarios</p>
              <p className="text-primary text-lg font-semibold">{users.length}</p>
            </div>
          </div>
        </div>
        {errorMessage && (
          <div className="glass p-4 mb-6">
            <p className="text-text">{errorMessage}</p>
            <p className="text-textMuted text-sm mt-2">
              Pasos: configura `.env.local`, inicia sesión y define tu usuario como `admin` en la tabla `users`.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 mb-6">
          {(['products', 'orders', 'users'] as const).map((t) => (
            <button
              key={t}
              className={`chip ${tab === t ? 'text-primary border-primary' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass p-6">
              <h2 className="font-semibold mb-4">Nuevo producto</h2>
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-textMuted">Nombre</label>
                    <input
                      className="w-full bg-transparent border border-line px-4 py-3"
                      placeholder="Nombre del producto"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textMuted">Slug</label>
                    <input
                      className="w-full bg-transparent border border-line px-4 py-3"
                      placeholder="slug-unico"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textMuted">Precio (céntimos)</label>
                    <input
                      className="w-full bg-transparent border border-line px-4 py-3"
                      placeholder="9900"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textMuted">Stock</label>
                    <input
                      className="w-full bg-transparent border border-line px-4 py-3"
                      placeholder="12"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textMuted">Categoría (ID)</label>
                    <input
                      className="w-full bg-transparent border border-line px-4 py-3"
                      placeholder="UUID categoría"
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textMuted">Estado</label>
                    <select
                      className="w-full bg-transparent border border-line px-4 py-3"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="new">Nuevo</option>
                      <option value="used">Usado</option>
                      <option value="special">Edición especial</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-textMuted">Descripción corta</label>
                  <textarea
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Resumen para catálogo"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted">Descripción larga</label>
                  <textarea
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Historia, detalles, estado, etc."
                    value={form.long_description}
                    onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                  />
                </div>
                <button className="button-primary" onClick={createProduct}>Crear producto</button>
              </div>
            </div>
            <div className="glass p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Productos</h2>
                <span className="text-xs text-textMuted">{products.length} items</span>
              </div>
              {products.length === 0 ? (
                <p className="text-textMuted">No hay productos aún.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex justify-between items-center border-b border-line pb-3">
                      <div>
                        <p className="text-text font-semibold">{p.name}</p>
                        <p className="text-textMuted text-xs">{p.id}</p>
                        <p className="text-textMuted text-xs">
                          {(p.price / 100).toFixed(2)} € · Stock {p.stock}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="chip text-xs">{p.status}</span>
                        <button className="chip" onClick={() => deleteProduct(p.id)}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Pedidos</h2>
              <span className="text-xs text-textMuted">{orders.length} pedidos</span>
            </div>
            {orders.length === 0 ? (
              <p className="text-textMuted">Sin pedidos aún.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-primary font-mono text-xs">#{o.id}</p>
                      <span className="chip text-xs">{o.status}</span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-3 mt-2">
                      <p className="text-textMuted text-sm">Usuario: {o.user_id}</p>
                      <p className="text-textMuted text-sm">Total: {(o.total / 100).toFixed(2)} €</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Usuarios</h2>
              <span className="text-xs text-textMuted">{users.length} usuarios</span>
            </div>
            {users.length === 0 ? (
              <p className="text-textMuted">Sin usuarios.</p>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex justify-between border-b border-line pb-3">
                    <div>
                      <p className="text-text">{u.email}</p>
                      <p className="text-textMuted text-xs">{u.role}</p>
                    </div>
                    <span className="chip text-xs">Activo</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
