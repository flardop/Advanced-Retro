import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { adminJson } from '@/lib/admin/api';
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

function readPayloadNumber(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    const normalized = Number(value);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return adminJson({ tracked: false, reason: 'missing-service-role' });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const mode = readPayloadString(payload, 'mode') || 'start';
    const url = readPayloadString(payload, 'url') || '/';
    if (url.startsWith('/admin')) {
      return adminJson({ tracked: false, reason: 'admin-route' });
    }

    const supabase = getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || null;
    const ipHash = hashIp(getRequestIp(request));

    const sessionId = readPayloadString(payload, 'sessionId', 'session_id') || null;
    const pageTitle = readPayloadString(payload, 'pageTitle', 'page_title') || null;
    const referrer = readPayloadString(payload, 'referrer') || null;
    const deviceType = readPayloadString(payload, 'deviceType', 'device_type') || null;
    const browser = readPayloadString(payload, 'browser') || null;
    const os = readPayloadString(payload, 'os') || null;
    const country = readPayloadString(payload, 'country') || null;
    const city = readPayloadString(payload, 'city') || null;
    const durationSeconds = Math.max(0, Math.round(readPayloadNumber(payload, 'durationSeconds', 'duration_seconds')));
    const viewId = readPayloadString(payload, 'viewId', 'view_id') || null;

    if (mode === 'complete' && viewId) {
      await supabaseService
        .from('page_views')
        .update({ duration_seconds: durationSeconds })
        .eq('id', viewId);
    } else {
      const pageView = {
        url,
        page_title: pageTitle,
        user_id: userId,
        ip_hash: ipHash,
        session_id: sessionId,
        referrer,
        device_type: deviceType,
        browser,
        os,
        country,
        city,
        duration_seconds: durationSeconds,
      };

      const { data: inserted } = await supabaseService
        .from('page_views')
        .insert(pageView)
        .select('id')
        .single();

      if (sessionId) {
        await supabaseService.from('user_sessions').upsert(
          {
            user_id: userId,
            session_id: sessionId,
            current_page: url,
            device_type: deviceType,
            browser,
            os,
            ip_hash: ipHash,
            country,
            city,
            last_heartbeat: new Date().toISOString(),
          },
          { onConflict: 'session_id' }
        );
      }

      return adminJson({ tracked: true, viewId: inserted?.id || null });
    }

    if (sessionId) {
      await supabaseService.from('user_sessions').upsert(
        {
          user_id: userId,
          session_id: sessionId,
          current_page: url,
          device_type: deviceType,
          browser,
          os,
          ip_hash: ipHash,
          country,
          city,
          last_heartbeat: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
    }

    return adminJson({ tracked: true });
  } catch (error) {
    await serverLogError(error, { source: 'track-route' }).catch(() => null);
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'Track failed' }, { status: 500 });
  }
}
