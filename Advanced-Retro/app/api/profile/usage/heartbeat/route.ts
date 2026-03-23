import { NextResponse } from 'next/server';
import { ApiError, requireAuthUser } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

function normalizeSessionId(value: unknown): string {
  return String(value || '')
    .trim()
    .slice(0, 120);
}

function normalizePath(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('/')) return '/';
  return raw.slice(0, 320);
}

function normalizeActiveSeconds(value: unknown): number {
  const n = Math.floor(Number(value || 0));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(900, n);
}

function normalizeMarkEnded(value: unknown): boolean {
  return value === true || String(value || '').trim().toLowerCase() === 'true';
}

function isUsageSchemaMissing(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('track_user_usage_heartbeat') ||
    message.includes('user_usage_sessions') ||
    message.includes('user_usage_daily_stats') ||
    message.includes('function') ||
    message.includes('does not exist') ||
    message.includes('relation')
  );
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const user = await requireAuthUser();
    const body = await req.json().catch(() => null);
    const sessionId = normalizeSessionId(body?.sessionId);
    const path = normalizePath(body?.path);
    const activeSeconds = normalizeActiveSeconds(body?.activeSeconds);
    const markEnded = normalizeMarkEnded(body?.markEnded);

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
    }

    const userAgent = String(req.headers.get('user-agent') || '')
      .trim()
      .slice(0, 350);

    const { data, error } = await supabaseAdmin.rpc('track_user_usage_heartbeat', {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_path: path || null,
      p_active_seconds: activeSeconds,
      p_mark_ended: markEnded,
      p_user_agent: userAgent || null,
    });

    if (error) {
      if (isUsageSchemaMissing(error)) {
        return NextResponse.json(
          {
            error:
              'Faltan tablas/funciones de métricas. Ejecuta SQL: database/profile_usage_metrics.sql',
            setupRequired: true,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message || 'No se pudo registrar uso' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tracked: data || null });
  } catch (error: any) {
    return handleError(error);
  }
}
