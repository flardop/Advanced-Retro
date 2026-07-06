import { endOfDay, format, isWithinInterval, parseISO, startOfDay, subDays, subHours } from 'date-fns';
import { getAdminSettingsMap } from '@/lib/admin/settings';
import { supabaseService } from '@/lib/supabase/service';
import {
  RETROVILLE_ADMIN_DEFAULT_PAGE_SIZE,
  RETROVILLE_PUBLIC_SETTING_KEYS,
  RETROVILLE_TRACKED_PAGES,
} from '@/lib/retroville-admin/constants';
import {
  getRetrovillePageRegistry,
  isRetrovillePageAllowedByRobots,
  isRetrovillePageInSitemap,
} from '@/lib/retroville-admin/page-registry';
import type { AnalyticsEventRecord, ErrorLogRecord, PageViewRecord, UserSessionRecord } from '@/types/admin';
import type {
  RetrovilleAdminAccessLogRow,
  RetrovilleAdminLoginAttemptRow,
  RetrovilleWaitlistAdminRow,
} from '@/types/retroville-admin';

function now() {
  return new Date();
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  } catch {
    return null;
  }
}

function toNumber(value: unknown) {
  const normalized = Number(value || 0);
  return Number.isFinite(normalized) ? normalized : 0;
}

function normalizePath(value: string | null | undefined) {
  const raw = String(value || '/').trim();
  if (!raw) return '/';
  try {
    const url = /^https?:\/\//i.test(raw) ? new URL(raw) : null;
    const pathname = (url?.pathname || raw.split('?')[0] || '/').trim();
    return pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : '/';
  } catch {
    const pathname = (raw.split('?')[0] || '/').trim();
    return pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : '/';
  }
}

function isRetrovillePath(value: string | null | undefined) {
  const path = normalizePath(value);
  return path === '/retroville' || path.startsWith('/retroville/');
}

function readMetaString(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function readMetaNumber(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = Number(meta?.[key]);
  return Number.isFinite(value) ? value : 0;
}

function calculateChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function groupCounts(values: Array<string | null | undefined>) {
  const map = new Map<string, number>();
  for (const value of values) {
    const key = String(value || 'Desconocido').trim() || 'Desconocido';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
}

function classifyTrafficSource(referrer: string | null | undefined) {
  const ref = String(referrer || '').toLowerCase().trim();
  if (!ref) return 'Directo';
  if (ref.includes('google') || ref.includes('bing') || ref.includes('duckduckgo') || ref.includes('yahoo')) return 'Google';
  if (
    ref.includes('instagram') ||
    ref.includes('threads') ||
    ref.includes('facebook') ||
    ref.includes('t.co') ||
    ref.includes('twitter') ||
    ref.includes('x.com') ||
    ref.includes('youtube') ||
    ref.includes('discord')
  ) {
    return 'Social';
  }
  if (ref.includes('mail') || ref.includes('gmail') || ref.includes('outlook')) return 'Email';
  return 'Referral';
}

function extractSearchKeyword(referrer: string | null | undefined) {
  const value = String(referrer || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!/google|bing|duckduckgo|yahoo/i.test(url.hostname)) return '';
    return (
      url.searchParams.get('q') ||
      url.searchParams.get('p') ||
      url.searchParams.get('query') ||
      url.searchParams.get('text') ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

function buildOccurrenceKey(row: ErrorLogRecord) {
  return String(row.message || 'error') + '|' + normalizePath(row.url || readMetaString(row.extra_data, 'route'));
}

function isRetrovilleError(row: ErrorLogRecord) {
  const route = readMetaString(row.extra_data, 'route');
  const zone = readMetaString(row.extra_data, 'zone');
  return zone === 'retroville' || isRetrovillePath(row.url) || isRetrovillePath(route);
}

async function selectRows<T = any>(table: string, query = '*', limit = 5000) {
  if (!supabaseService) return [] as T[];
  const { data } = await supabaseService.from(table).select(query).limit(limit);
  return (data || []) as T[];
}

async function getBaseRetrovilleRows() {
  const [pageViews, waitlist, events, errorLogs, sessions] = await Promise.all([
    selectRows<PageViewRecord>('page_views', '*', 10000),
    selectRows<RetrovilleWaitlistAdminRow>('retroville_waitlist', '*', 5000),
    selectRows<AnalyticsEventRecord>('analytics_events', '*', 10000),
    selectRows<ErrorLogRecord>('error_logs', '*', 5000),
    selectRows<UserSessionRecord>('user_sessions', '*', 5000),
  ]);

  return {
    pageViews,
    waitlist,
    events,
    errorLogs,
    sessions,
  };
}

function buildScrollDepthMap(events: AnalyticsEventRecord[]) {
  const perSessionPath = new Map<string, number>();

  for (const event of events) {
    if (event.event_name !== 'retroville_scroll_depth') continue;
    const path = normalizePath(event.path || readMetaString(event.meta, 'path'));
    const sessionId = event.session_id || 'unknown';
    const percent = Math.max(
      readMetaNumber(event.meta, 'percent'),
      readMetaNumber(event.meta, 'depth'),
      Math.round(readMetaNumber(event.meta, 'progress') * 100)
    );
    const key = `${path}|${sessionId}`;
    perSessionPath.set(key, Math.max(percent, perSessionPath.get(key) || 0));
  }

  const byPath = new Map<string, number[]>();
  for (const [key, percent] of perSessionPath.entries()) {
    const [path] = key.split('|');
    byPath.set(path, [...(byPath.get(path) || []), percent]);
  }

  return byPath;
}

function buildSessionPageMap(rows: PageViewRecord[]) {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = row.session_id || row.id;
    const set = map.get(key) || new Set<string>();
    set.add(normalizePath(row.url));
    map.set(key, set);
  }
  return map;
}

export async function getRetrovilleAdminDashboardData() {
  const { pageViews, waitlist, events, errorLogs, sessions } = await getBaseRetrovilleRows();
  const todayStart = startOfDay(now());
  const yesterdayStart = startOfDay(subDays(now(), 1));
  const yesterdayEnd = endOfDay(subDays(now(), 1));
  const last24h = subHours(now(), 24);
  const last2h = subHours(now(), 2);

  const retroPageViews = pageViews.filter((row) => isRetrovillePath(row.url));
  const retroEvents = events.filter((row) => isRetrovillePath(row.path || readMetaString(row.meta, 'path')) || String(row.event_name).startsWith('retroville_'));
  const retroErrors = errorLogs.filter(isRetrovilleError);
  const activeSessions = sessions.filter((row) => {
    const heartbeat = safeDate(row.last_heartbeat);
    return heartbeat ? heartbeat >= subHours(now(), 0.0334) && isRetrovillePath(row.current_page) : false;
  });

  const todayViews = retroPageViews.filter((row) => {
    const date = safeDate(row.timestamp);
    return date ? date >= todayStart : false;
  });
  const yesterdayViews = retroPageViews.filter((row) => {
    const date = safeDate(row.timestamp);
    return date ? isWithinInterval(date, { start: yesterdayStart, end: yesterdayEnd }) : false;
  });
  const todaySubscribers = waitlist.filter((row) => {
    const date = safeDate(row.created_at);
    return date ? date >= todayStart && row.signup_intent !== 'event' : false;
  });
  const pageGroups = groupCounts(todayViews.map((row) => normalizePath(row.url)));
  const topPage = pageGroups[0]?.label || '/retroville';

  const sessionDurations = new Map<string, number>();
  for (const row of todayViews) {
    const key = row.session_id || row.id;
    sessionDurations.set(key, (sessionDurations.get(key) || 0) + toNumber(row.duration_seconds));
  }
  const avgSessionDurationToday =
    sessionDurations.size > 0
      ? Array.from(sessionDurations.values()).reduce((sum, value) => sum + value, 0) / sessionDurations.size
      : 0;

  const errorsLast24h = retroErrors.filter((row) => {
    const date = safeDate(row.created_at);
    return date ? date >= last24h : false;
  });
  const criticalLast2h = retroErrors.filter((row) => {
    const date = safeDate(row.created_at);
    return date ? date >= last2h && row.severity === 'critical' : false;
  });
  const criticalBurst = groupCounts(criticalLast2h.map((row) => buildOccurrenceKey(row)))[0]?.value || 0;

  const siteStatus =
    criticalBurst > 10 ? 'error' : errorsLast24h.some((row) => (row.status || 'new') !== 'resolved') ? 'degradado' : 'online';

  const hourlyViews = Array.from({ length: 24 }, (_, index) => {
    const hourStart = new Date(todayStart);
    hourStart.setHours(index, 0, 0, 0);
    const hourEnd = new Date(todayStart);
    hourEnd.setHours(index, 59, 59, 999);

    const value = todayViews.filter((row) => {
      const date = safeDate(row.timestamp);
      return date ? isWithinInterval(date, { start: hourStart, end: hourEnd }) : false;
    }).length;

    return {
      label: format(hourStart, 'HH:00'),
      value,
    };
  });

  const recentFeed = [
    ...waitlist.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 4).map((row) => ({
      id: `waitlist-${row.id}`,
      type: 'signup',
      timestamp: row.created_at,
      label: row.signup_intent === 'event' ? 'Registro al reveal' : 'Alta en La Señal',
      detail: `${row.email} · ${row.role_label || 'perfil sin definir'} · ${row.page_path || '/retroville'}`,
    })),
    ...retroPageViews.slice().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 4).map((row) => ({
      id: `view-${row.id}`,
      type: 'page_view',
      timestamp: row.timestamp,
      label: 'Página visitada',
      detail: `${normalizePath(row.url)} · ${row.country || 'Desconocido'} · ${row.device_type || 'desconocido'}`,
    })),
    ...retroErrors.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 4).map((row) => ({
      id: `error-${row.id}`,
      type: 'error',
      timestamp: row.created_at,
      label: row.severity === 'critical' ? 'Error crítico' : 'Error detectado',
      detail: `${normalizePath(row.url || readMetaString(row.extra_data, 'route'))} · ${row.message}`,
    })),
    ...retroEvents.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 4).map((row) => ({
      id: `event-${row.id}`,
      type: 'event',
      timestamp: row.created_at,
      label: String(row.event_name).replace(/^retroville_/, '').replace(/_/g, ' '),
      detail: `${normalizePath(row.path || readMetaString(row.meta, 'path'))} · ${readMetaString(row.meta, 'country') || 'Desconocido'}`,
    })),
  ]
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 10);

  return {
    summary: {
      todayViews: todayViews.length,
      yesterdayViews: yesterdayViews.length,
      viewsChangePct: calculateChange(todayViews.length, yesterdayViews.length),
      newSubscribersToday: todaySubscribers.length,
      topPageToday: topPage,
      avgSessionDurationToday,
      errorsLast24h: errorsLast24h.length,
      siteStatus,
      activeNow: activeSessions.length,
    },
    hourlyViews,
    recentFeed,
  };
}

export async function getRetrovilleAdminUsersData(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  profile?: string;
  status?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  from?: string;
  to?: string;
}) {
  const { waitlist, pageViews } = await getBaseRetrovilleRows();
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.max(1, Math.min(5000, Number(input.pageSize || RETROVILLE_ADMIN_DEFAULT_PAGE_SIZE)));
  const search = String(input.search || '').trim().toLowerCase();
  const profile = String(input.profile || '').trim();
  const status = String(input.status || '').trim();
  const direction = input.direction === 'asc' ? 'asc' : 'desc';
  const sort = String(input.sort || 'created_at');
  const from = safeDate(input.from) || null;
  const to = safeDate(input.to) || null;

  let rows = waitlist.slice();

  if (search) {
    rows = rows.filter((row) =>
      [row.display_name || '', row.email || '', row.page_path || ''].some((value) =>
        String(value).toLowerCase().includes(search)
      )
    );
  }

  if (profile) {
    rows = rows.filter((row) => String(row.role_label || '').toLowerCase() === profile.toLowerCase());
  }

  if (status) {
    rows = rows.filter((row) => String(row.status || 'active').toLowerCase() === status.toLowerCase());
  }

  if (from || to) {
    rows = rows.filter((row) => {
      const createdAt = safeDate(row.created_at);
      if (!createdAt) return false;
      if (from && createdAt < from) return false;
      if (to && createdAt > endOfDay(to)) return false;
      return true;
    });
  }

  const sortValue = (row: RetrovilleWaitlistAdminRow) => {
    switch (sort) {
      case 'display_name':
        return row.display_name || '';
      case 'email':
        return row.email || '';
      case 'role_label':
        return row.role_label || '';
      case 'page_path':
        return row.page_path || '';
      case 'device_type':
        return row.device_type || '';
      case 'country':
        return row.country || '';
      case 'status':
        return row.status || 'active';
      default:
        return row.created_at || '';
    }
  };

  rows.sort((left, right) => {
    const a = sortValue(left);
    const b = sortValue(right);
    if (typeof a === 'string' && typeof b === 'string') {
      return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    return direction === 'asc' ? Number(a) - Number(b) : Number(b) - Number(a);
  });

  const summaryThisWeek = waitlist.filter((row) => {
    const date = safeDate(row.created_at);
    return date ? date >= startOfDay(subDays(now(), 6)) : false;
  }).length;

  const roleBreakdown = groupCounts(waitlist.map((row) => row.role_label || 'Sin perfil'));
  const topCountries = groupCounts(waitlist.map((row) => row.country || 'Desconocido')).slice(0, 3);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const relatedVisitsBySession = new Map<string, number>();
  for (const row of pageViews.filter((entry) => isRetrovillePath(entry.url))) {
    const key = String(row.session_id || '');
    if (!key) continue;
    relatedVisitsBySession.set(key, (relatedVisitsBySession.get(key) || 0) + 1);
  }

  return {
    summary: {
      totalSubscribers: waitlist.length,
      subscribersThisWeek: summaryThisWeek,
      roleBreakdown: roleBreakdown.map((item) => ({
        ...item,
        share: waitlist.length > 0 ? (item.value / waitlist.length) * 100 : 0,
      })),
      topCountries,
    },
    pagination: {
      page,
      pageSize,
      total: rows.length,
      totalPages,
    },
    rows: pageRows.map((row) => ({
      ...row,
      visits_count: row.session_id ? relatedVisitsBySession.get(row.session_id) || row.visits_count || 1 : row.visits_count || 1,
      avatarInitial: (row.display_name || row.email || '?').slice(0, 1).toUpperCase(),
    })),
  };
}

export async function getRetrovilleAdminUserDetail(id: string) {
  const { waitlist, pageViews } = await getBaseRetrovilleRows();
  const row = waitlist.find((item) => item.id === id) || null;
  if (!row) return null;

  const history = row.session_id
    ? pageViews
        .filter((entry) => entry.session_id === row.session_id && isRetrovillePath(entry.url))
        .sort((left, right) => String(right.timestamp).localeCompare(String(left.timestamp)))
    : [];

  const groupedPages = groupCounts(history.map((entry) => normalizePath(entry.url))).slice(0, 10);

  return {
    user: row,
    stats: {
      totalPageViews: history.length,
      totalTime: history.reduce((sum, entry) => sum + toNumber(entry.duration_seconds), 0),
      uniquePages: new Set(history.map((entry) => normalizePath(entry.url))).size,
      device: row.device_type || 'Desconocido',
      visits: history.length > 0 ? history.length : row.visits_count || 1,
    },
    pageHistory: history.map((entry) => ({
      id: entry.id,
      path: normalizePath(entry.url),
      title: entry.page_title || normalizePath(entry.url),
      durationSeconds: toNumber(entry.duration_seconds),
      timestamp: entry.timestamp,
    })),
    topPages: groupedPages,
  };
}

export async function getRetrovilleAdminPageAnalyticsData(input: {
  preset?: 'today' | '7d' | '30d' | 'custom';
  from?: string;
  to?: string;
}) {
  const { pageViews, events } = await getBaseRetrovilleRows();
  const preset = input.preset || '30d';
  const from =
    safeDate(input.from) ||
    (preset === 'today'
      ? startOfDay(now())
      : preset === '7d'
        ? startOfDay(subDays(now(), 6))
        : startOfDay(subDays(now(), 29)));
  const to = safeDate(input.to) || endOfDay(now());

  const retroRows = pageViews.filter((row) => isRetrovillePath(row.url)).filter((row) => {
    const date = safeDate(row.timestamp);
    return date ? isWithinInterval(date, { start: from, end: to }) : false;
  });
  const retroEvents = events.filter((row) => {
    if (!(String(row.event_name).startsWith('retroville_') || isRetrovillePath(row.path))) return false;
    const date = safeDate(row.created_at);
    return date ? isWithinInterval(date, { start: from, end: to }) : false;
  });

  const scrollDepthMap = buildScrollDepthMap(retroEvents);
  const sessionPages = buildSessionPageMap(retroRows);

  const rowsByPath = RETROVILLE_TRACKED_PAGES.map((path) => {
    const pageRows = retroRows.filter((row) => normalizePath(row.url) === path);
    const uniqueSessions = new Set(pageRows.map((row) => row.session_id || row.id));
    const sessionsIncludingPage = Array.from(uniqueSessions);
    const bounceSessions = sessionsIncludingPage.filter((sessionId) => (sessionPages.get(sessionId)?.size || 0) <= 1).length;
    const scrollValues = scrollDepthMap.get(path) || [];

    return {
      path,
      totalViews: pageRows.length,
      uniqueSessions: uniqueSessions.size,
      avgTimeSeconds:
        pageRows.length > 0
          ? pageRows.reduce((sum, row) => sum + toNumber(row.duration_seconds), 0) / pageRows.length
          : 0,
      bounceRate: uniqueSessions.size > 0 ? (bounceSessions / uniqueSessions.size) * 100 : 0,
      scrollDepthAverage:
        scrollValues.length > 0 ? scrollValues.reduce((sum, value) => sum + value, 0) / scrollValues.length : 0,
      topCountries: groupCounts(pageRows.map((row) => row.country || 'Desconocido')).slice(0, 3),
      topDevices: groupCounts(pageRows.map((row) => row.device_type || 'Desconocido')).slice(0, 3),
      topSources: groupCounts(pageRows.map((row) => classifyTrafficSource(row.referrer))).slice(0, 3),
      trend: Array.from({ length: Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1) }, (_, index) => {
        const date = new Date(from);
        date.setDate(from.getDate() + index);
        const label = format(date, 'dd MMM');
        const value = pageRows.filter((row) => {
          const timestamp = safeDate(row.timestamp);
          return timestamp ? format(timestamp, 'dd MMM') === label : false;
        }).length;
        return { label, value };
      }),
    };
  });

  return {
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      preset,
    },
    pages: rowsByPath,
  };
}

export async function getRetrovilleAdminRealtimeData() {
  const { sessions, pageViews, events } = await getBaseRetrovilleRows();
  const activeCutoff = subHours(now(), 0.0334);
  const activeSessions = sessions
    .filter((row) => {
      const heartbeat = safeDate(row.last_heartbeat);
      return heartbeat ? heartbeat >= activeCutoff && isRetrovillePath(row.current_page) : false;
    })
    .sort((left, right) => String(right.last_heartbeat).localeCompare(String(left.last_heartbeat)));

  const latestPageViewBySessionPath = new Map<string, PageViewRecord>();
  for (const row of pageViews.filter((entry) => isRetrovillePath(entry.url))) {
    const key = `${row.session_id || row.id}|${normalizePath(row.url)}`;
    const current = latestPageViewBySessionPath.get(key);
    if (!current || String(row.timestamp) > String(current.timestamp)) {
      latestPageViewBySessionPath.set(key, row);
    }
  }

  const clickEvents = events.filter((row) => {
    if (!String(row.event_name).startsWith('retroville_')) return false;
    return [
      'retroville_buyer_cta_click',
      'retroville_private_document_mail_click',
      'retroville_private_document_open',
      'retroville_newsletter_signup',
      'retroville_event_signup',
      'retroville_event_calendar_save',
    ].includes(row.event_name);
  });

  const clickLabels = clickEvents.map((row) => {
    if (row.event_name === 'retroville_buyer_cta_click') {
      return `${readMetaString(row.meta, 'location') || 'zona'} · ${readMetaString(row.meta, 'action') || 'cta'}`;
    }
    if (row.event_name === 'retroville_private_document_mail_click') {
      return `Documento privado · ${readMetaString(row.meta, 'document_title') || 'solicitud'}`;
    }
    if (row.event_name === 'retroville_newsletter_signup') {
      return `Newsletter · ${readMetaString(row.meta, 'source') || 'web'}`;
    }
    if (row.event_name === 'retroville_event_signup') {
      return `Reveal · ${readMetaString(row.meta, 'source') || 'web'}`;
    }
    if (row.event_name === 'retroville_event_calendar_save') {
      return `Calendario · ${readMetaString(row.meta, 'channel') || 'save'}`;
    }
    return row.event_name.replace(/^retroville_/, '').replace(/_/g, ' ');
  });
  const clickLeaderboard = groupCounts(clickLabels).map((item) => ({
    ...item,
    percentage: clickLabels.length > 0 ? (item.value / clickLabels.length) * 100 : 0,
  }));

  const scrollDepthMap = buildScrollDepthMap(events);
  const scrollLeaderboard = Array.from(scrollDepthMap.entries()).map(([path, values]) => ({
    path,
    averageDepth: values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    sessions: values.length,
  })).sort((left, right) => right.averageDepth - left.averageDepth);

  return {
    activeUsers: activeSessions.length,
    sessions: activeSessions.slice(0, 20).map((row) => {
      const key = `${row.session_id}|${normalizePath(row.current_page)}`;
      const latestView = latestPageViewBySessionPath.get(key);
      const startedAt = safeDate(latestView?.timestamp || row.started_at);
      const durationSeconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000)) : 0;

      return {
        id: row.id,
        currentPage: normalizePath(row.current_page),
        durationSeconds,
        deviceType: row.device_type || 'Desconocido',
        country: row.country || 'Desconocido',
        city: row.city || '—',
        lastHeartbeat: row.last_heartbeat,
      };
    }),
    clickLeaderboard: clickLeaderboard.slice(0, 12),
    scrollLeaderboard: scrollLeaderboard.slice(0, 12),
  };
}

export async function getRetrovilleAdminSeoData() {
  const [registry, audits, crawlerLogs, pageViews] = await Promise.all([
    getRetrovillePageRegistry(),
    selectRows<any>('retroville_seo_audits', '*', 500),
    selectRows<any>('retroville_crawler_logs', '*', 500),
    selectRows<PageViewRecord>('page_views', '*', 10000),
  ]);

  const auditMap = new Map<string, any>();
  for (const row of audits) {
    const path = normalizePath(row.path);
    if (!auditMap.has(path) || String(row.created_at) > String(auditMap.get(path).created_at)) {
      auditMap.set(path, row);
    }
  }

  const crawlerMap = new Map<string, any>();
  for (const row of crawlerLogs) {
    const path = normalizePath(row.path);
    if (!crawlerMap.has(path) || String(row.created_at) > String(crawlerMap.get(path).created_at)) {
      crawlerMap.set(path, row);
    }
  }

  const keywordCounts = groupCounts(
    pageViews
      .filter((row) => isRetrovillePath(row.url))
      .map((row) => extractSearchKeyword(row.referrer))
      .filter(Boolean)
  );

  return {
    pages: registry.map((entry) => {
      const audit = auditMap.get(entry.path) || null;
      const crawler = crawlerMap.get(entry.path) || null;
      return {
        path: entry.path,
        label: entry.label,
        published: entry.published !== false,
        seoTitle: audit?.title || entry.seoTitle,
        metaDescription: audit?.meta_description || entry.metaDescription,
        canonical: audit?.canonical || entry.canonical,
        lighthouseSeoScore: typeof audit?.lighthouse_seo_score === 'number' ? audit.lighthouse_seo_score : null,
        structuredData: audit?.structured_data_types?.length ? audit.structured_data_types : entry.structuredDataTypes,
        lastModified: entry.lastModified,
        inSitemap: isRetrovillePageInSitemap(entry.path),
        robotsAllowed: isRetrovillePageAllowedByRobots(entry.path),
        lastGooglebotVisit: crawler?.created_at || null,
      };
    }),
    keywords: keywordCounts.slice(0, 20),
  };
}

export async function regenerateRetrovilleSitemapSnapshot() {
  if (supabaseService) {
    await supabaseService.from('admin_settings').upsert({
      key: 'retroville_sitemap_last_regenerated',
      value: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const registry = await getRetrovillePageRegistry();
  const included = registry.filter((entry) => entry.published !== false && isRetrovillePageInSitemap(entry.path));
  return {
    includedUrls: included.length,
    regeneratedAt: new Date().toISOString(),
  };
}

export async function getRetrovilleAdminErrorsData() {
  const { errorLogs } = await getBaseRetrovilleRows();
  const retroErrors = errorLogs.filter(isRetrovilleError);
  const grouped = new Map<
    string,
    {
      ids: string[];
      message: string;
      page: string;
      browser: string;
      deviceType: string;
      severity: string;
      status: string;
      occurrences: number;
      latestAt: string;
    }
  >();

  for (const row of retroErrors) {
    const key = row.occurrence_key || buildOccurrenceKey(row);
    const current = grouped.get(key) || {
      ids: [],
      message: row.message,
      page: normalizePath(row.url || readMetaString(row.extra_data, 'route')),
      browser: row.browser || readMetaString(row.extra_data, 'browser') || 'Desconocido',
      deviceType: row.device_type || readMetaString(row.extra_data, 'device_type') || 'Desconocido',
      severity: row.severity,
      status: row.status || (row.resolved ? 'resolved' : 'new'),
      occurrences: 0,
      latestAt: row.created_at,
    };

    current.ids.push(row.id);
    current.occurrences += 1;
    if (String(row.created_at) > String(current.latestAt)) {
      current.latestAt = row.created_at;
      current.severity = row.severity;
      current.status = row.status || (row.resolved ? 'resolved' : 'new');
      current.browser = row.browser || readMetaString(row.extra_data, 'browser') || current.browser;
      current.deviceType = row.device_type || readMetaString(row.extra_data, 'device_type') || current.deviceType;
    }

    grouped.set(key, current);
  }

  const rows = Array.from(grouped.entries()).map(([occurrenceKey, row]) => ({
    occurrenceKey,
    ...row,
  }));
  const errorsLast24h = rows.filter((row) => {
    const date = safeDate(row.latestAt);
    return date ? date >= subHours(now(), 24) : false;
  });
  const criticalAlert = rows.some((row) => {
    const date = safeDate(row.latestAt);
    return date ? date >= subHours(now(), 2) && row.occurrences > 10 && row.severity === 'critical' : false;
  });

  return {
    summary: {
      totalLast24h: errorsLast24h.length,
      unreviewed: rows.filter((row) => row.status === 'new').length,
      criticalAlert,
    },
    rows: rows.sort((left, right) => String(right.latestAt).localeCompare(String(left.latestAt))),
  };
}

export async function updateRetrovilleAdminErrorStatus(
  occurrenceKey: string,
  status: 'new' | 'reviewed' | 'resolved'
) {
  if (!supabaseService) return { updated: 0 };

  const normalizedStatus: 'new' | 'reviewed' | 'resolved' = ['new', 'reviewed', 'resolved'].includes(status)
    ? status
    : 'new';

  const targetRows = (await selectRows<ErrorLogRecord>('error_logs', '*', 5000)).filter(
    (row) => isRetrovilleError(row) && (row.occurrence_key || buildOccurrenceKey(row)) === occurrenceKey
  );

  if (!targetRows.length) return { updated: 0 };

  const ids = targetRows.map((row) => row.id);
  const resolved = normalizedStatus === 'resolved';

  await supabaseService
    .from('error_logs')
    .update({
      status: normalizedStatus,
      resolved,
    })
    .in('id', ids);

  return {
    updated: ids.length,
  };
}

export async function clearRetrovilleResolvedErrors() {
  if (!supabaseService) return { deleted: 0 };

  const cutoff = subDays(now(), 7).toISOString();
  const targetRows = (await selectRows<ErrorLogRecord>('error_logs', '*', 5000)).filter((row) => {
    if (!isRetrovilleError(row)) return false;
    const createdAt = safeDate(row.created_at);
    const status = row.status || (row.resolved ? 'resolved' : 'new');
    return createdAt ? status === 'resolved' && createdAt <= subDays(now(), 7) : false;
  });

  if (!targetRows.length) return { deleted: 0 };

  await supabaseService
    .from('error_logs')
    .delete()
    .in(
      'id',
      targetRows.map((row) => row.id)
    );

  return {
    deleted: targetRows.length,
    olderThan: cutoff,
  };
}

export async function getRetrovilleAdminContentData() {
  const settings = await getAdminSettingsMap();

  return {
    heroTagline: settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.heroTagline) || 'Every forgotten game ends up somewhere.',
    buyerBriefCopy:
      settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.buyerBriefCopy) ||
      'El siguiente paso ya no depende de adivinar qué material hay o a qué correo escribir.',
    contactEmail: settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.contactEmail) || 'retr0ovllee@gmail.com',
    launchDate: settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.launchDate) || '2026-11-10T00:00:00.000Z',
    eventDescription:
      settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.eventDescription) ||
      'El 10 de noviembre llega la primera señal publica de Retroville: activamos el primer reveal, abrimos el siguiente drop y avisamos primero a quienes ya reciben La Señal.',
    waitlistOpen: ['1', 'true', 'yes', 'on'].includes(
      String(settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.waitlistOpen) || 'true').toLowerCase()
    ),
    maintenanceMode: ['1', 'true', 'yes', 'on'].includes(
      String(settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.maintenanceMode) || 'false').toLowerCase()
    ),
  };
}

export async function saveRetrovilleAdminContentData(values: Record<string, string | boolean>) {
  if (!supabaseService) return { updated: 0 };

  const entries = Object.entries(values).map(([key, value]) => ({
    key,
    value: typeof value === 'boolean' ? String(value) : String(value ?? ''),
    updated_at: new Date().toISOString(),
  }));

  await supabaseService.from('admin_settings').upsert(entries);
  return { updated: entries.length };
}

export async function getRetrovilleAdminConfigurationData() {
  const [settings, accessLogs, loginAttempts, sessions] = await Promise.all([
    getAdminSettingsMap(),
    selectRows<RetrovilleAdminAccessLogRow>('retroville_admin_access_logs', '*', 50),
    selectRows<RetrovilleAdminLoginAttemptRow>('retroville_admin_login_attempts', '*', 100),
    selectRows<any>('retroville_admin_sessions', '*', 200),
  ]);

  const maintenanceMode = ['1', 'true', 'yes', 'on'].includes(
    String(settings.get(RETROVILLE_PUBLIC_SETTING_KEYS.maintenanceMode) || 'false').toLowerCase()
  );

  return {
    maintenanceMode,
    activeAdminSessions: sessions.filter((row) => !row.revoked_at && safeDate(row.expires_at)?.getTime()! > Date.now()).length,
    recentAccesses: accessLogs
      .slice()
      .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
      .slice(0, 10),
    failedAttempts: loginAttempts
      .filter((row) => {
        const date = safeDate(row.attempted_at);
        return date ? date >= subHours(now(), 24) && !row.success : false;
      })
      .sort((left, right) => String(right.attempted_at).localeCompare(String(left.attempted_at))),
  };
}

export async function saveRetrovilleAdminConfigurationData(values: {
  maintenanceMode?: boolean;
}) {
  return saveRetrovilleAdminContentData({
    [RETROVILLE_PUBLIC_SETTING_KEYS.maintenanceMode]:
      typeof values.maintenanceMode === 'boolean' ? values.maintenanceMode : false,
  });
}
