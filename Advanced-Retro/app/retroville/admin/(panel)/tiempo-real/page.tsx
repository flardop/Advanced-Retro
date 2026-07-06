import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import RetrovilleAdminRealtimeClient from '@/components/retroville/admin/RetrovilleAdminRealtimeClient';
import { getRetrovilleAdminRealtimeData } from '@/lib/retroville-admin/data';

export const dynamic = 'force-dynamic';

export default async function RetrovilleAdminRealtimePage() {
  const data = await getRetrovilleAdminRealtimeData();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Seguimiento en tiempo real"
        description="Quién está navegando ahora mismo, cuánto tiempo lleva y qué zonas del home están recibiendo más atención."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Seguimiento en tiempo real' }]}
      />

      <RetrovilleAdminRealtimeClient initialData={data} />
    </div>
  );
}
