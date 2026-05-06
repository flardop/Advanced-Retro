import { EmailComposer } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { getScheduledEmails } from '@/lib/admin/data';
import { getEmailTemplates } from '@/lib/admin/emailService';

export default async function AdminSendEmailPage() {
  const [templates, scheduled] = await Promise.all([getEmailTemplates(), getScheduledEmails()]);

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Send Email" description="Campañas a toda la base, compradores o usuarios concretos con envío inmediato o programado." breadcrumbs={[{ label: 'Admin' }, { label: 'Emails', href: '/admin/emails' }, { label: 'Send' }]} />
      <EmailComposer templates={templates} scheduled={scheduled} />
    </div>
  );
}
