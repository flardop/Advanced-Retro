import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminPageSession } from '@/lib/admin/checkAdminSession';
import { listOnlineSessions } from '@/lib/admin/data';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPageSession();
  const onlineSessions = await listOnlineSessions();
  const onlineCount = onlineSessions.filter((item) => new Date(item.last_heartbeat).getTime() >= Date.now() - 120000).length;

  return (
    <AdminLayout profile={session.profile} onlineCount={onlineCount}>
      {children}
    </AdminLayout>
  );
}
