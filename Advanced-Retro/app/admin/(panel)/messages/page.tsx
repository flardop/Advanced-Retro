import { MessagesTableView } from '@/components/admin/AdminDataViews';
import { MessageReviewPanel } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { listAdminMessages } from '@/lib/admin/data';
import { Badge } from '@/components/admin/ui/Badge';
import { toDateTimeLabel } from '@/lib/admin/format';

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: { ticket?: string };
}) {
  const rows = await listAdminMessages();
  const selected = searchParams?.ticket ? rows.find((row) => row.id === searchParams.ticket) || null : rows[0] || null;
  const total = rows.length;
  const pending = rows.filter((row) => row.status === 'pending_review').length;
  const approvedWeek = rows.filter((row) => row.status === 'approved' && new Date(row.date).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Messages" description="Moderación y revisión de tickets de compra/venta y conversaciones clave." breadcrumbs={[{ label: 'Admin' }, { label: 'Messages' }]} />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Total messages', total],
          ['Pending review', pending],
          ['Approved this week', approvedWeek],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
            <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">{value}</p>
          </div>
        ))}
      </div>
      <MessagesTableView rows={rows} />
      {selected ? (
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--admin-text)]">{selected.title}</h3>
              <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{selected.user?.email || 'Anónimo'} · {toDateTimeLabel(selected.date)}</p>
            </div>
            <Badge variant={selected.status === 'approved' ? 'success' : selected.status === 'rejected' ? 'error' : 'warning'}>{selected.status}</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {selected.messages.map((message: any) => (
              <div key={message.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <p className="text-sm text-[var(--admin-text)]">{message.message}</p>
                <p className="mt-2 text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(message.created_at)}</p>
              </div>
            ))}
          </div>
          <MessageReviewPanel ticket={selected} />
        </section>
      ) : null}
    </div>
  );
}
