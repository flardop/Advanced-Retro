import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type SupportedRange = '1h' | '24h' | '7d';

type PerfRow = {
  endpoint: string;
  method: string;
  status_code: number;
  duration_ms: number;
  cache_hit: boolean | null;
  created_at: string;
};

const RANGE_TO_HOURS: Record<SupportedRange, number> = {
  '1h': 1,
  '24h': 24,
  '7d': 24 * 7,
};

const RANGE_FETCH_LIMIT: Record<SupportedRange, number> = {
  '1h': 3500,
  '24h': 7000,
  '7d': 12000,
};

function setupErrorMessage() {
  return 'Falta tabla de rendimiento API. Ejecuta SQL: database/performance_social_market_cache.sql';
}

function isMissingPerfTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('api_performance_events') && message.includes('does not exist');
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function safeRange(raw: string): SupportedRange {
  const normalized = String(raw || '').trim().toLowerCase();
  if (normalized === '1h' || normalized === '24h' || normalized === '7d') return normalized;
  return '24h';
}

function computeTimelineBucketMs(range: SupportedRange): number {
  if (range === '1h') return 5 * 60 * 1000;
  if (range === '24h') return 60 * 60 * 1000;
  return 6 * 60 * 60 * 1000;
}

function toSafeRow(row: any): PerfRow {
  return {
    endpoint: String(row?.endpoint || '/unknown').slice(0, 220),
    method: String(row?.method || 'GET').toUpperCase().slice(0, 16),
    status_code: Math.max(100, Math.min(599, Math.round(Number(row?.status_code || 500)))),
    duration_ms: Math.max(0, Math.round(Number(row?.duration_ms || 0))),
    cache_hit: typeof row?.cache_hit === 'boolean' ? row.cache_hit : null,
    created_at: String(row?.created_at || ''),
  };
}

function formatBucketLabel(bucketStartIso: string, range: SupportedRange): string {
  const date = new Date(bucketStartIso);
  if (!Number.isFinite(date.getTime())) return bucketStartIso;
  if (range === '7d') {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
    });
  }
  return date.toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function GET(req: Request) {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const url = new URL(req.url);
    const range = safeRange(url.searchParams.get('range') || '24h');
    const since = new Date(Date.now() - RANGE_TO_HOURS[range] * 60 * 60 * 1000).toISOString();
    const fetchLimit = RANGE_FETCH_LIMIT[range];

    const { data, error } = await supabaseAdmin
      .from('api_performance_events')
      .select('endpoint,method,status_code,duration_ms,cache_hit,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(fetchLimit);

    if (error) {
      if (isMissingPerfTableError(error)) {
        return NextResponse.json(
          { setupRequired: true, error: setupErrorMessage() },
          { status: 503 }
        );
      }
      throw error;
    }

    const rows = (data || []).map(toSafeRow);
    const durations = rows.map((row) => row.duration_ms);
    const totalRequests = rows.length;
    const errorRows = rows.filter((row) => row.status_code >= 500);
    const cacheMeasuredRows = rows.filter((row) => typeof row.cache_hit === 'boolean');
    const cacheHits = cacheMeasuredRows.filter((row) => row.cache_hit === true).length;

    const endpointMap = new Map<
      string,
      {
        endpoint: string;
        method: string;
        durations: number[];
        requests: number;
        errors: number;
        cacheMeasured: number;
        cacheHits: number;
      }
    >();

    for (const row of rows) {
      const key = `${row.method} ${row.endpoint}`;
      const current = endpointMap.get(key) || {
        endpoint: row.endpoint,
        method: row.method,
        durations: [],
        requests: 0,
        errors: 0,
        cacheMeasured: 0,
        cacheHits: 0,
      };
      current.requests += 1;
      current.durations.push(row.duration_ms);
      if (row.status_code >= 500) current.errors += 1;
      if (typeof row.cache_hit === 'boolean') {
        current.cacheMeasured += 1;
        if (row.cache_hit) current.cacheHits += 1;
      }
      endpointMap.set(key, current);
    }

    const endpointStats = [...endpointMap.values()].map((item) => {
      const avgDurationMs = Number(avg(item.durations).toFixed(2));
      const p95DurationMs = Number(percentile(item.durations, 95).toFixed(2));
      const maxDurationMs = Math.max(...item.durations, 0);
      return {
        endpoint: item.endpoint,
        method: item.method,
        requests: item.requests,
        avgDurationMs,
        p95DurationMs,
        maxDurationMs,
        errorRate: item.requests > 0 ? Number((item.errors / item.requests).toFixed(4)) : 0,
        cacheHitRatio:
          item.cacheMeasured > 0
            ? Number((item.cacheHits / item.cacheMeasured).toFixed(4))
            : null,
      };
    });

    const topSlowEndpoints = [...endpointStats]
      .sort((a, b) => {
        if (b.p95DurationMs !== a.p95DurationMs) return b.p95DurationMs - a.p95DurationMs;
        if (b.avgDurationMs !== a.avgDurationMs) return b.avgDurationMs - a.avgDurationMs;
        return b.requests - a.requests;
      })
      .slice(0, 12);

    const topEndpointsByRequests = [...endpointStats]
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 12);

    const bucketMs = computeTimelineBucketMs(range);
    const timelineMap = new Map<
      number,
      { durations: number[]; requests: number; errors: number; cacheMeasured: number; cacheHits: number }
    >();

    for (const row of rows) {
      const createdAtMs = new Date(row.created_at).getTime();
      if (!Number.isFinite(createdAtMs)) continue;
      const bucketStartMs = Math.floor(createdAtMs / bucketMs) * bucketMs;
      const current = timelineMap.get(bucketStartMs) || {
        durations: [],
        requests: 0,
        errors: 0,
        cacheMeasured: 0,
        cacheHits: 0,
      };
      current.requests += 1;
      current.durations.push(row.duration_ms);
      if (row.status_code >= 500) current.errors += 1;
      if (typeof row.cache_hit === 'boolean') {
        current.cacheMeasured += 1;
        if (row.cache_hit) current.cacheHits += 1;
      }
      timelineMap.set(bucketStartMs, current);
    }

    const timeline = [...timelineMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([bucketStartMs, bucket]) => {
        const bucketStartIso = new Date(bucketStartMs).toISOString();
        return {
          bucketStart: bucketStartIso,
          label: formatBucketLabel(bucketStartIso, range),
          requests: bucket.requests,
          avgDurationMs: Number(avg(bucket.durations).toFixed(2)),
          p95DurationMs: Number(percentile(bucket.durations, 95).toFixed(2)),
          errorRate: bucket.requests > 0 ? Number((bucket.errors / bucket.requests).toFixed(4)) : 0,
          cacheHitRatio:
            bucket.cacheMeasured > 0
              ? Number((bucket.cacheHits / bucket.cacheMeasured).toFixed(4))
              : null,
        };
      });

    return NextResponse.json({
      setupRequired: false,
      range,
      since,
      sampleSize: totalRequests,
      summary: {
        totalRequests,
        avgDurationMs: Number(avg(durations).toFixed(2)),
        p95DurationMs: Number(percentile(durations, 95).toFixed(2)),
        maxDurationMs: durations.length ? Math.max(...durations) : 0,
        errorCount: errorRows.length,
        errorRate: totalRequests > 0 ? Number((errorRows.length / totalRequests).toFixed(4)) : 0,
        cacheMeasuredRequests: cacheMeasuredRows.length,
        cacheHitRatio:
          cacheMeasuredRows.length > 0
            ? Number((cacheHits / cacheMeasuredRows.length).toFixed(4))
            : null,
        endpointCount: endpointStats.length,
      },
      topSlowEndpoints,
      topEndpointsByRequests,
      timeline,
      recentErrors: errorRows.slice(0, 20).map((row) => ({
        endpoint: row.endpoint,
        method: row.method,
        statusCode: row.status_code,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
      })),
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
