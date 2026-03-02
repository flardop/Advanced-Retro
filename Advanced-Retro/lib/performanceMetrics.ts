import { supabaseAdmin } from '@/lib/supabaseAdmin';

const TABLE_NAME = 'api_performance_events';

export type ApiPerformanceEventInput = {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  cacheHit?: boolean | null;
  metadata?: Record<string, unknown>;
};

function isMissingRelationError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('relation') && message.includes('does not exist');
}

function normalizeEndpoint(value: unknown): string {
  const endpoint = String(value || '').trim().slice(0, 180);
  return endpoint || '/unknown';
}

function normalizeMethod(value: unknown): string {
  const method = String(value || 'GET').trim().toUpperCase().slice(0, 16);
  return method || 'GET';
}

function normalizeStatusCode(value: unknown): number {
  const code = Math.round(Number(value || 0));
  if (!Number.isFinite(code) || code < 100 || code > 599) return 500;
  return code;
}

function normalizeDurationMs(value: unknown): number {
  const duration = Math.round(Number(value || 0));
  if (!Number.isFinite(duration) || duration < 0) return 0;
  return Math.min(duration, 120_000);
}

export async function logApiPerformanceEvent(input: ApiPerformanceEventInput): Promise<void> {
  if (!supabaseAdmin) return;

  const payload = {
    endpoint: normalizeEndpoint(input.endpoint),
    method: normalizeMethod(input.method),
    status_code: normalizeStatusCode(input.statusCode),
    duration_ms: normalizeDurationMs(input.durationMs),
    cache_hit:
      typeof input.cacheHit === 'boolean'
        ? input.cacheHit
        : null,
    metadata:
      input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
        ? input.metadata
        : {},
    created_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from(TABLE_NAME).insert(payload);
  if (error && !isMissingRelationError(error)) {
    console.warn('api_performance_events insert failed:', error.message || error);
  }
}

export function getRequestStartTimeMs(): number {
  return Date.now();
}

export function getRequestDurationMs(startMs: number): number {
  return Math.max(0, Date.now() - startMs);
}
