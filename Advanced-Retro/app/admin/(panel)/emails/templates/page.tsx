import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { getEmailTemplates } from '@/lib/admin/emailService';
import { toDateTimeLabel } from '@/lib/admin/format';

export default async function AdminEmailTemplatesPage() {
  const templates = await getEmailTemplates();

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Email Templates" description="Biblioteca editable de emails transaccionales y campañas editoriales." breadcrumbs={[{ label: 'Admin' }, { label: 'Emails', href: '/admin/emails' }, { label: 'Templates' }]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Link key={template.id} href={`/admin/emails/templates/${template.id}`} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 transition hover:border-[var(--admin-primary)] hover:bg-[var(--admin-surface-2)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">{template.name}</p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--admin-text)]">{template.subject}</h3>
            <p className="mt-3 text-sm text-[var(--admin-text-muted)]">Actualizada: {toDateTimeLabel(template.updated_at)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
