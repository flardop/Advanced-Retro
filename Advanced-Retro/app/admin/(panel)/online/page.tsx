import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { OnlineSessionsView } from '@/components/admin/AdminForms';
import { getConcurrentSessionsSeries, listOnlineSessions } from '@/lib/admin/data';

export default async function AdminOnlinePage() {
  const [sessions, timeline] = await Promise.all([listOnlineSessions(), getConcurrentSessionsSeries()]);

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Online Now" description="Monitor de visitantes y usuarios activos con detalle de sesión y recorrido reciente." breadcrumbs={[{ label: 'Admin' }, { label: 'Online Now' }]} />
      <OnlineSessionsView initialSessions={sessions} timeline={timeline} />
    </div>
  );
}
