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
        description="Quién está navegando ahora mismo, desde qué país o zona entra, qué parte de España está más viva y qué puedes exportar para estrategia social o editorial."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Seguimiento en tiempo real' }]}
        actions={
          <a
            href="/api/retroville/admin/realtime/export"
            className="inline-flex items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2 text-sm text-[var(--admin-text)] transition hover:border-[var(--admin-primary)] hover:text-white"
          >
            Exportar CSV live
          </a>
        }
      />

      <RetrovilleAdminRealtimeClient initialData={data} />
    </div>
  );
}
