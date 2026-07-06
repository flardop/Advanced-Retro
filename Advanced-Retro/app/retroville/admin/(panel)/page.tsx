import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import RetrovilleAdminDashboardClient from '@/components/retroville/admin/RetrovilleAdminDashboardClient';
import { getRetrovilleAdminDashboardData } from '@/lib/retroville-admin/data';

export const dynamic = 'force-dynamic';

export default async function RetrovilleAdminDashboardPage() {
  const data = await getRetrovilleAdminDashboardData();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard general"
        description="Vista rápida de la salud del universo Retroville: tráfico de hoy, altas, sesiones activas, errores y actividad reciente."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Dashboard general' }]}
        actions={
          <Link
            href="/retroville"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Retroville
          </Link>
        }
      />

      <RetrovilleAdminDashboardClient initialData={data} />
    </div>
  );
}
