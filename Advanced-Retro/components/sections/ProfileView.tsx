'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { AVATAR_FRAMES } from '@/lib/gamification';
import SafeImage from '@/components/SafeImage';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
import { getProductHref } from '@/lib/productUrl';
import {
  BADGE_DEFINITIONS,
  BADGE_RARITY_LABELS,
  BADGE_RARITY_ORDER,
  BADGE_RARITY_STYLES,
  getBadgeDefinition,
  getBadgeIconPng,
} from '@/lib/gamificationBadges';

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
  favorites_visibility: FavoritesVisibility;
  badges: string[];
  shipping_address: {
    full_name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
  } | null;
  is_verified_seller: boolean;
};

type GamificationReward = {
  reward_key: string;
  reward_label: string;
  reward_type: string;
  level_required: number;
  metadata?: Record<string, unknown> | null;
  unlocked_at: string;
};

type GamificationRecentItem = {
  type: 'xp' | 'reward';
  title: string;
  subtitle: string;
  xp_delta?: number;
  created_at: string;
};

type GamificationState = {
  xp_total: number;
  level: number;
  progress: {
    xpTotal: number;
    level: number;
    nextLevel: number;
    currentLevelXp: number;
    nextLevelXp: number;
    xpToNextLevel: number;
    progressInsideLevel: number;
    progressPercent: number;
  };
  frame: {
    id: string;
    label: string;
    ringClassName: string;
    badgeClassName: string;
  };
  streak: {
    current: number;
    longest: number;
    last_login_on: string | null;
  };
  rewards: GamificationReward[];
  recent: GamificationRecentItem[];
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
type FavoritesVisibility = 'public' | 'members' | 'private';
type GamificationTab = 'resumen' | 'marcos' | 'recompensas' | 'insignias' | 'actividad';

type FavoriteProduct = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  images: string[];
  stock: number;
  category: string | null;
  platform: string | null;
  liked_at: string | null;
};

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
  {
    id: 'obsidian-ember',
    label: 'Obsidian Ember',
    description: 'Carbón oscuro con acentos ámbar',
    previewClass: 'from-amber-500/30 via-zinc-950 to-orange-700/35',
    accentClass: 'border-amber-300/55 bg-amber-500/12 text-amber-100',
  },
  {
    id: 'aurora-scanline',
    label: 'Aurora Scanline',
    description: 'Neón frío con contraste arcade',
    previewClass: 'from-sky-400/35 via-indigo-950 to-cyan-500/35',
    accentClass: 'border-sky-300/55 bg-sky-500/12 text-sky-100',
  },
  {
    id: 'platinum-grid',
    label: 'Platinum Grid',
    description: 'Acabado limpio premium en plata',
    previewClass: 'from-slate-200/35 via-slate-900 to-slate-500/30',
    accentClass: 'border-slate-300/60 bg-slate-200/10 text-slate-100',
  },
] as const;

const BANNER_PRESETS = [
  {
    id: 'none',
    label: 'Sin portada personalizada',
    url: '',
    description: 'Solo gradiente del tema actual.',
  },
  {
    id: 'neon-grid',
    label: 'Banner Neon Grid',
    url: '/images/profile-banners/neon-grid.svg',
    description: 'Rejilla retro azul para perfil de coleccionista.',
  },
  {
    id: 'sunset-glow',
    label: 'Banner Sunset Glow',
    url: '/images/profile-banners/sunset-glow.svg',
    description: 'Tono cálido para destacar tu cabecera.',
  },
  {
    id: 'arcade-purple',
    label: 'Banner Arcade Purple',
    url: '/images/profile-banners/arcade-purple.svg',
    description: 'Estilo arcade nocturno en púrpura.',
  },
  {
    id: 'mint-wave',
    label: 'Banner Mint Wave',
    url: '/images/profile-banners/mint-wave.svg',
    description: 'Look mint limpio y moderno.',
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

const RETRO_RANKS: Array<{ min: number; max: number | null; label: string }> = [
  { min: 1, max: 4, label: 'Novato del Cartucho' },
  { min: 5, max: 9, label: 'Explorador de 8 Bits' },
  { min: 10, max: 19, label: 'Coleccionista Pixel' },
  { min: 20, max: 29, label: 'Veterano Arcade' },
  { min: 30, max: 39, label: 'Maestro del CRT' },
  { min: 40, max: 49, label: 'Leyenda del Bit' },
  { min: 50, max: null, label: 'Titan Retro' },
];

function getRetroRankLabel(levelInput: number): string {
  const level = Math.max(1, Math.floor(Number(levelInput || 1)));
  const found = RETRO_RANKS.find((entry) => {
    const aboveMin = level >= entry.min;
    const belowMax = entry.max == null ? true : level <= entry.max;
    return aboveMin && belowMax;
  });
  return found?.label || 'Coleccionista Retro';
}

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

function normalizeIbanInput(value: string): string {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function formatIbanForInput(value: string): string {
  const normalized = normalizeIbanInput(value);
  return normalized.replace(/(.{4})/g, '$1 ').trim();
}

function isValidIban(value: string): boolean {
  const iban = normalizeIbanInput(value);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const moved = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const expanded = moved.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of expanded) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

function isConciergeTicket(ticket: { subject?: string } | null | undefined): boolean {
  return String(ticket?.subject || '').toLowerCase().includes('encargo');
}

export default function ProfileView() {
  const autoOpenedTicketRef = useRef('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const gamificationPanelRef = useRef<HTMLDivElement | null>(null);
  const [deepLinkTab, setDeepLinkTab] = useState('');
  const [deepLinkTicketId, setDeepLinkTicketId] = useState('');
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [favoriteConsole, setFavoriteConsole] = useState('');
  const [profileTheme, setProfileTheme] = useState('neon-grid');
  const [favoritesVisibility, setFavoritesVisibility] = useState<FavoritesVisibility>('public');
  const [shippingFullName, setShippingFullName] = useState('');
  const [shippingLine1, setShippingLine1] = useState('');
  const [shippingLine2, setShippingLine2] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('España');
  const [shippingPhone, setShippingPhone] = useState('');
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
  const [withdrawalAccountHolder, setWithdrawalAccountHolder] = useState('');
  const [withdrawalIban, setWithdrawalIban] = useState('');
  const [withdrawalBankName, setWithdrawalBankName] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [gamificationTab, setGamificationTab] = useState<GamificationTab>('resumen');

  const openGamificationTab = (nextTab: GamificationTab) => {
    setTab('profile');
    setGamificationTab(nextTab);
    setTimeout(() => {
      gamificationPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const applyProfileSnapshot = (nextProfile: ProfileState | null) => {
    setProfile(nextProfile);
    setName(String(nextProfile?.name || ''));
    setAvatarUrl(String(nextProfile?.avatar_url || ''));
    setBannerUrl(String(nextProfile?.banner_url || ''));
    setBio(String(nextProfile?.bio || ''));
    setTagline(String(nextProfile?.tagline || ''));
    setFavoriteConsole(String(nextProfile?.favorite_console || ''));
    setProfileTheme(String(nextProfile?.profile_theme || 'neon-grid'));
    setFavoritesVisibility(
      nextProfile?.favorites_visibility === 'private'
        ? 'private'
        : nextProfile?.favorites_visibility === 'members'
          ? 'members'
          : 'public'
    );
    setShippingFullName(
      String(nextProfile?.shipping_address?.full_name || nextProfile?.name || shippingFullName || '')
    );
    setShippingLine1(String(nextProfile?.shipping_address?.line1 || shippingLine1 || ''));
    setShippingLine2(String(nextProfile?.shipping_address?.line2 || shippingLine2 || ''));
    setShippingCity(String(nextProfile?.shipping_address?.city || shippingCity || ''));
    setShippingState(String(nextProfile?.shipping_address?.state || shippingState || ''));
    setShippingPostalCode(String(nextProfile?.shipping_address?.postal_code || shippingPostalCode || ''));
    setShippingCountry(String(nextProfile?.shipping_address?.country || shippingCountry || 'España'));
    setShippingPhone(String(nextProfile?.shipping_address?.phone || shippingPhone || ''));
  };

  const loadFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const res = await fetch('/api/profile/favorites');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron cargar tus favoritos');
      }

      const favorites = data?.favorites || {};
      const nextVisibility =
        favorites?.visibility === 'private'
          ? 'private'
          : favorites?.visibility === 'members'
            ? 'members'
            : 'public';
      setFavoritesVisibility(nextVisibility);

      const list = Array.isArray(favorites?.items) ? favorites.items : [];
      setFavoriteProducts(
        list.map((item: any) => ({
          id: String(item?.id || ''),
          name: String(item?.name || 'Producto'),
          price: Number(item?.price || 0),
          image: typeof item?.image === 'string' ? item.image : null,
          images: Array.isArray(item?.images)
            ? item.images.map((entry: unknown) => String(entry || '')).filter(Boolean)
            : [],
          stock: Number(item?.stock || 0),
          category: typeof item?.category === 'string' ? item.category : null,
          platform: typeof item?.platform === 'string' ? item.platform : null,
          liked_at: typeof item?.liked_at === 'string' ? item.liked_at : null,
        }))
      );
    } catch {
      setFavoriteProducts([]);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const loadProfile = async (): Promise<string> => {
    const res = await fetch('/api/auth/profile');
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo cargar tu perfil');
    }

    setUser(data?.user || null);
    const nextProfile = data?.user?.profile || null;
    applyProfileSnapshot(nextProfile);
    if (data?.gamification) {
      setGamification(data.gamification);
    }

    return String(data?.user?.id || '');
  };

  const loadGamification = async () => {
    const res = await fetch('/api/profile/gamification');
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo cargar gamificación');
    }
    setGamification(data?.gamification || null);
  };

  const loadOrders = async (userId: string) => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .in('status', ['processing', 'paid', 'shipped', 'delivered', 'cancelled'])
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

      const lastPayout =
        data?.last_payout_details && typeof data.last_payout_details === 'object' && !Array.isArray(data.last_payout_details)
          ? data.last_payout_details
          : null;

      if (lastPayout) {
        setWithdrawalAccountHolder((prev) =>
          prev.trim() ? prev : String((lastPayout as any).account_holder || '')
        );
        setWithdrawalIban((prev) =>
          prev.trim() ? prev : formatIbanForInput(String((lastPayout as any).iban || ''))
        );
        setWithdrawalBankName((prev) =>
          prev.trim() ? prev : String((lastPayout as any).bank_name || '')
        );
      }
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
      const authUserId = await loadProfile();
      setLoading(false);

      // El resto de datos no bloquea la pantalla principal de perfil.
      void (async () => {
        const tasks: Promise<unknown>[] = [
          loadTickets(),
          loadListings(),
          loadWallet(),
          loadWithdrawals(),
          loadGamification(),
          loadFavorites(),
        ];

        if (authUserId) {
          tasks.push(loadOrders(authUserId));
        }

        const results = await Promise.allSettled(tasks);
        const [
          ticketsResult,
          listingsResult,
          walletResult,
          withdrawalsResult,
          gamificationResult,
          favoritesResult,
          ordersResult,
        ] = results;

        if (ticketsResult?.status === 'rejected') {
          setTickets([]);
        }
        if (listingsResult?.status === 'rejected') {
          setListings([]);
        }
        if (walletResult?.status === 'rejected') {
          setWallet(null);
        }
        if (withdrawalsResult?.status === 'rejected') {
          setWithdrawalRequests([]);
          setWithdrawalsState(null);
        }
        if (gamificationResult?.status === 'rejected') {
          setGamification(null);
        }
        if (favoritesResult?.status === 'rejected') {
          setFavoriteProducts([]);
        }
        if (ordersResult?.status === 'rejected') {
          setOrders([]);
        }
      })();
    } catch (error: any) {
      toast.error(error?.message || 'Error cargando perfil');
      setLoading(false);
    }
  };

  const createWithdrawalRequest = async () => {
    const amountEuro = Number(String(withdrawalAmountEuro || '').replace(',', '.'));
    const amountCents = Math.round(amountEuro * 100);
    const accountHolder = withdrawalAccountHolder.trim().replace(/\s+/g, ' ');
    const ibanNormalized = normalizeIbanInput(withdrawalIban);
    const bankName = withdrawalBankName.trim().replace(/\s+/g, ' ');

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error('Introduce un importe válido');
      return;
    }

    if (accountHolder.length < 4) {
      toast.error('Indica el titular de la cuenta');
      return;
    }

    if (!isValidIban(ibanNormalized)) {
      toast.error('IBAN no válido');
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
          payout_method: 'bank_transfer',
          payout_details: {
            account_holder: accountHolder,
            iban: ibanNormalized,
            bank_name: bankName || undefined,
            country: 'ES',
          },
          note: withdrawalNote,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo crear la solicitud de retirada');
      }

      setWithdrawalAmountEuro('');
      setWithdrawalNote('');
      // Mantenemos los datos bancarios para futuras retiradas (UX).
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
          banner_url: bannerUrl,
          bio,
          tagline,
          favorite_console: favoriteConsole,
          profile_theme: profileTheme,
          shipping_address: {
            full_name: shippingFullName,
            line1: shippingLine1,
            line2: shippingLine2,
            city: shippingCity,
            state: shippingState,
            postal_code: shippingPostalCode,
            country: shippingCountry,
            phone: shippingPhone,
          },
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo guardar el perfil');
      }

      applyProfileSnapshot(data.profile || null);
      if (data?.gamification) {
        setGamification(data.gamification);
      }

      const visibilityRes = await fetch('/api/profile/favorites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favorites_visibility: favoritesVisibility,
        }),
      });
      const visibilityData = await visibilityRes.json().catch(() => null);
      if (!visibilityRes.ok) {
        throw new Error(visibilityData?.error || 'No se pudo guardar la privacidad de favoritos');
      }
      setFavoritesVisibility(
        visibilityData?.favorites_visibility === 'private'
          ? 'private'
          : visibilityData?.favorites_visibility === 'members'
            ? 'members'
            : 'public'
      );

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
    if (imageList.length < 3) {
      toast.error('Debes añadir mínimo 3 imágenes');
      return;
    }
    if (imageList.length > 10) {
      toast.error('Máximo 10 imágenes por anuncio');
      return;
    }

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

  const userLevel = Math.max(1, Number(gamification?.level || 1));
  const avatarFrameRingClass = String(gamification?.frame?.ringClassName || 'border-white/40');
  const avatarFrameBadgeClass = String(gamification?.frame?.badgeClassName || 'border-white/30 text-white/90');
  const levelProgressPercent = Math.max(
    0,
    Math.min(100, Number(gamification?.progress?.progressPercent || 0))
  );
  const currentRetroRank = getRetroRankLabel(userLevel);
  const nextRetroRank = getRetroRankLabel(Number(gamification?.progress?.nextLevel || userLevel + 1));

  const profileBadges = useMemo(() => {
    if (!profile?.badges || !Array.isArray(profile.badges)) return [];
    return profile.badges
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 160);
  }, [profile?.badges]);

  const selectedBannerPresetId = useMemo(() => {
    const normalizedBanner = String(bannerUrl || '').trim();
    const matchedPreset = BANNER_PRESETS.find((preset) => preset.url === normalizedBanner);
    if (matchedPreset) return matchedPreset.id;
    if (!normalizedBanner) return 'none';
    return 'custom-upload';
  }, [bannerUrl]);

  const profileBadgesDetailed = useMemo(() => {
    const normalized = profileBadges
      .map((badgeKey) => {
        const definition = getBadgeDefinition(badgeKey);
        if (!definition) {
          return {
            key: badgeKey,
            label: badgeKey,
            description: 'Insignia personalizada',
            howToEarn: 'Asignada manualmente por el equipo.',
            rarity: 'common' as const,
            animated: false,
            iconPng: getBadgeIconPng(badgeKey),
          };
        }
        return {
          key: definition.key,
          label: definition.label,
          description: definition.description,
          howToEarn: definition.howToEarn,
          rarity: definition.rarity,
          animated: Boolean(definition.animated),
          iconPng: definition.iconPng || getBadgeIconPng(definition.key),
        };
      })
      .sort((a, b) => {
        const rarityDiff =
          Number(BADGE_RARITY_ORDER[b.rarity]) - Number(BADGE_RARITY_ORDER[a.rarity]);
        if (rarityDiff !== 0) return rarityDiff;
        return a.label.localeCompare(b.label, 'es');
      });

    return normalized;
  }, [profileBadges]);

  const unlockedBadgeKeySet = useMemo(() => {
    return new Set(profileBadgesDetailed.map((badge) => badge.key));
  }, [profileBadgesDetailed]);

  const lockedBadgesDetailed = useMemo(() => {
    return BADGE_DEFINITIONS.filter((badge) => !unlockedBadgeKeySet.has(badge.key))
      .sort((a, b) => {
        const rarityDiff =
          Number(BADGE_RARITY_ORDER[b.rarity]) - Number(BADGE_RARITY_ORDER[a.rarity]);
        if (rarityDiff !== 0) return rarityDiff;
        return a.label.localeCompare(b.label, 'es');
      })
      .slice(0, 40);
  }, [unlockedBadgeKeySet]);

  const frameRoadmap = useMemo(() => {
    return AVATAR_FRAMES.map((frame) => {
      const maxLabel = frame.maxLevel == null ? '+' : `${frame.maxLevel}`;
      const range = `${frame.minLevel}-${maxLabel}`;
      const unlocked = userLevel >= frame.minLevel;
      const active =
        userLevel >= frame.minLevel &&
        (frame.maxLevel == null || userLevel <= frame.maxLevel);
      return {
        ...frame,
        range,
        unlocked,
        active,
      };
    });
  }, [userLevel]);

  const formatRecentDate = (raw: string) => {
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        <h1 className="title-display text-3xl mb-5 sm:mb-6">Perfil</h1>

        <div className="glass mb-5 sm:mb-6 overflow-hidden">
          <div
            className={`relative h-40 sm:h-52 bg-gradient-to-r ${activeTheme.previewClass}`}
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
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
              <div className="min-w-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className={`relative h-24 w-24 overflow-hidden rounded-2xl border-2 bg-slate-900 ${avatarFrameRingClass} shrink-0`}
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
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl sm:text-2xl font-black break-words">{name || profile.name || 'Coleccionista'}</p>
                      <span className={`inline-flex items-center border px-2 py-1 text-xs ${avatarFrameBadgeClass}`}>
                        {currentRetroRank}
                      </span>
                    </div>
                    <p className="text-sm text-textMuted break-all">{profile.email}</p>
                    <p className="text-xs text-textMuted mt-1">
                      Rol: {profile.role} · Vendedor verificado: {profile.is_verified_seller ? 'sí' : 'no'}
                    </p>
                    <p className="text-sm text-primary mt-2">{tagline || 'Tu vitrina de coleccionismo retro'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="chip" onClick={() => openGamificationTab('insignias')}>
                    Insignias ({profileBadges.length})
                  </button>
                  <button className="chip" onClick={() => openGamificationTab('recompensas')}>
                    Recompensas
                  </button>
                  <button className="chip" onClick={() => openGamificationTab('marcos')}>
                    Marcos
                  </button>
                  {favoriteConsole ? (
                    <span className={`inline-flex items-center border px-2 py-1 text-xs ${activeTheme.accentClass}`}>
                      Consola favorita: {favoriteConsole}
                    </span>
                  ) : null}
                </div>

                <details className="mt-4 rounded-xl border border-line bg-slate-950/35 p-3">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Personalizar cabecera (avatar/banner)
                  </summary>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      className="button-secondary w-full"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? 'Subiendo avatar...' : 'Subir avatar'}
                    </button>
                    <button
                      className="button-secondary w-full"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingBanner}
                    >
                      {uploadingBanner ? 'Subiendo portada...' : 'Subir portada'}
                    </button>
                    <button className="chip w-full" onClick={() => removeAvatar()} disabled={uploadingAvatar || !avatarUrl}>
                      Quitar avatar
                    </button>
                    <button className="chip w-full" onClick={() => removeBanner()} disabled={uploadingBanner || !bannerUrl}>
                      Quitar portada
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-textMuted">
                    JPG, PNG, WEBP, GIF, AVIF o HEIC. Avatar hasta 10 MB, portada hasta 15 MB.
                  </p>
                </details>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs sm:text-sm self-start">
                <div className="rounded-xl border border-line px-3 py-3 bg-slate-950/35">
                  <p className="text-textMuted">Rango</p>
                  <p className="font-semibold">{userLevel}</p>
                </div>
                <div className="rounded-xl border border-line px-3 py-3 bg-slate-950/35">
                  <p className="text-textMuted">Pedidos</p>
                  <p className="font-semibold">{orders.length}</p>
                </div>
                <div className="rounded-xl border border-line px-3 py-3 bg-slate-950/35">
                  <p className="text-textMuted">Tickets</p>
                  <p className="font-semibold">{tickets.length}</p>
                </div>
                <div className="rounded-xl border border-line px-3 py-3 bg-slate-950/35">
                  <p className="text-textMuted">Insignias</p>
                  <p className="font-semibold">{profileBadges.length}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              <button className="chip justify-center" onClick={() => setTab('profile')}>
                Editar perfil
              </button>
              <button className="button-secondary justify-center" onClick={() => supabaseClient?.auth.signOut()}>
                Cerrar sesión
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
        </div>

        <div className="mobile-scroll-row no-scrollbar mb-6">
          {(['profile', 'wallet', 'orders', 'tickets', 'sell'] as const).map((entry) => (
            <button
              key={entry}
              className={`chip shrink-0 ${tab === entry ? 'text-primary border-primary' : ''}`}
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
            <div ref={gamificationPanelRef} className="glass p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">Progreso Advanced Retro</p>
                  <h2 className="text-2xl font-black mt-1">Rango de Coleccionista Retro</h2>
                  <p className="text-sm text-textMuted mt-1">
                    Sube de rango con compras, actividad en comunidad y constancia diaria.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                  <div className="border border-line rounded-xl px-3 py-2 bg-slate-950/40">
                    <p className="text-xs text-textMuted">XP total</p>
                    <p className="font-semibold text-primary">{Number(gamification?.xp_total || 0)}</p>
                  </div>
                  <div className="border border-line rounded-xl px-3 py-2 bg-slate-950/40">
                    <p className="text-xs text-textMuted">Racha actual</p>
                    <p className="font-semibold">{Number(gamification?.streak?.current || 0)} días</p>
                  </div>
                  <div className="border border-line rounded-xl px-3 py-2 bg-slate-950/40">
                    <p className="text-xs text-textMuted">Siguiente rango</p>
                    <p className="font-semibold">
                      Rango {Number(gamification?.progress?.nextLevel || userLevel + 1)} · {nextRetroRank}
                    </p>
                  </div>
                  <div className="border border-line rounded-xl px-3 py-2 bg-slate-950/40">
                    <p className="text-xs text-textMuted">XP para ascender</p>
                    <p className="font-semibold">{Number(gamification?.progress?.xpToNextLevel || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-textMuted">
                  <span>
                    Rango {userLevel} · {currentRetroRank} · Marco: {gamification?.frame?.label || 'Sin marco'}
                  </span>
                  <span>{levelProgressPercent.toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-3 w-full rounded-full border border-line bg-slate-950/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-300 transition-all duration-500"
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                {(
                  [
                    { id: 'resumen' as const, label: 'Resumen' },
                    { id: 'marcos' as const, label: 'Marcos' },
                    { id: 'recompensas' as const, label: 'Recompensas' },
                    { id: 'insignias' as const, label: 'Insignias' },
                    { id: 'actividad' as const, label: 'Actividad' },
                  ] satisfies Array<{ id: GamificationTab; label: string }>
                ).map((entry) => (
                  <button
                    key={`gamification-tab-${entry.id}`}
                    className={`chip shrink-0 ${gamificationTab === entry.id ? 'text-primary border-primary' : ''}`}
                    onClick={() => openGamificationTab(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>

              {gamificationTab === 'resumen' ? (
                <div className="mt-5 rounded-2xl border border-line bg-[rgba(4,14,26,0.66)] p-4">
                  <p className="font-semibold">Resumen de progreso</p>
                  <p className="text-xs text-textMuted mt-1">
                    XP, racha y avance de nivel. Los marcos están en la pestaña “Marcos”.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-line bg-slate-950/45 px-3 py-3">
                      <p className="text-xs text-textMuted">Marco activo</p>
                      <p className="text-sm font-semibold mt-1">{gamification?.frame?.label || 'Sin marco'}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-slate-950/45 px-3 py-3">
                      <p className="text-xs text-textMuted">XP para próximo nivel</p>
                      <p className="text-sm font-semibold mt-1">{Number(gamification?.progress?.xpToNextLevel || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-slate-950/45 px-3 py-3">
                      <p className="text-xs text-textMuted">Racha diaria</p>
                      <p className="text-sm font-semibold mt-1">{Number(gamification?.streak?.current || 0)} días</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {gamificationTab === 'marcos' ? (
                <div className="mt-5 rounded-2xl border border-line bg-[rgba(4,14,26,0.66)] p-4">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">Marcos desbloqueables por nivel</p>
                        <p className="text-xs text-textMuted mt-1">
                          Apartado independiente para no cargar la vista principal.
                        </p>
                      </div>
                      <span className="chip text-[11px] group-open:border-primary group-open:text-primary">Mostrar/Ocultar</span>
                    </summary>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {frameRoadmap.map((frame) => (
                        <div
                          key={frame.id}
                          className={`rounded-xl border p-3 ${
                            frame.active
                              ? 'border-primary bg-primary/10'
                              : frame.unlocked
                                ? 'border-line bg-slate-950/45'
                                : 'border-line/70 bg-slate-950/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{frame.label}</span>
                            <span className="text-[11px] text-textMuted">Niveles {frame.range}</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className={`inline-flex h-8 w-8 rounded-full border-2 ${frame.ringClassName}`} />
                            <span className="text-[11px] text-textMuted">
                              {frame.active
                                ? 'Activo'
                                : frame.unlocked
                                  ? 'Desbloqueado'
                                  : 'Bloqueado'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : null}

              {gamificationTab === 'recompensas' ? (
                <div className="mt-5 border border-line rounded-2xl p-4 bg-[rgba(4,14,26,0.66)]">
                  <p className="font-semibold">Expositor de recompensas</p>
                  <p className="text-xs text-textMuted mt-1">Desbloqueadas por nivel</p>
                  {Array.isArray(gamification?.rewards) && gamification.rewards.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {gamification.rewards.slice(0, 18).map((reward) => (
                        <div key={reward.reward_key} className="rounded-xl border border-line px-3 py-2 bg-slate-950/45">
                          <p className="font-semibold text-sm">{reward.reward_label}</p>
                          <p className="text-xs text-textMuted mt-1">
                            Rango requerido: {reward.level_required}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-textMuted mt-3">
                      Aún no hay recompensas desbloqueadas. Sigue completando acciones.
                    </p>
                  )}
                </div>
              ) : null}

              {gamificationTab === 'insignias' ? (
                <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
                  <div className="border border-line rounded-2xl p-4 bg-[rgba(4,14,26,0.66)]">
                    <p className="font-semibold">Insignias desbloqueadas</p>
                    <p className="text-xs text-textMuted mt-1">Las que ya tienes activas en tu perfil</p>
                    {profileBadgesDetailed.length > 0 ? (
                      <div className="mt-2 grid gap-2">
                        {profileBadgesDetailed.slice(0, 18).map((badge) => {
                          const rarityStyle = BADGE_RARITY_STYLES[badge.rarity];
                          const exclusive = badge.animated || badge.rarity === 'legendary' || badge.rarity === 'mythic';
                          return (
                            <div
                              key={`badge-unlocked-${badge.key}`}
                              className={`rounded-xl border px-3 py-2 ${rarityStyle.panelClass} ${
                                exclusive ? `animate-pulse ${rarityStyle.glowClass}` : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-11 w-11 rounded-lg border border-white/20 bg-slate-950/50 overflow-hidden shrink-0">
                                    <SafeImage
                                      src={badge.iconPng || getBadgeIconPng(badge.key)}
                                      fallbackSrc="/images/badges/default.png"
                                      alt={badge.label}
                                      width={44}
                                      height={44}
                                      className="h-full w-full object-contain p-1"
                                    />
                                  </div>
                                  <p className="font-semibold truncate">{badge.label}</p>
                                </div>
                                <span className={`inline-flex border px-2 py-1 text-[11px] ${rarityStyle.chipClass}`}>
                                  {BADGE_RARITY_LABELS[badge.rarity]}
                                </span>
                              </div>
                              <p className="text-xs text-textMuted mt-1">{badge.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-textMuted mt-2">Aún no tienes insignias desbloqueadas.</p>
                    )}
                  </div>

                  <div className="border border-line rounded-2xl p-4 bg-[rgba(4,14,26,0.66)]">
                    <p className="font-semibold">Insignias por desbloquear</p>
                    <p className="text-xs text-textMuted mt-1">
                      Se muestran en oscuro hasta que cumplas la condición.
                    </p>
                    <div className="mt-2 grid gap-2 max-h-[420px] overflow-auto pr-1">
                      {lockedBadgesDetailed.map((badge) => (
                        <div
                          key={`badge-locked-${badge.key}`}
                          className="rounded-xl border border-slate-600/35 bg-slate-950/60 px-3 py-2 opacity-75"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-lg border border-slate-600/40 bg-slate-950/70 overflow-hidden shrink-0">
                                <SafeImage
                                  src={getBadgeIconPng(badge.key)}
                                  fallbackSrc="/images/badges/default.png"
                                  alt={badge.label}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-contain p-1 grayscale opacity-60"
                                />
                              </div>
                              <p className="font-semibold text-slate-300 truncate">{badge.label}</p>
                            </div>
                            <span className="inline-flex border border-slate-500/40 px-2 py-1 text-[11px] text-slate-300">
                              Bloqueada
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {badge.howToEarn}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {gamificationTab === 'actividad' ? (
                <div className="mt-5 border border-line rounded-2xl p-4 bg-[rgba(4,14,26,0.66)]">
                  <p className="font-semibold">Logros recientes</p>
                  <p className="text-xs text-textMuted mt-1">Actividad XP + desbloqueos</p>
                  <div className="mt-3 max-h-[320px] overflow-auto pr-1 space-y-2">
                    {Array.isArray(gamification?.recent) && gamification.recent.length > 0 ? (
                      gamification.recent.slice(0, 20).map((item, index) => (
                        <div key={`${item.type}-${item.title}-${index}`} className="rounded-xl border border-line px-3 py-2 bg-slate-950/45">
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-textMuted mt-1">{item.subtitle}</p>
                          <p className="text-[11px] text-textMuted mt-1">{formatRecentDate(item.created_at)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-textMuted">Todavía no hay actividad registrada.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="glass p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Favoritos del perfil</p>
                  <h2 className="text-2xl font-black mt-1">Carrusel de juegos favoritos</h2>
                  <p className="text-sm text-textMuted mt-1">
                    Estos favoritos se comparten según tu configuración de privacidad.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="chip">{favoriteProducts.length} favoritos</span>
                  <button className="chip" onClick={() => void loadFavorites()} disabled={favoritesLoading}>
                    {favoritesLoading ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              </div>

              {favoritesLoading ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`favorite-skeleton-${index}`} className="rounded-2xl border border-line p-3 bg-slate-950/40">
                      <div className="h-28 rounded-xl bg-surface animate-pulse" />
                      <div className="mt-3 h-4 rounded bg-surface animate-pulse" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-surface animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : favoriteProducts.length > 0 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                  {favoriteProducts.map((favorite) => (
                    <Link
                      key={`favorite-${favorite.id}`}
                      href={getProductHref(favorite)}
                      className="min-w-[220px] max-w-[220px] snap-start rounded-2xl border border-line bg-[rgba(8,16,28,0.56)] p-3 hover:shadow-glow transition-shadow"
                    >
                      <div className="relative h-32 rounded-xl border border-line bg-surface overflow-hidden">
                        <SafeImage
                          src={getProductImageUrl(favorite)}
                          fallbackSrc={getProductFallbackImageUrl(favorite)}
                          alt={favorite.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <p className="mt-3 line-clamp-2 font-semibold">{favorite.name}</p>
                      <p className="text-primary text-sm mt-1">{toEuro(Math.max(0, Number(favorite.price || 0)))}</p>
                      <p className="text-xs text-textMuted mt-1">
                        {favorite.stock > 0 ? `Stock ${favorite.stock}` : 'Sin stock'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-textMuted mt-4">
                  Todavía no tienes favoritos guardados. Entra en un producto y pulsa “Me gusta” para añadirlo.
                </p>
              )}
            </div>

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
                    <span className="text-sm text-textMuted">Tema del perfil</span>
                    <select
                      className="bg-transparent border border-line px-3 py-2"
                      value={profileTheme}
                      onChange={(e) => setProfileTheme(e.target.value)}
                    >
                      {PROFILE_THEMES.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.label} · {theme.description}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-textMuted">Privacidad de favoritos</span>
                    <select
                      className="bg-transparent border border-line px-3 py-2"
                      value={favoritesVisibility}
                      onChange={(e) =>
                        setFavoritesVisibility(
                          e.target.value === 'private'
                            ? 'private'
                            : e.target.value === 'members'
                              ? 'members'
                              : 'public'
                        )
                      }
                    >
                      <option value="public">Todo el mundo</option>
                      <option value="members">Solo usuarios con sesión (modo amigos)</option>
                      <option value="private">Solo yo (privado)</option>
                    </select>
                    <p className="text-xs text-textMuted">
                      Controla si otros usuarios pueden ver tu carrusel de favoritos.
                    </p>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-textMuted">Portada del perfil</span>
                    <select
                      className="bg-transparent border border-line px-3 py-2"
                      value={selectedBannerPresetId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        if (nextId === 'custom-upload') return;
                        const preset = BANNER_PRESETS.find((item) => item.id === nextId);
                        if (preset) {
                          setBannerUrl(preset.url);
                        }
                      }}
                    >
                      {selectedBannerPresetId === 'custom-upload' ? (
                        <option value="custom-upload">Imagen personalizada (subida)</option>
                      ) : null}
                      {BANNER_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-textMuted">
                      {selectedBannerPresetId === 'custom-upload'
                        ? 'Tienes una imagen subida manualmente.'
                        : BANNER_PRESETS.find((item) => item.id === selectedBannerPresetId)?.description ||
                          'Selecciona una portada.'}
                    </p>
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

                  <details className="group rounded-2xl border border-line bg-[linear-gradient(145deg,rgba(6,16,32,0.86),rgba(5,12,24,0.7))] p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">Dirección guardada para checkout</p>
                        <p className="text-xs text-textMuted">
                          Guarda una vez y se autocompleta en todos tus pedidos.
                        </p>
                      </div>
                      <span className="chip text-[11px] group-open:border-primary/60 group-open:text-primary">
                        Editar
                      </span>
                    </summary>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input
                        className="bg-transparent border border-line px-3 py-2 sm:col-span-2"
                        value={shippingFullName}
                        onChange={(e) => setShippingFullName(e.target.value)}
                        placeholder="Nombre completo"
                      />
                      <input
                        className="bg-transparent border border-line px-3 py-2 sm:col-span-2"
                        value={shippingLine1}
                        onChange={(e) => setShippingLine1(e.target.value)}
                        placeholder="Dirección"
                      />
                      <input
                        className="bg-transparent border border-line px-3 py-2 sm:col-span-2"
                        value={shippingLine2}
                        onChange={(e) => setShippingLine2(e.target.value)}
                        placeholder="Dirección 2 (opcional)"
                      />
                      <input
                        className="bg-transparent border border-line px-3 py-2"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="Ciudad"
                      />
                      <input
                        className="bg-transparent border border-line px-3 py-2"
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        placeholder="Provincia / Estado"
                      />
                      <input
                        className="bg-transparent border border-line px-3 py-2"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                        placeholder="Código postal"
                      />
                      <input
                        className="bg-transparent border border-line px-3 py-2"
                        value={shippingCountry}
                        onChange={(e) => setShippingCountry(e.target.value)}
                        placeholder="País"
                      />
                      <input
                        className="bg-transparent border border-line px-3 py-2 sm:col-span-2"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="Teléfono (opcional)"
                      />
                    </div>
                  </details>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    className="button-secondary w-full"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Subiendo avatar...' : 'Subir avatar personalizado'}
                  </button>
                  <button
                    className="button-secondary w-full"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                  >
                    {uploadingBanner ? 'Subiendo banner...' : 'Subir imagen de portada'}
                  </button>
                  <button
                    className="chip w-full"
                    onClick={() => removeAvatar()}
                    disabled={uploadingAvatar || !avatarUrl}
                  >
                    Quitar avatar
                  </button>
                  <button
                    className="chip w-full"
                    onClick={() => removeBanner()}
                    disabled={uploadingBanner || !bannerUrl}
                  >
                    Quitar portada
                  </button>
                </div>
                <p className="text-xs text-textMuted">
                  Formatos admitidos: JPG, PNG, WEBP, GIF, AVIF o HEIC. Avatar hasta 10 MB, banner hasta 15 MB.
                </p>
              </div>

              <div className="glass p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Vista del perfil</p>
                  <h3 className="text-xl font-semibold mt-1">Tema + insignias desbloqueadas</h3>
                </div>

                <div className="border border-line p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-textMuted">Vista previa final</p>
                  <div
                    className={`mt-2 min-h-[150px] rounded-xl border border-line bg-gradient-to-r p-4 ${activeTheme.previewClass}`}
                    style={
                      bannerUrl
                        ? {
                            backgroundImage: `linear-gradient(145deg, rgba(2,6,23,0.78), rgba(2,6,23,0.38)), url('${bannerUrl.replace(/'/g, '%27')}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    <p className="text-lg font-black">{name || 'Tu nombre'}</p>
                    <p className="text-xs opacity-80 mt-1">
                      {tagline || 'Tu vitrina de coleccionismo retro'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(profileBadgesDetailed.length > 0 ? profileBadgesDetailed : []).slice(0, 4).map((badge) => {
                        const rarityStyle = BADGE_RARITY_STYLES[badge.rarity];
                        const exclusive = badge.animated || badge.rarity === 'legendary' || badge.rarity === 'mythic';
                        return (
                          <span
                            key={`preview-${badge.key}`}
                            className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] ${rarityStyle.chipClass} ${
                              exclusive ? `animate-pulse ${rarityStyle.glowClass}` : ''
                            }`}
                          >
                            <SafeImage
                              src={badge.iconPng || getBadgeIconPng(badge.key)}
                              fallbackSrc="/images/badges/default.png"
                              alt={badge.label}
                              width={14}
                              height={14}
                              className="h-3.5 w-3.5 object-contain"
                            />
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="border border-line p-4">
                  <p className="font-semibold">Insignias del perfil</p>
                  {profileBadgesDetailed.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profileBadgesDetailed.slice(0, 8).map((badge) => {
                        const rarityStyle = BADGE_RARITY_STYLES[badge.rarity];
                        return (
                          <span
                            key={`badge-${badge.key}`}
                            className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] ${rarityStyle.chipClass}`}
                            title={badge.description}
                          >
                            <SafeImage
                              src={badge.iconPng || getBadgeIconPng(badge.key)}
                              fallbackSrc="/images/badges/default.png"
                              alt={badge.label}
                              width={14}
                              height={14}
                              className="h-3.5 w-3.5 object-contain"
                            />
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-textMuted mt-2">
                      Aun no tienes insignias desbloqueadas.
                    </p>
                  )}
                  <button className="chip mt-3" onClick={() => openGamificationTab('insignias')}>
                    Ver panel completo de insignias
                  </button>
                </div>
              </div>
            </div>

            <div className="glass p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Guardar cambios del perfil</p>
                <p className="text-xs text-textMuted">
                  Se actualizan nombre, bio, frase, portada, consola favorita, tema visual y privacidad de favoritos.
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-xs text-textMuted">Titular de la cuenta</span>
                      <input
                        className="w-full bg-transparent border border-line px-3 py-2"
                        placeholder="Nombre y apellidos"
                        value={withdrawalAccountHolder}
                        onChange={(e) => setWithdrawalAccountHolder(e.target.value)}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs text-textMuted">Banco (opcional)</span>
                      <input
                        className="w-full bg-transparent border border-line px-3 py-2"
                        placeholder="Ej. Santander / CaixaBank"
                        value={withdrawalBankName}
                        onChange={(e) => setWithdrawalBankName(e.target.value)}
                      />
                    </label>
                  </div>

                  <label className="grid gap-1">
                    <span className="text-xs text-textMuted">IBAN (validación automática)</span>
                    <input
                      className={`w-full bg-transparent border px-3 py-2 ${
                        withdrawalIban && !isValidIban(withdrawalIban) ? 'border-red-400/60' : 'border-line'
                      }`}
                      placeholder="ES12 3456 7890 1234 5678 9012"
                      value={formatIbanForInput(withdrawalIban)}
                      onChange={(e) => setWithdrawalIban(formatIbanForInput(e.target.value))}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className={withdrawalIban && !isValidIban(withdrawalIban) ? 'text-red-400' : 'text-textMuted'}>
                        {withdrawalIban
                          ? isValidIban(withdrawalIban)
                            ? 'IBAN válido'
                            : 'IBAN no válido'
                          : 'Introduce un IBAN para validar antes de enviar'}
                      </span>
                      <span className="text-textMuted">Método: transferencia bancaria (manual)</span>
                    </div>
                  </label>

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
                            {request.payout_details?.iban_masked ? (
                              <p className="text-xs text-textMuted mt-1">
                                IBAN: {String(request.payout_details.iban_masked)}
                              </p>
                            ) : null}
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
                Publicación gratuita (0,00 €). Si se aprueba y se vende, la comisión para la tienda es del 5%.
              </p>
              {!profile.is_verified_seller && profile.role !== 'admin' ? (
                <p className="text-sm text-textMuted mt-2">
                  Tu cuenta aún no está verificada para publicar. Pide revisión desde soporte.
                </p>
              ) : (
                <>
                  <p className="text-sm text-textMuted mt-2">
                    Requisitos mínimos: 3 fotos (máx. 10), descripción completa y detalle de autenticidad.
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
                      placeholder="URLs de fotos (mínimo 3, máximo 10), una por línea"
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
                        {' '}{Number(listing.commission_rate || 5).toFixed(0)}% ({((Number(listing.commission_cents || 0)) / 100).toFixed(2)} €)
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
