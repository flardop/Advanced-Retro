import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import {
  RetrovilleAdminMaintenanceToggle,
  RetrovilleAdminPasswordForm,
} from '@/components/retroville/admin/RetrovilleAdminConfigurationForms';
import { getRetrovilleAdminConfigurationData } from '@/lib/retroville-admin/data';
import { toDateTimeLabel } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

export default async function RetrovilleAdminConfigurationPage() {
  const data = await getRetrovilleAdminConfigurationData();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Configuración"
        description="Cuenta del administrador, contraseña, historial de accesos, intentos fallidos y modo mantenimiento global de Retroville."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Configuración' }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Seguridad</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">Cambiar contraseña</h2>
          <p className="mt-2 text-sm text-[var(--admin-text-muted)]">
            La contraseña actual es obligatoria para confirmar el cambio y el resto de sesiones se revocan.
          </p>
          <div className="mt-5">
            <RetrovilleAdminPasswordForm />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Sitio público</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">Modo mantenimiento</h2>
          <p className="mt-2 text-sm text-[var(--admin-text-muted)]">
            Cuando está activo, Retroville debe servir una pantalla de “volvemos pronto” en lugar del contenido normal.
          </p>
          <div className="mt-5">
            <RetrovilleAdminMaintenanceToggle initialValue={data.maintenanceMode} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Accesos recientes</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">Últimos 10 accesos</h2>
            </div>
            <div className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-2 text-sm text-[var(--admin-text)]">
              {data.activeAdminSessions} sesiones activas
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.recentAccesses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--admin-text)]">{item.email || 'Admin'}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                    {toDateTimeLabel(item.created_at)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-[var(--admin-text-muted)]">
                  {item.event_type} · IP {item.ip_address || 'N/D'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Intentos fallidos</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">Últimas 24 horas</h2>
          <div className="mt-5 space-y-3">
            {data.failedAttempts.length ? (
              data.failedAttempts.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--admin-text)]">{item.email || 'Sin email'}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                      {toDateTimeLabel(item.attempted_at)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--admin-text-muted)]">
                    IP {item.ip_address || 'N/D'} · {item.user_agent || 'User-Agent no disponible'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--admin-text-muted)]">
                No hay intentos fallidos registrados durante las últimas 24 horas.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
