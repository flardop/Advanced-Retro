import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { getEmailTemplateById, sendAdminEmail } from '@/lib/admin/emailService';
import { supabaseService } from '@/lib/supabase/service';
import { getAdminSettingsMap, getSettingValue } from '@/lib/admin/settings';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    const template = await getEmailTemplateById(params.id);
    if (!template) throw new Error('Template no encontrada');
    return template;
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    await supabaseService.from('email_templates').update({
      subject: String(payload.subject || ''),
      html_body: String(payload.html_body || ''),
      updated_at: new Date().toISOString(),
    }).eq('id', params.id);
    return { updated: true };
  });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async () => {
    const payload = await request.json();
    const template = await getEmailTemplateById(params.id);
    if (!template) throw new Error('Template no encontrada');
    const settings = await getAdminSettingsMap();
    const to = String(payload.testEmail || getSettingValue(settings, 'admin_alert_email', 'pitch@advancedretro.es'));
    await sendAdminEmail({
      to,
      subject: template.subject,
      html: template.html_body,
      templateId: template.id,
    });
    return { sent: true };
  });
}
