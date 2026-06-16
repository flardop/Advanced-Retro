import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { adminJson } from '@/lib/admin/api';
import { resolveGeoFromRequest } from '@/lib/admin/geo';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service';
import { serverLogError } from '@/lib/admin/serverErrorLogger';

function hashIp(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getRequestIp(request: NextRequest) {
  return (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0').split(',')[0].trim();
}

function readPayloadString(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return adminJson({ updated: false, reason: 'missing-service-role' });
    }
    const payload = (await request.json()) as Record<string, unknown>;
    const sessionId = readPayloadString(payload, 'sessionId', 'session_id');
    if (!sessionId) {
      return Response.json({ success: false, error: 'sessionId requerido' }, { status: 400 });
    }

    const url = readPayloadString(payload, 'currentPage', 'current_page') || '/';
    if (url.startsWith('/admin')) {
      return adminJson({ updated: false, reason: 'admin-route' });
    }

    const supabase = getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const geo = resolveGeoFromRequest(request, payload);

    await supabaseService.from('user_sessions').upsert(
      {
        user_id: authData.user?.id || null,
        session_id: sessionId,
        current_page: url,
        device_type: readPayloadString(payload, 'deviceType', 'device_type') || null,
        browser: readPayloadString(payload, 'browser') || null,
        os: readPayloadString(payload, 'os') || null,
        ip_hash: hashIp(getRequestIp(request)),
        country: geo.country,
        city: geo.city,
        last_heartbeat: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    );

    return adminJson({ updated: true });
  } catch (error) {
    await serverLogError(error, { source: 'heartbeat-route' }).catch(() => null);
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'Heartbeat failed' }, { status: 500 });
  }
}
