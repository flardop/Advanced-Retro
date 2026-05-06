import Link from 'next/link';
import { MailPlus } from 'lucide-react';
import { EmailLogsTableView } from '@/components/admin/AdminDataViews';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { getEmailLogs } from '@/lib/admin/data';

export default async function AdminEmailsPage() {
  const rows = await getEmailLogs();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader title="Email Logs" description="Historial de entregas, fallos, campañas y comunicaciones transaccionales." breadcrumbs={[{ label: 'Admin' }, { label: 'Emails' }]} />
        <div className="flex gap-3">
          <Link href="/admin/emails/templates" className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">Templates</Link>
          <Link href="/admin/emails/send" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white"><MailPlus className="h-4 w-4" /> Send Email</Link>
        </div>
      </div>
      <EmailLogsTableView rows={rows} />
    </div>
  );
}
