import { Resend } from 'resend';
import { DEFAULT_EMAIL_TEMPLATES } from '@/lib/admin/constants';
import { getAdminSettingsMap, getSettingValue } from '@/lib/admin/settings';
import { supabaseService } from '@/lib/supabase/service';
import type { EmailTemplateRecord, EmailLogStatus } from '@/types/admin';

function renderTemplate(input: string, variables: Record<string, unknown>) {
  return input.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_full, key: string) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}

export async function getEmailTemplates(): Promise<EmailTemplateRecord[]> {
  if (!supabaseService) {
    return DEFAULT_EMAIL_TEMPLATES.map((item, index) => ({
      id: `default-${index}`,
      name: item.name,
      subject: item.subject,
      html_body: item.html_body,
      variables: [...item.variables],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  const { data } = await supabaseService.from('email_templates').select('*').order('name');
  return (data || []).map((row: any) => ({
    id: String(row.id),
    name: String(row.name),
    subject: String(row.subject || ''),
    html_body: String(row.html_body || ''),
    variables: Array.isArray(row.variables) ? row.variables.map((value: unknown) => String(value)) : [],
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  }));
}

export async function getEmailTemplateById(idOrName: string) {
  const templates = await getEmailTemplates();
  return templates.find((template) => template.id === idOrName || template.name === idOrName) || null;
}

async function insertEmailLog(payload: {
  recipient_email: string;
  recipient_user_id?: string | null;
  subject: string;
  template_id?: string | null;
  status: EmailLogStatus;
  error_message?: string | null;
}) {
  if (!supabaseService) return;
  await supabaseService.from('email_logs').insert({
    recipient_email: payload.recipient_email,
    recipient_user_id: payload.recipient_user_id || null,
    subject: payload.subject,
    template_id: payload.template_id || null,
    status: payload.status,
    error_message: payload.error_message || null,
  });
}

export async function sendAdminEmail(options: {
  to: string;
  subject: string;
  html: string;
  templateId?: string | null;
  recipientUserId?: string | null;
}) {
  const settings = await getAdminSettingsMap();
  const apiKey = getSettingValue(settings, 'resend_api_key', '');
  const compositeFrom = getSettingValue(
    settings,
    'resend_from_email',
    process.env.RESEND_FROM_EMAIL ? `AdvancedRetro <${process.env.RESEND_FROM_EMAIL}>` : 'AdvancedRetro <onboarding@resend.dev>'
  );

  if (!apiKey) {
    await insertEmailLog({
      recipient_email: options.to,
      recipient_user_id: options.recipientUserId,
      subject: options.subject,
      template_id: options.templateId,
      status: 'failed',
      error_message: 'Missing Resend API key in admin settings',
    });
    return { success: false, error: 'Missing Resend API key in admin settings' };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: compositeFrom,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    });

    await insertEmailLog({
      recipient_email: options.to,
      recipient_user_id: options.recipientUserId,
      subject: options.subject,
      template_id: options.templateId,
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email send failed';
    await insertEmailLog({
      recipient_email: options.to,
      recipient_user_id: options.recipientUserId,
      subject: options.subject,
      template_id: options.templateId,
      status: 'failed',
      error_message: message,
    });
    return { success: false, error: message };
  }
}

export async function sendEmailFromTemplate(options: {
  templateIdOrName: string;
  to: string;
  recipientUserId?: string | null;
  variables?: Record<string, unknown>;
  subjectOverride?: string;
  htmlOverride?: string;
}) {
  const template = await getEmailTemplateById(options.templateIdOrName);
  if (!template) {
    return { success: false, error: 'Email template not found' };
  }

  const subject = renderTemplate(options.subjectOverride || template.subject, options.variables || {});
  const html = renderTemplate(options.htmlOverride || template.html_body, options.variables || {});

  return sendAdminEmail({
    to: options.to,
    recipientUserId: options.recipientUserId || null,
    templateId: template.id,
    subject,
    html,
  });
}
