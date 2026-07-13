import Link from 'next/link';
import { DonutChart } from '@/components/admin/ui/Charts';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { buildRetrovilleAdminQuery } from '@/lib/retroville-admin/query';
import { getRetrovilleAdminUserDetail, getRetrovilleAdminUsersData } from '@/lib/retroville-admin/data';
import { toDateTimeLabel } from '@/lib/admin/format';
import { formatAdminDuration } from '@/lib/retroville-admin/theme';

export const dynamic = 'force-dynamic';

type SearchParams = {
  page?: string;
  search?: string;
  profile?: string;
  intent?: string;
  status?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  from?: string;
  to?: string;
  selected?: string;
};

function getUsersPageHref(searchParams: SearchParams, overrides: Partial<SearchParams> = {}) {
  const next = { ...searchParams, ...overrides };
  return buildRetrovilleAdminQuery('/retroville/admin/usuarios', {
    page: next.page || '',
    search: next.search || '',
    profile: next.profile || '',
    intent: next.intent || '',
    status: next.status || '',
    sort: next.sort || '',
    direction: next.direction || '',
    from: next.from || '',
    to: next.to || '',
    selected: next.selected || '',
  });
}

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

export default async function RetrovilleAdminUsersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const filters = {
    page: Number(searchParams?.page || 1),
    search: searchParams?.search || '',
    profile: searchParams?.profile || '',
    intent: searchParams?.intent || '',
    status: searchParams?.status || '',
    sort: searchParams?.sort || 'created_at',
    direction: searchParams?.direction === 'asc' ? 'asc' : 'desc',
    from: searchParams?.from || '',
    to: searchParams?.to || '',
  } as const;

  const data = await getRetrovilleAdminUsersData(filters);
  const selectedUser = searchParams?.selected ? await getRetrovilleAdminUserDetail(searchParams.selected) : null;
  const exportHref = buildRetrovilleAdminQuery('/api/retroville/admin/users/export', {
    search: filters.search,
    profile: filters.profile,
    intent: filters.intent,
    status: filters.status,
    sort: filters.sort,
    direction: filters.direction,
    from: filters.from,
    to: filters.to,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Suscriptores y solicitudes"
        description="Base privada de contactos de Retroville. Aquí se juntan newsletter, reveal y solicitudes de biblia o seguimiento para que puedas filtrar, revisar y exportar correos, teléfonos y preguntas."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Suscriptores y solicitudes' }]}
        actions={
          <a
            href={exportHref}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white"
          >
            Exportar CSV
          </a>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total de contactos"
          value={data.summary.totalSubscribers.toLocaleString('es-ES')}
          helper="Base total de newsletter, reveal y acceso privado"
        />
        <SummaryCard
          label="Esta semana"
          value={data.summary.subscribersThisWeek.toLocaleString('es-ES')}
          helper="Altas registradas en los últimos 7 días"
        />
        <SummaryCard
          label="Solicitudes de biblia"
          value={data.summary.accessRequests.toLocaleString('es-ES')}
          helper="Contactos que han pedido acceso o más contexto del proyecto"
        />
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
          <DonutChart
            title="Perfiles declarados"
            data={data.summary.roleBreakdown.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </div>
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">Países top</p>
          <div className="mt-4 space-y-3">
            {data.summary.topCountries.map((item, index) => (
              <div key={item.label} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--admin-text)]">
                    {index + 1}. {item.label}
                  </p>
                  <p className="text-sm [font-family:var(--admin-mono)] text-[var(--admin-text)]">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form className="grid gap-3 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 xl:grid-cols-[1.2fr_repeat(7,minmax(0,1fr))]">
        <input
          type="text"
          name="search"
          defaultValue={filters.search}
          placeholder="Buscar por nombre, email o telefono"
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        />
        <select
          name="profile"
          defaultValue={filters.profile}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        >
          <option value="">Todos los perfiles</option>
          {data.summary.roleBreakdown.map((item) => (
            <option key={item.label} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          name="intent"
          defaultValue={filters.intent}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        >
          <option value="">Todos los canales</option>
          <option value="newsletter">Newsletter</option>
          <option value="event">Reveal</option>
          <option value="access">Acceso privado</option>
        </select>
        <select
          name="status"
          defaultValue={filters.status}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="unsubscribed">Dado de baja</option>
        </select>
        <input
          type="date"
          name="from"
          defaultValue={filters.from}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        />
        <input
          type="date"
          name="to"
          defaultValue={filters.to}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        />
        <select
          name="sort"
          defaultValue={filters.sort}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        >
          <option value="created_at">Fecha</option>
          <option value="display_name">Nombre</option>
          <option value="email">Email</option>
          <option value="signup_intent">Canal</option>
          <option value="role_label">Perfil</option>
          <option value="page_path">Página</option>
          <option value="device_type">Dispositivo</option>
          <option value="country">País</option>
          <option value="status">Estado</option>
        </select>
        <select
          name="direction"
          defaultValue={filters.direction}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        >
          <option value="desc">Descendente</option>
          <option value="asc">Ascendente</option>
        </select>
        <div className="flex gap-3 xl:col-span-full">
          <button
            type="submit"
            className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            Aplicar filtros
          </button>
          <Link
            href="/retroville/admin/usuarios"
            className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]"
          >
            Resetear
          </Link>
        </div>
      </form>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--admin-border)]">
                <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                  <th className="px-4 py-4">Avatar</th>
                  <th className="px-4 py-4">Nombre</th>
                  <th className="px-4 py-4">Canal</th>
                  <th className="px-4 py-4">Perfil</th>
                  <th className="px-4 py-4">Registro</th>
                  <th className="px-4 py-4">Página</th>
                  <th className="px-4 py-4">Dispositivo</th>
                  <th className="px-4 py-4">País</th>
                  <th className="px-4 py-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--admin-border)] align-top">
                    <td className="px-4 py-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] text-sm font-semibold text-[var(--admin-text)]">
                        {row.avatarInitial}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={getUsersPageHref(searchParams || {}, {
                          ...filters,
                          page: String(filters.page),
                          selected: row.id,
                        })}
                        className="font-semibold text-[var(--admin-text)] underline-offset-4 hover:underline"
                      >
                        {row.display_name || row.first_name || 'Sin nombre'}
                      </Link>
                      <p className="mt-1 text-[var(--admin-text-muted)]">{row.email}</p>
                      {row.phone ? <p className="mt-1 text-[var(--admin-text-muted)]">{row.phone}</p> : null}
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">
                      {row.signup_intent === 'event'
                        ? 'Reveal'
                        : row.signup_intent === 'access'
                          ? 'Acceso privado'
                          : 'Newsletter'}
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{row.role_label || 'Sin perfil'}</td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{toDateTimeLabel(row.created_at)}</td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{row.page_path || '—'}</td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{row.device_type || '—'}</td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{row.country || '—'}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-[var(--admin-text)]">
                        {row.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-[var(--admin-text-muted)]">
            <span>
              Página {data.pagination.page} de {data.pagination.totalPages} · {data.pagination.total} registros
            </span>
            <div className="flex gap-2">
              <Link
                href={getUsersPageHref(searchParams || {}, {
                  ...filters,
                  page: String(Math.max(1, data.pagination.page - 1)),
                })}
                className={`rounded-2xl px-4 py-2 ${
                  data.pagination.page <= 1
                    ? 'pointer-events-none border border-[var(--admin-border)] bg-[var(--admin-surface-2)] opacity-40'
                    : 'border border-[var(--admin-border)] bg-[var(--admin-surface-2)] text-[var(--admin-text)]'
                }`}
              >
                Anterior
              </Link>
              <Link
                href={getUsersPageHref(searchParams || {}, {
                  ...filters,
                  page: String(Math.min(data.pagination.totalPages, data.pagination.page + 1)),
                })}
                className={`rounded-2xl px-4 py-2 ${
                  data.pagination.page >= data.pagination.totalPages
                    ? 'pointer-events-none border border-[var(--admin-border)] bg-[var(--admin-surface-2)] opacity-40'
                    : 'border border-[var(--admin-border)] bg-[var(--admin-surface-2)] text-[var(--admin-text)]'
                }`}
              >
                Siguiente
              </Link>
            </div>
          </div>
        </section>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">
              Detalle de usuario
            </p>
            {selectedUser ? (
              <div className="mt-4 space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--admin-text)]">
                    {selectedUser.user.display_name || selectedUser.user.first_name || selectedUser.user.email}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{selectedUser.user.email}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Canal</p>
                    <p className="mt-2 text-sm text-[var(--admin-text)]">
                      {selectedUser.user.signup_intent === 'event'
                        ? 'Reveal'
                        : selectedUser.user.signup_intent === 'access'
                          ? 'Acceso privado'
                          : 'Newsletter'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Teléfono</p>
                    <p className="mt-2 text-sm text-[var(--admin-text)]">{selectedUser.user.phone || '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 md:col-span-2 xl:col-span-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Documento o interés</p>
                    <p className="mt-2 text-sm text-[var(--admin-text)]">{selectedUser.user.document_interest || '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 md:col-span-2 xl:col-span-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Pregunta</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--admin-text)]">{selectedUser.user.question || '—'}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Páginas vistas</p>
                    <p className="mt-2 [font-family:var(--admin-mono)] text-2xl font-semibold text-[var(--admin-text)]">
                      {selectedUser.stats.totalPageViews}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Tiempo total</p>
                    <p className="mt-2 [font-family:var(--admin-mono)] text-2xl font-semibold text-[var(--admin-text)]">
                      {formatAdminDuration(selectedUser.stats.totalTime)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Visitas</p>
                    <p className="mt-2 [font-family:var(--admin-mono)] text-2xl font-semibold text-[var(--admin-text)]">
                      {selectedUser.stats.visits}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Dispositivo</p>
                    <p className="mt-2 text-sm text-[var(--admin-text)]">{selectedUser.stats.device}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Top páginas visitadas</p>
                  <div className="mt-3 space-y-2">
                    {selectedUser.topPages.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-[var(--admin-text)]">{item.label}</p>
                          <p className="text-sm [font-family:var(--admin-mono)] text-[var(--admin-text)]">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Historial reciente</p>
                  <div className="mt-3 space-y-2">
                    {selectedUser.pageHistory.slice(0, 8).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3">
                        <p className="text-sm font-medium text-[var(--admin-text)]">{item.path}</p>
                        <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                          {toDateTimeLabel(item.timestamp)} · {formatAdminDuration(item.durationSeconds)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--admin-text-muted)]">
                Haz clic sobre un usuario de la tabla para abrir su panel lateral con historial de páginas,
                tiempo acumulado y comportamiento de visita.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
