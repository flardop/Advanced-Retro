import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { getEmailTemplateById, sendAdminEmail } from '@/lib/admin/emailService';
import { supabaseService } from '@/lib/supabase/service';

async function resolveRecipients(scope: string, payload: Record<string, unknown>) {
  if (!supabaseService) throw new Error('Supabase service role no configurado');

  if (scope === 'custom_email') {
    const emails = Array.isArray(payload.emails) ? payload.emails.map((value) => String(value).trim()).filter(Boolean) : [];
    return emails.map((email) => ({ email, userId: null }));
  }

  if (scope === 'buyers') {
    const { data } = await supabaseService.from('orders').select('user_id, users:users(email)').limit(5000);
    const seen = new Map<string, string | null>();
    for (const row of data || []) {
      const email = String((row as any).users?.email || '');
      if (email) seen.set(email, String((row as any).user_id || ''));
    }
    return Array.from(seen.entries()).map(([email, userId]) => ({ email, userId }));
  }

  if (scope === 'selected_users') {
    const query = String(payload.query || '').trim();
    if (!query) return [];
    const { data } = await supabaseService.from('users').select('id,email').or(`email.ilike.%${query}%,name.ilike.%${query}%`).limit(100);
    return (data || []).map((row: any) => ({ email: String(row.email || ''), userId: String(row.id || '') })).filter((row) => row.email);
  }

  const { data } = await supabaseService.from('users').select('id,email').limit(5000);
  return (data || []).map((row: any) => ({ email: String(row.email || ''), userId: String(row.id || '') })).filter((row) => row.email);
}

export async function POST(request: NextRequest) {
  return withAdminRoute(async (session) => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();

    if (payload.retryLogId) {
      const { data: emailLog } = await supabaseService.from('email_logs').select('*').eq('id', payload.retryLogId).maybeSingle();
      if (!emailLog) throw new Error('Email log no encontrado');
      if (emailLog.template_id) {
        const template = await getEmailTemplateById(String(emailLog.template_id));
        if (template) {
          await sendAdminEmail({ to: String(emailLog.recipient_email), subject: template.subject, html: template.html_body, templateId: template.id, recipientUserId: emailLog.recipient_user_id || null });
        }
      } else {
        await supabaseService.from('email_logs').update({ status: 'pending', error_message: null }).eq('id', payload.retryLogId);
      }
      return { queued: true };
    }

    const scope = String(payload.recipientScope || 'all_users');
    const subject = String(payload.subject || '');
    const htmlBody = String(payload.htmlBody || '');
    const scheduleFor = payload.scheduleFor ? String(payload.scheduleFor) : null;

    if (scheduleFor) {
      await supabaseService.from('scheduled_emails').insert({
        template_id: payload.templateId || null,
        recipient_scope: scope,
        recipient_payload: payload.recipientPayload || {},
        subject,
        html_body: htmlBody,
        status: 'pending',
        scheduled_for: scheduleFor,
        created_by: session.user.id,
      });
      return { scheduled: true };
    }

    const recipients = await resolveRecipients(scope, payload.recipientPayload || {});
    let sent = 0;
    for (const recipient of recipients) {
      await sendAdminEmail({
        to: recipient.email,
        subject,
        html: htmlBody,
        templateId: payload.templateId || null,
        recipientUserId: recipient.userId,
      });
      sent += 1;
    }

    return { sent, recipients: recipients.length };
  });
}
