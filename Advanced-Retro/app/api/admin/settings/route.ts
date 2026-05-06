import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { getSettingsSnapshot } from '@/lib/admin/data';
import { DEFAULT_EMAIL_TEMPLATES } from '@/lib/admin/constants';
import { supabaseService } from '@/lib/supabase/service';

const backupTables = [
  'users',
  'products',
  'orders',
  'support_tickets',
  'support_messages',
  'profiles',
  'page_views',
  'user_sessions',
  'error_logs',
  'email_logs',
  'email_templates',
  'admin_settings',
  'retroville_waitlist',
  'store_creator_leads',
];

export async function GET() {
  return withAdminRoute(async () => getSettingsSnapshot());
}

export async function PATCH(request: NextRequest) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const settings = Array.isArray(payload.settings) ? payload.settings : [];
    if (!settings.length) return { updated: 0 };
    await supabaseService.from('admin_settings').upsert(settings.map((item: any) => ({
      key: String(item.key),
      value: String(item.value ?? ''),
      updated_at: new Date().toISOString(),
    })));
    return { updated: settings.length };
  });
}

export async function POST(request: NextRequest) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const action = String(payload.action || '');

    if (action === 'clear_analytics') {
      await Promise.all([
        supabaseService.from('page_views').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabaseService.from('user_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabaseService.from('login_activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      return { cleared: true };
    }

    if (action === 'reset_templates') {
      await supabaseService.from('email_templates').upsert(
        DEFAULT_EMAIL_TEMPLATES.map((item) => ({
          name: item.name,
          subject: item.subject,
          html_body: item.html_body,
          variables: item.variables,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'name' }
      );
      return { reset: true };
    }

    if (action === 'export_backup') {
      const backup: Record<string, unknown> = {};
      for (const table of backupTables) {
        const { data } = await supabaseService.from(table).select('*').limit(5000);
        backup[table] = data || [];
      }
      return backup;
    }

    throw new Error('Acción no soportada');
  });
}
