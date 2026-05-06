import { UsersTableView } from '@/components/admin/AdminDataViews';
import { AddUserButton } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { listAdminUsers } from '@/lib/admin/data';

export default async function AdminUsersPage() {
  const rows = await listAdminUsers();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminPageHeader title="Users" description="Usuarios, roles, acceso, actividad y relación con pedidos y comunidad." breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]} />
        <AddUserButton />
      </div>
      <UsersTableView rows={rows} />
    </div>
  );
}
