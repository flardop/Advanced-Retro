'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabaseClient';

type Ticket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  order_id: string | null;
  created_at: string;
  updated_at: string;
  last_message?: { message: string; is_admin: boolean; created_at: string } | null;
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  is_admin: boolean;
  message: string;
  created_at: string;
};

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  originality_status: string;
  status: 'pending_review' | 'approved' | 'rejected';
  images: string[];
  created_at: string;
  admin_notes?: string | null;
  listing_fee_cents?: number;
  commission_rate?: number;
  commission_cents?: number;
  delivery_status?: string;
  shipping_tracking_code?: string | null;
};

type ProfileState = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified_seller: boolean;
};

type Tab = 'profile' | 'orders' | 'tickets' | 'sell';

function parseImageLines(input: string): string[] {
  const list = input
    .split(/\n|,|;/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(list)];
}

function isConciergeTicket(ticket: { subject?: string } | null | undefined): boolean {
  return String(ticket?.subject || '').toLowerCase().includes('encargo');
}

export default function ProfileView() {
  const autoOpenedTicketRef = useRef('');
  const [deepLinkTab, setDeepLinkTab] = useState('');
  const [deepLinkTicketId, setDeepLinkTicketId] = useState('');
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [ticketReply, setTicketReply] = useState('');

  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketOrderId, setNewTicketOrderId] = useState('');
  const [sendingTicket, setSendingTicket] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingCategory, setListingCategory] = useState('juegos-gameboy');
  const [listingCondition, setListingCondition] = useState('used');
  const [listingOriginality, setListingOriginality] = useState('original_sin_verificar');
  const [listingOriginalityNotes, setListingOriginalityNotes] = useState('');
  const [listingImageText, setListingImageText] = useState('');
  const [publishingListing, setPublishingListing] = useState(false);

  const loadProfile = async () => {
    const res = await fetch('/api/auth/profile');
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo cargar tu perfil');
    }

    setUser(data?.user || null);
    const nextProfile = data?.user?.profile || null;
    setProfile(nextProfile);

    setName(String(nextProfile?.name || ''));
    setAvatarUrl(String(nextProfile?.avatar_url || ''));
    setBio(String(nextProfile?.bio || ''));
  };

  const loadOrders = async (userId: string) => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setOrders(data || []);
  };

  const loadTickets = async () => {
    const res = await fetch('/api/chat/tickets');
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'No se pudieron cargar los tickets');
    }
    setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
  };

  const loadListings = async () => {
    const res = await fetch('/api/profile/listings');
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 403) {
        setListings([]);
        return;
      }
      throw new Error(data?.error || 'No se pudieron cargar tus publicaciones');
    }
    setListings(Array.isArray(data?.listings) ? data.listings : []);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await loadProfile();
      const currentUser = await supabaseClient?.auth.getUser();
      const authUserId = currentUser?.data?.user?.id || '';
      if (authUserId) {
        await loadOrders(authUserId);
      }
      const [ticketsResult, listingsResult] = await Promise.allSettled([loadTickets(), loadListings()]);

      if (ticketsResult.status === 'rejected') {
        setTickets([]);
      }
      if (listingsResult.status === 'rejected') {
        setListings([]);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabaseClient) return;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setDeepLinkTab(String(params.get('tab') || '').trim());
      setDeepLinkTicketId(String(params.get('ticket') || '').trim());
    }
    loadAll();
    // loadAll is intentionally triggered once on mount for profile bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deepLinkTab === 'tickets' && tab !== 'tickets') {
      setTab('tickets');
    }

    if (
      deepLinkTicketId &&
      tickets.some((ticket) => ticket.id === deepLinkTicketId) &&
      autoOpenedTicketRef.current !== deepLinkTicketId
    ) {
      autoOpenedTicketRef.current = deepLinkTicketId;
      void openTicket(deepLinkTicketId);
    }
    // openTicket is intentionally used as callback for deep-link tickets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkTab, deepLinkTicketId, tickets, tab]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          avatar_url: avatarUrl,
          bio,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo guardar el perfil');
      }

      setProfile(data.profile || null);
      toast.success('Perfil actualizado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const openTicket = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setTicketReply('');

    const res = await fetch(`/api/chat/tickets/${ticketId}/messages`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo abrir el ticket');
      return;
    }

    setSelectedTicket(data.ticket || null);
    setTicketMessages(Array.isArray(data.messages) ? data.messages : []);
  };

  const sendTicketReply = async () => {
    if (!selectedTicketId) return;
    if (ticketReply.trim().length < 2) {
      toast.error('Escribe un mensaje más largo');
      return;
    }

    const res = await fetch(`/api/chat/tickets/${selectedTicketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: ticketReply }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error || 'No se pudo enviar el mensaje');
      return;
    }

    setTicketReply('');
    await openTicket(selectedTicketId);
    await loadTickets();
  };

  const createTicket = async () => {
    if (newTicketSubject.trim().length < 4) {
      toast.error('El asunto debe tener al menos 4 caracteres');
      return;
    }
    if (newTicketMessage.trim().length < 2) {
      toast.error('Escribe un mensaje para abrir el ticket');
      return;
    }

    setSendingTicket(true);
    try {
      const res = await fetch('/api/chat/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newTicketSubject,
          message: newTicketMessage,
          orderId: newTicketOrderId || undefined,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo crear el ticket');
      }

      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketOrderId('');
      await loadTickets();
      if (data?.ticket?.id) {
        await openTicket(data.ticket.id);
      }
      toast.success('Ticket creado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear el ticket');
    } finally {
      setSendingTicket(false);
    }
  };

  const createTicketFromOrder = async (orderId: string) => {
    setNewTicketOrderId(orderId);
    setNewTicketSubject(`Seguimiento del pedido ${orderId.slice(0, 8)}`);
    setNewTicketMessage('Hola, necesito ayuda con este pedido.');
    setTab('tickets');
  };

  const publishListing = async () => {
    if (!profile?.is_verified_seller && profile?.role !== 'admin') {
      toast.error('Tu cuenta debe estar verificada para publicar');
      return;
    }

    const imageList = parseImageLines(listingImageText);

    setPublishingListing(true);
    try {
      const res = await fetch('/api/profile/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listingTitle,
          description: listingDescription,
          price: Math.round(Number(listingPrice || 0) * 100),
          category: listingCategory,
          condition: listingCondition,
          originality_status: listingOriginality,
          originality_notes: listingOriginalityNotes,
          images: imageList,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo publicar');
      }

      setListingTitle('');
      setListingDescription('');
      setListingPrice('');
      setListingOriginality('original_sin_verificar');
      setListingOriginalityNotes('');
      setListingImageText('');

      await loadListings();
      toast.success('Publicación enviada a revisión');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo publicar');
    } finally {
      setPublishingListing(false);
    }
  };

  const availableOrderIds = useMemo(
    () => orders.map((order) => String(order.id)),
    [orders]
  );

  if (!supabaseClient) {
    return (
      <section className="section">
        <div className="container">Configura Supabase en `.env.local` para usar el perfil.</div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container"><p className="text-textMuted">Cargando perfil...</p></div>
      </section>
    );
  }

  if (!user || !profile) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-8">
            <p className="text-textMuted">No tienes sesión activa.</p>
            <Link href="/login" className="button-primary mt-4 inline-flex">Ir a login</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="title-display text-3xl mb-6">Perfil</h1>

        <div className="glass p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border border-line bg-surface overflow-hidden">
              {profile.avatar_url ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${profile.avatar_url.replace(/'/g, '%27')}')` }}
                  aria-label="Avatar"
                  role="img"
                />
              ) : null}
            </div>
            <div>
              <p className="font-semibold">{profile.name || 'Coleccionista'}</p>
              <p className="text-sm text-textMuted">{profile.email}</p>
              <p className="text-xs text-textMuted mt-1">
                Rol: {profile.role} · Vendedor verificado: {profile.is_verified_seller ? 'sí' : 'no'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="button-secondary" onClick={() => supabaseClient?.auth.signOut()}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {(['profile', 'orders', 'tickets', 'sell'] as const).map((entry) => (
            <button
              key={entry}
              className={`chip ${tab === entry ? 'text-primary border-primary' : ''}`}
              onClick={() => setTab(entry)}
            >
              {entry === 'profile' ? 'Perfil' : entry === 'orders' ? 'Pedidos' : entry === 'tickets' ? 'Tickets' : 'Vender'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="glass p-6 grid gap-4 max-w-2xl">
            <h2 className="font-semibold">Editar perfil</h2>
            <label className="text-sm text-textMuted">Nombre visible</label>
            <input className="bg-transparent border border-line px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />

            <label className="text-sm text-textMuted">URL de foto de perfil</label>
            <input className="bg-transparent border border-line px-3 py-2" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />

            <label className="text-sm text-textMuted">Bio</label>
            <textarea className="bg-transparent border border-line px-3 py-2 min-h-[120px]" value={bio} onChange={(e) => setBio(e.target.value)} />

            <button className="button-primary" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}

        {tab === 'orders' && (
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
                    <p className="text-textMuted text-sm">Total: {(Number(order.total || 0) / 100).toFixed(2)} €</p>
                    {order.shipping_tracking_code ? (
                      <p className="text-xs text-primary mt-1">Tracking: {order.shipping_tracking_code}</p>
                    ) : null}
                    <button className="chip mt-3" onClick={() => createTicketFromOrder(order.id)}>
                      Abrir ticket sobre este pedido
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'tickets' && (
          <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
            <div className="glass p-4">
              <h2 className="font-semibold mb-3">Mis tickets ({tickets.length})</h2>

              <div className="space-y-2 max-h-[300px] overflow-auto pr-1 mb-4">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => openTicket(ticket.id)}
                    className={`w-full text-left border px-3 py-3 ${selectedTicketId === ticket.id ? 'border-primary' : 'border-line'}`}
                  >
                    <p className="font-semibold text-sm line-clamp-1">{ticket.subject}</p>
                    <p className="text-xs text-textMuted line-clamp-1">{ticket.last_message?.message || 'Sin mensajes'}</p>
                    <p className="text-xs text-primary mt-1">{ticket.status}</p>
                    {isConciergeTicket(ticket) ? (
                      <p className="text-[11px] text-primary mt-1">Canal verificado de encargo</p>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="border border-line p-3 space-y-2">
                <p className="font-semibold text-sm">Crear nuevo ticket</p>
                <input
                  className="w-full bg-transparent border border-line px-3 py-2"
                  placeholder="Asunto"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                />

                <select
                  className="w-full bg-transparent border border-line px-3 py-2"
                  value={newTicketOrderId}
                  onChange={(e) => setNewTicketOrderId(e.target.value)}
                >
                  <option value="">Sin pedido asociado</option>
                  {availableOrderIds.map((orderId) => (
                    <option key={orderId} value={orderId}>{orderId}</option>
                  ))}
                </select>

                <textarea
                  className="w-full bg-transparent border border-line px-3 py-2 min-h-[90px]"
                  placeholder="Cuéntanos qué necesitas"
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                />
                <button className="button-primary w-full" onClick={createTicket} disabled={sendingTicket}>
                  {sendingTicket ? 'Creando...' : 'Crear ticket'}
                </button>
              </div>
            </div>

            <div className="glass p-6">
              {!selectedTicket ? (
                <p className="text-textMuted">Selecciona un ticket para ver el chat.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold">{selectedTicket.subject}</p>
                      <p className="text-xs text-textMuted">Estado: {selectedTicket.status}</p>
                      {isConciergeTicket(selectedTicket) ? (
                        <p className="text-xs text-primary mt-1">Canal verificado comprador ↔ tienda</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border border-line p-3 max-h-[420px] overflow-auto space-y-3">
                    {ticketMessages.length === 0 ? (
                      <p className="text-textMuted text-sm">No hay mensajes aún.</p>
                    ) : (
                      ticketMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 border ${msg.is_admin ? 'border-primary/40 bg-primary/5' : 'border-line bg-surface'}`}
                        >
                          <p className="text-xs text-textMuted mb-1">
                            {msg.is_admin ? 'Soporte' : 'Tú'} · {new Date(msg.created_at).toLocaleString('es-ES')}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <textarea
                      className="w-full bg-transparent border border-line px-3 py-2 min-h-[90px]"
                      placeholder="Escribe tu mensaje..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                    />
                    <button className="button-primary" onClick={sendTicketReply}>Enviar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'sell' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass p-6">
              <h2 className="font-semibold">Marketplace comunidad</h2>
              <p className="text-sm text-textMuted mt-2">
                Publicación gratuita (0,00 €). Si se aprueba y se vende, la comisión para la tienda es del 10%.
              </p>
              {!profile.is_verified_seller && profile.role !== 'admin' ? (
                <p className="text-sm text-textMuted mt-2">
                  Tu cuenta aún no está verificada para publicar. Pide revisión desde soporte.
                </p>
              ) : (
                <>
                  <p className="text-sm text-textMuted mt-2">
                    Requisitos mínimos: 2 fotos, descripción completa y detalle de autenticidad.
                  </p>
                  <div className="grid gap-3 mt-4">
                    <input className="bg-transparent border border-line px-3 py-2" placeholder="Título" value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} />
                    <textarea className="bg-transparent border border-line px-3 py-2 min-h-[120px]" placeholder="Descripción" value={listingDescription} onChange={(e) => setListingDescription(e.target.value)} />
                    <input className="bg-transparent border border-line px-3 py-2" placeholder="Precio en € (ej. 49.99)" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <select className="bg-transparent border border-line px-3 py-2" value={listingCategory} onChange={(e) => setListingCategory(e.target.value)}>
                        <option value="juegos-gameboy">Juegos Game Boy</option>
                        <option value="juegos-gameboy-color">Juegos Game Boy Color</option>
                        <option value="juegos-gameboy-advance">Juegos Game Boy Advance</option>
                        <option value="juegos-super-nintendo">Juegos Super Nintendo</option>
                        <option value="juegos-gamecube">Juegos GameCube</option>
                        <option value="cajas-gameboy">Cajas Game Boy</option>
                        <option value="manuales">Manuales</option>
                        <option value="accesorios">Accesorios</option>
                        <option value="consolas-retro">Consolas Retro</option>
                      </select>

                      <select className="bg-transparent border border-line px-3 py-2" value={listingCondition} onChange={(e) => setListingCondition(e.target.value)}>
                        <option value="used">Usado</option>
                        <option value="new">Nuevo</option>
                        <option value="restored">Restaurado</option>
                      </select>
                    </div>

                    <select className="bg-transparent border border-line px-3 py-2" value={listingOriginality} onChange={(e) => setListingOriginality(e.target.value)}>
                      <option value="original_verificado">Original verificado</option>
                      <option value="original_sin_verificar">Original sin verificar</option>
                      <option value="repro_1_1">Repro 1:1</option>
                      <option value="mixto">Mixto (parte original + parte repro)</option>
                    </select>

                    <textarea
                      className="bg-transparent border border-line px-3 py-2 min-h-[90px]"
                      placeholder="Explica por qué es original/repro (sellos, placas, fotos macro, etc.)"
                      value={listingOriginalityNotes}
                      onChange={(e) => setListingOriginalityNotes(e.target.value)}
                    />

                    <textarea
                      className="bg-transparent border border-line px-3 py-2 min-h-[90px]"
                      placeholder="URLs de fotos (mínimo 2), una por línea"
                      value={listingImageText}
                      onChange={(e) => setListingImageText(e.target.value)}
                    />

                    <button className="button-primary" onClick={publishListing} disabled={publishingListing}>
                      {publishingListing ? 'Publicando...' : 'Enviar publicación'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="glass p-6">
              <h2 className="font-semibold mb-3">Mis publicaciones ({listings.length})</h2>
              <div className="space-y-3 max-h-[700px] overflow-auto pr-1">
                {listings.length === 0 ? (
                  <p className="text-textMuted text-sm">Aún no tienes publicaciones.</p>
                ) : (
                  listings.map((listing) => (
                    <div key={listing.id} className="border border-line p-4">
                      <p className="font-semibold">{listing.title}</p>
                      <p className="text-xs text-textMuted">{(listing.price / 100).toFixed(2)} € · {listing.status}</p>
                      <p className="text-xs text-textMuted mt-1">
                        Publicar: {((Number(listing.listing_fee_cents || 0)) / 100).toFixed(2)} € · Comisión:
                        {' '}{Number(listing.commission_rate || 10).toFixed(0)}% ({((Number(listing.commission_cents || 0)) / 100).toFixed(2)} €)
                      </p>
                      <p className="text-xs text-textMuted mt-1">Originalidad: {listing.originality_status}</p>
                      <p className="text-xs text-textMuted mt-1">Entrega: {listing.delivery_status || 'pending'}</p>
                      {listing.shipping_tracking_code ? (
                        <p className="text-xs text-primary mt-1">Tracking: {listing.shipping_tracking_code}</p>
                      ) : null}
                      <p className="text-sm text-textMuted mt-2 line-clamp-3">{listing.description}</p>
                      {listing.admin_notes ? (
                        <p className="text-xs text-primary mt-2">Nota admin: {listing.admin_notes}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
