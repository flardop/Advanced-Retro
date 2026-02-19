'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type AdminTab = 'products' | 'orders' | 'shipping' | 'users' | 'chats' | 'listings' | 'coupons' | 'mystery';

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

type MysteryPrizeAdmin = {
  id: string;
  box_id: string;
  label: string;
  probability: number;
  stock: number | null;
  is_active: boolean;
};

type MysteryBoxAdmin = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ticket_price: number;
  is_active: boolean;
  prizes: MysteryPrizeAdmin[];
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
  const [coupons, setCoupons] = useState<any[]>([]);
  const [mysteryBoxes, setMysteryBoxes] = useState<MysteryBoxAdmin[]>([]);

  const [form, setForm] = useState<any>({
    name: '',
    slug: '',
    price: 0,
    status: 'new',
    stock: 0,
    category: 'juegos-gameboy',
    component_type: 'full_game',
    edition: 'sin-especificar',
    platform: 'game-boy',
    collection_key: '',
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
  const [listingDeliveryById, setListingDeliveryById] = useState<
    Record<
      string,
      {
        buyer_email: string;
        delivery_status: string;
        shipping_carrier: string;
        shipping_tracking_code: string;
        shipping_notes: string;
      }
    >
  >({});
  const [dedupeSummary, setDedupeSummary] = useState<any | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: 10,
    max_uses: 1,
  });

  const load = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [pRes, oRes, uRes, tRes, lRes, cRes, mRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/users'),
        fetch('/api/admin/chats/tickets'),
        fetch('/api/admin/listings'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/mystery'),
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

      if (cRes.ok) {
        const c = await cRes.json().catch(() => null);
        setCoupons(Array.isArray(c?.coupons) ? c.coupons : []);
      } else {
        setCoupons([]);
      }

      if (mRes.ok) {
        const m = await mRes.json().catch(() => null);
        setMysteryBoxes(Array.isArray(m?.boxes) ? m.boxes : []);
      } else {
        setMysteryBoxes([]);
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

  const runProductDeduplication = async (apply: boolean) => {
    const res = await fetch('/api/admin/products/deduplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apply, maxGroups: 300 }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo ejecutar la deduplicación');
      return;
    }

    setDedupeSummary(data);
    if (apply) {
      toast.success(`Deduplicación aplicada. Eliminados: ${Number(data?.productsRemoved || 0)}`);
      await load();
    } else {
      toast.success(`Preview generado. Grupos detectados: ${Number(data?.groupsFound || 0)}`);
    }
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

  const updateOrderTracking = async (id: string, shippingTrackingCode: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_tracking_code: shippingTrackingCode }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo guardar tracking');
      return;
    }
    toast.success('Tracking guardado');
    load();
  };

  const downloadShippingLabel = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping-label`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo generar PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipping-label-${orderId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Etiqueta PDF descargada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo descargar PDF');
    }
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

  const createCoupon = async () => {
    const payload = {
      code: couponForm.code.trim() || undefined,
      type: couponForm.type,
      value: Number(couponForm.value || 0),
      max_uses: Number(couponForm.max_uses || 1),
      active: true,
    };

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo crear cupón');
      return;
    }

    setCoupons((prev) => [data.coupon, ...prev]);
    setCouponForm((prev) => ({ ...prev, code: '' }));
    toast.success('Cupón creado');
  };

  const toggleCouponActive = async (couponId: string, nextActive: boolean) => {
    const res = await fetch(`/api/admin/coupons/${couponId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextActive }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo actualizar cupón');
      return;
    }

    setCoupons((prev) => prev.map((coupon) => (coupon.id === couponId ? data.coupon : coupon)));
  };

  const toggleMysteryBoxActive = async (boxId: string, nextActive: boolean) => {
    const res = await fetch(`/api/admin/mystery/boxes/${boxId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextActive }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo actualizar la caja');
      return;
    }

    setMysteryBoxes((prev) =>
      prev.map((box) => (box.id === boxId ? { ...box, is_active: Boolean(data?.box?.is_active) } : box))
    );
  };

  const toggleMysteryPrizeActive = async (prizeId: string, nextActive: boolean) => {
    const res = await fetch(`/api/admin/mystery/prizes/${prizeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextActive }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo actualizar el premio');
      return;
    }

    const updatedPrizeId = String(data?.prize?.id || '');
    const updatedPrizeActive = Boolean(data?.prize?.is_active);
    setMysteryBoxes((prev) =>
      prev.map((box) => ({
        ...box,
        prizes: Array.isArray(box.prizes)
          ? box.prizes.map((prize) =>
              prize.id === updatedPrizeId ? { ...prize, is_active: updatedPrizeActive } : prize
            )
          : [],
      }))
    );
  };

  const setAllMysteryBoxesActive = async (nextActive: boolean) => {
    const res = await fetch('/api/admin/mystery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextActive }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo actualizar la ruleta');
      return;
    }

    setMysteryBoxes((prev) => prev.map((box) => ({ ...box, is_active: nextActive })));
    toast.success(nextActive ? 'Ruleta activada' : 'Ruleta apagada');
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

  const getListingDeliveryDraft = (listing: any) => {
    const existing = listingDeliveryById[listing.id];
    if (existing) return existing;
    return {
      buyer_email: String(listing?.buyer_email || ''),
      delivery_status: String(listing?.delivery_status || 'pending'),
      shipping_carrier: String(listing?.shipping_carrier || ''),
      shipping_tracking_code: String(listing?.shipping_tracking_code || ''),
      shipping_notes: String(listing?.shipping_notes || ''),
    };
  };

  const updateListingDelivery = async (listingId: string) => {
    const listing = listings.find((item) => item.id === listingId);
    if (!listing) {
      toast.error('No se encontró la publicación');
      return;
    }
    const draft = listingDeliveryById[listingId] || getListingDeliveryDraft(listing);

    const res = await fetch(`/api/admin/listings/${listingId}/delivery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.error || 'No se pudo guardar entrega');
      return;
    }

    toast.success('Entrega actualizada');
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
          {(['products', 'orders', 'shipping', 'users', 'chats', 'listings', 'coupons', 'mystery'] as const).map((t) => (
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
                    <option value="juegos-gameboy-color">Juegos Game Boy Color</option>
                    <option value="juegos-gameboy-advance">Juegos Game Boy Advance</option>
                    <option value="juegos-super-nintendo">Juegos Super Nintendo</option>
                    <option value="juegos-gamecube">Juegos GameCube</option>
                    <option value="cajas-gameboy">Cajas Game Boy</option>
                    <option value="manuales">Manuales</option>
                    <option value="accesorios">Accesorios</option>
                    <option value="consolas-retro">Consolas Retro</option>
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
                  <select
                    className="w-full bg-transparent border border-line px-4 py-3"
                    value={form.component_type}
                    onChange={(e) => setForm({ ...form, component_type: e.target.value })}
                  >
                    <option value="full_game">Juego completo / principal</option>
                    <option value="cartucho">Cartucho</option>
                    <option value="caja">Caja</option>
                    <option value="manual">Manual</option>
                    <option value="insert">Insert/Inlay interior</option>
                    <option value="protector_juego">Protector de juego</option>
                    <option value="protector_caja">Protector de caja</option>
                    <option value="otro">Otro</option>
                  </select>
                  <select
                    className="w-full bg-transparent border border-line px-4 py-3"
                    value={form.edition}
                    onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  >
                    <option value="sin-especificar">Sin especificar</option>
                    <option value="original">Original</option>
                    <option value="repro">Repro 1:1</option>
                  </select>
                  <input
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Plataforma (game-boy, gamecube, etc.)"
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  />
                  <input
                    className="w-full bg-transparent border border-line px-4 py-3"
                    placeholder="Collection key (ej: pokemon-amarillo)"
                    value={form.collection_key}
                    onChange={(e) => setForm({ ...form, collection_key: e.target.value })}
                  />
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-semibold">Productos ({products.length})</h2>
                <div className="flex gap-2">
                  <button className="chip" onClick={() => runProductDeduplication(false)}>
                    Preview duplicados
                  </button>
                  <button className="chip" onClick={() => runProductDeduplication(true)}>
                    Limpiar duplicados
                  </button>
                </div>
              </div>

              {dedupeSummary ? (
                <div className="border border-line p-3 mb-4 text-xs text-textMuted">
                  Grupos: {Number(dedupeSummary.groupsFound || 0)} · Aplicados: {Number(dedupeSummary.groupsApplied || 0)} ·
                  Eliminados: {Number(dedupeSummary.productsRemoved || 0)}
                </div>
              ) : null}

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
              {orders.map((order) => {
                const address =
                  order?.shipping_address && typeof order.shipping_address === 'object'
                    ? order.shipping_address
                    : null;

                return (
                  <div key={order.id} className="border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-primary font-mono text-xs">#{order.id}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {order.needs_shipping ? (
                          <span className="chip text-primary border-primary">Pendiente de envío</span>
                        ) : null}
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
                    </div>
                    <p className="text-textMuted text-sm mt-2">
                      Usuario: {order.user?.email || order.user_id}
                    </p>
                    <p className="text-textMuted text-sm">
                      Total: {(Number(order.total || 0) / 100).toFixed(2)} €
                    </p>

                    {address ? (
                      <div className="mt-3 border border-line p-3 text-sm">
                        <p className="font-semibold">Dirección de envío</p>
                        <p className="text-textMuted">{address.full_name || '-'}</p>
                        <p className="text-textMuted">{address.line1 || '-'}</p>
                        {address.line2 ? <p className="text-textMuted">{address.line2}</p> : null}
                        <p className="text-textMuted">
                          {address.postal_code || '-'} · {address.city || '-'} · {address.country || '-'}
                        </p>
                        {address.phone ? <p className="text-textMuted">Tel: {address.phone}</p> : null}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <input
                        className="bg-transparent border border-line px-3 py-2 text-sm min-w-[220px]"
                        defaultValue={order.shipping_tracking_code || ''}
                        placeholder="Código de tracking"
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          if (next === String(order.shipping_tracking_code || '').trim()) return;
                          updateOrderTracking(order.id, next);
                        }}
                      />
                      <button className="chip" onClick={() => downloadShippingLabel(order.id)}>
                        Descargar etiqueta PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'shipping' && (
          <div className="glass p-6">
            <h2 className="font-semibold mb-4">Productos a enviar</h2>
            <div className="space-y-4">
              {orders
                .filter((order) => Boolean(order.needs_shipping))
                .map((order) => {
                  const address =
                    order?.shipping_address && typeof order.shipping_address === 'object'
                      ? order.shipping_address
                      : null;

                  return (
                    <div key={order.id} className="border border-line p-4">
                      <p className="text-primary font-mono text-xs">#{order.id}</p>
                      <p className="text-sm text-textMuted mt-1">
                        Cliente: {order.user?.email || order.user_id}
                      </p>
                      <p className="text-sm text-textMuted">
                        Total: {(Number(order.total || 0) / 100).toFixed(2)} €
                      </p>

                      {address ? (
                        <div className="mt-2 text-sm text-textMuted">
                          <p>{address.full_name || '-'}</p>
                          <p>{address.line1 || '-'}</p>
                          {address.line2 ? <p>{address.line2}</p> : null}
                          <p>{address.postal_code || '-'} · {address.city || '-'} · {address.country || '-'}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-400 mt-2">Pedido sin dirección de envío.</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="chip" onClick={() => downloadShippingLabel(order.id)}>
                          Generar PDF envío
                        </button>
                        <button className="chip" onClick={() => updateOrderStatus(order.id, 'shipped')}>
                          Marcar como enviado
                        </button>
                      </div>
                    </div>
                  );
                })}

              {orders.filter((order) => Boolean(order.needs_shipping)).length === 0 ? (
                <p className="text-textMuted text-sm">No hay pedidos pendientes de envío.</p>
              ) : null}
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
            <div className="glass p-3 mb-4 text-sm">
              <p className="text-primary font-semibold">Marketplace comunidad</p>
              <p className="text-textMuted mt-1">
                Publicar cuesta 0,00 € para el cliente vendedor. Comisión para la tienda: 10% del precio cuando se vende.
              </p>
            </div>
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
                      <p className="text-xs text-textMuted mt-1">
                        Publicar: {(Number(listing.listing_fee_cents || 0) / 100).toFixed(2)} € · Comisión:
                        {' '}{(Number(listing.commission_rate || 10)).toFixed(0)}% ·
                        {' '}Importe comisión: {(Number(listing.commission_cents || 0) / 100).toFixed(2)} €
                      </p>
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

                  {(() => {
                    const deliveryDraft = getListingDeliveryDraft(listing);
                    return (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <input
                          className="bg-transparent border border-line px-3 py-2"
                          placeholder="Email comprador para avisos"
                          value={deliveryDraft.buyer_email}
                          onChange={(e) =>
                            setListingDeliveryById((prev) => ({
                              ...prev,
                              [listing.id]: { ...deliveryDraft, buyer_email: e.target.value },
                            }))
                          }
                        />
                        <select
                          className="bg-transparent border border-line px-3 py-2"
                          value={deliveryDraft.delivery_status}
                          onChange={(e) =>
                            setListingDeliveryById((prev) => ({
                              ...prev,
                              [listing.id]: { ...deliveryDraft, delivery_status: e.target.value },
                            }))
                          }
                        >
                          <option value="pending">Pendiente</option>
                          <option value="processing">Preparando envío</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                        <input
                          className="bg-transparent border border-line px-3 py-2"
                          placeholder="Transportista (ej. Correos)"
                          value={deliveryDraft.shipping_carrier}
                          onChange={(e) =>
                            setListingDeliveryById((prev) => ({
                              ...prev,
                              [listing.id]: { ...deliveryDraft, shipping_carrier: e.target.value },
                            }))
                          }
                        />
                        <input
                          className="bg-transparent border border-line px-3 py-2"
                          placeholder="Tracking"
                          value={deliveryDraft.shipping_tracking_code}
                          onChange={(e) =>
                            setListingDeliveryById((prev) => ({
                              ...prev,
                              [listing.id]: { ...deliveryDraft, shipping_tracking_code: e.target.value },
                            }))
                          }
                        />
                        <textarea
                          className="md:col-span-2 bg-transparent border border-line px-3 py-2 min-h-[80px]"
                          placeholder="Notas de entrega para email"
                          value={deliveryDraft.shipping_notes}
                          onChange={(e) =>
                            setListingDeliveryById((prev) => ({
                              ...prev,
                              [listing.id]: { ...deliveryDraft, shipping_notes: e.target.value },
                            }))
                          }
                        />
                        <div className="md:col-span-2">
                          <button className="chip" onClick={() => updateListingDelivery(listing.id)}>
                            Guardar entrega y enviar correo
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'coupons' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass p-6 space-y-3">
              <h2 className="font-semibold">Crear cupón</h2>
              <input
                className="bg-transparent border border-line px-3 py-2"
                placeholder="Código (opcional, se genera automático)"
                value={couponForm.code}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="bg-transparent border border-line px-3 py-2"
                  value={couponForm.type}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="percent">Porcentaje</option>
                  <option value="fixed">Importe fijo (céntimos)</option>
                  <option value="free_order">Pedido gratis</option>
                </select>
                <input
                  className="bg-transparent border border-line px-3 py-2"
                  type="number"
                  min={0}
                  value={couponForm.value}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
                />
                <input
                  className="bg-transparent border border-line px-3 py-2"
                  type="number"
                  min={1}
                  value={couponForm.max_uses}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, max_uses: Number(e.target.value) }))}
                />
              </div>
              <button className="button-primary" onClick={createCoupon}>
                Crear cupón
              </button>
            </div>

            <div className="glass p-6">
              <h2 className="font-semibold mb-3">Cupones ({coupons.length})</h2>
              <div className="space-y-2 max-h-[680px] overflow-auto pr-1">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="border border-line p-3">
                    <p className="font-mono text-sm text-primary">{coupon.code}</p>
                    <p className="text-xs text-textMuted">
                      Tipo: {coupon.type} · Valor: {coupon.value} · Uso: {coupon.used_count}/{coupon.max_uses}
                    </p>
                    <div className="mt-2">
                      <button
                        className={`chip ${coupon.active ? 'text-primary border-primary' : ''}`}
                        onClick={() => toggleCouponActive(coupon.id, !coupon.active)}
                      >
                        {coupon.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'mystery' && (
          <div className="glass p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold">Ruleta y Mystery Boxes ({mysteryBoxes.length})</h2>
              <div className="flex flex-wrap gap-2">
                <button className="chip" onClick={() => setAllMysteryBoxesActive(true)}>
                  Activar ruleta
                </button>
                <button className="chip" onClick={() => setAllMysteryBoxesActive(false)}>
                  Apagar ruleta
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {mysteryBoxes.map((box) => (
                <div key={box.id} className="border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{box.name}</p>
                      <p className="text-xs text-textMuted">
                        {box.slug} · {(Number(box.ticket_price || 0) / 100).toFixed(2)} € por ticket
                      </p>
                      <p className="text-xs text-textMuted mt-1">{box.description}</p>
                    </div>
                    <button
                      className={`chip ${box.is_active ? 'text-primary border-primary' : ''}`}
                      onClick={() => toggleMysteryBoxActive(box.id, !box.is_active)}
                    >
                      {box.is_active ? 'Desactivar caja' : 'Activar caja'}
                    </button>
                  </div>

                  <div className="mt-3 border border-line p-3 space-y-2">
                    <p className="text-sm font-medium">Premios ({Array.isArray(box.prizes) ? box.prizes.length : 0})</p>
                    {Array.isArray(box.prizes) && box.prizes.length > 0 ? (
                      box.prizes.map((prize) => (
                        <div key={prize.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                          <div>
                            <p className="text-sm">{prize.label}</p>
                            <p className="text-xs text-textMuted">
                              Prob: {Number(prize.probability || 0).toFixed(4)}
                              {prize.stock == null ? ' · Stock ilimitado' : ` · Stock ${prize.stock}`}
                            </p>
                          </div>
                          <button
                            className={`chip ${prize.is_active ? 'text-primary border-primary' : ''}`}
                            onClick={() => toggleMysteryPrizeActive(prize.id, !prize.is_active)}
                          >
                            {prize.is_active ? 'Desactivar premio' : 'Activar premio'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-textMuted">Sin premios configurados.</p>
                    )}
                  </div>
                </div>
              ))}

              {mysteryBoxes.length === 0 ? (
                <p className="text-sm text-textMuted">No hay mystery boxes configuradas.</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
