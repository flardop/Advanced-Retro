import { SettingsManager } from '@/components/admin/AdminForms';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { getSettingsSnapshot } from '@/lib/admin/data';

export default async function AdminSettingsPage() {
  const snapshot = await getSettingsSnapshot();

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Settings" description="Configuración operativa del negocio, integraciones, alertas y acciones sensibles." breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]} />
      <SettingsManager settings={snapshot.settings} />
    </div>
  );
}
