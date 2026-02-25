'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type AdminTab =
  | 'products'
  | 'orders'
  | 'shipping'
  | 'users'
  | 'wallets'
  | 'withdrawals'
  | 'chats'
  | 'listings'
  | 'coupons'
  | 'mystery';

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

type UserVisualDraft = {
  badges: string;
  tagline: string;
  favorite_console: string;
  profile_theme: string;
};

type AdminWalletListItem = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: 'admin' | 'user';
    avatar_url: string | null;
    is_verified_seller: boolean;
    created_at: string | null;
  };
  account: {
    user_id: string;
    balance_cents: number;
    pending_cents: number;
    total_earned_cents: number;
    total_withdrawn_cents: number;
    created_at: string | null;
    updated_at: string | null;
    initialized: boolean;
  };
};

type AdminWalletSummary = {
  users: number;
  initialized: number;
  balance_cents: number;
  pending_cents: number;
  total_earned_cents: number;
  total_withdrawn_cents: number;
};

type AdminWalletDetail = {
  user: {
    id: string;
    email?: string;
    name?: string | null;
    role?: string;
    avatar_url?: string | null;
    is_verified_seller?: boolean;
    created_at?: string;
  } | null;
  wallet: {
    account: {
      user_id: string;
      balance_cents: number;
      pending_cents: number;
      total_earned_cents: number;
      total_withdrawn_cents: number;
      created_at?: string;
      updated_at?: string;
    };
    transactions: Array<{
      id: string;
      amount_cents: number;
      direction: 'credit' | 'debit';
      status: 'pending' | 'available' | 'spent' | 'cancelled';
      kind: string;
      description: string | null;
      reference_type: string | null;
      reference_id: string | null;
      metadata?: Record<string, unknown>;
      created_by: string | null;
      created_at: string;
    }>;
  };
};

type AdminWithdrawalRequest = {
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
  user?: { id: string; email?: string; name?: string | null; avatar_url?: string | null } | null;
  reviewer?: { id: string; email?: string; name?: string | null; avatar_url?: string | null } | null;
};

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'] as const;
const PROFILE_THEME_OPTIONS = ['neon-grid', 'sunset-glow', 'arcade-purple', 'mint-wave'] as const;
const WALLET_STATUS_OPTIONS = ['available', 'pending', 'spent'] as const;
const ADMIN_PREFS_STORAGE_KEY = 'advanced-retro-admin-prefs-v1';

const TICKET_REPLY_TEMPLATES = [
  {
    id: 'recibido',
    label: 'Acuse recibo',
    status: 'in_progress' as const,
    template:
      'Hola {nombre}, hemos recibido tu ticket{pedido}. Ya lo estamos revisando y te responderemos con una actualización lo antes posible.',
  },
  {
    id: 'mas-datos',
    label: 'Pedir datos',
    status: 'in_progress' as const,
    template:
      'Hola {nombre}. Para poder ayudarte mejor necesitamos más información{pedido}: fotos del producto/incidencia y una breve descripción de lo ocurrido.',
  },
  {
    id: 'en-proceso-envio',
    label: 'Preparando envío',
    status: 'in_progress' as const,
    template:
      'Hola {nombre}. Tu consulta está revisada{pedido}. Estamos preparando el pedido/envío y te avisaremos en cuanto tengamos actualización o tracking.',
  },
  {
    id: 'tracking',
    label: 'Tracking enviado',
    status: 'resolved' as const,
    template:
      'Hola {nombre}. Tu pedido {pedido_id} ya está enviado. Tracking: {tracking}. Si hay cualquier incidencia de transporte, responde por este mismo ticket.',
  },
  {
    id: 'resuelto',
    label: 'Cerrar ticket',
    status: 'resolved' as const,
    template:
      'Hola {nombre}. Hemos marcado el ticket como resuelto. Si necesitas algo más o la incidencia continúa, puedes responder por aquí y lo reabrimos.',
  },
] as const;

function toEuro(cents: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number(cents || 0) / 100);
}

function shortId(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  return raw.length > 8 ? `#${raw.slice(0, 8)}` : raw;
}

function formatDateTimeShort(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw;
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '');
  if (/[",;\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const csv = [headers.join(';'), ...rows.map((row) => row.map(escapeCsvCell).join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function isSameLocalDay(value: unknown, referenceDate = new Date()): boolean {
  const raw = String(value || '').trim();
  if (!raw) return false;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return false;
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

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
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequest[]>([]);
  const [withdrawalsSummary, setWithdrawalsSummary] = useState<{
    total: number;
    amount_cents: number;
    by_status: Record<string, number>;
  } | null>(null);
  const [withdrawalsSetupRequired, setWithdrawalsSetupRequired] = useState(false);
  const [withdrawalsErrorMessage, setWithdrawalsErrorMessage] = useState<string | null>(null);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('all');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [withdrawalAdminNoteById, setWithdrawalAdminNoteById] = useState<Record<string, string>>({});
  const [walletRows, setWalletRows] = useState<AdminWalletListItem[]>([]);
  const [walletSummary, setWalletSummary] = useState<AdminWalletSummary | null>(null);
  const [walletsSetupRequired, setWalletsSetupRequired] = useState(false);
  const [walletsErrorMessage, setWalletsErrorMessage] = useState<string | null>(null);
  const [walletSearch, setWalletSearch] = useState('');
  const [selectedWalletUserId, setSelectedWalletUserId] = useState('');
  const [selectedWalletDetail, setSelectedWalletDetail] = useState<AdminWalletDetail | null>(null);
  const [walletDetailLoading, setWalletDetailLoading] = useState(false);
  const [walletDetailError, setWalletDetailError] = useState<string | null>(null);
  const [walletAdjustForm, setWalletAdjustForm] = useState({
    direction: 'credit' as 'credit' | 'debit',
    amount_cents: 500,
    status: 'available' as 'available' | 'pending' | 'spent',
    description: '',
  });

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
  const [workbenchOnlyToday, setWorkbenchOnlyToday] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: 10,
    max_uses: 1,
  });
  const [userVisualDraftById, setUserVisualDraftById] = useState<
    Record<string, UserVisualDraft>
  >({});

  const loadWallets = async (search = '') => {
    setWalletsErrorMessage(null);
    setWalletsSetupRequired(false);

    try {
      const url = new URL('/api/admin/wallets', window.location.origin);
      if (search.trim()) url.searchParams.set('q', search.trim());
      url.searchParams.set('limit', '200');

      const res = await fetch(url.pathname + url.search);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setWalletRows([]);
        setWalletSummary(null);
        setWalletsErrorMessage(data?.error || 'No se pudieron cargar las carteras');
        return;
      }

      setWalletRows(Array.isArray(data?.wallets) ? data.wallets : []);
      setWalletSummary(data?.summary || null);
      setWalletsSetupRequired(Boolean(data?.setup_required));
      if (data?.error) setWalletsErrorMessage(String(data.error));
    } catch {
      setWalletRows([]);
      setWalletSummary(null);
      setWalletsErrorMessage('No se pudieron cargar las carteras');
    }
  };

  const openWalletDetail = async (userId: string) => {
    if (!userId) return;
    setSelectedWalletUserId(userId);
    setWalletDetailLoading(true);
    setWalletDetailError(null);

    try {
      const res = await fetch(`/api/admin/wallets/${userId}?tx_limit=60`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSelectedWalletDetail(null);
        setWalletDetailError(data?.error || 'No se pudo abrir la cartera');
        return;
      }
      setSelectedWalletDetail({
        user: data?.user || null,
        wallet: data?.wallet || { account: null, transactions: [] },
      } as AdminWalletDetail);
    } catch {
      setSelectedWalletDetail(null);
      setWalletDetailError('No se pudo abrir la cartera');
    } finally {
      setWalletDetailLoading(false);
    }
  };

  const loadWithdrawals = async (options?: { status?: string; q?: string }) => {
    setWithdrawalsErrorMessage(null);
    setWithdrawalsSetupRequired(false);
    try {
      const url = new URL('/api/admin/wallet-withdrawals', window.location.origin);
      url.searchParams.set('status', (options?.status || withdrawalStatusFilter || 'all').trim() || 'all');
      if ((options?.q ?? withdrawalSearch).trim()) {
        url.searchParams.set('q', (options?.q ?? withdrawalSearch).trim());
      }
      url.searchParams.set('limit', '200');

      const res = await fetch(url.pathname + url.search);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setWithdrawals([]);
        setWithdrawalsSummary(null);
        setWithdrawalsSetupRequired(Boolean(data?.setupRequired));
        setWithdrawalsErrorMessage(data?.error || 'No se pudieron cargar retiradas');
        return;
      }

      setWithdrawals(Array.isArray(data?.requests) ? data.requests : []);
      setWithdrawalsSummary(data?.summary || null);
      setWithdrawalsSetupRequired(Boolean(data?.setupRequired));
      if (typeof data?.error === 'string') setWithdrawalsErrorMessage(data.error);
    } catch {
      setWithdrawals([]);
      setWithdrawalsSummary(null);
      setWithdrawalsErrorMessage('No se pudieron cargar retiradas');
    }
  };

  const updateWithdrawalStatus = async (
    requestId: string,
    status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled'
  ) => {
    const admin_note = (withdrawalAdminNoteById[requestId] || '').trim();

    const res = await fetch(`/api/admin/wallet-withdrawals/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_note }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.error || 'No se pudo actualizar la retirada');
      return;
    }

    toast.success(
      status === 'paid'
        ? 'Retirada marcada como pagada (saldo debitado)'
        : 'Retirada actualizada'
    );

    setWithdrawals((prev) => prev.map((item) => (item.id === requestId ? { ...item, ...data.request } : item)));
    await Promise.all([loadWithdrawals(), loadWallets(walletSearch)]);
    const targetUserId =
      withdrawals.find((item) => item.id === requestId)?.user_id ||
      data?.request?.user_id ||
      selectedWalletUserId;
    if (targetUserId && selectedWalletUserId === targetUserId) {
      await openWalletDetail(targetUserId);
    }
  };

  const exportWithdrawalsCsv = async () => {
    try {
      const params = new URLSearchParams();
      params.set('status', withdrawalStatusFilter || 'all');
      if (withdrawalSearch.trim()) params.set('q', withdrawalSearch.trim());
      params.set('limit', '3000');

      const res = await fetch(`/api/admin/wallet-withdrawals/export?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo exportar CSV');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retiradas-cartera-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV descargado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo exportar CSV');
    }
  };

  const load = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [pRes, oRes, uRes, tRes, lRes, cRes, mRes, wRes, wdRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/users'),
        fetch('/api/admin/chats/tickets'),
        fetch('/api/admin/listings'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/mystery'),
        fetch('/api/admin/wallets?limit=200'),
        fetch('/api/admin/wallet-withdrawals?status=all&limit=150'),
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

      if (wRes.ok) {
        const w = await wRes.json().catch(() => null);
        setWalletRows(Array.isArray(w?.wallets) ? w.wallets : []);
        setWalletSummary(w?.summary || null);
        setWalletsSetupRequired(Boolean(w?.setup_required));
        setWalletsErrorMessage(typeof w?.error === 'string' ? w.error : null);
      } else {
        const wErr = await wRes.json().catch(() => null);
        setWalletRows([]);
        setWalletSummary(null);
        setWalletsSetupRequired(false);
        setWalletsErrorMessage(wErr?.error || 'No se pudieron cargar las carteras');
      }

      if (wdRes.ok) {
        const wd = await wdRes.json().catch(() => null);
        setWithdrawals(Array.isArray(wd?.requests) ? wd.requests : []);
        setWithdrawalsSummary(wd?.summary || null);
        setWithdrawalsSetupRequired(Boolean(wd?.setupRequired));
        setWithdrawalsErrorMessage(typeof wd?.error === 'string' ? wd.error : null);
      } else {
        const wdErr = await wdRes.json().catch(() => null);
        setWithdrawals([]);
        setWithdrawalsSummary(null);
        setWithdrawalsSetupRequired(Boolean(wdErr?.setupRequired));
        setWithdrawalsErrorMessage(wdErr?.error || 'No se pudieron cargar retiradas');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(ADMIN_PREFS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      const nextTab = String((parsed as any).tab || '').trim().toLowerCase();
      const allowedTabs: AdminTab[] = [
        'products',
        'orders',
        'shipping',
        'users',
        'wallets',
        'withdrawals',
        'chats',
        'listings',
        'coupons',
        'mystery',
      ];
      if (allowedTabs.includes(nextTab as AdminTab)) setTab(nextTab as AdminTab);

      if (typeof (parsed as any).withdrawalStatusFilter === 'string') {
        setWithdrawalStatusFilter(String((parsed as any).withdrawalStatusFilter));
      }
      if (typeof (parsed as any).withdrawalSearch === 'string') {
        setWithdrawalSearch(String((parsed as any).withdrawalSearch).slice(0, 120));
      }
      if (typeof (parsed as any).walletSearch === 'string') {
        setWalletSearch(String((parsed as any).walletSearch).slice(0, 120));
      }
      if (typeof (parsed as any).workbenchOnlyToday === 'boolean') {
        setWorkbenchOnlyToday(Boolean((parsed as any).workbenchOnlyToday));
      }
    } catch {
      // ignore malformed local prefs
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      tab,
      withdrawalStatusFilter,
      withdrawalSearch,
      walletSearch,
      workbenchOnlyToday,
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(ADMIN_PREFS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage may be unavailable
    }
  }, [tab, withdrawalStatusFilter, withdrawalSearch, walletSearch, workbenchOnlyToday]);

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

  const getUserVisualDraft = (user: any): UserVisualDraft => {
    const existing = userVisualDraftById[user.id];
    if (existing) return existing;
    const badges = Array.isArray(user.badges)
      ? user.badges.filter((value: unknown) => typeof value === 'string').join(', ')
      : '';
    return {
      badges,
      tagline: String(user.tagline || ''),
      favorite_console: String(user.favorite_console || ''),
      profile_theme: String(user.profile_theme || 'neon-grid'),
    };
  };

  const setUserVisualDraftField = (
    userId: string,
    key: 'badges' | 'tagline' | 'favorite_console' | 'profile_theme',
    value: string
  ) => {
    setUserVisualDraftById((prev) => {
      const currentUser = users.find((user) => user.id === userId);
      const base = currentUser
        ? getUserVisualDraft(currentUser)
        : ({
            badges: '',
            tagline: '',
            favorite_console: '',
            profile_theme: 'neon-grid',
          } satisfies UserVisualDraft);
      return {
        ...prev,
        [userId]: {
          ...base,
          [key]: value,
        },
      };
    });
  };

  const saveUserVisualSettings = async (user: any) => {
    const draft = getUserVisualDraft(user);
    const badges = draft.badges
      .split(/,|\n|;/g)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
    const safeTheme =
      PROFILE_THEME_OPTIONS.find((theme) => theme === draft.profile_theme) || 'neon-grid';

    await updateUser(user.id, {
      badges,
      tagline: draft.tagline,
      favorite_console: draft.favorite_console,
      profile_theme: safeTheme,
    });
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

  const resolveTicketTemplateText = (templateText: string) => {
    const ticket = selectedTicket;
    const orderId = String(ticket?.order_id || '').trim();
    const order = orderId ? orders.find((item) => String(item?.id || '') === orderId) : null;
    const rawName =
      String(ticket?.user?.name || '').trim() ||
      String(ticket?.user?.email || '').trim().split('@')[0] ||
      'cliente';
    const safeName = rawName.length > 1 ? rawName : 'cliente';
    const tracking = String(order?.shipping_tracking_code || '').trim() || 'pendiente de asignar';
    const orderIdShort = orderId ? `#${orderId.slice(0, 8)}` : 'sin pedido';
    const orderSuffix = orderId ? ` sobre el pedido ${orderIdShort}` : '';

    return templateText
      .replaceAll('{nombre}', safeName)
      .replaceAll('{pedido}', orderSuffix)
      .replaceAll('{pedido_id}', orderIdShort)
      .replaceAll('{tracking}', tracking)
      .trim();
  };

  const applyTicketReplyTemplate = (templateId: string) => {
    const template = TICKET_REPLY_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;

    const message = resolveTicketTemplateText(template.template);
    setTicketReply((prev) => {
      const current = prev.trim();
      if (!current) return message;
      return `${current}\n\n${message}`;
    });
    setTicketReplyStatus(template.status);
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

  const submitWalletAdjustment = async () => {
    if (!selectedWalletUserId) {
      toast.error('Selecciona una cartera');
      return;
    }

    const amountCents = Math.round(Number(walletAdjustForm.amount_cents || 0));
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error('El importe debe ser mayor que 0');
      return;
    }

    const payload = {
      user_id: selectedWalletUserId,
      direction: walletAdjustForm.direction,
      amount_cents: amountCents,
      status: walletAdjustForm.status,
      description: walletAdjustForm.description.trim() || undefined,
    };

    const res = await fetch('/api/admin/wallets/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.error || 'No se pudo guardar el ajuste');
      return;
    }

    toast.success(data?.duplicate ? 'Movimiento ya existente (idempotente)' : 'Ajuste aplicado');
    setWalletAdjustForm((prev) => ({
      ...prev,
      description: '',
    }));
    await Promise.all([loadWallets(walletSearch), openWalletDetail(selectedWalletUserId)]);
  };

  const filteredWalletRows = useMemo(() => {
    const q = walletSearch.trim().toLowerCase();
    const base = q
      ? walletRows.filter((entry) => {
          const haystack = [
            entry.user.email,
            entry.user.name || '',
            entry.user.id,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : walletRows;

    return [...base].sort((a, b) => {
      const balanceDiff = Number(b.account.balance_cents || 0) - Number(a.account.balance_cents || 0);
      if (balanceDiff !== 0) return balanceDiff;
      return String(a.user.email || '').localeCompare(String(b.user.email || ''), 'es');
    });
  }, [walletRows, walletSearch]);

  useEffect(() => {
    if (!selectedWalletUserId && filteredWalletRows.length > 0) {
      void openWalletDetail(filteredWalletRows[0].user.id);
      return;
    }

    if (
      selectedWalletUserId &&
      filteredWalletRows.length > 0 &&
      !filteredWalletRows.some((row) => row.user.id === selectedWalletUserId)
    ) {
      void openWalletDetail(filteredWalletRows[0].user.id);
    }
  }, [filteredWalletRows, selectedWalletUserId]);

  const userCountVerified = useMemo(
    () => users.filter((user) => Boolean(user.is_verified_seller)).length,
    [users]
  );

  const pendingOverview = useMemo(() => {
    const orderSource = workbenchOnlyToday
      ? orders.filter((order) => isSameLocalDay(order?.created_at))
      : orders;
    const ticketSource = workbenchOnlyToday
      ? tickets.filter((ticket) => isSameLocalDay(ticket?.updated_at || ticket?.created_at))
      : tickets;
    const withdrawalSource = workbenchOnlyToday
      ? withdrawals.filter((request) => isSameLocalDay(request?.updated_at || request?.created_at))
      : withdrawals;
    const listingSource = workbenchOnlyToday
      ? listings.filter((listing) => isSameLocalDay(listing?.updated_at || listing?.created_at))
      : listings;

    const shipping = orderSource.filter((order) => Boolean(order?.needs_shipping)).length;
    const ticketsOpen = ticketSource.filter((ticket) => ['open', 'in_progress'].includes(String(ticket.status))).length;
    const ticketsWaitingCustomer = ticketSource.filter(
      (ticket) => ticket.last_message && ticket.last_message.is_admin
    ).length;
    const withdrawalsPending = withdrawalSource.filter((request) =>
      ['pending', 'approved'].includes(String(request.status || '').toLowerCase())
    ).length;
    const listingsReview = listingSource.filter((listing) => String(listing?.status || '') === 'pending_review').length;
    return {
      shipping,
      ticketsOpen,
      ticketsWaitingCustomer,
      withdrawalsPending,
      listingsReview,
      totalActionable: shipping + ticketsOpen + withdrawalsPending + listingsReview,
    };
  }, [orders, tickets, withdrawals, listings, workbenchOnlyToday]);

  const workbenchQueues = useMemo(() => {
    const orderSource = workbenchOnlyToday
      ? orders.filter((order) => isSameLocalDay(order?.created_at))
      : orders;
    const ticketSource = workbenchOnlyToday
      ? tickets.filter((ticket) => isSameLocalDay(ticket?.updated_at || ticket?.created_at))
      : tickets;
    const withdrawalSource = workbenchOnlyToday
      ? withdrawals.filter((request) => isSameLocalDay(request?.updated_at || request?.created_at))
      : withdrawals;
    const listingSource = workbenchOnlyToday
      ? listings.filter((listing) => isSameLocalDay(listing?.updated_at || listing?.created_at))
      : listings;

    const shippingQueue = orderSource
      .filter((order) => Boolean(order?.needs_shipping))
      .slice(0, 6);
    const ticketQueue = ticketSource
      .filter((ticket) => ['open', 'in_progress'].includes(String(ticket.status)))
      .slice(0, 6);
    const withdrawalQueue = withdrawalSource
      .filter((request) => ['pending', 'approved'].includes(String(request.status || '').toLowerCase()))
      .slice(0, 6);
    const listingQueue = listingSource
      .filter((listing) => String(listing?.status || '') === 'pending_review')
      .slice(0, 6);

    return { shippingQueue, ticketQueue, withdrawalQueue, listingQueue };
  }, [orders, tickets, withdrawals, listings, workbenchOnlyToday]);

  const exportOrdersCsvLocal = () => {
    if (orders.length === 0) {
      toast.error('No hay pedidos para exportar');
      return;
    }
    downloadCsvFile(
      `pedidos-admin-${new Date().toISOString().slice(0, 10)}.csv`,
      ['id', 'estado', 'total_eur', 'user_email', 'tracking', 'needs_shipping', 'created_at'],
      orders.map((order) => [
        order.id,
        order.status,
        (Number(order.total || 0) / 100).toFixed(2),
        order.user?.email || order.user_id || '',
        order.shipping_tracking_code || '',
        order.needs_shipping ? 'yes' : 'no',
        order.created_at || '',
      ])
    );
    toast.success('CSV de pedidos descargado');
  };

  const exportTicketsCsvLocal = () => {
    if (tickets.length === 0) {
      toast.error('No hay tickets para exportar');
      return;
    }
    downloadCsvFile(
      `tickets-admin-${new Date().toISOString().slice(0, 10)}.csv`,
      ['id', 'estado', 'subject', 'user_email', 'order_id', 'updated_at', 'ultimo_mensaje_admin'],
      tickets.map((ticket) => [
        ticket.id,
        ticket.status,
        ticket.subject,
        ticket.user?.email || ticket.user_id,
        ticket.order_id || '',
        ticket.updated_at || '',
        ticket.last_message?.is_admin ? 'yes' : 'no',
      ])
    );
    toast.success('CSV de tickets descargado');
  };

  const exportListingsCsvLocal = () => {
    if (listings.length === 0) {
      toast.error('No hay publicaciones para exportar');
      return;
    }
    downloadCsvFile(
      `marketplace-comunidad-${new Date().toISOString().slice(0, 10)}.csv`,
      ['id', 'estado', 'titulo', 'precio_eur', 'seller', 'delivery_status', 'created_at'],
      listings.map((listing) => [
        listing.id,
        listing.status,
        listing.title,
        (Number(listing.price || 0) / 100).toFixed(2),
        listing.user?.email || listing.user?.name || listing.user_id || '',
        listing.delivery_status || '',
        listing.created_at || '',
      ])
    );
    toast.success('CSV de publicaciones descargado');
  };

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-primary font-mono text-xs">ADVANCED RETRO ADMIN</p>
            <h1 className="title-display text-3xl mt-2">Panel de administración</h1>
            <p className="text-textMuted mt-1">Gestión de catálogo, pedidos, usuarios, carteras, chats y publicaciones.</p>
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

        <div className="glass p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Panel de pendientes</p>
              <h2 className="text-lg font-semibold mt-1">
                Acciones pendientes: {pendingOverview.totalActionable}
                {workbenchOnlyToday ? ' (hoy)' : ''}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`chip ${workbenchOnlyToday ? 'border-primary text-primary' : ''}`}
                onClick={() => setWorkbenchOnlyToday((prev) => !prev)}
              >
                {workbenchOnlyToday ? 'Vista: solo hoy' : 'Vista: todo'}
              </button>
              <button className="chip" onClick={load} disabled={loading}>
                {loading ? 'Actualizando...' : 'Recalcular panel'}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('shipping')}>
              <p className="text-xs text-textMuted">Envíos pendientes</p>
              <p className="text-xl font-semibold text-primary mt-1">{pendingOverview.shipping}</p>
              <p className="text-xs text-textMuted mt-1">Pedidos pagados sin tracking</p>
            </button>
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('chats')}>
              <p className="text-xs text-textMuted">Tickets abiertos</p>
              <p className="text-xl font-semibold text-primary mt-1">{pendingOverview.ticketsOpen}</p>
              <p className="text-xs text-textMuted mt-1">open / in_progress</p>
            </button>
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('withdrawals')}>
              <p className="text-xs text-textMuted">Retiradas pendientes</p>
              <p className="text-xl font-semibold text-primary mt-1">{pendingOverview.withdrawalsPending}</p>
              <p className="text-xs text-textMuted mt-1">pending / approved</p>
            </button>
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('listings')}>
              <p className="text-xs text-textMuted">Publicaciones a revisar</p>
              <p className="text-xl font-semibold text-primary mt-1">{pendingOverview.listingsReview}</p>
              <p className="text-xs text-textMuted mt-1">Marketplace comunidad</p>
            </button>
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('chats')}>
              <p className="text-xs text-textMuted">Chats esperando cliente</p>
              <p className="text-xl font-semibold text-primary mt-1">{pendingOverview.ticketsWaitingCustomer}</p>
              <p className="text-xs text-textMuted mt-1">Último mensaje admin</p>
            </button>
          </div>
        </div>

        <div className="glass p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Bandeja de trabajo</p>
              <h2 className="text-lg font-semibold mt-1">Pendientes + acciones rápidas + exportes</h2>
              <p className="text-xs text-textMuted mt-1">
                Vista operativa para gestionar el día sin entrar en cada pestaña.
                {workbenchOnlyToday ? ' Filtrada por trabajo de hoy.' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`chip ${workbenchOnlyToday ? 'border-primary text-primary' : ''}`}
                onClick={() => setWorkbenchOnlyToday((prev) => !prev)}
              >
                {workbenchOnlyToday ? 'Solo trabajo de hoy' : 'Ver todo'}
              </button>
              <button
                className="chip"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    try {
                      window.localStorage.removeItem(ADMIN_PREFS_STORAGE_KEY);
                    } catch {
                      // ignore
                    }
                  }
                  setWorkbenchOnlyToday(false);
                  setWithdrawalStatusFilter('all');
                  setWithdrawalSearch('');
                  setWalletSearch('');
                  setTab('products');
                  toast.success('Preferencias de admin restablecidas');
                }}
              >
                Reset filtros guardados
              </button>
              <button className="chip" onClick={exportOrdersCsvLocal}>
                Export pedidos CSV
              </button>
              <button className="chip" onClick={exportTicketsCsvLocal}>
                Export tickets CSV
              </button>
              <button className="chip" onClick={exportListingsCsvLocal}>
                Export comunidad CSV
              </button>
              <button className="chip" onClick={exportWithdrawalsCsv}>
                Export retiradas CSV
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('shipping')}>
              <p className="text-xs text-textMuted">Acción rápida</p>
              <p className="font-semibold mt-1">Gestionar envíos</p>
              <p className="text-xs text-textMuted mt-1">Ir a pedidos listos para enviar</p>
            </button>
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('chats')}>
              <p className="text-xs text-textMuted">Acción rápida</p>
              <p className="font-semibold mt-1">Responder tickets</p>
              <p className="text-xs text-textMuted mt-1">Abrir chat de soporte y usar plantillas</p>
            </button>
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('withdrawals')}>
              <p className="text-xs text-textMuted">Acción rápida</p>
              <p className="font-semibold mt-1">Procesar retiradas</p>
              <p className="text-xs text-textMuted mt-1">Aprobar, rechazar o marcar pagada</p>
            </button>
            <button className="border border-line p-3 text-left hover:border-primary/50" onClick={() => setTab('listings')}>
              <p className="text-xs text-textMuted">Acción rápida</p>
              <p className="font-semibold mt-1">Moderar comunidad</p>
              <p className="text-xs text-textMuted mt-1">Revisión de anuncios y entrega</p>
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="border border-line p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold">Cola de envíos ({workbenchQueues.shippingQueue.length})</h3>
                <button className="chip" onClick={() => setTab('shipping')}>
                  Abrir
                </button>
              </div>
              <div className="space-y-2">
                {workbenchQueues.shippingQueue.length === 0 ? (
                  <p className="text-xs text-textMuted">No hay pedidos pendientes de envío.</p>
                ) : (
                  workbenchQueues.shippingQueue.map((order) => (
                    <div key={`wb-shipping-${order.id}`} className="border border-line px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-primary font-mono">{shortId(order.id)}</p>
                          <p className="text-sm">{order.user?.email || order.user_id}</p>
                          <p className="text-xs text-textMuted">{formatDateTimeShort(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{toEuro(Number(order.total || 0))}</p>
                          <p className="text-xs text-textMuted">{order.status}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-line p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold">Cola de tickets ({workbenchQueues.ticketQueue.length})</h3>
                <button className="chip" onClick={() => setTab('chats')}>
                  Abrir
                </button>
              </div>
              <div className="space-y-2">
                {workbenchQueues.ticketQueue.length === 0 ? (
                  <p className="text-xs text-textMuted">No hay tickets abiertos.</p>
                ) : (
                  workbenchQueues.ticketQueue.map((ticket) => (
                    <button
                      key={`wb-ticket-${ticket.id}`}
                      type="button"
                      className="w-full border border-line px-3 py-2 text-left hover:border-primary/50"
                      onClick={() => {
                        setTab('chats');
                        void openTicket(ticket.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-primary font-mono">{shortId(ticket.id)}</p>
                          <p className="text-sm line-clamp-1">{ticket.subject}</p>
                          <p className="text-xs text-textMuted line-clamp-1">
                            {ticket.user?.email || ticket.user_id} · {ticket.status}
                          </p>
                        </div>
                        <p className="text-xs text-textMuted whitespace-nowrap">
                          {formatDateTimeShort(ticket.updated_at)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="border border-line p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold">Cola de retiradas ({workbenchQueues.withdrawalQueue.length})</h3>
                <button className="chip" onClick={() => setTab('withdrawals')}>
                  Abrir
                </button>
              </div>
              <div className="space-y-2">
                {workbenchQueues.withdrawalQueue.length === 0 ? (
                  <p className="text-xs text-textMuted">No hay retiradas pendientes.</p>
                ) : (
                  workbenchQueues.withdrawalQueue.map((request) => (
                    <div key={`wb-withdrawal-${request.id}`} className="border border-line px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-primary font-mono">{shortId(request.id)}</p>
                          <p className="text-sm">{request.user?.email || request.user_id}</p>
                          <p className="text-xs text-textMuted">
                            {String(request.status || '').toUpperCase()} · {formatDateTimeShort(request.created_at)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{toEuro(Number(request.amount_cents || 0))}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-line p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold">Cola de anuncios ({workbenchQueues.listingQueue.length})</h3>
                <button className="chip" onClick={() => setTab('listings')}>
                  Abrir
                </button>
              </div>
              <div className="space-y-2">
                {workbenchQueues.listingQueue.length === 0 ? (
                  <p className="text-xs text-textMuted">No hay anuncios pendientes de revisión.</p>
                ) : (
                  workbenchQueues.listingQueue.map((listing) => (
                    <div key={`wb-listing-${listing.id}`} className="border border-line px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-primary font-mono">{shortId(listing.id)}</p>
                          <p className="text-sm line-clamp-1">{listing.title}</p>
                          <p className="text-xs text-textMuted line-clamp-1">
                            {listing.user?.email || listing.user_id || 'seller'} · {listing.category || 'sin categoría'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{toEuro(Number(listing.price || 0))}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {(['products', 'orders', 'shipping', 'users', 'wallets', 'withdrawals', 'chats', 'listings', 'coupons', 'mystery'] as const).map((t) => (
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
                const visualDraft = getUserVisualDraft(u);
                const badgesCount = visualDraft.badges
                  .split(/,|\n|;/g)
                  .map((value) => value.trim())
                  .filter(Boolean).length;

                return (
                  <div key={u.id} className="border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-line bg-slate-900">
                          {u.avatar_url ? (
                            <div
                              className="h-full w-full bg-cover bg-center"
                              style={{ backgroundImage: `url('${String(u.avatar_url).replace(/'/g, '%27')}')` }}
                              role="img"
                              aria-label={u.name || u.email}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                              {String(u.name || u.email || 'U').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{u.name || u.email}</p>
                          <p className="text-xs text-textMuted">{u.email}</p>
                          <p className="text-xs text-textMuted">ID: {u.id}</p>
                          <p className="text-xs text-textMuted mt-1">
                            Tema: {u.profile_theme || 'neon-grid'} · Insignias: {badgesCount}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="chip"
                          onClick={() => {
                            setTab('wallets');
                            setWalletSearch(u.email || '');
                            void openWalletDetail(u.id);
                          }}
                        >
                          Ver cartera
                        </button>
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

                    <div className="grid gap-3 mt-3 lg:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs text-textMuted">Insignias (coma separada)</span>
                        <input
                          className="bg-transparent border border-line px-3 py-2 text-sm"
                          value={visualDraft.badges}
                          onChange={(e) => setUserVisualDraftField(u.id, 'badges', e.target.value)}
                          placeholder="collector, trusted_seller, retro_master"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs text-textMuted">Tema visual</span>
                        <select
                          className="bg-transparent border border-line px-3 py-2 text-sm"
                          value={visualDraft.profile_theme}
                          onChange={(e) => setUserVisualDraftField(u.id, 'profile_theme', e.target.value)}
                        >
                          {PROFILE_THEME_OPTIONS.map((theme) => (
                            <option key={`${u.id}-${theme}`} value={theme}>
                              {theme}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs text-textMuted">Tagline</span>
                        <input
                          className="bg-transparent border border-line px-3 py-2 text-sm"
                          value={visualDraft.tagline}
                          onChange={(e) => setUserVisualDraftField(u.id, 'tagline', e.target.value)}
                          placeholder="Tu vitrina de coleccionismo retro"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs text-textMuted">Consola favorita</span>
                        <input
                          className="bg-transparent border border-line px-3 py-2 text-sm"
                          value={visualDraft.favorite_console}
                          onChange={(e) => setUserVisualDraftField(u.id, 'favorite_console', e.target.value)}
                          placeholder="Game Boy"
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button className="chip" onClick={() => saveUserVisualSettings(u)}>
                        Guardar perfil visual
                      </button>
                    </div>
                    {u.bio ? <p className="text-sm text-textMuted mt-2">Bio: {u.bio}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'wallets' && (
          <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
            <div className="glass p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="font-semibold">Carteras internas</h2>
                <button
                  className="chip"
                  onClick={() => {
                    void loadWallets(walletSearch);
                    if (selectedWalletUserId) void openWalletDetail(selectedWalletUserId);
                  }}
                >
                  Refrescar
                </button>
              </div>

              <div className="grid gap-2 mb-3">
                <input
                  className="bg-transparent border border-line px-3 py-2 text-sm"
                  placeholder="Buscar por email, nombre o ID"
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                />
                <div className="flex gap-2">
                  <button className="chip" onClick={() => void loadWallets(walletSearch)}>
                    Buscar
                  </button>
                  {walletSearch ? (
                    <button
                      className="chip"
                      onClick={() => {
                        setWalletSearch('');
                        void loadWallets('');
                      }}
                    >
                      Limpiar
                    </button>
                  ) : null}
                </div>
              </div>

              {walletSummary ? (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="border border-line p-2">
                    <p className="text-xs text-textMuted">Usuarios</p>
                    <p className="text-sm font-semibold">{walletSummary.users}</p>
                    <p className="text-[11px] text-textMuted">Inicializadas: {walletSummary.initialized}</p>
                  </div>
                  <div className="border border-line p-2">
                    <p className="text-xs text-textMuted">Saldo disponible total</p>
                    <p className="text-sm font-semibold text-primary">{toEuro(walletSummary.balance_cents)}</p>
                  </div>
                  <div className="border border-line p-2">
                    <p className="text-xs text-textMuted">Saldo pendiente</p>
                    <p className="text-sm font-semibold">{toEuro(walletSummary.pending_cents)}</p>
                  </div>
                  <div className="border border-line p-2">
                    <p className="text-xs text-textMuted">Total retirado</p>
                    <p className="text-sm font-semibold">{toEuro(walletSummary.total_withdrawn_cents)}</p>
                  </div>
                </div>
              ) : null}

              {walletsErrorMessage ? (
                <div className="border border-line p-3 mb-3 text-sm">
                  <p className="text-red-400">{walletsErrorMessage}</p>
                  {walletsSetupRequired ? (
                    <p className="text-xs text-textMuted mt-1">
                      Ejecuta en Supabase SQL Editor: <span className="text-primary">database/internal_wallet_mvp.sql</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2 max-h-[720px] overflow-auto pr-1">
                {filteredWalletRows.map((entry) => {
                  const active = selectedWalletUserId === entry.user.id;
                  return (
                    <button
                      key={entry.user.id}
                      className={`w-full text-left border p-3 ${active ? 'border-primary' : 'border-line'}`}
                      onClick={() => void openWalletDetail(entry.user.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">
                            {entry.user.name || entry.user.email}
                          </p>
                          <p className="text-xs text-textMuted line-clamp-1">{entry.user.email}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {entry.user.role === 'admin' ? (
                              <span className="chip text-[10px] text-primary border-primary">Admin</span>
                            ) : null}
                            {entry.user.is_verified_seller ? (
                              <span className="chip text-[10px] text-primary border-primary">Verificado</span>
                            ) : null}
                            {!entry.account.initialized ? (
                              <span className="chip text-[10px]">Sin inicializar</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-textMuted">Disponible</p>
                          <p className="text-sm font-semibold text-primary">
                            {toEuro(entry.account.balance_cents)}
                          </p>
                          <p className="text-[11px] text-textMuted">
                            Pend: {toEuro(entry.account.pending_cents)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredWalletRows.length === 0 ? (
                  <p className="text-sm text-textMuted">
                    {walletsSetupRequired ? 'Cartera pendiente de configurar en Supabase.' : 'No hay resultados de carteras.'}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="glass p-6">
              {!selectedWalletUserId ? (
                <p className="text-textMuted">Selecciona una cartera para ver movimientos y hacer ajustes.</p>
              ) : walletDetailLoading ? (
                <p className="text-textMuted">Cargando cartera...</p>
              ) : walletDetailError ? (
                <div className="border border-line p-3">
                  <p className="text-red-400">{walletDetailError}</p>
                </div>
              ) : !selectedWalletDetail?.wallet?.account ? (
                <p className="text-textMuted">No se pudo cargar la cartera seleccionada.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs text-primary font-mono">CARTERA USUARIO</p>
                      <h2 className="font-semibold text-lg mt-1">
                        {selectedWalletDetail.user?.name || selectedWalletDetail.user?.email || selectedWalletUserId}
                      </h2>
                      <p className="text-xs text-textMuted">
                        {selectedWalletDetail.user?.email || selectedWalletUserId}
                      </p>
                      <p className="text-xs text-textMuted mt-1">
                        ID: {selectedWalletDetail.wallet.account.user_id}
                      </p>
                    </div>
                    <button
                      className="chip"
                      onClick={() => void openWalletDetail(selectedWalletUserId)}
                    >
                      Recargar movimientos
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
                    <div className="border border-line p-3">
                      <p className="text-xs text-textMuted">Disponible</p>
                      <p className="text-lg font-semibold text-primary">
                        {toEuro(selectedWalletDetail.wallet.account.balance_cents)}
                      </p>
                    </div>
                    <div className="border border-line p-3">
                      <p className="text-xs text-textMuted">Pendiente</p>
                      <p className="text-lg font-semibold">
                        {toEuro(selectedWalletDetail.wallet.account.pending_cents)}
                      </p>
                    </div>
                    <div className="border border-line p-3">
                      <p className="text-xs text-textMuted">Ganado total</p>
                      <p className="text-lg font-semibold">
                        {toEuro(selectedWalletDetail.wallet.account.total_earned_cents)}
                      </p>
                    </div>
                    <div className="border border-line p-3">
                      <p className="text-xs text-textMuted">Retirado total</p>
                      <p className="text-lg font-semibold">
                        {toEuro(selectedWalletDetail.wallet.account.total_withdrawn_cents)}
                      </p>
                    </div>
                  </div>

                  <div className="border border-line p-4 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h3 className="font-semibold">Ajuste manual de saldo</h3>
                      <p className="text-xs text-textMuted">
                        Abonos/cargos internos (MVP)
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        className="bg-transparent border border-line px-3 py-2"
                        value={walletAdjustForm.direction}
                        onChange={(e) =>
                          setWalletAdjustForm((prev) => ({
                            ...prev,
                            direction: e.target.value === 'debit' ? 'debit' : 'credit',
                          }))
                        }
                      >
                        <option value="credit">Abono (credit)</option>
                        <option value="debit">Cargo (debit)</option>
                      </select>
                      <select
                        className="bg-transparent border border-line px-3 py-2"
                        value={walletAdjustForm.status}
                        onChange={(e) =>
                          setWalletAdjustForm((prev) => ({
                            ...prev,
                            status: (WALLET_STATUS_OPTIONS.find((v) => v === e.target.value) || 'available') as
                              | 'available'
                              | 'pending'
                              | 'spent',
                          }))
                        }
                      >
                        {WALLET_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <input
                        className="bg-transparent border border-line px-3 py-2"
                        type="number"
                        min={1}
                        step={1}
                        value={walletAdjustForm.amount_cents}
                        onChange={(e) =>
                          setWalletAdjustForm((prev) => ({
                            ...prev,
                            amount_cents: Math.max(0, Math.round(Number(e.target.value || 0))),
                          }))
                        }
                        placeholder="Importe en céntimos"
                      />
                      <div className="border border-line px-3 py-2 text-sm">
                        Equivale a: <span className="text-primary font-semibold">{toEuro(walletAdjustForm.amount_cents)}</span>
                      </div>
                      <textarea
                        className="md:col-span-2 bg-transparent border border-line px-3 py-2 min-h-[90px]"
                        placeholder="Motivo (ej. Ajuste manual por incidencia, bono de compensación...)"
                        value={walletAdjustForm.description}
                        onChange={(e) =>
                          setWalletAdjustForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                      />
                      <div className="md:col-span-2 flex justify-end">
                        <button className="button-primary" onClick={submitWalletAdjustment}>
                          Aplicar ajuste
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h3 className="font-semibold">Movimientos recientes</h3>
                      <p className="text-xs text-textMuted">
                        {(selectedWalletDetail.wallet.transactions || []).length} movimientos
                      </p>
                    </div>
                    <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                      {(selectedWalletDetail.wallet.transactions || []).length === 0 ? (
                        <p className="text-sm text-textMuted">Aún no hay movimientos en esta cartera.</p>
                      ) : (
                        selectedWalletDetail.wallet.transactions.map((tx) => (
                          <div key={tx.id} className="border border-line p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">
                                  {tx.description || tx.kind}
                                </p>
                                <p className="text-xs text-textMuted">
                                  {tx.kind} · {tx.direction} · {tx.status}
                                </p>
                                <p className="text-xs text-textMuted mt-1">
                                  {new Date(tx.created_at).toLocaleString('es-ES')}
                                </p>
                                {tx.reference_type || tx.reference_id ? (
                                  <p className="text-xs text-textMuted mt-1">
                                    Ref: {tx.reference_type || '-'} / {tx.reference_id || '-'}
                                  </p>
                                ) : null}
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-sm font-semibold ${
                                    tx.direction === 'credit' ? 'text-primary' : 'text-amber-300'
                                  }`}
                                >
                                  {tx.direction === 'credit' ? '+' : '-'}
                                  {toEuro(tx.amount_cents)}
                                </p>
                                <p className="text-xs text-textMuted">{tx.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'withdrawals' && (
          <div className="glass p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold">Solicitudes de retirada</h2>
                <p className="text-xs text-textMuted mt-1">
                  Gestión de aprobaciones y pagos de cartera interna (MVP).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="chip" onClick={exportWithdrawalsCsv}>
                  Export CSV
                </button>
                <button className="chip" onClick={() => void loadWithdrawals()}>
                  Refrescar retiradas
                </button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[220px,1fr,auto] mb-4">
              <select
                className="bg-transparent border border-line px-3 py-2"
                value={withdrawalStatusFilter}
                onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
                <option value="paid">Pagadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <input
                className="bg-transparent border border-line px-3 py-2"
                placeholder="Buscar por email, nombre, ID o nota"
                value={withdrawalSearch}
                onChange={(e) => setWithdrawalSearch(e.target.value)}
              />
              <button
                className="chip"
                onClick={() => void loadWithdrawals({ status: withdrawalStatusFilter, q: withdrawalSearch })}
              >
                Buscar
              </button>
            </div>

            {withdrawalsSummary ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
                <div className="border border-line p-3">
                  <p className="text-xs text-textMuted">Solicitudes</p>
                  <p className="text-lg font-semibold">{withdrawalsSummary.total}</p>
                </div>
                <div className="border border-line p-3">
                  <p className="text-xs text-textMuted">Importe total</p>
                  <p className="text-lg font-semibold text-primary">{toEuro(withdrawalsSummary.amount_cents)}</p>
                </div>
                <div className="border border-line p-3">
                  <p className="text-xs text-textMuted">Pendientes</p>
                  <p className="text-lg font-semibold">{Number(withdrawalsSummary.by_status?.pending || 0)}</p>
                </div>
                <div className="border border-line p-3">
                  <p className="text-xs text-textMuted">Pagadas</p>
                  <p className="text-lg font-semibold">{Number(withdrawalsSummary.by_status?.paid || 0)}</p>
                </div>
              </div>
            ) : null}

            {withdrawalsErrorMessage ? (
              <div className="border border-line p-3 mb-4">
                <p className="text-red-400">{withdrawalsErrorMessage}</p>
                {withdrawalsSetupRequired ? (
                  <p className="text-xs text-textMuted mt-1">
                    Ejecuta en Supabase SQL Editor: <span className="text-primary">database/wallet_withdrawal_requests_mvp.sql</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-4">
              {withdrawals.map((request) => (
                <div key={request.id} className="border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {request.user?.name || request.user?.email || request.user_id}
                      </p>
                      <p className="text-xs text-textMuted">{request.user?.email || request.user_id}</p>
                      <p className="text-xs text-textMuted mt-1">
                        #{request.id} · {request.payout_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">{toEuro(request.amount_cents)}</p>
                      <p className="text-xs text-textMuted">Estado: {request.status}</p>
                      {request.paid_at ? (
                        <p className="text-xs text-textMuted">Pagada: {new Date(request.paid_at).toLocaleString('es-ES')}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 mt-3 md:grid-cols-2">
                    <div className="text-xs text-textMuted space-y-1">
                      <p>Creada: {request.created_at ? new Date(request.created_at).toLocaleString('es-ES') : '-'}</p>
                      <p>Revisada: {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString('es-ES') : '-'}</p>
                      {request.wallet_transaction_id ? <p>Tx cartera: {request.wallet_transaction_id}</p> : null}
                    </div>
                    <div className="text-xs text-textMuted space-y-1">
                      {request.note ? <p>Nota usuario: {request.note}</p> : <p>Nota usuario: -</p>}
                      {request.payout_details?.account_holder ? (
                        <p>Titular: {String(request.payout_details.account_holder)}</p>
                      ) : null}
                      {request.payout_details?.iban_masked ? (
                        <p>IBAN: {String(request.payout_details.iban_masked)}</p>
                      ) : null}
                      {request.payout_details?.bank_name ? (
                        <p>Banco: {String(request.payout_details.bank_name)}</p>
                      ) : null}
                      {request.reviewer?.email ? <p>Revisado por: {request.reviewer.email}</p> : null}
                    </div>
                  </div>

                  <textarea
                    className="w-full bg-transparent border border-line px-3 py-2 mt-3 min-h-[80px]"
                    placeholder="Nota interna de administración..."
                    value={withdrawalAdminNoteById[request.id] ?? request.admin_note ?? ''}
                    onChange={(e) =>
                      setWithdrawalAdminNoteById((prev) => ({
                        ...prev,
                        [request.id]: e.target.value,
                      }))
                    }
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="chip" onClick={() => updateWithdrawalStatus(request.id, 'approved')}>
                      Aprobar
                    </button>
                    <button className="chip" onClick={() => updateWithdrawalStatus(request.id, 'rejected')}>
                      Rechazar
                    </button>
                    <button className="chip" onClick={() => updateWithdrawalStatus(request.id, 'cancelled')}>
                      Cancelar
                    </button>
                    <button
                      className="chip text-primary border-primary"
                      onClick={() => updateWithdrawalStatus(request.id, 'paid')}
                    >
                      Marcar pagada (debita saldo)
                    </button>
                    <button className="chip" onClick={() => updateWithdrawalStatus(request.id, 'pending')}>
                      Volver a pendiente
                    </button>
                    {request.user_id ? (
                      <button
                        className="chip"
                        onClick={() => {
                          setTab('wallets');
                          setWalletSearch(request.user?.email || '');
                          void openWalletDetail(request.user_id);
                        }}
                      >
                        Abrir cartera
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}

              {withdrawals.length === 0 ? (
                <p className="text-sm text-textMuted">
                  {withdrawalsSetupRequired
                    ? 'Sistema de retiradas pendiente de configurar en Supabase.'
                    : 'No hay solicitudes de retirada con los filtros actuales.'}
                </p>
              ) : null}
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
                    <div className="flex flex-wrap gap-2">
                      {TICKET_REPLY_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          className="chip"
                          onClick={() => applyTicketReplyTemplate(template.id)}
                          type="button"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
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
