import { addMonths, endOfDay, endOfMonth, endOfWeek, format, isWithinInterval, parseISO, startOfDay, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns';
import type {
  ActivityFeedItem,
  AnalyticsEventRecord,
  AdminOrderMeta,
  AdminOrderStatusEvent,
  AdminProductMeta,
  AdminUserRecord,
  AnalyticsSnapshot,
  ChartPoint,
  DashboardSnapshot,
  DeviceType,
  EmailLogRecord,
  EmailTemplateRecord,
  ErrorLogRecord,
  FulfillmentStatus,
  LoginActivityRecord,
  MessageReviewStatus,
  PageViewRecord,
  RetrovilleAnalyticsSnapshot,
  RetrovilleWaitlistRecord,
  ScheduledEmailRecord,
  UserSessionRecord,
} from '@/types/admin';
import { supabaseService } from '@/lib/supabase/service';
import { slugifyAdmin, truncate } from '@/lib/admin/format';
import { getEmailTemplates } from '@/lib/admin/emailService';
import { listAdminSettings } from '@/lib/admin/settings';
import { DEFAULT_RETROVILLE_MONTHS_AHEAD, RETROVILLE_SETTING_KEY } from '@/lib/admin/constants';

function now() {
  return new Date();
}

function toIso(value: Date) {
  return value.toISOString();
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

function toNumber(value: unknown) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function toChartSeriesByDay<T>(rows: T[], getDate: (row: T) => string | null | undefined, getValue: (row: T) => number, days: number) {
  const start = startOfDay(subDays(now(), days - 1));
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const date = subDays(startOfDay(now()), days - 1 - i);
    buckets.set(format(date, 'dd MMM'), 0);
  }
  for (const row of rows) {
    const date = safeDate(getDate(row));
    if (!date || date < start) continue;
    const label = format(date, 'dd MMM');
    buckets.set(label, (buckets.get(label) || 0) + getValue(row));
  }
  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

function groupCounts(values: Array<string | null | undefined>) {
  const map = new Map<string, number>();
  for (const raw of values) {
    const key = String(raw || 'Desconocido').trim() || 'Desconocido';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function classifyTrafficSource(referrer: string | null | undefined) {
  const ref = String(referrer || '').toLowerCase().trim();
  if (!ref) return 'Direct';
  if (ref.includes('google') || ref.includes('bing') || ref.includes('duckduckgo') || ref.includes('yahoo')) {
    return 'Search';
  }
  if (
    ref.includes('facebook') ||
    ref.includes('instagram') ||
    ref.includes('threads') ||
    ref.includes('reddit') ||
    ref.includes('discord') ||
    ref.includes('kickstarter') ||
    ref.includes('youtube') ||
    ref.includes('t.co') ||
    ref.includes('x.com') ||
    ref.includes('twitter')
  ) {
    return 'Social';
  }
  if (ref.includes('mail') || ref.includes('gmail') || ref.includes('outlook')) return 'Email';
  return 'Referral';
}

function humanizeWaitlistSource(source: string | null | undefined) {
  const raw = String(source || '').trim().toLowerCase();
  if (!raw || raw === 'public') return 'Web publica';
  if (raw === 'dev') return 'Desarrollo';
  if (raw.includes('discord')) return 'Discord';
  if (raw.includes('kickstarter')) return 'Kickstarter';
  if (raw.includes('reddit')) return 'Reddit';
  if (raw.includes('thread')) return 'Threads';
  if (raw.includes('facebook')) return 'Facebook';
  if (raw.includes('instagram')) return 'Instagram';
  if (raw.includes('youtube')) return 'YouTube';
  if (raw === 'x' || raw.includes('x.com') || raw.includes('twitter')) return 'X / Twitter';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readMetaString(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function isRetrovillePath(path: string | null | undefined) {
  const normalized = normalizeTrackedPath(path);
  return normalized === '/retroville' || normalized.startsWith('/retroville/');
}

function isRetrovilleEvent(row: AnalyticsEventRecord) {
  const path = normalizeTrackedPath(row.path || readMetaString(row.meta, 'path') || '/retroville');
  return String(row.event_name || '').startsWith('retroville_') || isRetrovillePath(path);
}

function humanizeRetrovilleEventName(eventName: string | null | undefined) {
  const normalized = String(eventName || '').trim().toLowerCase();
  switch (normalized) {
    case 'retroville_newsletter_signup':
      return 'Alta newsletter';
    case 'retroville_event_signup':
      return 'Registro en evento';
    case 'retroville_event_calendar_save':
      return 'Evento guardado';
    case 'retroville_buyer_cta_click':
      return 'CTA de comprador';
    case 'retroville_intro_enter':
      return 'Entrada al universo';
    case 'retroville_private_document_open':
      return 'Documento privado · Popup abierto';
    case 'retroville_private_document_mail_click':
      return 'Documento privado · Click en email';
    case 'retroville_private_document_email_copy':
      return 'Documento privado · Correo copiado';
    default:
      return normalized
        .replace(/^retroville_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Evento';
  }
}

function buildRetrovilleBuyerLabel(meta: Record<string, unknown> | null | undefined) {
  const location = readMetaString(meta, 'location');
  const action = readMetaString(meta, 'action');
  const label = [location, action].filter(Boolean).join(' · ');
  return label || 'CTA sin detalle';
}

function describeRetrovilleEvent(row: AnalyticsEventRecord) {
  const base = humanizeRetrovilleEventName(row.event_name);
  const source = humanizeWaitlistSource(readMetaString(row.meta, 'source'));
  const channel = readMetaString(row.meta, 'channel');
  const documentTitle = readMetaString(row.meta, 'document_title');
  const buyerLabel = buildRetrovilleBuyerLabel(row.meta);

  if (row.event_name === 'retroville_buyer_cta_click') return buyerLabel;
  if (row.event_name === 'retroville_event_calendar_save') {
    return channel ? `${base} · ${channel}` : base;
  }
  if (row.event_name === 'retroville_newsletter_signup' || row.event_name === 'retroville_event_signup') {
    return source ? `${base} · ${source}` : base;
  }
  if (String(row.event_name || '').startsWith('retroville_private_document_')) {
    return documentTitle ? `${base} · ${documentTitle}` : base;
  }
  return base;
}

function normalizeTrackedPath(url: string | null | undefined) {
  const raw = String(url || '/').trim();
  if (!raw) return '/';
  try {
    const absolute = /^https?:\/\//i.test(raw) ? new URL(raw) : null;
    const pathname = absolute?.pathname || raw.split('?')[0] || '/';
    return pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : '/';
  } catch {
    const pathname = raw.split('?')[0] || '/';
    return pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : '/';
  }
}

function maskEmailAddress(email: string | null | undefined) {
  const raw = String(email || '').trim().toLowerCase();
  const [local, domain] = raw.split('@');
  if (!local || !domain) return 'oculto@retroville.local';
  const localPreview = local.length <= 2 ? `${local[0] || '*'}*` : `${local.slice(0, 2)}***`;
  return `${localPreview}@${domain}`;
}

async function selectRows(table: string, query = '*', limit = 5000) {
  if (!supabaseService) return [] as any[];
  const { data } = await supabaseService.from(table).select(query).limit(limit);
  return data || [];
}

export async function getDashboardSnapshot(range: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<DashboardSnapshot> {
  const [orders, users, products, pageViews, sessions, errorLogs, orderMetaRows] = await Promise.all([
    selectRows('orders', '*', 5000),
    selectRows('users', '*', 5000),
    selectRows('products', '*', 5000),
    selectRows('page_views', '*', 5000),
    selectRows('user_sessions', '*', 5000),
    selectRows('error_logs', '*', 5000),
    selectRows('admin_order_meta', '*', 5000),
  ]);

  const orderMetaMap = new Map<string, AdminOrderMeta>((orderMetaRows || []).map((row: any) => [String(row.order_id), row]));
  const currentMonthStart = startOfMonth(now());
  const previousMonthStart = startOfMonth(subMonths(now(), 1));
  const previousMonthEnd = endOfMonth(subMonths(now(), 1));
  const currentMonthOrders = orders.filter((row: any) => {
    const date = safeDate(row.created_at);
    return date ? date >= currentMonthStart : false;
  });
  const previousMonthOrders = orders.filter((row: any) => {
    const date = safeDate(row.created_at);
    return date ? isWithinInterval(date, { start: previousMonthStart, end: previousMonthEnd }) : false;
  });
  const currentMonthUsers = users.filter((row: any) => {
    const date = safeDate(row.created_at);
    return date ? date >= currentMonthStart : false;
  });
  const previousMonthUsers = users.filter((row: any) => {
    const date = safeDate(row.created_at);
    return date ? isWithinInterval(date, { start: previousMonthStart, end: previousMonthEnd }) : false;
  });

  const sumTotal = (collection: any[]) => collection.reduce((sum, row) => sum + toNumber(row.total), 0);
  const currentRevenue = sumTotal(currentMonthOrders);
  const previousRevenue = sumTotal(previousMonthOrders);
  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const onlineCutoff = new Date(Date.now() - 2 * 60 * 1000);
  const activeUsers = sessions.filter((row: any) => {
    const date = safeDate(row.last_heartbeat);
    return date ? date >= onlineCutoff : false;
  }).length;

  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const revenueSeries = toChartSeriesByDay(
    orders,
    (row: any) => row.created_at,
    (row: any) => toNumber(row.total) / 100,
    rangeDays
  );

  const statusMap = new Map<string, number>();
  for (const order of orders) {
    const meta = orderMetaMap.get(String(order.id));
    const key = String(meta?.fulfillment_status || order.status || 'pending');
    statusMap.set(key, (statusMap.get(key) || 0) + 1);
  }
  const ordersStatus = Array.from(statusMap.entries()).map(([label, value]) => ({ label, value }));

  const productViews = new Map<string, { id: string; name: string; image: string | null; views: number }>();
  for (const row of pageViews as PageViewRecord[]) {
    if (!row.url.includes('/producto/')) continue;
    const productSlug = row.url.split('/producto/')[1]?.split('?')[0] || row.url;
    const matchingProduct = products.find((product: any) => String(product.slug || slugifyAdmin(product.name || '')).trim() === productSlug.replace(/-p-[a-z0-9]+$/i, ''));
    const key = matchingProduct ? String(matchingProduct.id) : productSlug;
    const current = productViews.get(key) || {
      id: key,
      name: matchingProduct ? String(matchingProduct.name || 'Producto') : productSlug,
      image: matchingProduct ? String(matchingProduct.image || '') || null : null,
      views: 0,
    };
    current.views += 1;
    productViews.set(key, current);
  }
  const topVisitedProducts = Array.from(productViews.values()).sort((a, b) => b.views - a.views).slice(0, 10);

  const trafficByDevice = groupCounts((pageViews as PageViewRecord[]).map((row) => row.device_type as DeviceType | null));

  const userMap = new Map<string, any>((users || []).map((row: any) => [String(row.id), row]));
  const recentOrders = currentMonthOrders
    .slice()
    .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 5)
    .map((row: any) => ({
      id: row.id,
      total: row.total,
      status: orderMetaMap.get(String(row.id))?.fulfillment_status || row.status,
      payment_status: orderMetaMap.get(String(row.id))?.payment_status || (String(row.status) === 'paid' ? 'paid' : 'pending'),
      created_at: row.created_at,
      user: userMap.get(String(row.user_id)) || null,
    }));

  const recentUsers = users
    .slice()
    .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 5)
    .map(
      (row: any): AdminUserRecord => ({
        id: String(row.id),
        email: String(row.email || ''),
        full_name: typeof row.name === 'string' ? row.name : null,
        avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : null,
        role: row.role === 'admin' ? 'admin' : row.role === 'banned' ? 'banned' : 'user',
        status: row.role === 'banned' ? 'banned' : 'active',
        notes: null,
        last_login_at: null,
        orders_count: orders.filter((order: any) => String(order.user_id) === String(row.id)).length,
        total_spent_cents: orders.filter((order: any) => String(order.user_id) === String(row.id)).reduce((sum: number, order: any) => sum + toNumber(order.total), 0),
        created_at: row.created_at || null,
        updated_at: row.updated_at || null,
      })
    );

  const recentErrors = (errorLogs as ErrorLogRecord[])
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 5)
    .map((row: any) => ({
      id: String(row.id),
      message: String(row.message || ''),
      stack_trace: typeof row.stack_trace === 'string' ? row.stack_trace : null,
      url: typeof row.url === 'string' ? row.url : null,
      user_id: typeof row.user_id === 'string' ? row.user_id : null,
      severity: (['info', 'warning', 'error', 'critical'].includes(String(row.severity)) ? row.severity : 'error') as any,
      extra_data: row.extra_data || null,
      resolved: Boolean(row.resolved),
      created_at: String(row.created_at || new Date().toISOString()),
    }));

  const liveActivity = await getLiveActivityFeed();

  return {
    stats: {
      totalRevenueCents: currentRevenue,
      revenueChangePct: pctChange(currentRevenue, previousRevenue),
      totalOrders: currentMonthOrders.length,
      ordersChangePct: pctChange(currentMonthOrders.length, previousMonthOrders.length),
      newUsers: currentMonthUsers.length,
      usersChangePct: pctChange(currentMonthUsers.length, previousMonthUsers.length),
      activeUsers,
      totalProducts: products.filter((row: any) => row.is_active !== false).length,
      pendingOrders: orders.filter((row: any) => ['pending', 'processing'].includes(String(row.status || 'pending'))).length,
    },
    revenueSeries,
    ordersStatus,
    topVisitedProducts,
    trafficByDevice,
    recentOrders,
    recentUsers,
    recentErrors,
    liveActivity,
    generatedAt: new Date().toISOString(),
  };
}

export async function getLiveActivityFeed(): Promise<ActivityFeedItem[]> {
  const [pageViews, orders, users, errorLogs] = await Promise.all([
    selectRows('page_views', '*', 20),
    selectRows('orders', '*', 20),
    selectRows('users', '*', 20),
    selectRows('error_logs', '*', 20),
  ]);

  const items: ActivityFeedItem[] = [];
  for (const row of pageViews as any[]) {
    items.push({
      id: `pv-${row.id}`,
      type: 'page_view',
      title: 'Nueva visita registrada',
      description: truncate(`${row.page_title || 'Página'} · ${row.url || '/'}`, 120),
      href: typeof row.url === 'string' ? row.url : null,
      created_at: String(row.timestamp || new Date().toISOString()),
    });
  }
  for (const row of orders as any[]) {
    items.push({
      id: `order-${row.id}`,
      type: 'order',
      title: `Pedido ${String(row.id).slice(0, 8)} creado`,
      description: `Importe ${toNumber(row.total) / 100} €`,
      href: `/admin/orders/${row.id}`,
      created_at: String(row.created_at || new Date().toISOString()),
    });
  }
  for (const row of users as any[]) {
    items.push({
      id: `user-${row.id}`,
      type: 'signup',
      title: 'Nuevo registro',
      description: String(row.email || row.name || 'Nuevo usuario'),
      href: `/admin/users/${row.id}`,
      created_at: String(row.created_at || new Date().toISOString()),
    });
  }
  for (const row of errorLogs as any[]) {
    items.push({
      id: `error-${row.id}`,
      type: 'error',
      title: `${String(row.severity || 'error').toUpperCase()} en ${row.url || 'ruta desconocida'}`,
      description: truncate(String(row.message || 'Error detectado'), 120),
      href: `/admin/errors`,
      created_at: String(row.created_at || new Date().toISOString()),
      severity: (['info', 'warning', 'error', 'critical'].includes(String(row.severity)) ? row.severity : 'error') as any,
    });
  }

  return items.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 20);
}

export async function getAnalyticsSnapshot(input?: { from?: string; to?: string }): Promise<AnalyticsSnapshot> {
  const rows = (await selectRows('page_views', '*', 10000)) as PageViewRecord[];
  const from = safeDate(input?.from) || startOfDay(subDays(now(), 29));
  const to = safeDate(input?.to) || endOfDay(now());
  const filtered = rows.filter((row) => {
    const date = safeDate(row.timestamp);
    return date ? isWithinInterval(date, { start: from, end: to }) : false;
  });

  const uniqueSessions = new Set(filtered.map((row) => row.session_id).filter(Boolean)).size;
  const totalDuration = filtered.reduce((sum, row) => sum + toNumber(row.duration_seconds), 0);
  const bySession = new Map<string, PageViewRecord[]>();
  for (const row of filtered) {
    const key = String(row.session_id || 'anon');
    bySession.set(key, [...(bySession.get(key) || []), row]);
  }
  const bounceSessions = Array.from(bySession.values()).filter((sessionRows) => sessionRows.length <= 1).length;

  const topPagesMap = new Map<string, { url: string; page_title: string | null; views: number; sessions: Set<string>; totalDuration: number }>();
  for (const row of filtered) {
    const current = topPagesMap.get(row.url) || {
      url: row.url,
      page_title: row.page_title || null,
      views: 0,
      sessions: new Set<string>(),
      totalDuration: 0,
    };
    current.views += 1;
    if (row.session_id) current.sessions.add(row.session_id);
    current.totalDuration += toNumber(row.duration_seconds);
    topPagesMap.set(row.url, current);
  }

  const topPages = Array.from(topPagesMap.values())
    .map((item) => ({
      url: item.url,
      page_title: item.page_title,
      views: item.views,
      uniqueSessions: item.sessions.size,
      avgDuration: item.views > 0 ? item.totalDuration / item.views : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 50);

  const sourceBuckets = filtered.map((row) => classifyTrafficSource(row.referrer));

  const geographyMap = new Map<string, { country: string; city: string; sessions: Set<string> }>();
  for (const row of filtered) {
    const key = `${row.country || 'Desconocido'}|${row.city || '—'}`;
    const current = geographyMap.get(key) || {
      country: row.country || 'Desconocido',
      city: row.city || '—',
      sessions: new Set<string>(),
    };
    if (row.session_id) current.sessions.add(row.session_id);
    geographyMap.set(key, current);
  }
  const geography = Array.from(geographyMap.values())
    .map((entry) => ({
      country: entry.country,
      city: entry.city,
      sessions: entry.sessions.size,
      percentage: uniqueSessions > 0 ? (entry.sessions.size / uniqueSessions) * 100 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 50);

  const visitsByIp = new Map<string, number>();
  for (const row of filtered) {
    const key = row.ip_hash || row.session_id || row.id;
    visitsByIp.set(key, (visitsByIp.get(key) || 0) + 1);
  }
  const newVsReturning = [
    {
      label: 'Nuevos',
      value: Array.from(visitsByIp.values()).filter((count) => count <= 1).length,
    },
    {
      label: 'Recurrentes',
      value: Array.from(visitsByIp.values()).filter((count) => count > 1).length,
    },
  ];

  const activeHours = Array.from({ length: 24 }, (_, hour) => ({ label: `${hour}:00`, value: 0 }));
  const heatmap: Array<{ day: string; hour: number; views: number }> = [];
  const heatMapBucket = new Map<string, number>();
  for (const row of filtered) {
    const date = safeDate(row.timestamp);
    if (!date) continue;
    const hour = date.getHours();
    activeHours[hour].value += 1;
    const key = `${format(date, 'EEE')}|${hour}`;
    heatMapBucket.set(key, (heatMapBucket.get(key) || 0) + 1);
  }
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (const day of days) {
    for (let hour = 0; hour < 24; hour += 1) {
      heatmap.push({ day, hour, views: heatMapBucket.get(`${day}|${hour}`) || 0 });
    }
  }

  return {
    summary: {
      totalPageViews: filtered.length,
      uniqueSessions,
      avgSessionDuration: filtered.length > 0 ? totalDuration / filtered.length : 0,
      bounceRate: uniqueSessions > 0 ? (bounceSessions / uniqueSessions) * 100 : 0,
    },
    pageViewsOverTime: toChartSeriesByDay(filtered, (row) => row.timestamp, () => 1, Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1)),
    topPages,
    trafficSources: groupCounts(sourceBuckets),
    geography,
    deviceBreakdown: groupCounts(filtered.map((row) => row.device_type)),
    browserBreakdown: groupCounts(filtered.map((row) => row.browser)),
    heatmap,
    newVsReturning,
    activeHours,
  };
}

export async function getRetrovilleAnalyticsSnapshot(input?: { from?: string; to?: string }): Promise<RetrovilleAnalyticsSnapshot> {
  const [pageViewRows, waitlistRows, analyticsEventRows, settings] = await Promise.all([
    selectRows('page_views', '*', 10000),
    selectRows('retroville_waitlist', '*', 5000),
    selectRows('analytics_events', '*', 10000),
    listAdminSettings(),
  ]);

  const rows = pageViewRows as PageViewRecord[];
  const waitlist = waitlistRows as RetrovilleWaitlistRecord[];
  const analyticsEvents = analyticsEventRows as AnalyticsEventRecord[];
  const from = safeDate(input?.from) || startOfDay(subDays(now(), 29));
  const to = safeDate(input?.to) || endOfDay(now());

  const rowsInRange = rows.filter((row) => {
    const date = safeDate(row.timestamp);
    return date ? isWithinInterval(date, { start: from, end: to }) : false;
  });

  const retrovilleAllRows = rows.filter((row) => isRetrovillePath(row.url));
  const retrovilleRows = rowsInRange.filter((row) => isRetrovillePath(row.url));
  const retrovilleEventsInRange = analyticsEvents.filter((row) => {
    if (!isRetrovilleEvent(row)) return false;
    const date = safeDate(row.created_at);
    return date ? isWithinInterval(date, { start: from, end: to }) : false;
  });

  const sortedRetrovilleAllRows = retrovilleAllRows
    .slice()
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const sortedRetrovilleRows = retrovilleRows
    .slice()
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));

  const visitorFirstSeen = new Map<string, Date>();
  for (const row of sortedRetrovilleAllRows) {
    const visitDate = safeDate(row.timestamp);
    const visitorKey = row.ip_hash || row.session_id || null;
    if (!visitorKey || !visitDate) continue;
    const current = visitorFirstSeen.get(visitorKey);
    if (!current || visitDate < current) {
      visitorFirstSeen.set(visitorKey, visitDate);
    }
  }

  const topPagesMap = new Map<
    string,
    {
      url: string;
      page_title: string | null;
      views: number;
      sessions: Set<string>;
      totalDuration: number;
    }
  >();
  const sessionMap = new Map<
    string,
    {
      session_id: string;
      visitor_key: string | null;
      started_at: string;
      last_seen_at: string;
      country: string;
      city: string;
      source: string;
      device_type: string;
      browser: string;
      os: string;
      first_page: string;
      last_page: string;
      page_views: number;
      unique_pages: Set<string>;
      total_duration: number;
    }
  >();

  for (const row of sortedRetrovilleRows) {
    const path = normalizeTrackedPath(row.url);
    const sessionKey = row.session_id?.trim() || `view:${row.id}`;
    const visitDate = safeDate(row.timestamp);
    const current = topPagesMap.get(path) || {
      url: path,
      page_title: row.page_title || null,
      views: 0,
      sessions: new Set<string>(),
      totalDuration: 0,
    };
    current.views += 1;
    if (!current.page_title && row.page_title) current.page_title = row.page_title;
    current.sessions.add(sessionKey);
    current.totalDuration += toNumber(row.duration_seconds);
    topPagesMap.set(path, current);

    const session = sessionMap.get(sessionKey) || {
      session_id: row.session_id?.trim() || sessionKey,
      visitor_key: row.ip_hash || row.session_id || null,
      started_at: row.timestamp,
      last_seen_at: row.timestamp,
      country: row.country || 'Desconocido',
      city: row.city || '—',
      source: classifyTrafficSource(row.referrer),
      device_type: row.device_type || 'Desconocido',
      browser: row.browser || 'Desconocido',
      os: row.os || 'Desconocido',
      first_page: path,
      last_page: path,
      page_views: 0,
      unique_pages: new Set<string>(),
      total_duration: 0,
    };

    if (visitDate) {
      const startedAt = safeDate(session.started_at);
      const lastSeenAt = safeDate(session.last_seen_at);

      if (!startedAt || visitDate < startedAt) {
        session.started_at = row.timestamp;
        session.first_page = path;
        session.source = classifyTrafficSource(row.referrer);
      }

      if (!lastSeenAt || visitDate >= lastSeenAt) {
        session.last_seen_at = row.timestamp;
        session.last_page = path;
      }
    }

    if ((session.country === 'Desconocido' || !session.country) && row.country) session.country = row.country;
    if ((session.city === '—' || !session.city) && row.city) session.city = row.city;
    if ((session.device_type === 'Desconocido' || !session.device_type) && row.device_type) session.device_type = row.device_type;
    if ((session.browser === 'Desconocido' || !session.browser) && row.browser) session.browser = row.browser;
    if ((session.os === 'Desconocido' || !session.os) && row.os) session.os = row.os;

    session.page_views += 1;
    session.unique_pages.add(path);
    session.total_duration += toNumber(row.duration_seconds);
    sessionMap.set(sessionKey, session);
  }

  const sessionJourneys = Array.from(sessionMap.values())
    .map((session) => {
      const firstSeen = session.visitor_key ? visitorFirstSeen.get(session.visitor_key) : null;
      const sessionStart = safeDate(session.started_at);
      const isReturning = Boolean(firstSeen && sessionStart && firstSeen.getTime() < sessionStart.getTime());

      return {
        session_id: session.session_id,
        started_at: session.started_at,
        last_seen_at: session.last_seen_at,
        country: session.country || 'Desconocido',
        city: session.city || '—',
        source: session.source || 'Direct',
        device_type: session.device_type || 'Desconocido',
        browser: session.browser || 'Desconocido',
        os: session.os || 'Desconocido',
        first_page: session.first_page,
        last_page: session.last_page,
        page_views: session.page_views,
        unique_pages: session.unique_pages.size,
        total_duration: session.total_duration,
        is_returning: isReturning,
      };
    })
    .sort((a, b) => String(b.last_seen_at).localeCompare(String(a.last_seen_at)));

  const sessionLookup = new Map(sessionJourneys.map((session) => [session.session_id, session]));
  const uniqueSessions = sessionJourneys.length;
  const totalDuration = sessionJourneys.reduce((sum, session) => sum + session.total_duration, 0);
  const returningSessions = sessionJourneys.filter((session) => session.is_returning).length;

  const topPages = Array.from(topPagesMap.values())
    .map((item) => ({
      url: item.url,
      page_title: item.page_title,
      views: item.views,
      uniqueSessions: item.sessions.size,
      avgDuration: item.views > 0 ? item.totalDuration / item.views : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 25);

  const engagementPages = Array.from(topPagesMap.values())
    .map((item) => ({
      url: item.url,
      page_title: item.page_title,
      views: item.views,
      uniqueSessions: item.sessions.size,
      totalDuration: item.totalDuration,
      avgDuration: item.views > 0 ? item.totalDuration / item.views : 0,
    }))
    .sort((a, b) => b.totalDuration - a.totalDuration || b.avgDuration - a.avgDuration)
    .slice(0, 12);

  const geographyMap = new Map<string, { country: string; city: string; sessions: number }>();
  for (const session of sessionJourneys) {
    const key = `${session.country || 'Desconocido'}|${session.city || '—'}`;
    const current = geographyMap.get(key) || {
      country: session.country || 'Desconocido',
      city: session.city || '—',
      sessions: 0,
    };
    current.sessions += 1;
    geographyMap.set(key, current);
  }

  const geography = Array.from(geographyMap.values())
    .map((entry) => ({
      country: entry.country,
      city: entry.city,
      sessions: entry.sessions,
      percentage: uniqueSessions > 0 ? (entry.sessions / uniqueSessions) * 100 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20);

  const topCountries = groupCounts(sessionJourneys.map((session) => session.country)).slice(0, 10);
  const topCities = groupCounts(
    sessionJourneys.map((session) =>
      session.city && session.city !== '—' ? `${session.city} · ${session.country}` : session.country
    )
  ).slice(0, 10);
  const entryPages = groupCounts(sessionJourneys.map((session) => session.first_page)).slice(0, 10);
  const exitPages = groupCounts(sessionJourneys.map((session) => session.last_page)).slice(0, 10);

  const waitlistInRange = waitlist.filter((row) => {
    const date = safeDate(row.created_at);
    return date ? isWithinInterval(date, { start: from, end: to }) : false;
  });
  const waitlistLast30Days = waitlist.filter((row) => {
    const date = safeDate(row.created_at);
    return date ? date >= startOfDay(subDays(now(), 29)) : false;
  });
  const newsletterEventsInRange = analyticsEvents.filter((row) => {
    if (row.event_name !== 'retroville_newsletter_signup') return false;
    const date = safeDate(row.created_at);
    return date ? isWithinInterval(date, { start: from, end: to }) : false;
  });
  const eventSignupEventsInRange = retrovilleEventsInRange.filter((row) => row.event_name === 'retroville_event_signup');
  const buyerCtaEventsInRange = retrovilleEventsInRange.filter((row) => row.event_name === 'retroville_buyer_cta_click');
  const calendarSaveEventsInRange = retrovilleEventsInRange.filter((row) => row.event_name === 'retroville_event_calendar_save');
  const privateDocumentEventsInRange = retrovilleEventsInRange.filter((row) =>
    String(row.event_name || '').startsWith('retroville_private_document_')
  );
  const newsletterSignupPages = groupCounts(
    newsletterEventsInRange.map((row) => normalizeTrackedPath(row.path || String(row.meta?.path || '/retroville')))
  );
  const newsletterSignupDevices = groupCounts(
    newsletterEventsInRange.map((row) => {
      const device = row.meta?.device_type;
      return typeof device === 'string' ? device : 'Desconocido';
    })
  );
  const eventBreakdown = groupCounts(retrovilleEventsInRange.map((row) => humanizeRetrovilleEventName(row.event_name))).slice(0, 12);
  const buyerIntentBreakdown = groupCounts(
    buyerCtaEventsInRange.map((row) => buildRetrovilleBuyerLabel(row.meta))
  ).slice(0, 10);
  const calendarSaveChannels = groupCounts(
    calendarSaveEventsInRange.map((row) => readMetaString(row.meta, 'channel') || 'Sin canal')
  ).slice(0, 8);
  const privateDocumentActions = groupCounts(
    privateDocumentEventsInRange.map((row) => humanizeRetrovilleEventName(row.event_name).replace('Documento privado · ', ''))
  ).slice(0, 8);

  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const launchDate = settingsMap.get(RETROVILLE_SETTING_KEY) || addMonths(now(), DEFAULT_RETROVILLE_MONTHS_AHEAD).toISOString();

  return {
    summary: {
      totalPageViews: retrovilleRows.length,
      uniqueSessions,
      avgSessionDuration: uniqueSessions > 0 ? totalDuration / uniqueSessions : 0,
      avgPagesPerSession: uniqueSessions > 0 ? retrovilleRows.length / uniqueSessions : 0,
      waitlistTotal: waitlist.length,
      waitlistInRange: waitlistInRange.length,
      waitlistLast30Days: waitlistLast30Days.length,
      waitlistConversionRate: uniqueSessions > 0 ? (waitlistInRange.length / uniqueSessions) * 100 : 0,
      newsletterSignupsInRange: newsletterEventsInRange.length,
      newsletterConversionRate: uniqueSessions > 0 ? (newsletterEventsInRange.length / uniqueSessions) * 100 : 0,
      eventSignupsInRange: eventSignupEventsInRange.length,
      eventConversionRate: uniqueSessions > 0 ? (eventSignupEventsInRange.length / uniqueSessions) * 100 : 0,
      buyerCtaClicksInRange: buyerCtaEventsInRange.length,
      calendarSavesInRange: calendarSaveEventsInRange.length,
      privateDocumentInteractionsInRange: privateDocumentEventsInRange.length,
      trafficShare: rowsInRange.length > 0 ? (retrovilleRows.length / rowsInRange.length) * 100 : 0,
      countriesReached: new Set(sessionJourneys.map((session) => session.country)).size,
      citiesReached: new Set(sessionJourneys.map((session) => `${session.country}|${session.city}`)).size,
      returningSessions,
      returningRate: uniqueSessions > 0 ? (returningSessions / uniqueSessions) * 100 : 0,
      launchDate,
    },
    pageViewsOverTime: toChartSeriesByDay(
      retrovilleRows,
      (row) => row.timestamp,
      () => 1,
      Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1)
    ),
    topPages,
    engagementPages,
    trafficSources: groupCounts(sessionJourneys.map((session) => session.source)).slice(0, 10),
    geography,
    deviceBreakdown: groupCounts(sessionJourneys.map((session) => session.device_type)).slice(0, 6),
    browserBreakdown: groupCounts(sessionJourneys.map((session) => session.browser)).slice(0, 8),
    osBreakdown: groupCounts(sessionJourneys.map((session) => session.os)).slice(0, 8),
    topCountries,
    topCities,
    entryPages,
    exitPages,
    eventBreakdown,
    buyerIntentBreakdown,
    calendarSaveChannels,
    privateDocumentActions,
    waitlistSources: groupCounts(waitlistInRange.map((row) => humanizeWaitlistSource(row.source))).slice(0, 10),
    waitlistRoles: groupCounts(waitlistInRange.map((row) => row.role_label || 'Sin etiqueta')).slice(0, 10),
    newsletterSignupPages,
    newsletterSignupDevices,
    sessionJourneys: sessionJourneys.slice(0, 25),
    recentEvents: retrovilleEventsInRange
      .slice()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 25)
      .map((row) => {
        const session = row.session_id ? sessionLookup.get(row.session_id) || null : null;
        return {
          id: row.id,
          event_name: row.event_name,
          label: describeRetrovilleEvent(row),
          path: normalizeTrackedPath(row.path || readMetaString(row.meta, 'path') || '/retroville'),
          created_at: row.created_at,
          session_id: row.session_id || null,
          country: readMetaString(row.meta, 'country') || session?.country || 'Desconocido',
          city: readMetaString(row.meta, 'city') || session?.city || '—',
          source: session?.source || classifyTrafficSource(readMetaString(row.meta, 'referrer')),
        };
      }),
    recentWaitlist: waitlist
      .slice()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 20)
      .map((row) => ({
        id: row.id,
        email_masked: maskEmailAddress(row.email),
        created_at: row.created_at,
        source: humanizeWaitlistSource(row.source),
        role_label: row.role_label || 'Sin etiqueta',
      })),
  };
}

export async function listAdminProducts() {
  const [products, metaRows] = await Promise.all([
    selectRows('products', '*', 5000),
    selectRows('admin_product_meta', '*', 5000),
  ]);
  const metaMap = new Map<string, AdminProductMeta>((metaRows as any[]).map((row) => [String(row.product_id), row]));
  return (products as any[]).map((product) => ({
    ...product,
    meta: metaMap.get(String(product.id)) || null,
  }));
}

export async function getAdminProductDetail(productId: string) {
  const rows = await listAdminProducts();
  return rows.find((row: any) => String(row.id) === productId) || null;
}

export async function listAdminOrders() {
  const [orders, users, metas] = await Promise.all([
    selectRows('orders', '*, order_items(*)', 5000),
    selectRows('users', '*', 5000),
    selectRows('admin_order_meta', '*', 5000),
  ]);
  const userMap = new Map<string, any>((users as any[]).map((row) => [String(row.id), row]));
  const metaMap = new Map<string, AdminOrderMeta>((metas as any[]).map((row) => [String(row.order_id), row]));

  return (orders as any[]).map((row) => ({
    ...row,
    user: userMap.get(String(row.user_id)) || null,
    meta: metaMap.get(String(row.id)) || null,
  }));
}

export async function getAdminOrderDetail(orderId: string) {
  const [orders, events] = await Promise.all([
    listAdminOrders(),
    selectRows('admin_order_status_events', '*', 5000),
  ]);
  const order = orders.find((row: any) => String(row.id) === orderId) || null;
  const timeline = (events as AdminOrderStatusEvent[])
    .filter((row) => String(row.order_id) === orderId)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  return { order, timeline };
}

export async function listAdminUsers() {
  const [users, profiles, orders, loginEvents] = await Promise.all([
    selectRows('users', '*', 5000),
    selectRows('profiles', '*', 5000),
    selectRows('orders', '*', 5000),
    selectRows('login_activity_logs', '*', 5000),
  ]);
  const profileMap = new Map<string, any>((profiles as any[]).map((row) => [String(row.id), row]));

  return (users as any[]).map(
    (row): AdminUserRecord => ({
      id: String(row.id),
      email: String(row.email || ''),
      full_name:
        typeof profileMap.get(String(row.id))?.full_name === 'string'
          ? profileMap.get(String(row.id)).full_name
          : typeof row.name === 'string'
            ? row.name
            : null,
      avatar_url:
        typeof profileMap.get(String(row.id))?.avatar_url === 'string'
          ? profileMap.get(String(row.id)).avatar_url
          : typeof row.avatar_url === 'string'
            ? row.avatar_url
            : null,
      role: profileMap.get(String(row.id))?.role === 'admin' || row.role === 'admin' ? 'admin' : profileMap.get(String(row.id))?.role === 'banned' ? 'banned' : 'user',
      status: profileMap.get(String(row.id))?.role === 'banned' ? 'banned' : 'active',
      notes: typeof profileMap.get(String(row.id))?.notes === 'string' ? profileMap.get(String(row.id)).notes : null,
      last_login_at: (loginEvents as any[])
        .filter((event) => String(event.user_id || '') === String(row.id) && event.success)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]?.created_at || null,
      orders_count: (orders as any[]).filter((order) => String(order.user_id) === String(row.id)).length,
      total_spent_cents: (orders as any[])
        .filter((order) => String(order.user_id) === String(row.id))
        .reduce((sum, order) => sum + toNumber(order.total), 0),
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
    })
  );
}

export async function getAdminUserDetail(userId: string) {
  const [users, pageViews, sessions, loginEvents, orders, tickets, messages] = await Promise.all([
    listAdminUsers(),
    selectRows('page_views', '*', 5000),
    selectRows('user_sessions', '*', 5000),
    selectRows('login_activity_logs', '*', 5000),
    listAdminOrders(),
    selectRows('support_tickets', '*', 5000),
    selectRows('support_messages', '*', 5000),
  ]);

  return {
    user: users.find((row) => row.id === userId) || null,
    pageViews: (pageViews as PageViewRecord[]).filter((row) => String(row.user_id || '') === userId),
    sessions: (sessions as UserSessionRecord[]).filter((row) => String(row.user_id || '') === userId),
    loginHistory: (loginEvents as LoginActivityRecord[]).filter((row) => String(row.user_id || '') === userId),
    orders: orders.filter((row: any) => String(row.user_id) === userId),
    tickets: (tickets as any[]).filter((row) => String(row.user_id) === userId),
    messages: (messages as any[]).filter((row) => String(row.user_id || '') === userId),
  };
}

export async function listOnlineSessions() {
  const [sessions, users, pageViews] = await Promise.all([
    selectRows('user_sessions', '*', 5000),
    listAdminUsers(),
    selectRows('page_views', '*', 5000),
  ]);
  const userMap = new Map<string, AdminUserRecord>(users.map((user) => [user.id, user]));
  const historyBySession = new Map<string, PageViewRecord[]>();
  for (const row of pageViews as PageViewRecord[]) {
    const key = String(row.session_id || '');
    historyBySession.set(key, [...(historyBySession.get(key) || []), row]);
  }
  return (sessions as UserSessionRecord[])
    .map((row) => ({
      ...row,
      user: row.user_id ? userMap.get(row.user_id) || null : null,
      history: (historyBySession.get(row.session_id) || []).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 25),
    }))
    .sort((a, b) => String(b.last_heartbeat).localeCompare(String(a.last_heartbeat)));
}

export async function getConcurrentSessionsSeries() {
  const sessions = (await selectRows('user_sessions', '*', 5000)) as UserSessionRecord[];
  const start = startOfWeek(subDays(now(), 1));
  const points: ChartPoint[] = [];
  for (let i = 0; i < 24; i += 1) {
    const date = subDays(now(), 0);
    date.setHours(i, 0, 0, 0);
    const label = `${i}:00`;
    const value = sessions.filter((session) => {
      const started = safeDate(session.started_at);
      const heartbeat = safeDate(session.last_heartbeat);
      if (!started || !heartbeat) return false;
      return started <= date && heartbeat >= date;
    }).length;
    points.push({ label, value });
  }
  return points;
}

export async function listAdminMessages() {
  const [tickets, messages, users, reviews] = await Promise.all([
    selectRows('support_tickets', '*', 5000),
    selectRows('support_messages', '*', 5000),
    listAdminUsers(),
    selectRows('admin_message_reviews', '*', 5000),
  ]);
  const userMap = new Map<string, AdminUserRecord>(users.map((user) => [user.id, user]));
  const messageMap = new Map<string, any[]>();
  for (const message of messages as any[]) {
    const key = String(message.ticket_id || '');
    messageMap.set(key, [...(messageMap.get(key) || []), message]);
  }
  const reviewMap = new Map<string, { review_status: MessageReviewStatus; review_reason: string | null }>(
    (reviews as any[]).map((row) => [String(row.ticket_id), { review_status: row.review_status, review_reason: row.review_reason || null }])
  );

  return (tickets as any[]).map((ticket) => {
    const ticketMessages = (messageMap.get(String(ticket.id)) || []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const latestMessage = ticketMessages[ticketMessages.length - 1] || null;
    const review = reviewMap.get(String(ticket.id)) || { review_status: 'pending_review' as MessageReviewStatus, review_reason: null };
    return {
      id: String(ticket.id),
      date: String(ticket.created_at || new Date().toISOString()),
      user: userMap.get(String(ticket.user_id)) || null,
      type: String(ticket.ticket_type || '').toLowerCase().includes('concierge') ? 'Buy' : 'Sell',
      title: String(ticket.subject || 'Ticket'),
      preview: truncate(String(latestMessage?.message || ticket.subject || ''), 120),
      status: review.review_status,
      review_reason: review.review_reason,
      messages: ticketMessages,
      ticket,
    };
  });
}

export async function getEmailLogs(): Promise<EmailLogRecord[]> {
  const [logs, templates] = await Promise.all([selectRows('email_logs', '*', 5000), getEmailTemplates()]);
  const templateMap = new Map<string, EmailTemplateRecord>(templates.map((template) => [template.id, template]));
  return (logs as any[]).map((row) => ({
    id: String(row.id),
    recipient_email: String(row.recipient_email || ''),
    recipient_user_id: typeof row.recipient_user_id === 'string' ? row.recipient_user_id : null,
    subject: String(row.subject || ''),
    template_id: typeof row.template_id === 'string' ? row.template_id : null,
    template_name: row.template_id ? templateMap.get(String(row.template_id))?.name || null : null,
    status: ['sent', 'failed', 'pending'].includes(String(row.status)) ? row.status : 'pending',
    error_message: typeof row.error_message === 'string' ? row.error_message : null,
    sent_at: String(row.sent_at || new Date().toISOString()),
  }));
}

export async function getScheduledEmails(): Promise<ScheduledEmailRecord[]> {
  const rows = await selectRows('scheduled_emails', '*', 5000);
  return (rows as any[]).map((row) => ({
    id: String(row.id),
    template_id: typeof row.template_id === 'string' ? row.template_id : null,
    recipient_scope: row.recipient_scope,
    recipient_payload: row.recipient_payload || {},
    subject: String(row.subject || ''),
    html_body: String(row.html_body || ''),
    status: row.status,
    scheduled_for: String(row.scheduled_for || new Date().toISOString()),
    sent_at: row.sent_at || null,
    created_by: row.created_by || null,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  }));
}

export async function getErrorLogSnapshot() {
  const rows = (await selectRows('error_logs', '*', 5000)) as ErrorLogRecord[];
  const todayStart = startOfDay(now());
  return {
    total: rows.length,
    critical: rows.filter((row) => row.severity === 'critical').length,
    today: rows.filter((row) => {
      const date = safeDate(row.created_at);
      return date ? date >= todayStart : false;
    }).length,
    unresolved: rows.filter((row) => !row.resolved).length,
    rows: rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
  };
}

export async function getSettingsSnapshot() {
  const [settings, templates] = await Promise.all([listAdminSettings(), getEmailTemplates()]);
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const retrovilleLaunchDate = settingMap.get(RETROVILLE_SETTING_KEY) || addMonths(now(), DEFAULT_RETROVILLE_MONTHS_AHEAD).toISOString();
  return {
    settings,
    templates,
    retrovilleLaunchDate,
  };
}
