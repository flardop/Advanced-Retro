import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { UserProfileManager } from '@/components/admin/AdminForms';
import { getAdminUserDetail } from '@/lib/admin/data';

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const detail = await getAdminUserDetail(params.id);
  if (!detail.user) notFound();

  return (
    <div className="space-y-8">
      <AdminPageHeader title={detail.user.full_name || detail.user.email} description="Perfil, permisos, pedidos, actividad y trazabilidad del usuario." breadcrumbs={[{ label: 'Admin' }, { label: 'Users', href: '/admin/users' }, { label: detail.user.email }]} />
      <UserProfileManager data={detail} />
    </div>
  );
}
