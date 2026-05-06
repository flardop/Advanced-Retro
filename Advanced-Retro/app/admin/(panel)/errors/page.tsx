import { ErrorsTableView } from '@/components/admin/AdminDataViews';
import { ErrorLogsToolbar } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { getErrorLogSnapshot } from '@/lib/admin/data';

export default async function AdminErrorsPage() {
  const snapshot = await getErrorLogSnapshot();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader title="Error Logs" description="Registro operativo de errores, severidad, resolución y exportación para debugging." breadcrumbs={[{ label: 'Admin' }, { label: 'Error Logs' }]} />
        <ErrorLogsToolbar />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Errors', snapshot.total],
          ['Critical', snapshot.critical],
          ['Errors Today', snapshot.today],
          ['Unresolved', snapshot.unresolved],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
            <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">{value}</p>
          </div>
        ))}
      </div>
      <ErrorsTableView rows={snapshot.rows} />
    </div>
  );
}
