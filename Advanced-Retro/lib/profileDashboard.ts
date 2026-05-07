import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { AppUserProfile } from '@/lib/serverAuth';
import { getFavoriteProductsForUser, normalizeFavoritesVisibility } from '@/lib/profileFavorites';
import { listUserTickets } from '@/lib/supportTickets';

export type ProfileDashboardOrderItem = {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  name: string;
  image: string | null;
};

export type ProfileDashboardOrder = {
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
  items: ProfileDashboardOrderItem[];
};

export type ProfileDashboardReview = {
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

export type ProfileDashboardSession = {
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

export type ProfileDashboardPayload = {
  profile: AppUserProfile;
  stats: {
    orders_count: number;
    favorites_count: number;
    reviews_count: number;
    open_tickets_count: number;
    total_spent_cents: number;
  };
  favorites: {
    visibility: 'public' | 'members' | 'private';
    items: Awaited<ReturnType<typeof getFavoriteProductsForUser>>['items'];
    total: number;
  };
  orders: ProfileDashboardOrder[];
  tickets: Awaited<ReturnType<typeof listUserTickets>>;
  reviews: ProfileDashboardReview[];
  sessions: ProfileDashboardSession[];
  usage_summary: Record<string, any> | null;
};

function isMissingSchemaError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('column') ||
    message.includes('function')
  );
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const safe = value.trim();
  return safe || null;
}

function toIsoOrNull(value: unknown): string | null {
  const safe = toStringOrNull(value);
  if (!safe) return null;
  const ts = new Date(safe).getTime();
  if (!Number.isFinite(ts)) return null;
  return new Date(ts).toISOString();
}

function toNumber(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCents(value: unknown): number {
  return Math.max(0, Math.round(toNumber(value)));
}

function normalizeUsageSummary(input: any) {
  if (!input || typeof input !== 'object') return null;
  return input;
}

export async function loadProfileDashboard(userId: string, profile: AppUserProfile): Promise<ProfileDashboardPayload> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const [favoritesResult, ticketsResult, ordersResult, reviewsResult, sessionsResult, usageResult] =
    await Promise.all([
      getFavoriteProductsForUser(userId, 120).catch(() => ({ available: false, items: [], total: 0 })),
      listUserTickets(userId).catch(() => []),
      supabaseAdmin.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(40),
      supabaseAdmin
        .from('product_social_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('user_usage_sessions')
        .select('session_id,started_at,last_seen_at,ended_at,active_seconds,heartbeat_count,page_views,last_path,user_agent')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false })
        .limit(20),
      supabaseAdmin.rpc('get_user_usage_summary', { p_user_id: userId }),
    ]);

  const ordersRows = !ordersResult.error && Array.isArray(ordersResult.data) ? ordersResult.data : [];
  const reviewsRows = !reviewsResult.error && Array.isArray(reviewsResult.data) ? reviewsResult.data : [];
  const sessionRows = !sessionsResult.error && Array.isArray(sessionsResult.data) ? sessionsResult.data : [];

  if (ordersResult.error && !isMissingSchemaError(ordersResult.error)) {
    throw new Error(ordersResult.error.message || 'No se pudieron cargar los pedidos');
  }

  const orderIds = ordersRows.map((row: any) => String(row?.id || '').trim()).filter(Boolean);
  const orderItemsResult = orderIds.length
    ? await supabaseAdmin
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: true })
    : { data: [], error: null as any };

  if (orderItemsResult.error && !isMissingSchemaError(orderItemsResult.error)) {
    throw new Error(orderItemsResult.error.message || 'No se pudieron cargar los artículos del pedido');
  }

  const orderItemsRows = Array.isArray(orderItemsResult.data) ? orderItemsResult.data : [];
  const productIds = [
    ...new Set(
      [
        ...orderItemsRows.map((item: any) => String(item?.product_id || '').trim()),
        ...reviewsRows.map((review: any) => String(review?.product_id || '').trim()),
      ].filter(Boolean)
    ),
  ];

  const productsResult = productIds.length
    ? await supabaseAdmin.from('products').select('id,name,image,images').in('id', productIds)
    : { data: [], error: null as any };

  if (productsResult.error && !isMissingSchemaError(productsResult.error)) {
    throw new Error(productsResult.error.message || 'No se pudieron cargar los productos asociados');
  }

  const productMap = new Map<string, any>();
  for (const row of productsResult.data || []) {
    const id = String((row as any)?.id || '').trim();
    if (!id) continue;
    productMap.set(id, row);
  }

  const orderItemsByOrder = new Map<string, ProfileDashboardOrderItem[]>();
  for (const item of orderItemsRows) {
    const orderId = String((item as any)?.order_id || '').trim();
    if (!orderId) continue;
    const productId = String((item as any)?.product_id || '').trim() || null;
    const snapshot = (item as any)?.product_snapshot && typeof (item as any).product_snapshot === 'object'
      ? (item as any).product_snapshot
      : null;
    const product = productId ? productMap.get(productId) : null;
    const imageFromSnapshot = snapshot
      ? typeof snapshot.image === 'string'
        ? snapshot.image
        : Array.isArray(snapshot.images)
          ? String(snapshot.images.find((value: unknown) => typeof value === 'string') || '')
          : ''
      : '';

    const normalizedItem: ProfileDashboardOrderItem = {
      id: String((item as any)?.id || ''),
      product_id: productId,
      quantity: Math.max(1, Math.round(toNumber((item as any)?.quantity || 1))),
      unit_price_cents: normalizeCents((item as any)?.unit_price_cents ?? (item as any)?.unit_price),
      total_price_cents: normalizeCents((item as any)?.total_price_cents ?? (item as any)?.total_price),
      name:
        (snapshot && typeof snapshot.name === 'string' ? snapshot.name : null) ||
        (product && typeof product.name === 'string' ? product.name : null) ||
        'Producto retro',
      image:
        toStringOrNull(imageFromSnapshot) ||
        (product && typeof product.image === 'string' ? String(product.image) : null),
    };

    const bucket = orderItemsByOrder.get(orderId) || [];
    bucket.push(normalizedItem);
    orderItemsByOrder.set(orderId, bucket);
  }

  const orders: ProfileDashboardOrder[] = ordersRows.map((row: any) => {
    const id = String(row?.id || '').trim();
    return {
      id,
      status: String(row?.status || 'pending'),
      payment_status: String(row?.payment_status || (row?.paid_at ? 'paid' : 'pending')),
      total_cents: normalizeCents(row?.total_cents ?? row?.total),
      created_at: toIsoOrNull(row?.created_at),
      shipped_at: toIsoOrNull(row?.shipped_at),
      delivered_at: toIsoOrNull(row?.delivered_at),
      shipping_company: toStringOrNull(row?.shipping_company),
      tracking_number: toStringOrNull(row?.tracking_number ?? row?.shipping_tracking_code),
      tracking_url: toStringOrNull(row?.tracking_url),
      estimated_delivery: toIsoOrNull(row?.estimated_delivery),
      notes: toStringOrNull(row?.notes),
      items: orderItemsByOrder.get(id) || [],
    };
  });

  const reviews: ProfileDashboardReview[] = reviewsRows.map((row: any) => {
    const productId = String(row?.product_id || '').trim() || null;
    const product = productId ? productMap.get(productId) : null;
    return {
      id: String(row?.id || ''),
      product_id: productId,
      product_name:
        (product && typeof product.name === 'string' ? String(product.name) : null) || 'Producto retro',
      product_image: product && typeof product.image === 'string' ? String(product.image) : null,
      rating: Math.max(1, Math.min(5, Math.round(toNumber(row?.rating || 5)))),
      comment: String(row?.comment || '').trim(),
      author_name: String(row?.author_name || 'Coleccionista').trim() || 'Coleccionista',
      helpful_count: Math.max(0, Math.round(toNumber(row?.helpful_count || 0))),
      created_at: toIsoOrNull(row?.created_at),
      updated_at: toIsoOrNull(row?.updated_at),
    };
  });

  const sessions: ProfileDashboardSession[] = sessionRows.map((row: any) => ({
    session_id: String(row?.session_id || ''),
    started_at: toIsoOrNull(row?.started_at),
    last_seen_at: toIsoOrNull(row?.last_seen_at),
    ended_at: toIsoOrNull(row?.ended_at),
    active_seconds: normalizeCents(row?.active_seconds),
    heartbeat_count: normalizeCents(row?.heartbeat_count),
    page_views: normalizeCents(row?.page_views),
    last_path: toStringOrNull(row?.last_path),
    user_agent: toStringOrNull(row?.user_agent),
  }));

  const totalSpentCents = orders.reduce((sum, order) => {
    if (['paid', 'shipped', 'delivered', 'refunded'].includes(order.payment_status) || ['processing', 'shipped', 'delivered', 'refunded'].includes(order.status)) {
      return sum + order.total_cents;
    }
    return sum;
  }, 0);

  return {
    profile,
    stats: {
      orders_count: orders.length,
      favorites_count: favoritesResult.total,
      reviews_count: reviews.length,
      open_tickets_count: ticketsResult.filter((ticket: any) => ['open', 'in_progress'].includes(String(ticket?.status || ''))).length,
      total_spent_cents: totalSpentCents,
    },
    favorites: {
      visibility: normalizeFavoritesVisibility((profile as any).favorites_visibility),
      items: favoritesResult.items,
      total: favoritesResult.total,
    },
    orders,
    tickets: ticketsResult,
    reviews,
    sessions,
    usage_summary: usageResult.error && isMissingSchemaError(usageResult.error) ? null : normalizeUsageSummary(usageResult.data),
  };
}
