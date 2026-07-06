import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import {
  RetrovilleAdminClearResolvedButton,
  RetrovilleAdminErrorStatusSelect,
} from '@/components/retroville/admin/RetrovilleAdminErrorActions';
import { getRetrovilleAdminErrorsData } from '@/lib/retroville-admin/data';
import { toDateTimeLabel } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">{label}</p>
      <p className="mt-3 [font-family:var(--admin-mono)] text-3xl font-semibold tracking-tight text-[var(--admin-text)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--admin-text-muted)]">{helper}</p>
    </div>
  );
}

export default async function RetrovilleAdminErrorsPage() {
  const data = await getRetrovilleAdminErrorsData();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Registro de errores"
        description="Consola privada de errores frontend de Retroville agrupados por ocurrencia, página, navegador y frecuencia."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Registro de errores' }]}
        actions={<RetrovilleAdminClearResolvedButton />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Errores 24h"
          value={data.summary.totalLast24h.toLocaleString('es-ES')}
          helper="Ocurrencias detectadas en el último día"
        />
        <SummaryCard
          label="Sin revisar"
          value={data.summary.unreviewed.toLocaleString('es-ES')}
          helper="Aún marcados como nuevos"
        />
        <SummaryCard
          label="Alerta crítica"
          value={data.summary.criticalAlert ? 'Sí' : 'No'}
          helper="Marca roja si un crítico se repite más de 10 veces en 2 horas"
        />
      </div>

      <section className="overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--admin-border)]">
              <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                <th className="px-4 py-4">Última vez</th>
                <th className="px-4 py-4">Mensaje</th>
                <th className="px-4 py-4">Página</th>
                <th className="px-4 py-4">Navegador</th>
                <th className="px-4 py-4">Dispositivo</th>
                <th className="px-4 py-4">Severidad</th>
                <th className="px-4 py-4">Ocurrencias</th>
                <th className="px-4 py-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.occurrenceKey} className="border-b border-[var(--admin-border)] align-top">
                  <td className="px-4 py-4 text-[var(--admin-text)]">{toDateTimeLabel(row.latestAt)}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{row.message}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{row.page}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{row.browser}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{row.deviceType}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{row.severity}</td>
                  <td className="px-4 py-4">
                    <span className="[font-family:var(--admin-mono)] text-[var(--admin-text)]">{row.occurrences}</span>
                  </td>
                  <td className="px-4 py-4">
                    <RetrovilleAdminErrorStatusSelect occurrenceKey={row.occurrenceKey} status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
