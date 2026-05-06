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

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return adminJson({ tracked: false, reason: 'missing-service-role' });
    }

    const payload = await request.json();
    const url = String(payload.url || '/');
    if (url.startsWith('/admin')) {
      return adminJson({ tracked: false, reason: 'admin-route' });
    }

    const supabase = getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || null;
    const ipHash = hashIp(getRequestIp(request));

    const pageView = {
      url,
      page_title: typeof payload.pageTitle === 'string' ? payload.pageTitle : null,
      user_id: userId,
      ip_hash: ipHash,
      session_id: typeof payload.sessionId === 'string' ? payload.sessionId : null,
      referrer: typeof payload.referrer === 'string' ? payload.referrer : null,
      device_type: typeof payload.deviceType === 'string' ? payload.deviceType : null,
      browser: typeof payload.browser === 'string' ? payload.browser : null,
      os: typeof payload.os === 'string' ? payload.os : null,
      country: typeof payload.country === 'string' ? payload.country : null,
      city: typeof payload.city === 'string' ? payload.city : null,
      duration_seconds: Number(payload.durationSeconds || 0),
    };

    await supabaseService.from('page_views').insert(pageView);
    if (pageView.session_id) {
      await supabaseService.from('user_sessions').upsert(
        {
          user_id: userId,
          session_id: pageView.session_id,
          current_page: url,
          device_type: pageView.device_type,
          browser: pageView.browser,
          os: pageView.os,
          ip_hash: ipHash,
          country: pageView.country,
          city: pageView.city,
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
