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
  banner_url: string | null;
  bio: string | null;
  tagline: string | null;
  favorite_console: string | null;
  profile_theme: string | null;
  badges: string[];
  is_verified_seller: boolean;
};

type WalletTransaction = {
  id: string;
  amount_cents: number;
  direction: 'credit' | 'debit';
  status: 'pending' | 'available' | 'spent' | 'cancelled';
  kind: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
};

type WalletState = {
  account: {
    user_id: string;
    balance_cents: number;
    pending_cents: number;
    total_earned_cents: number;
    total_withdrawn_cents: number;
  };
  transactions: WalletTransaction[];
};

type WalletWithdrawalRequest = {
  id: string;
  user_id: string;
  amount_cents: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled' | string;
  payout_method: string;
  payout_details: Record<string, unknown>;
  note: string | null;
  admin_note: string | null;
  wallet_transaction_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type WalletWithdrawalsState = {
  available_cents: number;
  outstanding_withdrawals_cents: number;
  requestable_now_cents: number;
};

type Tab = 'profile' | 'wallet' | 'orders' | 'tickets' | 'sell';

const PROFILE_THEMES = [
  {
    id: 'neon-grid',
    label: 'Neon Grid',
    description: 'Azul eléctrico y rejilla arcade',
    previewClass: 'from-cyan-500/35 via-slate-950 to-blue-700/35',
    accentClass: 'border-cyan-300/50 bg-cyan-400/10 text-cyan-100',
  },
  {
    id: 'sunset-glow',
    label: 'Sunset Glow',
    description: 'Naranja cálido con brillo sunset',
    previewClass: 'from-orange-500/35 via-rose-950 to-amber-500/35',
    accentClass: 'border-orange-300/50 bg-orange-400/10 text-orange-100',
  },
  {
    id: 'arcade-purple',
    label: 'Arcade Purple',
    description: 'Estilo arcade nocturno púrpura',
    previewClass: 'from-fuchsia-500/35 via-violet-950 to-indigo-600/35',
    accentClass: 'border-fuchsia-300/50 bg-fuchsia-400/10 text-fuchsia-100',
  },
  {
    id: 'mint-wave',
    label: 'Mint Wave',
    description: 'Tono mint fresco para vitrina',
    previewClass: 'from-emerald-400/35 via-slate-950 to-teal-600/35',
    accentClass: 'border-emerald-300/50 bg-emerald-400/10 text-emerald-100',
  },
] as const;

const FAVORITE_CONSOLES = [
  'Game Boy',
  'Game Boy Color',
  'Game Boy Advance',
  'Super Nintendo',
  'Nintendo 64',
  'GameCube',
  'Nintendo DS',
  'PlayStation',
  'Sega Mega Drive',
  'Otra',
] as const;

const BADGE_LABELS: Record<string, string> = {
  founder: 'Fundador',
  collector: 'Coleccionista',
  trusted_buyer: 'Comprador fiable',
  trusted_seller: 'Vendedor verificado',
  mystery_champion: 'Campeón ruleta',
  premium_member: 'Miembro premium',
  retro_master: 'Retro Master',
  ambassador: 'Embajador',
};

function parseImageLines(input: string): string[] {
  const list = input
    .split(/\n|,|;/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(list)];
}

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number(cents || 0) / 100);
}

function isConciergeTicket(ticket: { subject?: string } | null | undefined): boolean {
  return String(ticket?.subject || '').toLowerCase().includes('encargo');
}

export default function ProfileView() {
  const autoOpenedTicketRef = useRef('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [deepLinkTab, setDeepLinkTab] = useState('');
  const [deepLinkTicketId, setDeepLinkTicketId] = useState('');
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [favoriteConsole, setFavoriteConsole] = useState('');
  const [profileTheme, setProfileTheme] = useState('neon-grid');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

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
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [withdrawalRequests, setWithdrawalRequests] = useState<WalletWithdrawalRequest[]>([]);
  const [withdrawalsState, setWithdrawalsState] = useState<WalletWithdrawalsState | null>(null);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState('');
  const [withdrawalAmountEuro, setWithdrawalAmountEuro] = useState('');
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const applyProfileSnapshot = (nextProfile: ProfileState | null) => {
    setProfile(nextProfile);
    setName(String(nextProfile?.name || ''));
    setAvatarUrl(String(nextProfile?.avatar_url || ''));
    setBannerUrl(String(nextProfile?.banner_url || ''));
    setBio(String(nextProfile?.bio || ''));
    setTagline(String(nextProfile?.tagline || ''));
    setFavoriteConsole(String(nextProfile?.favorite_console || ''));
    setProfileTheme(String(nextProfile?.profile_theme || 'neon-grid'));
  };

  const loadProfile = async () => {
    const res = await fetch('/api/auth/profile');
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo cargar tu perfil');
    }

    setUser(data?.user || null);
    const nextProfile = data?.user?.profile || null;
    applyProfileSnapshot(nextProfile);
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

  const loadWallet = async () => {
    setWalletLoading(true);
    setWalletError('');
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo cargar la cartera');
      }
      setWallet(data?.wallet || null);
    } catch (error: any) {
      setWallet(null);
      setWalletError(error?.message || 'No se pudo cargar la cartera');
    } finally {
      setWalletLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    setWithdrawalsLoading(true);
    setWithdrawalsError('');
    try {
      const res = await fetch('/api/wallet/withdrawals');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron cargar las retiradas');
      }
      setWithdrawalRequests(Array.isArray(data?.requests) ? data.requests : []);
      setWithdrawalsState(data?.wallet || null);
    } catch (error: any) {
      setWithdrawalRequests([]);
      setWithdrawalsState(null);
      setWithdrawalsError(error?.message || 'No se pudieron cargar las retiradas');
    } finally {
      setWithdrawalsLoading(false);
    }
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
      const [ticketsResult, listingsResult, walletResult, withdrawalsResult] = await Promise.allSettled([
        loadTickets(),
        loadListings(),
        loadWallet(),
        loadWithdrawals(),
      ]);

      if (ticketsResult.status === 'rejected') {
        setTickets([]);
      }
      if (listingsResult.status === 'rejected') {
        setListings([]);
      }
      if (walletResult.status === 'rejected') {
        setWallet(null);
      }
      if (withdrawalsResult.status === 'rejected') {
        setWithdrawalRequests([]);
        setWithdrawalsState(null);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  const createWithdrawalRequest = async () => {
    const amountEuro = Number(String(withdrawalAmountEuro || '').replace(',', '.'));
    const amountCents = Math.round(amountEuro * 100);

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error('Introduce un importe válido');
      return;
    }

    if (withdrawalsState && amountCents > Number(withdrawalsState.requestable_now_cents || 0)) {
      toast.error('El importe supera el saldo disponible para retirada');
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      const res = await fetch('/api/wallet/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: amountCents,
          payout_method: 'manual_transfer',
          note: withdrawalNote,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo crear la solicitud de retirada');
      }

      setWithdrawalAmountEuro('');
      setWithdrawalNote('');
      await Promise.all([loadWithdrawals(), loadWallet()]);
      toast.success('Solicitud de retirada enviada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear la retirada');
    } finally {
      setSubmittingWithdrawal(false);
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
          bio,
          tagline,
          favorite_console: favoriteConsole,
          profile_theme: profileTheme,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo guardar el perfil');
      }

      applyProfileSnapshot(data.profile || null);
      toast.success('Perfil actualizado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.set('avatar', file);

      const res = await fetch('/api/auth/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo subir la foto');
      }

      if (typeof data?.avatar_url === 'string') {
        setAvatarUrl(data.avatar_url);
      }
      if (data?.profile) {
        applyProfileSnapshot(data.profile);
      }

      toast.success('Foto de perfil actualizada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo subir la imagen');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadBanner = async (file: File) => {
    if (!file) return;

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.set('banner', file);

      const res = await fetch('/api/auth/profile/banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo subir la portada');
      }

      if (typeof data?.banner_url === 'string') {
        setBannerUrl(data.banner_url);
      }
      if (data?.profile) {
        applyProfileSnapshot(data.profile);
      }

      toast.success('Portada actualizada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo subir la portada');
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: '' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo eliminar la foto');
      }
      applyProfileSnapshot(data.profile || null);
      toast.success('Foto de perfil eliminada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar la foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeBanner = async () => {
    setUploadingBanner(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_url: '' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo eliminar la portada');
      }
      applyProfileSnapshot(data.profile || null);
      toast.success('Portada eliminada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar la portada');
    } finally {
      setUploadingBanner(false);
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

  const activeTheme = useMemo(
    () => PROFILE_THEMES.find((theme) => theme.id === profileTheme) || PROFILE_THEMES[0],
    [profileTheme]
  );

  const profileBadges = useMemo(() => {
    if (!profile?.badges || !Array.isArray(profile.badges)) return [];
    return profile.badges
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8);
  }, [profile?.badges]);

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

        <div className="glass mb-6 overflow-hidden">
          <div
            className={`relative h-44 sm:h-56 bg-gradient-to-r ${activeTheme.previewClass}`}
            style={
              bannerUrl
                ? {
                    backgroundImage: `linear-gradient(to right, rgba(2,6,23,0.82), rgba(2,6,23,0.45)), url('${bannerUrl.replace(/'/g, '%27')}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.32),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_20%,rgba(2,6,23,0.65)_100%)]" />
            <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
              <button
                className="chip"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
              >
                {uploadingBanner ? 'Subiendo banner...' : 'Subir imagen de banner'}
              </button>
              <button
                className="chip"
                onClick={() => removeBanner()}
                disabled={uploadingBanner || !bannerUrl}
              >
                Quitar portada
              </button>
              <button className="button-secondary" onClick={() => supabaseClient?.auth.signOut()}>
                Cerrar sesión
              </button>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/bmp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadBanner(file);
                e.currentTarget.value = '';
              }}
            />
          </div>

          <div className="p-6 pt-0">
            <div className="-mt-12 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="relative">
                  <button
                    type="button"
                    className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-white/40 bg-slate-900 shadow-[0_0_32px_rgba(34,211,238,.32)]"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {avatarUrl ? (
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${avatarUrl.replace(/'/g, '%27')}')` }}
                        aria-label="Avatar"
                        role="img"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
                        {(name || 'C').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[11px]">
                      {uploadingAvatar ? 'Subiendo...' : 'Cambiar'}
                    </span>
                  </button>
                  <button
                    className="chip absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px]"
                    onClick={() => removeAvatar()}
                    disabled={uploadingAvatar || !avatarUrl}
                  >
                    Quitar foto
                  </button>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/bmp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadAvatar(file);
                    e.currentTarget.value = '';
                  }}
                />

                <div className="pt-3 sm:pt-0">
                  <p className="text-2xl font-black">{name || profile.name || 'Coleccionista'}</p>
                  <p className="text-sm text-textMuted">{profile.email}</p>
                  <p className="text-xs text-textMuted mt-1">
                    Rol: {profile.role} · Vendedor verificado: {profile.is_verified_seller ? 'sí' : 'no'}
                  </p>
                  <p className="text-sm text-primary mt-2">{tagline || 'Tu vitrina de coleccionismo retro'}</p>
                  {favoriteConsole ? (
                    <span className={`mt-2 inline-flex items-center border px-2 py-1 text-xs ${activeTheme.accentClass}`}>
                      Consola favorita: {favoriteConsole}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm min-w-[260px]">
                <div className="border border-line px-3 py-2 bg-slate-950/35">
                  <p className="text-textMuted">Pedidos</p>
                  <p className="font-semibold">{orders.length}</p>
                </div>
                <div className="border border-line px-3 py-2 bg-slate-950/35">
                  <p className="text-textMuted">Tickets</p>
                  <p className="font-semibold">{tickets.length}</p>
                </div>
                <div className="border border-line px-3 py-2 bg-slate-950/35">
                  <p className="text-textMuted">Insignias</p>
                  <p className="font-semibold">{profileBadges.length}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {profileBadges.length > 0 ? (
                profileBadges.map((badge) => (
                  <span
                    key={badge}
                    className={`inline-flex items-center border px-2 py-1 text-xs ${activeTheme.accentClass}`}
                  >
                    {BADGE_LABELS[badge] || badge}
                  </span>
                ))
              ) : (
                <span className="text-xs text-textMuted">
                  Aún no tienes insignias. El admin puede asignártelas.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {(['profile', 'wallet', 'orders', 'tickets', 'sell'] as const).map((entry) => (
            <button
              key={entry}
              className={`chip ${tab === entry ? 'text-primary border-primary' : ''}`}
              onClick={() => setTab(entry)}
            >
              {entry === 'profile'
                ? 'Perfil'
                : entry === 'wallet'
                  ? 'Cartera'
                  : entry === 'orders'
                    ? 'Pedidos'
                    : entry === 'tickets'
                      ? 'Tickets'
                      : 'Vender'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="grid gap-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="glass p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Identidad del perfil</p>
                  <h2 className="text-2xl font-black mt-1">Personalización pública</h2>
                  <p className="text-sm text-textMuted mt-1">
                    Configura tu portada, estilo visual y cómo te ven otros coleccionistas.
                  </p>
                </div>

                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm text-textMuted">Nombre visible</span>
                    <input
                      className="bg-transparent border border-line px-3 py-2"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre de coleccionista"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-textMuted">Frase de perfil</span>
                    <input
                      className="bg-transparent border border-line px-3 py-2"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Ej: Cazador de ediciones completas PAL"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-textMuted">Consola favorita</span>
                    <input
                      className="bg-transparent border border-line px-3 py-2"
                      value={favoriteConsole}
                      onChange={(e) => setFavoriteConsole(e.target.value)}
                      placeholder="Ej: Game Boy Color"
                      list="favorite-consoles-list"
                    />
                    <datalist id="favorite-consoles-list">
                      {FAVORITE_CONSOLES.map((consoleName) => (
                        <option key={consoleName} value={consoleName} />
                      ))}
                    </datalist>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-textMuted">Bio</span>
                    <textarea
                      className="bg-transparent border border-line px-3 py-2 min-h-[130px]"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuenta tu historia como coleccionista, restaurador o vendedor."
                    />
                  </label>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    className="button-secondary w-full"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Subiendo avatar...' : 'Subir imagen de perfil'}
                  </button>
                  <button
                    className="button-secondary w-full"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                  >
                    {uploadingBanner ? 'Subiendo banner...' : 'Subir imagen de banner'}
                  </button>
                </div>
                <p className="text-xs text-textMuted">
                  Formatos admitidos: JPG, PNG, WEBP, GIF, AVIF o HEIC. Avatar hasta 10 MB, banner hasta 15 MB.
                </p>
              </div>

              <div className="glass p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Tema de perfil</p>
                  <h3 className="text-xl font-semibold mt-1">Estilo visual</h3>
                </div>

                <div className="grid gap-3">
                  {PROFILE_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`w-full border p-3 text-left transition ${
                        profileTheme === theme.id
                          ? 'border-primary bg-primary/10'
                          : 'border-line bg-slate-950/30 hover:border-primary/40'
                      }`}
                      onClick={() => setProfileTheme(theme.id)}
                    >
                      <div className={`h-10 bg-gradient-to-r ${theme.previewClass} border border-line`} />
                      <p className="mt-2 font-semibold">{theme.label}</p>
                      <p className="text-xs text-textMuted">{theme.description}</p>
                    </button>
                  ))}
                </div>

                <div className="border border-line p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Vista previa</p>
                  <div
                    className={`mt-2 min-h-[130px] rounded-xl border border-line bg-gradient-to-r p-4 ${activeTheme.previewClass}`}
                  >
                    <p className="text-lg font-black">{name || 'Tu nombre'}</p>
                    <p className="text-xs opacity-80 mt-1">
                      {tagline || 'Tu vitrina de coleccionismo retro'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(profileBadges.length > 0 ? profileBadges : ['collector']).slice(0, 3).map((badge) => (
                        <span key={`preview-${badge}`} className={`inline-flex border px-2 py-1 text-[11px] ${activeTheme.accentClass}`}>
                          {BADGE_LABELS[badge] || badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-line p-4">
                  <p className="font-semibold">Insignias del perfil</p>
                  {profileBadges.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profileBadges.map((badge) => (
                        <span key={`badge-${badge}`} className={`inline-flex border px-2 py-1 text-xs ${activeTheme.accentClass}`}>
                          {BADGE_LABELS[badge] || badge}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textMuted mt-2">
                      Aún no tienes insignias. Un admin puede asignarlas desde el panel.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Guardar cambios del perfil</p>
                <p className="text-xs text-textMuted">
                  Se actualizan nombre, bio, frase, consola favorita y tema visual.
                </p>
              </div>
              <button
                className="button-primary min-w-[190px]"
                onClick={saveProfile}
                disabled={savingProfile || uploadingAvatar || uploadingBanner}
              >
                {savingProfile ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </div>
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

        {tab === 'wallet' && (
          <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="glass p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">Cartera interna (MVP)</p>
                  <h2 className="text-2xl font-black mt-1">Saldo y comisiones</h2>
                </div>
                <button
                  className="chip"
                  onClick={() => {
                    void Promise.all([loadWallet(), loadWithdrawals()]);
                  }}
                  disabled={walletLoading || withdrawalsLoading}
                >
                  {walletLoading || withdrawalsLoading ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>

              <p className="text-sm text-textMuted mt-2">
                MVP inicial: saldo interno para comisiones/abonos y solicitudes de retirada con revisión manual.
              </p>

              {walletError ? (
                <div className="mt-4 border border-line p-4 text-sm text-textMuted">
                  <p className="text-red-400">{walletError}</p>
                  <p className="mt-2">
                    Si aparece por primera vez, ejecuta en Supabase: <span className="text-primary">database/internal_wallet_mvp.sql</span>
                  </p>
                </div>
              ) : null}

              {withdrawalsError ? (
                <div className="mt-4 border border-line p-4 text-sm text-textMuted">
                  <p className="text-red-400">{withdrawalsError}</p>
                  <p className="mt-2">
                    Si es la primera vez, ejecuta en Supabase: <span className="text-primary">database/wallet_withdrawal_requests_mvp.sql</span>
                  </p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-line p-4 bg-slate-950/35">
                  <p className="text-xs text-textMuted">Saldo disponible</p>
                  <p className="text-2xl font-black text-primary">
                    {toEuro(wallet?.account?.balance_cents || 0)}
                  </p>
                </div>
                <div className="border border-line p-4 bg-slate-950/35">
                  <p className="text-xs text-textMuted">Saldo pendiente</p>
                  <p className="text-2xl font-black">
                    {toEuro(wallet?.account?.pending_cents || 0)}
                  </p>
                </div>
                <div className="border border-line p-4 bg-slate-950/35">
                  <p className="text-xs text-textMuted">Total ganado</p>
                  <p className="text-lg font-semibold">
                    {toEuro(wallet?.account?.total_earned_cents || 0)}
                  </p>
                </div>
                <div className="border border-line p-4 bg-slate-950/35">
                  <p className="text-xs text-textMuted">Total retirado</p>
                  <p className="text-lg font-semibold">
                    {toEuro(wallet?.account?.total_withdrawn_cents || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 border border-line p-4 text-sm text-textMuted">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-textMuted">Disponible para solicitar</p>
                    <p className="text-lg font-semibold text-primary">
                      {toEuro(withdrawalsState?.requestable_now_cents || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Retiradas pendientes/aprobadas</p>
                    <p className="text-lg font-semibold">
                      {toEuro(withdrawalsState?.outstanding_withdrawals_cents || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Solicitudes</p>
                    <p className="text-lg font-semibold">{withdrawalRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border border-line p-4 text-sm text-textMuted">
                <p className="font-semibold text-text">Solicitar retirada (revisión manual)</p>
                <p className="mt-1">
                  De momento las retiradas son manuales: tú solicitas, administración revisa y marca el pago.
                </p>
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
                    <input
                      className="w-full bg-transparent border border-line px-3 py-2"
                      inputMode="decimal"
                      placeholder="Importe (ej. 15.50)"
                      value={withdrawalAmountEuro}
                      onChange={(e) => setWithdrawalAmountEuro(e.target.value)}
                    />
                    <button
                      className="button-primary"
                      onClick={createWithdrawalRequest}
                      disabled={submittingWithdrawal || withdrawalsLoading}
                    >
                      {submittingWithdrawal ? 'Enviando...' : 'Solicitar retirada'}
                    </button>
                  </div>
                  <textarea
                    className="w-full bg-transparent border border-line px-3 py-2 min-h-[84px]"
                    placeholder="Nota opcional (método preferido, referencia, observaciones)"
                    value={withdrawalNote}
                    onChange={(e) => setWithdrawalNote(e.target.value)}
                  />
                  <p className="text-xs">
                    Máximo disponible ahora: <span className="text-primary">{toEuro(withdrawalsState?.requestable_now_cents || 0)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 border border-line p-4 text-sm text-textMuted">
                <p className="font-semibold text-text">Qué incluye este MVP</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Abonos internos de comisiones/ventas</li>
                  <li>Historial de movimientos</li>
                  <li>Solicitudes de retirada con revisión manual en admin</li>
                  <li>Base lista para antifraude y automatización posterior</li>
                </ul>
              </div>
            </div>

            <div className="glass p-6">
              <div className="mb-5">
                <h3 className="font-semibold">Solicitudes de retirada</h3>
                <div className="mt-3 space-y-3 max-h-[250px] overflow-auto pr-1">
                  {withdrawalRequests.length === 0 ? (
                    <p className="text-sm text-textMuted">
                      Aún no has creado solicitudes de retirada.
                    </p>
                  ) : (
                    withdrawalRequests.map((request) => (
                      <div key={request.id} className="border border-line p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{toEuro(request.amount_cents)}</p>
                            <p className="text-xs text-textMuted mt-1">
                              Estado: {request.status} · Método: {request.payout_method}
                            </p>
                          </div>
                          <p className="text-xs text-textMuted">
                            {request.created_at ? new Date(request.created_at).toLocaleString('es-ES') : '-'}
                          </p>
                        </div>
                        {request.note ? <p className="text-xs text-textMuted mt-2">Tu nota: {request.note}</p> : null}
                        {request.admin_note ? (
                          <p className="text-xs text-primary mt-2">Admin: {request.admin_note}</p>
                        ) : null}
                        {request.paid_at ? (
                          <p className="text-xs text-primary mt-2">
                            Pagada: {new Date(request.paid_at).toLocaleString('es-ES')}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <h3 className="font-semibold mb-3">Movimientos recientes</h3>
              {!wallet && !walletLoading ? (
                <p className="text-sm text-textMuted">Sin datos de cartera todavía.</p>
              ) : null}
              <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                {(wallet?.transactions || []).length === 0 ? (
                  <p className="text-sm text-textMuted">
                    Aún no tienes movimientos. Cuando se te abone una comisión aparecerá aquí.
                  </p>
                ) : (
                  (wallet?.transactions || []).map((tx) => {
                    const sign = tx.direction === 'debit' ? '-' : '+';
                    const amountClass = tx.direction === 'debit' ? 'text-red-400' : 'text-primary';
                    return (
                      <div key={tx.id} className="border border-line p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{tx.description || 'Movimiento de cartera'}</p>
                            <p className="text-xs text-textMuted mt-1">
                              {tx.kind} · {tx.status}
                              {tx.reference_type && tx.reference_id
                                ? ` · ${tx.reference_type}:${tx.reference_id.slice(0, 8)}`
                                : ''}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold ${amountClass}`}>
                            {sign}{toEuro(tx.amount_cents)}
                          </p>
                        </div>
                        <p className="text-xs text-textMuted mt-2">
                          {new Date(tx.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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
