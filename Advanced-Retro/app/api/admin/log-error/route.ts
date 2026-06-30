import { NextRequest } from 'next/server';
import { adminJson } from '@/lib/admin/api';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service';
import { sendAdminEmail } from '@/lib/admin/emailService';
import { getAdminSettingsMap, getBooleanSetting, getSettingValue } from '@/lib/admin/settings';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return adminJson({ logged: false, reason: 'missing-service-role' });
    }
    const payload = await request.json();
    const supabase = getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const severity = ['info', 'warning', 'error', 'critical'].includes(String(payload.severity)) ? String(payload.severity) : 'error';

    const { data } = await supabaseService
      .from('error_logs')
      .insert({
        message: String(payload.message || 'Unknown error'),
        stack_trace: typeof payload.stack === 'string' ? payload.stack : null,
        url: typeof payload.url === 'string' ? payload.url : null,
        user_id: authData.user?.id || null,
        severity,
        extra_data: payload.extra_data || {},
      })
      .select('*')
      .single();

    if (severity === 'critical') {
      const settings = await getAdminSettingsMap();
      const shouldNotify = getBooleanSetting(settings, 'notify_critical_error', true);
      const adminEmail = getSettingValue(settings, 'admin_alert_email', 'pitch@advancedretro.es');
      if (shouldNotify && adminEmail) {
        await sendAdminEmail({
          to: adminEmail,
          subject: `[CRITICAL] ${String(payload.message || 'Critical error')}`,
          html: `<h1>Error crítico detectado</h1><p><strong>URL:</strong> ${String(payload.url || 'N/D')}</p><pre>${String(payload.stack || '')}</pre>`,
        });
      }
    }

    return adminJson({ logged: true, row: data });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'Log error failed' }, { status: 500 });
  }
}
