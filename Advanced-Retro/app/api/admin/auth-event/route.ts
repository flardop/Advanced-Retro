import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { adminJson } from '@/lib/admin/api';
import { supabaseService } from '@/lib/supabase/service';
import { serverLogError } from '@/lib/admin/serverErrorLogger';

function hashIp(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return adminJson({ logged: false, reason: 'missing-service-role' });
    }

    const payload = await request.json();
    await supabaseService.from('login_activity_logs').insert({
      user_id: typeof payload.userId === 'string' ? payload.userId : null,
      email: typeof payload.email === 'string' ? payload.email : null,
      event_type: typeof payload.eventType === 'string' ? payload.eventType : 'login',
      success: payload.success !== false,
      ip_hash: hashIp((request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0').split(',')[0].trim()),
      device_type: typeof payload.deviceType === 'string' ? payload.deviceType : null,
      browser: typeof payload.browser === 'string' ? payload.browser : null,
      os: typeof payload.os === 'string' ? payload.os : null,
    });

    return adminJson({ logged: true });
  } catch (error) {
    await serverLogError(error, { source: 'auth-event-route' }).catch(() => null);
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'Auth event failed' }, { status: 500 });
  }
}
