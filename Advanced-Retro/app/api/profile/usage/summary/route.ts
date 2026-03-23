import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type UsageSummaryPayload = {
  totals: {
    active_seconds: number;
    sessions_count: number;
    page_views: number;
    avg_session_seconds: number;
    last_seen_at: string | null;
  };
  today: {
    active_seconds: number;
    sessions_count: number;
    page_views: number;
  };
  last_7d: {
    active_seconds: number;
    sessions_count: number;
    page_views: number;
  };
  last_30d: {
    active_seconds: number;
    sessions_count: number;
    page_views: number;
  };
  daily: Array<{
    usage_date: string;
    active_seconds: number;
    sessions_count: number;
    heartbeats_count: number;
    page_views: number;
  }>;
  latest_session: {
    session_id: string;
    started_at: string | null;
    last_seen_at: string | null;
    ended_at: string | null;
    active_seconds: number;
    heartbeat_count: number;
    page_views: number;
    last_path: string | null;
  } | null;
};

function emptySummary(): UsageSummaryPayload {
  return {
    totals: {
      active_seconds: 0,
      sessions_count: 0,
      page_views: 0,
      avg_session_seconds: 0,
      last_seen_at: null,
    },
    today: {
      active_seconds: 0,
      sessions_count: 0,
      page_views: 0,
    },
    last_7d: {
      active_seconds: 0,
      sessions_count: 0,
      page_views: 0,
    },
    last_30d: {
      active_seconds: 0,
      sessions_count: 0,
      page_views: 0,
    },
    daily: [],
    latest_session: null,
  };
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return new Date(ts).toISOString();
}

function toNumber(value: unknown): number {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function normalizeSummary(input: any): UsageSummaryPayload {
  const base = emptySummary();
  if (!input || typeof input !== 'object') return base;

  const totals = input.totals && typeof input.totals === 'object' ? input.totals : {};
  const today = input.today && typeof input.today === 'object' ? input.today : {};
  const last7d = input.last_7d && typeof input.last_7d === 'object' ? input.last_7d : {};
  const last30d = input.last_30d && typeof input.last_30d === 'object' ? input.last_30d : {};
  const latest = input.latest_session && typeof input.latest_session === 'object' ? input.latest_session : null;
  const dailyInput = Array.isArray(input.daily) ? input.daily : [];

  return {
    totals: {
      active_seconds: toNumber((totals as any).active_seconds),
      sessions_count: toNumber((totals as any).sessions_count),
      page_views: toNumber((totals as any).page_views),
      avg_session_seconds: toNumber((totals as any).avg_session_seconds),
      last_seen_at: toIsoOrNull((totals as any).last_seen_at),
    },
    today: {
      active_seconds: toNumber((today as any).active_seconds),
      sessions_count: toNumber((today as any).sessions_count),
      page_views: toNumber((today as any).page_views),
    },
    last_7d: {
      active_seconds: toNumber((last7d as any).active_seconds),
      sessions_count: toNumber((last7d as any).sessions_count),
      page_views: toNumber((last7d as any).page_views),
    },
    last_30d: {
      active_seconds: toNumber((last30d as any).active_seconds),
      sessions_count: toNumber((last30d as any).sessions_count),
      page_views: toNumber((last30d as any).page_views),
    },
    daily: dailyInput
      .map((item: any) => ({
        usage_date: String(item?.usage_date || ''),
        active_seconds: toNumber(item?.active_seconds),
        sessions_count: toNumber(item?.sessions_count),
        heartbeats_count: toNumber(item?.heartbeats_count),
        page_views: toNumber(item?.page_views),
      }))
      .filter((item: { usage_date: string }) => item.usage_date),
    latest_session: latest
      ? {
          session_id: String((latest as any).session_id || ''),
          started_at: toIsoOrNull((latest as any).started_at),
          last_seen_at: toIsoOrNull((latest as any).last_seen_at),
          ended_at: toIsoOrNull((latest as any).ended_at),
          active_seconds: toNumber((latest as any).active_seconds),
          heartbeat_count: toNumber((latest as any).heartbeat_count),
          page_views: toNumber((latest as any).page_views),
          last_path: String((latest as any).last_path || '') || null,
        }
      : null,
  };
}

function accountAgeDays(createdAt: string | null | undefined): number {
  const ts = new Date(String(createdAt || '')).getTime();
  if (!Number.isFinite(ts)) return 0;
  const now = Date.now();
  if (now <= ts) return 0;
  return Math.max(0, Math.floor((now - ts) / (1000 * 60 * 60 * 24)));
}

function isUsageSchemaMissing(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('get_user_usage_summary') ||
    message.includes('user_usage_sessions') ||
    message.includes('user_usage_daily_stats') ||
    message.includes('function') ||
    message.includes('does not exist') ||
    message.includes('relation')
  );
}

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { user, profile } = await requireUserContext();
    const createdAt = toIsoOrNull(profile?.created_at || null);
    const ageDays = accountAgeDays(createdAt);

    const { data, error } = await supabaseAdmin.rpc('get_user_usage_summary', {
      p_user_id: user.id,
    });

    if (error) {
      if (isUsageSchemaMissing(error)) {
        return NextResponse.json({
          setupRequired: true,
          setupSqlPath: 'database/profile_usage_metrics.sql',
          summary: emptySummary(),
          account_created_at: createdAt,
          account_age_days: ageDays,
        });
      }
      return NextResponse.json({ error: error.message || 'No se pudo cargar uso' }, { status: 500 });
    }

    const summary = normalizeSummary(data);
    return NextResponse.json({
      setupRequired: false,
      summary,
      account_created_at: createdAt,
      account_age_days: ageDays,
    });
  } catch (error: any) {
    return handleError(error);
  }
}
