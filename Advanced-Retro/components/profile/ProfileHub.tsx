'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  Globe2,
  Heart,
  Languages,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Monitor,
  Moon,
  Package,
  Pencil,
  Save,
  Shield,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Truck,
  Upload,
  UserCircle2,
  X,
} from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
import { getProductHref } from '@/lib/productUrl';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type FavoritesVisibility = 'public' | 'members' | 'private';
type PreferredLanguage = 'auto' | 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';
type PreferredCurrency = 'EUR' | 'USD' | 'GBP';
type ThemePreference = 'light' | 'dark' | 'system';

type NotificationPreferences = {
  orders: boolean;
  shipping: boolean;
  offers: boolean;
  newsletter: boolean;
  messages: boolean;
};

type ProfilePayload = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string | null;
  username?: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  tagline: string | null;
  favorite_console: string | null;
  profile_theme: string | null;
  phone?: string | null;
  birthdate?: string | null;
  favorites_visibility: FavoritesVisibility;
  badges: string[];
  is_verified_seller: boolean;
  helper_completed_count?: number;
  helper_active_count?: number;
  helper_reputation?: number;
  preferred_language?: string | null;
  preferred_currency?: PreferredCurrency;
  theme_preference?: ThemePreference;
  notification_preferences?: NotificationPreferences;
  created_at?: string | null;
};

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

type OrderItem = {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  name: string;
  image: string | null;
};

type Order = {
  id: string;
  status: string;
  payment_status: string;
  total_cents: number;
  created_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  shipping_company: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  notes: string | null;
  items: OrderItem[];
};

type Ticket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  ticket_type?: 'support' | 'concierge' | string | null;
  concierge_state?: string | null;
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
  attachments?: Array<{ type: 'image' | 'video'; url: string }>;
  expires_at?: string | null;
  created_at: string;
};

type Review = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  rating: number;
  comment: string;
  author_name: string;
  helpful_count: number;
  created_at: string | null;
  updated_at: string | null;
};

type SessionRow = {
  session_id: string;
  started_at: string | null;
  last_seen_at: string | null;
  ended_at: string | null;
  active_seconds: number;
  heartbeat_count: number;
  page_views: number;
  last_path: string | null;
  user_agent: string | null;
};

type UsageSummary = {
  totals?: {
    active_seconds: number;
    sessions_count: number;
    page_views: number;
    avg_session_seconds: number;
    last_seen_at: string | null;
  };
  latest_session?: {
    session_id: string;
    last_seen_at: string | null;
    last_path: string | null;
  } | null;
};

type DashboardPayload = {
  profile: ProfilePayload;
  stats: {
    orders_count: number;
    favorites_count: number;
    reviews_count: number;
    open_tickets_count: number;
    total_spent_cents: number;
  };
  favorites: {
    visibility: FavoritesVisibility;
    items: FavoriteProduct[];
    total: number;
  };
  orders: Order[];
  tickets: Ticket[];
  reviews: Review[];
  sessions: SessionRow[];
  usage_summary: UsageSummary | null;
};

type SectionKey =
  | 'profile'
  | 'orders'
  | 'favorites'
  | 'notifications'
  | 'preferences'
  | 'security'
  | 'messages'
  | 'reviews'
  | 'danger';

type ProfileFormState = {
  name: string;
  username: string;
  bio: string;
  phone: string;
  birthdate: string;
};

const SECTION_META: Array<{ key: SectionKey; label: string; icon: typeof UserCircle2 }> = [
  { key: 'profile', label: 'Información personal', icon: UserCircle2 },
  { key: 'orders', label: 'Mis pedidos', icon: Package },
  { key: 'favorites', label: 'Favoritos', icon: Heart },
  { key: 'notifications', label: 'Notificaciones', icon: Bell },
  { key: 'preferences', label: 'Idioma y preferencias', icon: Languages },
  { key: 'security', label: 'Seguridad', icon: Shield },
  { key: 'messages', label: 'Mis mensajes', icon: MessageSquare },
  { key: 'reviews', label: 'Mis reseñas', icon: Star },
  { key: 'danger', label: 'Zona peligrosa', icon: Trash2 },
];

const LANGUAGE_OPTIONS: Array<{ value: PreferredLanguage; label: string }> = [
  { value: 'auto', label: 'Automático' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
];

const CURRENCY_OPTIONS: PreferredCurrency[] = ['EUR', 'USD', 'GBP'];
const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Monitor }> = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'light', label: 'Claro', icon: Sun },
];

const FAVORITES_VISIBILITY_LABELS: Record<FavoritesVisibility, string> = {
  public: 'Público',
  members: 'Solo miembros',
  private: 'Privado',
};

const NOTIFICATION_LABELS: Array<{ key: keyof NotificationPreferences; title: string; copy: string }> = [
  { key: 'orders', title: 'Nuevos pedidos', copy: 'Avisos cuando haya cambios en tus compras.' },
  { key: 'shipping', title: 'Envíos', copy: 'Actualizaciones de tracking y entrega.' },
  { key: 'offers', title: 'Ofertas', copy: 'Drops, descuentos y oportunidades puntuales.' },
  { key: 'newsletter', title: 'Newsletter', copy: 'Resumen editorial y novedades de tienda.' },
  { key: 'messages', title: 'Mensajes', copy: 'Respuestas a tickets y conversaciones activas.' },
];

const defaultNotifications: NotificationPreferences = {
  orders: true,
  shipping: true,
  offers: false,
  newsletter: false,
  messages: true,
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function toCurrency(cents: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format((Number(cents || 0) || 0) / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Sin actividad';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin actividad';
  return parsed.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(Number(seconds || 0)));
  if (safe < 60) return `${safe}s`;
  const mins = Math.floor(safe / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return `${hours}h ${rest}m`;
}

function getRoleLabel(profile: ProfilePayload) {
  if (profile.role === 'admin') return 'Admin';
  if (profile.is_verified_seller) return 'VIP';
  return 'Usuario';
}

function getStatusBadge(status: string) {
  const key = String(status || '').toLowerCase();
  if (key === 'delivered' || key === 'resolved' || key === 'closed') {
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100';
  }
  if (key === 'shipped' || key === 'processing' || key === 'in_progress') {
    return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100';
  }
  if (key === 'cancelled' || key === 'rejected' || key === 'failed' || key === 'refunded') {
    return 'border-rose-400/30 bg-rose-400/10 text-rose-100';
  }
  return 'border-amber-400/30 bg-amber-400/10 text-amber-100';
}

function parseBrowser(userAgent: string | null) {
  const value = String(userAgent || '').toLowerCase();
  if (!value) return 'Dispositivo desconocido';
  if (value.includes('edg/')) return 'Microsoft Edge';
  if (value.includes('chrome/') && !value.includes('edg/')) return 'Google Chrome';
  if (value.includes('safari/') && !value.includes('chrome/')) return 'Safari';
  if (value.includes('firefox/')) return 'Firefox';
  return 'Navegador web';
}

function parseDevice(userAgent: string | null) {
  const value = String(userAgent || '').toLowerCase();
  if (value.includes('iphone') || value.includes('android')) return 'Móvil';
  if (value.includes('ipad') || value.includes('tablet')) return 'Tablet';
  return 'Desktop';
}

export default function ProfileHub() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    profile: true,
    orders: true,
    favorites: true,
    notifications: true,
    preferences: true,
    security: true,
    messages: true,
    reviews: true,
    danger: true,
  });
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ name: '', username: '', bio: '', phone: '', birthdate: '' });
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotifications);
  const [notificationsDirty, setNotificationsDirty] = useState(false);
  const [preferences, setPreferences] = useState<{
    preferred_language: PreferredLanguage;
    preferred_currency: PreferredCurrency;
    theme_preference: ThemePreference;
  }>({ preferred_language: 'es', preferred_currency: 'EUR', theme_preference: 'system' });
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [ticketLoading, setTicketLoading] = useState<Record<string, boolean>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewEditor, setReviewEditor] = useState({ rating: 5, comment: '' });
  const [deletePhrase, setDeletePhrase] = useState('');
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/dashboard', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo cargar el perfil');
      }
      setDashboard(data);
      setProfileForm({
        name: data.profile?.name || '',
        username: data.profile?.username || '',
        bio: data.profile?.bio || '',
        phone: data.profile?.phone || '',
        birthdate: data.profile?.birthdate || '',
      });
      setNotifications(data.profile?.notification_preferences || defaultNotifications);
      setPreferences({
        preferred_language: (data.profile?.preferred_language || 'es') as PreferredLanguage,
        preferred_currency: (data.profile?.preferred_currency || 'EUR') as PreferredCurrency,
        theme_preference: (data.profile?.theme_preference || 'system') as ThemePreference,
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const favorites = useMemo(() => dashboard?.favorites.items || [], [dashboard?.favorites.items]);
  const orders = useMemo(() => dashboard?.orders || [], [dashboard?.orders]);
  const tickets = useMemo(() => dashboard?.tickets || [], [dashboard?.tickets]);
  const reviews = useMemo(() => dashboard?.reviews || [], [dashboard?.reviews]);
  const sessions = useMemo(() => dashboard?.sessions || [], [dashboard?.sessions]);
  const profile = dashboard?.profile || null;

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    if (orderFilter === 'pending') {
      return orders.filter((order) => ['pending', 'processing'].includes(order.status));
    }
    if (orderFilter === 'shipped') {
      return orders.filter((order) => order.status === 'shipped');
    }
    return orders.filter((order) => order.status === 'delivered');
  }, [orders, orderFilter]);

  const saveProfilePatch = useCallback(async (payload: Record<string, unknown>, successMessage?: string) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo actualizar el perfil');
    }

    if (data?.profile) {
      setDashboard((current) =>
        current
          ? {
              ...current,
              profile: {
                ...current.profile,
                ...data.profile,
              },
            }
          : current
      );
    }
    if (successMessage) toast.success(successMessage);
    return data;
  }, []);

  useEffect(() => {
    if (!notificationsDirty) return;
    const timeout = window.setTimeout(() => {
      void saveProfilePatch({ notification_preferences: notifications }, 'Preferencias de notificación guardadas');
      setNotificationsDirty(false);
    }, 550);
    return () => window.clearTimeout(timeout);
  }, [notifications, notificationsDirty, saveProfilePatch]);

  const handleMediaUpload = async (kind: 'avatar' | 'banner', file: File | null) => {
    if (!file) return;
    const key = kind === 'avatar' ? 'upload-avatar' : 'upload-banner';
    setBusy((current) => ({ ...current, [key]: true }));
    try {
      const form = new FormData();
      form.append(kind, file);
      const res = await fetch(`/api/auth/profile/${kind}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `No se pudo subir ${kind}`);
      if (dashboard) {
        setDashboard({
          ...dashboard,
          profile: {
            ...dashboard.profile,
            ...(kind === 'avatar' ? { avatar_url: data.avatar_url } : { banner_url: data.banner_url }),
          },
        });
      }
      toast.success(kind === 'avatar' ? 'Avatar actualizado' : 'Portada actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo subir el archivo');
    } finally {
      setBusy((current) => ({ ...current, [key]: false }));
    }
  };

  const handleSaveInfo = async () => {
    setBusy((current) => ({ ...current, 'save-profile': true }));
    try {
      await saveProfilePatch(
        {
          name: profileForm.name,
          username: profileForm.username,
          bio: profileForm.bio,
          phone: profileForm.phone,
          birthdate: profileForm.birthdate || null,
        },
        'Información personal guardada'
      );
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar la información');
    } finally {
      setBusy((current) => ({ ...current, 'save-profile': false }));
    }
  };

  const handleSavePreferences = async () => {
    setBusy((current) => ({ ...current, 'save-preferences': true }));
    try {
      await saveProfilePatch(
        {
          preferred_language: preferences.preferred_language,
          preferred_currency: preferences.preferred_currency,
          theme_preference: preferences.theme_preference,
        },
        'Preferencias guardadas'
      );
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron guardar las preferencias');
    } finally {
      setBusy((current) => ({ ...current, 'save-preferences': false }));
    }
  };

  const handleFavoritesVisibility = async (visibility: FavoritesVisibility) => {
    if (!dashboard) return;
    setBusy((current) => ({ ...current, 'favorites-visibility': true }));
    try {
      const res = await fetch('/api/profile/favorites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites_visibility: visibility }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar la visibilidad');
      setDashboard({
        ...dashboard,
        profile: { ...dashboard.profile, favorites_visibility: visibility },
        favorites: { ...dashboard.favorites, visibility },
      });
      toast.success('Privacidad de favoritos actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar');
    } finally {
      setBusy((current) => ({ ...current, 'favorites-visibility': false }));
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    if (!dashboard) return;
    setBusy((current) => ({ ...current, [`favorite-${productId}`]: true }));
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_like' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar el favorito');
      setDashboard({
        ...dashboard,
        favorites: {
          ...dashboard.favorites,
          items: dashboard.favorites.items.filter((item) => item.id !== productId),
          total: Math.max(0, dashboard.favorites.total - 1),
        },
        stats: {
          ...dashboard.stats,
          favorites_count: Math.max(0, dashboard.stats.favorites_count - 1),
        },
      });
      toast.success('Favorito eliminado');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el favorito');
    } finally {
      setBusy((current) => ({ ...current, [`favorite-${productId}`]: false }));
    }
  };

  const handleOrderHelp = async (order: Order) => {
    setBusy((current) => ({ ...current, [`order-help-${order.id}`]: true }));
    try {
      const res = await fetch('/api/chat/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Ayuda con pedido ${order.id.slice(0, 8).toUpperCase()}`,
          message: 'Necesito ayuda con este pedido. ¿Podéis revisarlo, por favor?',
          orderId: order.id,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo abrir el ticket');
      toast.success('Ticket abierto. Te responderemos en tu bandeja privada.');
      await loadDashboard();
      setActiveSection('messages');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo abrir el ticket');
    } finally {
      setBusy((current) => ({ ...current, [`order-help-${order.id}`]: false }));
    }
  };

  const toggleTicket = async (ticketId: string) => {
    const nextOpen = !expandedTickets[ticketId];
    setExpandedTickets((current) => ({ ...current, [ticketId]: nextOpen }));
    if (!nextOpen || ticketMessages[ticketId]) return;

    setTicketLoading((current) => ({ ...current, [ticketId]: true }));
    try {
      const res = await fetch(`/api/chat/tickets/${encodeURIComponent(ticketId)}/messages`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar la conversación');
      setTicketMessages((current) => ({ ...current, [ticketId]: Array.isArray(data?.messages) ? data.messages : [] }));
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo cargar la conversación');
    } finally {
      setTicketLoading((current) => ({ ...current, [ticketId]: false }));
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    const message = String(messageDrafts[ticketId] || '').trim();
    if (message.length < 2) {
      toast.error('Escribe un mensaje un poco más largo');
      return;
    }
    setBusy((current) => ({ ...current, [`ticket-reply-${ticketId}`]: true }));
    try {
      const res = await fetch(`/api/chat/tickets/${encodeURIComponent(ticketId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar el mensaje');
      setMessageDrafts((current) => ({ ...current, [ticketId]: '' }));
      setTicketMessages((current) => ({
        ...current,
        [ticketId]: [...(current[ticketId] || []), data.message],
      }));
      toast.success('Mensaje enviado');
      await loadDashboard();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo enviar el mensaje');
    } finally {
      setBusy((current) => ({ ...current, [`ticket-reply-${ticketId}`]: false }));
    }
  };

  const handlePasswordChange = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error('Supabase no está disponible en el navegador');
      return;
    }
    if (!securityForm.currentPassword.trim()) {
      toast.error('Introduce tu contraseña actual');
      return;
    }
    if (securityForm.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setBusy((current) => ({ ...current, 'password-change': true }));
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: securityForm.newPassword });
      if (updateError) throw updateError;
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setBusy((current) => ({ ...current, 'password-change': false }));
    }
  };

  const handleSignOutOthers = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy((current) => ({ ...current, 'signout-others': true }));
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
      if (signOutError) throw signOutError;
      toast.success('Se han cerrado otras sesiones');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron cerrar otras sesiones');
    } finally {
      setBusy((current) => ({ ...current, 'signout-others': false }));
    }
  };

  const handleSignOutCurrent = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const startReviewEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setReviewEditor({ rating: review.rating, comment: review.comment });
  };

  const handleReviewSave = async (reviewId: string) => {
    setBusy((current) => ({ ...current, [`review-save-${reviewId}`]: true }));
    try {
      const res = await fetch(`/api/profile/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewEditor),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar la reseña');
      setDashboard((current) =>
        current
          ? {
              ...current,
              reviews: current.reviews.map((review) =>
                review.id === reviewId
                  ? { ...review, rating: reviewEditor.rating, comment: reviewEditor.comment, updated_at: new Date().toISOString() }
                  : review
              ),
            }
          : current
      );
      setEditingReviewId(null);
      toast.success('Reseña actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar la reseña');
    } finally {
      setBusy((current) => ({ ...current, [`review-save-${reviewId}`]: false }));
    }
  };

  const handleReviewDelete = async (reviewId: string) => {
    setBusy((current) => ({ ...current, [`review-delete-${reviewId}`]: true }));
    try {
      const res = await fetch(`/api/profile/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar la reseña');
      setDashboard((current) =>
        current
          ? {
              ...current,
              reviews: current.reviews.filter((review) => review.id !== reviewId),
              stats: {
                ...current.stats,
                reviews_count: Math.max(0, current.stats.reviews_count - 1),
              },
            }
          : current
      );
      toast.success('Reseña eliminada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar la reseña');
    } finally {
      setBusy((current) => ({ ...current, [`review-delete-${reviewId}`]: false }));
    }
  };

  const handleExportData = async () => {
    setBusy((current) => ({ ...current, 'export-data': true }));
    try {
      const res = await fetch('/api/profile/export');
      if (!res.ok) throw new Error('No se pudo exportar la cuenta');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'advancedretro-profile.json';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Exportación preparada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo exportar');
    } finally {
      setBusy((current) => ({ ...current, 'export-data': false }));
    }
  };

  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'ELIMINAR') {
      toast.error('Debes escribir ELIMINAR exactamente');
      return;
    }
    const supabase = getSupabaseBrowserClient();
    setBusy((current) => ({ ...current, 'delete-account': true }));
    try {
      const res = await fetch('/api/profile/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deletePhrase }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar la cuenta');
      await supabase?.auth.signOut();
      toast.success('Cuenta eliminada');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar la cuenta');
    } finally {
      setBusy((current) => ({ ...current, 'delete-account': false }));
    }
  };

  const scrollToSection = (key: SectionKey) => {
    setActiveSection(key);
    setOpenSections((current) => ({ ...current, [key]: true }));
    document.getElementById(`profile-section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <div className="content-rail">
            <div className="rounded-[2rem] border border-line bg-surface/80 p-10 text-center text-textMuted shadow-soft">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm uppercase tracking-[0.22em]">Cargando perfil…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard || !profile) {
    return (
      <div className="section">
        <div className="container">
          <div className="content-rail">
            <div className="rounded-[2rem] border border-rose-400/20 bg-rose-400/5 p-8 shadow-soft">
              <p className="text-sm uppercase tracking-[0.22em] text-rose-200">Perfil no disponible</p>
              <h1 className="mt-3 text-3xl font-semibold text-text">No se pudo cargar tu área privada.</h1>
              <p className="mt-3 text-textMuted">{error || 'Necesitas iniciar sesión para continuar.'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login" className="button-primary">Iniciar sesión</Link>
                <button type="button" onClick={() => void loadDashboard()} className="button-secondary">Reintentar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section pt-4">
      <div className="container">
        <div className="content-rail">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-soft">
              <div
                className="relative h-48 border-b border-line bg-[radial-gradient(circle_at_top,rgba(75,228,214,0.18),transparent_32%),linear-gradient(135deg,#07101f,#131f38_55%,#0b0e18)] sm:h-60"
                style={profile.banner_url ? { backgroundImage: `linear-gradient(135deg,rgba(7,16,31,0.76),rgba(19,31,56,0.7)), url(${profile.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,12,21,0.85))]" />
                <div className="absolute right-4 top-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => bannerInputRef.current?.click()} className="chip hover:border-primary/40 hover:text-text">
                    {busy['upload-banner'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Cambiar portada
                  </button>
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleMediaUpload('banner', event.target.files?.[0] || null)} />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="group relative h-24 w-24 overflow-hidden rounded-[1.8rem] border border-white/15 bg-[rgba(255,255,255,0.06)] shadow-[0_18px_36px_rgba(0,0,0,0.28)] sm:h-28 sm:w-28"
                      >
                        <SafeImage
                          src={profile.avatar_url || '/placeholder.svg'}
                          fallbackSrc="/placeholder.svg"
                          alt={profile.name || 'Avatar'}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-[rgba(5,10,18,0.82)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 transition group-hover:opacity-100">
                          {busy['upload-avatar'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Avatar
                        </span>
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleMediaUpload('avatar', event.target.files?.[0] || null)} />

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-3xl font-semibold text-white sm:text-4xl">{profile.name || 'Coleccionista'}</h1>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                            {getRoleLabel(profile)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-white/70">{profile.email}</p>
                        {profile.tagline ? <p className="mt-2 text-sm text-white/80">{profile.tagline}</p> : null}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Pedidos</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{dashboard.stats.orders_count}</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Favoritos</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{dashboard.stats.favorites_count}</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Miembro desde</p>
                        <p className="mt-1 text-sm font-semibold text-white">{formatDate(profile.created_at || null)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[290px,minmax(0,1fr)] xl:items-start">
              <aside className="xl:sticky xl:top-[104px]">
                <div className="rounded-[1.75rem] border border-line bg-surface p-4 shadow-soft">
                  <div className="rounded-[1.4rem] border border-primary/15 bg-[linear-gradient(180deg,rgba(75,228,214,0.1),rgba(75,228,214,0.04))] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-textMuted">Tu snapshot</p>
                    <div className="mt-3 space-y-3 text-sm text-textMuted">
                      <div className="flex items-center justify-between gap-3"><span>Total gastado</span><strong className="text-text">{toCurrency(dashboard.stats.total_spent_cents)}</strong></div>
                      <div className="flex items-center justify-between gap-3"><span>Tickets abiertos</span><strong className="text-text">{dashboard.stats.open_tickets_count}</strong></div>
                      <div className="flex items-center justify-between gap-3"><span>Reseñas</span><strong className="text-text">{dashboard.stats.reviews_count}</strong></div>
                    </div>
                  </div>

                  <nav className="mt-4 hidden gap-2 xl:grid">
                    {SECTION_META.map((section) => {
                      const Icon = section.icon;
                      const active = activeSection === section.key;
                      return (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => scrollToSection(section.key)}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition',
                            active
                              ? 'border-primary/35 bg-primary/10 text-text'
                              : 'border-line bg-surface2 text-textMuted hover:border-primary/25 hover:text-text'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{section.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden">
                    {SECTION_META.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => scrollToSection(section.key)}
                          className={cn(
                            'chip shrink-0 gap-2',
                            activeSection === section.key && 'border-primary/40 bg-primary/10 text-text'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {section.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <div className="space-y-5">
                {SECTION_META.map((section) => {
                  const Icon = section.icon;
                  const open = openSections[section.key];
                  return (
                    <section key={section.key} id={`profile-section-${section.key}`} className="rounded-[1.75rem] border border-line bg-surface shadow-soft">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection(section.key);
                          setOpenSections((current) => ({ ...current, [section.key]: !current[section.key] }));
                        }}
                        className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-text">{section.label}</h2>
                            <p className="mt-1 text-sm text-textMuted">
                              {section.key === 'profile' && 'Datos básicos, avatar, portada y presentación pública.'}
                              {section.key === 'orders' && 'Seguimiento de compras y ayuda directa por pedido.'}
                              {section.key === 'favorites' && 'Tu colección guardada y su visibilidad.'}
                              {section.key === 'notifications' && 'Qué tipo de avisos quieres recibir.'}
                              {section.key === 'preferences' && 'Idioma, moneda preferida y aspecto.'}
                              {section.key === 'security' && 'Contraseña y sesiones recientes.'}
                              {section.key === 'messages' && 'Tus tickets de soporte y concierge.'}
                              {section.key === 'reviews' && 'Reseñas que has dejado en productos.'}
                              {section.key === 'danger' && 'Exportación y eliminación de la cuenta.'}
                            </p>
                          </div>
                        </div>
                        {open ? <ChevronUp className="h-5 w-5 text-textMuted" /> : <ChevronDown className="h-5 w-5 text-textMuted" />}
                      </button>

                      {open ? (
                        <div className="border-t border-line px-5 py-5">
                          {section.key === 'profile' ? (
                            <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
                              <div className="space-y-4">
                                <label className="block text-sm text-textMuted">Nombre completo
                                  <input value={profileForm.name} onChange={(e) => setProfileForm((current) => ({ ...current, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-text outline-none transition focus:border-primary/40" placeholder="Tu nombre o alias" />
                                </label>
                                <label className="block text-sm text-textMuted">Username
                                  <input value={profileForm.username} onChange={(e) => setProfileForm((current) => ({ ...current, username: e.target.value }))} className="mt-2 w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-text outline-none transition focus:border-primary/40" placeholder="usuario-retro" />
                                </label>
                                <label className="block text-sm text-textMuted">Bio
                                  <textarea value={profileForm.bio} onChange={(e) => setProfileForm((current) => ({ ...current, bio: e.target.value }))} className="mt-2 min-h-[140px] w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-text outline-none transition focus:border-primary/40" placeholder="Cuéntanos qué coleccionas, qué buscas o cómo te mueves dentro del retro." />
                                </label>
                              </div>

                              <div className="space-y-4">
                                <label className="block text-sm text-textMuted">Teléfono
                                  <input value={profileForm.phone} onChange={(e) => setProfileForm((current) => ({ ...current, phone: e.target.value }))} className="mt-2 w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-text outline-none transition focus:border-primary/40" placeholder="600 000 000" />
                                </label>
                                <label className="block text-sm text-textMuted">Fecha de nacimiento
                                  <input type="date" value={profileForm.birthdate} onChange={(e) => setProfileForm((current) => ({ ...current, birthdate: e.target.value }))} className="mt-2 w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-text outline-none transition focus:border-primary/40" />
                                </label>
                                <div className="rounded-[1.4rem] border border-line bg-surface2 p-4 text-sm text-textMuted">
                                  <p className="font-semibold text-text">Estado del perfil</p>
                                  <div className="mt-3 space-y-2">
                                    <div className="flex items-center justify-between gap-3"><span>Consola favorita</span><strong className="text-text">{profile.favorite_console || 'Sin definir'}</strong></div>
                                    <div className="flex items-center justify-between gap-3"><span>Badges</span><strong className="text-text">{profile.badges?.length || 0}</strong></div>
                                    <div className="flex items-center justify-between gap-3"><span>Reputación helper</span><strong className="text-text">{profile.helper_reputation || 0}</strong></div>
                                  </div>
                                </div>
                                <button type="button" onClick={() => void handleSaveInfo()} className="button-primary w-full justify-center" disabled={Boolean(busy['save-profile'])}>
                                  {busy['save-profile'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar información
                                </button>
                              </div>
                            </div>
                          ) : null}

                          {section.key === 'orders' ? (
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { key: 'all', label: 'Todos' },
                                  { key: 'pending', label: 'Pendientes' },
                                  { key: 'shipped', label: 'En camino' },
                                  { key: 'delivered', label: 'Entregados' },
                                ].map((tab) => (
                                  <button key={tab.key} type="button" onClick={() => setOrderFilter(tab.key as any)} className={cn('chip', orderFilter === tab.key && 'border-primary/40 bg-primary/10 text-text')}>
                                    {tab.label}
                                  </button>
                                ))}
                              </div>

                              {filteredOrders.length === 0 ? (
                                <div className="rounded-[1.4rem] border border-dashed border-line bg-surface2 p-6 text-center text-textMuted">
                                  <Package className="mx-auto h-8 w-8 text-primary" />
                                  <p className="mt-3 text-lg font-semibold text-text">Aún no tienes pedidos en esta sección</p>
                                  <p className="mt-2">Cuando compres algo, aquí verás el estado, los artículos y el seguimiento.</p>
                                  <Link href="/tienda" className="button-secondary mx-auto mt-4 w-fit">Ir a la tienda</Link>
                                </div>
                              ) : (
                                filteredOrders.map((order) => {
                                  const expanded = expandedOrders[order.id];
                                  return (
                                    <article key={order.id} className="rounded-[1.5rem] border border-line bg-surface2 p-4">
                                      <button type="button" onClick={() => setExpandedOrders((current) => ({ ...current, [order.id]: !current[order.id] }))} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
                                        <div>
                                          <p className="text-xs uppercase tracking-[0.18em] text-textMuted">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                                          <h3 className="mt-1 text-lg font-semibold text-text">{formatDate(order.created_at)}</h3>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', getStatusBadge(order.status))}>{order.status}</span>
                                          <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">{toCurrency(order.total_cents)}</span>
                                        </div>
                                      </button>

                                      {expanded ? (
                                        <div className="mt-4 space-y-4 border-t border-line pt-4">
                                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {order.items.map((item) => (
                                              <div key={item.id} className="flex gap-3 rounded-[1.25rem] border border-line bg-[rgba(255,255,255,0.02)] p-3">
                                                <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-line bg-[rgba(255,255,255,0.04)]">
                                                  <SafeImage src={item.image || getProductFallbackImageUrl({})} alt={item.name} fill sizes="64px" className="object-cover" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <p className="line-clamp-2 text-sm font-semibold text-text">{item.name}</p>
                                                  <p className="mt-1 text-xs text-textMuted">{item.quantity} × {toCurrency(item.unit_price_cents)}</p>
                                                  {item.product_id ? <Link href={getProductHref({ id: item.product_id, name: item.name })} className="mt-2 inline-flex text-xs font-semibold text-primary">Ver producto</Link> : null}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="grid gap-3 md:grid-cols-2">
                                            <div className="rounded-[1.25rem] border border-line bg-[rgba(255,255,255,0.02)] p-4 text-sm text-textMuted">
                                              <p className="font-semibold text-text">Estado del envío</p>
                                              <div className="mt-3 space-y-2">
                                                <p>Pago: <span className="text-text">{order.payment_status}</span></p>
                                                <p>Transportista: <span className="text-text">{order.shipping_company || 'Pendiente'}</span></p>
                                                <p>Tracking: <span className="text-text">{order.tracking_number || 'Pendiente'}</span></p>
                                                <p>Entrega estimada: <span className="text-text">{order.estimated_delivery ? formatDate(order.estimated_delivery) : 'Sin fecha'}</span></p>
                                                {order.tracking_url ? <a href={order.tracking_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary"><Truck className="h-4 w-4" /> Seguir envío</a> : null}
                                              </div>
                                            </div>
                                            <div className="rounded-[1.25rem] border border-line bg-[rgba(255,255,255,0.02)] p-4 text-sm text-textMuted">
                                              <p className="font-semibold text-text">Acciones</p>
                                              <p className="mt-3">Si algo no va bien, te abrimos un ticket privado enlazado a este pedido.</p>
                                              <button type="button" onClick={() => void handleOrderHelp(order)} className="button-secondary mt-4 w-full justify-center" disabled={Boolean(busy[`order-help-${order.id}`])}>
                                                {busy[`order-help-${order.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Necesito ayuda
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : null}
                                    </article>
                                  );
                                })
                              )}
                            </div>
                          ) : null}

                          {section.key === 'favorites' ? (
                            <div className="space-y-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm text-textMuted">Define quién puede ver tu colección guardada.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(Object.keys(FAVORITES_VISIBILITY_LABELS) as FavoritesVisibility[]).map((visibility) => (
                                    <button key={visibility} type="button" onClick={() => void handleFavoritesVisibility(visibility)} className={cn('chip', dashboard.favorites.visibility === visibility && 'border-primary/40 bg-primary/10 text-text')} disabled={Boolean(busy['favorites-visibility'])}>
                                      {FAVORITES_VISIBILITY_LABELS[visibility]}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {favorites.length === 0 ? (
                                <div className="rounded-[1.4rem] border border-dashed border-line bg-surface2 p-6 text-center text-textMuted">
                                  <Heart className="mx-auto h-8 w-8 text-primary" />
                                  <p className="mt-3 text-lg font-semibold text-text">Tu estantería de favoritos está vacía</p>
                                  <p className="mt-2">Guarda productos desde la tienda para compararlos luego con calma.</p>
                                  <Link href="/tienda" className="button-secondary mx-auto mt-4 w-fit">Explorar tienda</Link>
                                </div>
                              ) : (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                  {favorites.map((item) => (
                                    <article key={item.id} className="overflow-hidden rounded-[1.4rem] border border-line bg-surface2">
                                      <Link href={getProductHref(item)} className="block">
                                        <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-[rgba(255,255,255,0.03)]">
                                          <SafeImage src={getProductImageUrl(item)} fallbackSrc={getProductFallbackImageUrl(item)} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 hover:scale-[1.03]" />
                                        </div>
                                      </Link>
                                      <div className="p-4">
                                        <Link href={getProductHref(item)} className="text-base font-semibold text-text transition hover:text-primary">{item.name}</Link>
                                        <p className="mt-1 text-sm text-textMuted">{item.platform || item.category || 'Colección retro'}</p>
                                        <div className="mt-4 flex items-center justify-between gap-3">
                                          <strong className="text-text">{toCurrency(item.price)}</strong>
                                          <button type="button" onClick={() => void handleRemoveFavorite(item.id)} className="chip text-rose-200 hover:border-rose-400/30 hover:bg-rose-400/10" disabled={Boolean(busy[`favorite-${item.id}`])}>
                                            {busy[`favorite-${item.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Quitar
                                          </button>
                                        </div>
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}

                          {section.key === 'notifications' ? (
                            <div className="grid gap-4 lg:grid-cols-2">
                              {NOTIFICATION_LABELS.map((entry) => (
                                <label key={entry.key} className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-line bg-surface2 p-4">
                                  <div>
                                    <p className="font-semibold text-text">{entry.title}</p>
                                    <p className="mt-1 text-sm text-textMuted">{entry.copy}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNotifications((current) => ({ ...current, [entry.key]: !current[entry.key] }));
                                      setNotificationsDirty(true);
                                    }}
                                    className={cn(
                                      'relative h-7 w-12 rounded-full transition',
                                      notifications[entry.key] ? 'bg-primary' : 'bg-slate-700'
                                    )}
                                  >
                                    <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white transition', notifications[entry.key] ? 'left-6' : 'left-1')} />
                                  </button>
                                </label>
                              ))}
                            </div>
                          ) : null}

                          {section.key === 'preferences' ? (
                            <div className="grid gap-5 lg:grid-cols-2">
                              <label className="block text-sm text-textMuted">Idioma preferido
                                <select value={preferences.preferred_language} onChange={(e) => setPreferences((current) => ({ ...current, preferred_language: e.target.value as PreferredLanguage }))} className="mt-2 w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-text outline-none transition focus:border-primary/40">
                                  {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </label>
                              <label className="block text-sm text-textMuted">Moneda preferida
                                <select value={preferences.preferred_currency} onChange={(e) => setPreferences((current) => ({ ...current, preferred_currency: e.target.value as PreferredCurrency }))} className="mt-2 w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-text outline-none transition focus:border-primary/40">
                                  {CURRENCY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                                <span className="mt-2 block text-xs text-textMuted">Se guarda como preferencia de cuenta. La tienda principal sigue mostrando precios base en EUR.</span>
                              </label>
                              <div className="lg:col-span-2">
                                <p className="text-sm text-textMuted">Tema preferido</p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                  {THEME_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                      <button key={option.value} type="button" onClick={() => setPreferences((current) => ({ ...current, theme_preference: option.value }))} className={cn('rounded-[1.3rem] border px-4 py-4 text-left transition', preferences.theme_preference === option.value ? 'border-primary/35 bg-primary/10 text-text' : 'border-line bg-surface2 text-textMuted hover:border-primary/25 hover:text-text')}>
                                        <Icon className="h-5 w-5" />
                                        <p className="mt-3 font-semibold">{option.label}</p>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <button type="button" onClick={() => void handleSavePreferences()} className="button-primary lg:col-span-2 w-full justify-center" disabled={Boolean(busy['save-preferences'])}>
                                {busy['save-preferences'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar preferencias
                              </button>
                            </div>
                          ) : null}

                          {section.key === 'security' ? (
                            <div className="grid gap-5 lg:grid-cols-[0.92fr,1.08fr]">
                              <div className="space-y-4">
                                <div className="rounded-[1.4rem] border border-line bg-surface2 p-4">
                                  <p className="font-semibold text-text">Cambiar contraseña</p>
                                  <div className="mt-4 space-y-3">
                                    <input type="password" value={securityForm.currentPassword} onChange={(e) => setSecurityForm((current) => ({ ...current, currentPassword: e.target.value }))} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-text outline-none focus:border-primary/40" placeholder="Contraseña actual" />
                                    <input type="password" value={securityForm.newPassword} onChange={(e) => setSecurityForm((current) => ({ ...current, newPassword: e.target.value }))} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-text outline-none focus:border-primary/40" placeholder="Nueva contraseña" />
                                    <input type="password" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm((current) => ({ ...current, confirmPassword: e.target.value }))} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-text outline-none focus:border-primary/40" placeholder="Confirmar nueva contraseña" />
                                    <button type="button" onClick={() => void handlePasswordChange()} className="button-primary w-full justify-center" disabled={Boolean(busy['password-change'])}>
                                      {busy['password-change'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Actualizar contraseña
                                    </button>
                                  </div>
                                </div>

                                <div className="rounded-[1.4rem] border border-line bg-surface2 p-4">
                                  <p className="font-semibold text-text">Autenticación de dos factores</p>
                                  <p className="mt-2 text-sm text-textMuted">Próximamente. Dejamos preparada la sección para cuando activemos MFA sobre Supabase Auth.</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="rounded-[1.4rem] border border-line bg-surface2 p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-text">Historial de sesiones</p>
                                      <p className="mt-1 text-sm text-textMuted">Actividad reciente basada en uso real y heartbeats.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button type="button" onClick={() => void handleSignOutOthers()} className="chip" disabled={Boolean(busy['signout-others'])}>
                                        {busy['signout-others'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Cerrar otras sesiones
                                      </button>
                                      <button type="button" onClick={() => void handleSignOutCurrent()} className="chip">
                                        <LogOut className="h-4 w-4" /> Cerrar sesión actual
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-4 space-y-3">
                                    {sessions.length === 0 ? (
                                      <p className="text-sm text-textMuted">Todavía no hay historial suficiente de sesiones.</p>
                                    ) : (
                                      sessions.map((session) => (
                                        <div key={session.session_id} className="rounded-[1.2rem] border border-line bg-surface px-4 py-3">
                                          <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                              <p className="font-medium text-text">{parseBrowser(session.user_agent)}</p>
                                              <p className="mt-1 text-xs text-textMuted">{parseDevice(session.user_agent)} · {session.last_path || 'Sin ruta'} · {formatDateTime(session.last_seen_at)}</p>
                                            </div>
                                            <div className="text-right text-xs text-textMuted">
                                              <p>{formatDuration(session.active_seconds)}</p>
                                              <p>{session.page_views} páginas</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {section.key === 'messages' ? (
                            <div className="space-y-4">
                              {tickets.length === 0 ? (
                                <div className="rounded-[1.4rem] border border-dashed border-line bg-surface2 p-6 text-center text-textMuted">
                                  <MessageSquare className="mx-auto h-8 w-8 text-primary" />
                                  <p className="mt-3 text-lg font-semibold text-text">Todavía no tienes conversaciones abiertas</p>
                                  <p className="mt-2">Cuando abras un ticket de soporte o concierge, aparecerá aquí con su historial.</p>
                                </div>
                              ) : (
                                tickets.map((ticket) => {
                                  const open = expandedTickets[ticket.id];
                                  return (
                                    <article key={ticket.id} className="rounded-[1.5rem] border border-line bg-surface2 p-4">
                                      <button type="button" onClick={() => void toggleTicket(ticket.id)} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
                                        <div>
                                          <p className="text-xs uppercase tracking-[0.18em] text-textMuted">{ticket.ticket_type === 'concierge' ? 'Concierge' : 'Soporte'}</p>
                                          <h3 className="mt-1 text-lg font-semibold text-text">{ticket.subject}</h3>
                                          <p className="mt-1 text-sm text-textMuted">{ticket.last_message?.message || 'Sin mensajes recientes'}</p>
                                        </div>
                                        <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', getStatusBadge(ticket.status))}>{ticket.status}</span>
                                      </button>

                                      {open ? (
                                        <div className="mt-4 border-t border-line pt-4">
                                          {ticketLoading[ticket.id] ? (
                                            <div className="flex items-center gap-2 text-sm text-textMuted"><Loader2 className="h-4 w-4 animate-spin" /> Cargando conversación…</div>
                                          ) : (
                                            <>
                                              <div className="space-y-3">
                                                {(ticketMessages[ticket.id] || []).map((message) => (
                                                  <div key={message.id} className={cn('rounded-[1.2rem] border px-4 py-3 text-sm', message.is_admin ? 'border-cyan-400/25 bg-cyan-400/8 text-cyan-50' : 'border-line bg-surface text-text')}>
                                                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-textMuted">
                                                      <span>{message.is_admin ? 'Equipo AdvancedRetro' : 'Tú'}</span>
                                                      <span>{formatDateTime(message.created_at)}</span>
                                                    </div>
                                                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">{message.message}</p>
                                                  </div>
                                                ))}
                                              </div>
                                              <div className="mt-4 flex flex-col gap-3">
                                                <textarea value={messageDrafts[ticket.id] || ''} onChange={(e) => setMessageDrafts((current) => ({ ...current, [ticket.id]: e.target.value }))} className="min-h-[110px] rounded-2xl border border-line bg-surface px-4 py-3 text-text outline-none focus:border-primary/40" placeholder="Escribe tu respuesta…" />
                                                <button type="button" onClick={() => void handleTicketReply(ticket.id)} className="button-primary w-full justify-center" disabled={Boolean(busy[`ticket-reply-${ticket.id}`])}>
                                                  {busy[`ticket-reply-${ticket.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Enviar mensaje
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      ) : null}
                                    </article>
                                  );
                                })
                              )}
                            </div>
                          ) : null}

                          {section.key === 'reviews' ? (
                            <div className="space-y-4">
                              {reviews.length === 0 ? (
                                <div className="rounded-[1.4rem] border border-dashed border-line bg-surface2 p-6 text-center text-textMuted">
                                  <Star className="mx-auto h-8 w-8 text-primary" />
                                  <p className="mt-3 text-lg font-semibold text-text">Todavía no has dejado reseñas</p>
                                  <p className="mt-2">Cuando compartas tu experiencia en productos, aparecerá aquí para poder editarla o retirarla.</p>
                                </div>
                              ) : (
                                reviews.map((review) => {
                                  const editing = editingReviewId === review.id;
                                  return (
                                    <article key={review.id} className="rounded-[1.5rem] border border-line bg-surface2 p-4">
                                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-line bg-surface shrink-0">
                                          <SafeImage src={review.product_image || '/placeholder.svg'} fallbackSrc="/placeholder.svg" alt={review.product_name} fill sizes="80px" className="object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                              <Link href={review.product_id ? getProductHref({ id: review.product_id, name: review.product_name }) : '/tienda'} className="text-lg font-semibold text-text transition hover:text-primary">{review.product_name}</Link>
                                              <p className="mt-1 text-sm text-textMuted">{formatDate(review.created_at)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-amber-300">
                                              {Array.from({ length: 5 }).map((_, index) => <Star key={`${review.id}-star-${index}`} className={cn('h-4 w-4', index < review.rating ? 'fill-current' : 'text-white/15')} />)}
                                            </div>
                                          </div>

                                          {editing ? (
                                            <div className="mt-4 space-y-3">
                                              <div className="flex flex-wrap gap-2">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                  <button key={`edit-rating-${review.id}-${index}`} type="button" onClick={() => setReviewEditor((current) => ({ ...current, rating: index + 1 }))} className={cn('chip', reviewEditor.rating >= index + 1 && 'border-primary/40 bg-primary/10 text-text')}>
                                                    {index + 1}★
                                                  </button>
                                                ))}
                                              </div>
                                              <textarea value={reviewEditor.comment} onChange={(e) => setReviewEditor((current) => ({ ...current, comment: e.target.value }))} className="min-h-[120px] w-full rounded-2xl border border-line bg-surface px-4 py-3 text-text outline-none focus:border-primary/40" />
                                              <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => void handleReviewSave(review.id)} className="button-primary" disabled={Boolean(busy[`review-save-${review.id}`])}>
                                                  {busy[`review-save-${review.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
                                                </button>
                                                <button type="button" onClick={() => setEditingReviewId(null)} className="button-secondary">
                                                  Cancelar
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <p className="mt-4 text-sm leading-relaxed text-textMuted">{review.comment}</p>
                                              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-textMuted">
                                                <span>{review.helpful_count} personas la encontraron útil</span>
                                                <button type="button" onClick={() => startReviewEdit(review)} className="chip"><Pencil className="h-4 w-4" /> Editar</button>
                                                <button type="button" onClick={() => void handleReviewDelete(review.id)} className="chip text-rose-200 hover:border-rose-400/30 hover:bg-rose-400/10" disabled={Boolean(busy[`review-delete-${review.id}`])}>
                                                  {busy[`review-delete-${review.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Eliminar
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </article>
                                  );
                                })
                              )}
                            </div>
                          ) : null}

                          {section.key === 'danger' ? (
                            <div className="space-y-5">
                              <div className="rounded-[1.4rem] border border-line bg-surface2 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-lg font-semibold text-text">Exportar mis datos</p>
                                    <p className="mt-1 text-sm text-textMuted">Descarga un JSON con tu actividad principal, pedidos, tickets y preferencias.</p>
                                  </div>
                                  <button type="button" onClick={() => void handleExportData()} className="button-secondary" disabled={Boolean(busy['export-data'])}>
                                    {busy['export-data'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Exportar
                                  </button>
                                </div>
                              </div>

                              <div className="rounded-[1.4rem] border border-rose-500/25 bg-rose-500/6 p-5">
                                <p className="text-lg font-semibold text-rose-100">Eliminar cuenta</p>
                                <p className="mt-2 text-sm text-rose-100/70">Esto eliminará tu acceso y limpiará tu perfil. Si quieres continuar, escribe <strong>ELIMINAR</strong>.</p>
                                <input value={deletePhrase} onChange={(e) => setDeletePhrase(e.target.value)} className="mt-4 w-full rounded-2xl border border-rose-400/20 bg-[rgba(20,7,12,0.6)] px-4 py-3 text-white outline-none focus:border-rose-300/40" placeholder="Escribe ELIMINAR" />
                                <button type="button" onClick={() => void handleDeleteAccount()} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110" disabled={Boolean(busy['delete-account'])}>
                                  {busy['delete-account'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Eliminar cuenta definitivamente
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
