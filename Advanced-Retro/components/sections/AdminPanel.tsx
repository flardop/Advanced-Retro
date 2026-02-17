'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type AdminTab = 'products' | 'orders' | 'users' | 'chats' | 'listings';

type AdminTicket = {
  id: string;
  user_id: string;
  order_id: string | null;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user?: { id: string; email: string; name?: string | null } | null;
  last_message?: { message: string; created_at: string; is_admin: boolean } | null;
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  is_admin: boolean;
  message: string;
  created_at: string;
};

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'] as const;

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('products');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    name: '',
    slug: '',
    price: 0,
    status: 'new',
    stock: 0,
    category: 'juegos-gameboy',
    description: '',
    long_description: '',
    curiosities: [],
    tips: [],
    images: [],
  });

  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketReplyStatus, setTicketReplyStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('in_progress');

  const [listingNotesById, setListingNotesById] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [pRes, oRes, uRes, tRes, lRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/users'),
        fetch('/api/admin/chats/tickets'),
        fetch('/api/admin/listings'),
      ]);

      if (!pRes.ok || !oRes.ok || !uRes.ok) {
        setErrorMessage('Acceso denegado. Esta área solo está disponible para administradores.');
        return;
      }

      const [p, o, u] = await Promise.all([
        pRes.json(),
        oRes.json(),
        uRes.json(),
      ]);

      setProducts(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
      setUsers(Array.isArray(u) ? u : []);

      if (tRes.ok) {
        const t = await tRes.json().catch(() => null);
        setTickets(Array.isArray(t?.tickets) ? t.tickets : []);
      } else {
        setTickets([]);
      }

      if (lRes.ok) {
        const l = await lRes.json().catch(() => null);
        setListings(Array.isArray(l?.listings) ? l.listings : []);
      } else {
        setListings([]);
      }
    } catch {
      setErrorMessage('No se pudo cargar el panel de administración.');
    } finally {
      setLoading(false);
    }
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

  const updateOrderStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error('No se pudo actualizar el pedido');
      return;
    }
    toast.success('Estado del pedido actualizado');
    load();
  };

  const updateUser = async (userId: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo actualizar usuario');
      return;
    }
    toast.success('Usuario actualizado');
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...data.user } : user)));
  };

  const openTicket = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setTicketReply('');
    try {
      const res = await fetch(`/api/chat/tickets/${ticketId}/messages`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'No se pudo abrir el chat');
        return;
      }
      setSelectedTicket(data.ticket || null);
      setTicketMessages(Array.isArray(data.messages) ? data.messages : []);
      setTicketReplyStatus((data.ticket?.status || 'in_progress') as any);
    } catch {
      toast.error('No se pudo abrir el chat');
    }
  };

  const sendTicketReply = async () => {
    if (!selectedTicketId) return;
    if (ticketReply.trim().length < 2) {
      toast.error('Escribe una respuesta más larga');
      return;
    }

    const res = await fetch(`/api/chat/tickets/${selectedTicketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: ticketReply, status: ticketReplyStatus }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo enviar el mensaje');
      return;
    }

    setTicketReply('');
    await openTicket(selectedTicketId);
    await load();
    toast.success('Respuesta enviada');
  };

  const moderateListing = async (listingId: string, status: 'pending_review' | 'approved' | 'rejected') => {
    const adminNotes = String(listingNotesById[listingId] || '').trim();

    const res = await fetch(`/api/admin/listings/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.error || 'No se pudo actualizar la publicación');
      return;
    }

    toast.success('Publicación actualizada');
    setListings((prev) => prev.map((item) => (item.id === listingId ? { ...item, ...data.listing } : item)));
  };

  const userCountVerified = useMemo(
    () => users.filter((user) => Boolean(user.is_verified_seller)).length,
    [users]
  );

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-primary font-mono text-xs">ADVANCED RETRO ADMIN</p>
            <h1 className="title-display text-3xl mt-2">Panel de administración</h1>
            <p className="text-textMuted mt-1">Gestión de catálogo, pedidos, usuarios, chats y publicaciones.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="glass px-4 py-3 text-center min-w-[120px]">
              <p className="text-xs text-textMuted">Productos</p>
              <p className="text-primary text-lg font-semibold">{products.length}</p>
            </div>
            <div className="glass px-4 py-3 text-center min-w-[120px]">
              <p className="text-xs text-textMuted">Pedidos</p>
              <p className="text-primary text-lg font-semibold">{orders.length}</p>
            </div>
            <div className="glass px-4 py-3 text-center min-w-[120px]">
              <p className="text-xs text-textMuted">Tickets</p>
              <p className="text-primary text-lg font-semibold">{tickets.length}</p>
            </div>
            <div className="glass px-4 py-3 text-center min-w-[120px]">
              <p className="text-xs text-textMuted">Vendedores verificados</p>
              <p className="text-primary text-lg font-semibold">{userCountVerified}</p>
            </div>
            <Link
              href="/update-images"
              className="chip bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40"
            >
              Actualizar imágenes
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="glass p-4 mb-6">
            <p className="text-text">{errorMessage}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          {(['products', 'orders', 'users', 'chats', 'listings'] as const).map((t) => (
            <button
              key={t}
              className={`chip ${tab === t ? 'text-primary border-primary' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}

          <button className="chip" onClick={load} disabled={loading}>
            {loading ? 'Actualizando...' : 'Refrescar'}
          </button>
        </div>

        {tab === 'products' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass p-6">
              <h2 className="font-semibold mb-4">Nuevo producto</h2>
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Nombre"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <input
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                  <input
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Precio (cent)"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                  <input
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Stock"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  />
                  <select
                    className="w-full bg-transparent border border-line px-4 py-3"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="juegos-gameboy">Juegos Game Boy</option>
                    <option value="cajas-gameboy">Cajas Game Boy</option>
                    <option value="accesorios">Accesorios</option>
                    <option value="cajas-misteriosas">Cajas Misteriosas</option>
                  </select>
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

                <textarea
                  className="w-full bg-transparent border border-line px-4 py-3"
                  placeholder="Descripción corta"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <textarea
                  className="w-full bg-transparent border border-line px-4 py-3"
                  placeholder="Descripción larga"
                  value={form.long_description}
                  onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                />

                <button className="button-primary" onClick={createProduct}>Crear producto</button>
              </div>
            </div>

            <div className="glass p-6">
              <h2 className="font-semibold mb-4">Productos ({products.length})</h2>
              <div className="space-y-3 max-h-[720px] overflow-auto pr-1">
                {products.map((p) => (
                  <div key={p.id} className="flex justify-between items-center border-b border-line pb-3">
                    <div>
                      <p className="text-text font-semibold">{p.name}</p>
                      <p className="text-textMuted text-xs">{p.id}</p>
                      <p className="text-textMuted text-xs">
                        {(Number(p.price || 0) / 100).toFixed(2)} € · Stock {p.stock}
                      </p>
                    </div>
                    <button className="chip" onClick={() => deleteProduct(p.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="glass p-6">
            <h2 className="font-semibold mb-4">Pedidos ({orders.length})</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-primary font-mono text-xs">#{order.id}</p>
                    <select
                      className="bg-transparent border border-line px-3 py-2 text-sm"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="processing">processing</option>
                      <option value="paid">paid</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                  <p className="text-textMuted text-sm mt-2">Usuario: {order.user_id}</p>
                  <p className="text-textMuted text-sm">Total: {(Number(order.total || 0) / 100).toFixed(2)} €</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="glass p-6">
            <h2 className="font-semibold mb-4">Usuarios ({users.length})</h2>
            <div className="space-y-3 max-h-[700px] overflow-auto pr-1">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isVerified = Boolean(u.is_verified_seller);

                return (
                  <div key={u.id} className="border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{u.name || u.email}</p>
                        <p className="text-xs text-textMuted">{u.email}</p>
                        <p className="text-xs text-textMuted">ID: {u.id}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`chip ${isAdmin ? 'text-primary border-primary' : ''}`}
                          onClick={() => updateUser(u.id, { role: isAdmin ? 'user' : 'admin' })}
                        >
                          {isAdmin ? 'Quitar admin' : 'Hacer admin'}
                        </button>
                        <button
                          className={`chip ${isVerified ? 'text-primary border-primary' : ''}`}
                          onClick={() => updateUser(u.id, { is_verified_seller: !isVerified })}
                        >
                          {isVerified ? 'Quitar verificado' : 'Verificar vendedor'}
                        </button>
                      </div>
                    </div>
                    {u.bio ? <p className="text-sm text-textMuted mt-2">Bio: {u.bio}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'chats' && (
          <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
            <div className="glass p-4">
              <h2 className="font-semibold mb-3">Tickets ({tickets.length})</h2>
              <div className="space-y-2 max-h-[720px] overflow-auto pr-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    className={`w-full text-left border px-3 py-3 ${selectedTicketId === ticket.id ? 'border-primary' : 'border-line'}`}
                    onClick={() => openTicket(ticket.id)}
                  >
                    <p className="text-sm font-semibold line-clamp-1">{ticket.subject}</p>
                    <p className="text-xs text-textMuted line-clamp-1">
                      {ticket.user?.name || ticket.user?.email || ticket.user_id}
                    </p>
                    <p className="text-xs text-textMuted mt-1 line-clamp-1">
                      {ticket.last_message?.message || 'Sin mensajes'}
                    </p>
                    <p className="text-xs text-primary mt-1">{ticket.status}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass p-6">
              {!selectedTicket ? (
                <p className="text-textMuted">Selecciona un ticket para ver el chat.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{selectedTicket.subject}</p>
                      <p className="text-xs text-textMuted">
                        Cliente: {selectedTicket.user?.email || selectedTicket.user_id}
                      </p>
                    </div>
                    <select
                      className="bg-transparent border border-line px-3 py-2 text-sm"
                      value={ticketReplyStatus}
                      onChange={(e) => setTicketReplyStatus(e.target.value as any)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 border border-line p-3 max-h-[430px] overflow-auto space-y-3">
                    {ticketMessages.length === 0 ? (
                      <p className="text-sm text-textMuted">No hay mensajes aún.</p>
                    ) : (
                      ticketMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 border ${msg.is_admin ? 'border-primary/40 bg-primary/5' : 'border-line bg-surface'}`}
                        >
                          <p className="text-xs text-textMuted mb-1">{msg.is_admin ? 'Admin' : 'Cliente'} · {new Date(msg.created_at).toLocaleString('es-ES')}</p>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <textarea
                      className="w-full bg-transparent border border-line px-3 py-2 min-h-[100px]"
                      placeholder="Escribe tu respuesta al cliente..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                    />
                    <button className="button-primary" onClick={sendTicketReply}>Enviar respuesta</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'listings' && (
          <div className="glass p-6">
            <h2 className="font-semibold mb-4">Publicaciones de usuarios ({listings.length})</h2>
            <div className="space-y-4 max-h-[780px] overflow-auto pr-1">
              {listings.map((listing) => (
                <div key={listing.id} className="border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{listing.title}</p>
                      <p className="text-xs text-textMuted">
                        {listing.user?.email || listing.user_id} · {(Number(listing.price || 0) / 100).toFixed(2)} €
                      </p>
                      <p className="text-xs text-primary">Estado revisión: {listing.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="chip" onClick={() => moderateListing(listing.id, 'approved')}>Aprobar</button>
                      <button className="chip" onClick={() => moderateListing(listing.id, 'rejected')}>Rechazar</button>
                      <button className="chip" onClick={() => moderateListing(listing.id, 'pending_review')}>Pendiente</button>
                    </div>
                  </div>

                  <p className="text-sm text-textMuted mt-2">{listing.description}</p>
                  <p className="text-xs text-textMuted mt-1">Originalidad: {listing.originality_status}</p>
                  {listing.originality_notes ? (
                    <p className="text-xs text-textMuted mt-1">Notas autenticidad: {listing.originality_notes}</p>
                  ) : null}

                  {Array.isArray(listing.images) && listing.images.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {listing.images.slice(0, 4).map((image: string) => (
                        <a
                          key={image}
                          href={image}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-line px-2 py-1 text-xs text-textMuted truncate"
                        >
                          {image}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <textarea
                    className="w-full bg-transparent border border-line px-3 py-2 mt-3"
                    placeholder="Notas internas para el vendedor..."
                    value={listingNotesById[listing.id] ?? listing.admin_notes ?? ''}
                    onChange={(e) =>
                      setListingNotesById((prev) => ({
                        ...prev,
                        [listing.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
