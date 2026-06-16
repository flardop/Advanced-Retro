import Link from 'next/link';
import { ExternalLink, Radar, Settings2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AreaChart, BarChart, DonutChart } from '@/components/admin/ui/Charts';
import { getRetrovilleAnalyticsSnapshot } from '@/lib/admin/data';
import { toDateLabel, toDateTimeLabel } from '@/lib/admin/format';

const presets = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 3 months' },
];

function resolveRange(preset?: string, fromParam?: string, toParam?: string) {
  const now = new Date();
  if (fromParam && toParam) {
    return { from: fromParam, to: toParam };
  }
  if (preset === 'today') {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  if (preset === 'yesterday') {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: now.toISOString() };
}

function formatPercentValue(value: number) {
  return `${value.toFixed(1)}%`;
}

const quickLinks = [
  { href: '/retroville', label: 'Landing Retroville' },
  { href: '/retroville/presentaciones', label: 'Presentacion oficial' },
  { href: '/retroville/personajes', label: 'Personajes' },
  { href: '/retroville/sketches', label: 'Sketchbook' },
  { href: '/retroville/press', label: 'Press kit' },
  { href: '/retroville/faq', label: 'FAQ' },
  { href: '/retroville/legal', label: 'Legal' },
];

export default async function AdminRetrovillePage({
  searchParams,
}: {
  searchParams?: { preset?: string; from?: string; to?: string };
}) {
  const preset = searchParams?.preset || '30d';
  const range = resolveRange(preset, searchParams?.from, searchParams?.to);
  const snapshot = await getRetrovilleAnalyticsSnapshot(range);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Retroville HQ"
        description="Panel dedicado a Retroville con trafico, origen de visitas, geografia, paginas mas vistas y conversion de la newsletter."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Retroville' }]}
        actions={
          <>
            <Link
              href="/admin/settings?tab=retroville"
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)]"
            >
              <Settings2 className="h-4 w-4" /> Ajustes
            </Link>
            <Link
              href="/retroville"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white"
            >
              <ExternalLink className="h-4 w-4" /> Abrir Retroville
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {presets.map((item) => (
          <a
            key={item.id}
            href={`/admin/retroville?preset=${item.id}`}
            className={`rounded-full px-4 py-2 text-sm ${
              searchParams?.preset === item.id || (!searchParams?.preset && item.id === '30d')
                ? 'bg-[var(--admin-primary)] text-white'
                : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>

      <form className="grid gap-3 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm text-[var(--admin-text-muted)]">
          Desde
          <input type="date" name="from" className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none" />
        </label>
        <label className="text-sm text-[var(--admin-text-muted)]">
          Hasta
          <input type="date" name="to" className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none" />
        </label>
        <button type="submit" className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white md:self-end">
          Aplicar rango
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          ['Page views Retroville', snapshot.summary.totalPageViews],
          ['Sesiones únicas', snapshot.summary.uniqueSessions],
          ['Media por vista', `${Math.round(snapshot.summary.avgSessionDuration)} s`],
          ['Newsletter total', snapshot.summary.waitlistTotal],
          ['Altas en rango', snapshot.summary.newsletterSignupsInRange],
          ['Conversion newsletter', formatPercentValue(snapshot.summary.newsletterConversionRate)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
            <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-sm text-[var(--admin-text-muted)]">Peso de Retroville en el tráfico total</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">{formatPercentValue(snapshot.summary.trafficShare)}</p>
          <p className="mt-2 text-xs text-[var(--admin-text-muted)]">Qué porcentaje del tráfico del rango pertenece a rutas de Retroville.</p>
        </div>
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-sm text-[var(--admin-text-muted)]">Newsletter ultimos 30 dias</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">{snapshot.summary.waitlistLast30Days}</p>
          <p className="mt-2 text-xs text-[var(--admin-text-muted)]">Altas recientes registradas en La Senal de Retroville.</p>
        </div>
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-sm text-[var(--admin-text-muted)]">Launch date</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">{toDateLabel(snapshot.summary.launchDate)}</p>
          <p className="mt-2 text-xs text-[var(--admin-text-muted)]">Fecha configurada para la cuenta atrás pública de Retroville.</p>
        </div>
      </div>

      <AreaChart data={snapshot.pageViewsOverTime} title="Evolución de visitas a Retroville" />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.trafficSources} title="Fuentes de tráfico" />
        <DonutChart data={snapshot.deviceBreakdown} title="Dispositivos" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.waitlistSources} title="Origen de los registros a la newsletter" />
        <DonutChart data={snapshot.waitlistRoles} title="Perfiles declarados en la newsletter" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.newsletterSignupPages} title="Paginas que mas convierten a la newsletter" />
        <DonutChart data={snapshot.newsletterSignupDevices} title="Dispositivos que convierten" />
      </div>

      <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--admin-text)]">Dónde han estado más dentro de Retroville</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[var(--admin-text-muted)]">
              <tr>
                <th className="pb-3">Ruta</th>
                <th className="pb-3">Título</th>
                <th className="pb-3">Views</th>
                <th className="pb-3">Sesiones</th>
                <th className="pb-3">Tiempo medio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {snapshot.topPages.map((row) => (
                <tr key={row.url}>
                  <td className="py-3 text-[var(--admin-text)]">{row.url}</td>
                  <td className="py-3 text-[var(--admin-text-muted)]">{row.page_title || '—'}</td>
                  <td className="py-3 text-[var(--admin-text)]">{row.views}</td>
                  <td className="py-3 text-[var(--admin-text)]">{row.uniqueSessions}</td>
                  <td className="py-3 text-[var(--admin-text)]">{Math.round(row.avgDuration)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Nacionalidad y ubicación</h3>
          <div className="mt-4 space-y-3">
            {snapshot.geography.map((row) => (
              <div key={`${row.country}-${row.city}`} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--admin-text)]">{row.country}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">{row.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--admin-text)]">{row.sessions}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">{formatPercentValue(row.percentage)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <DonutChart data={snapshot.browserBreakdown} title="Navegadores" />

          <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-[var(--admin-accent)]" />
              <h3 className="text-lg font-semibold text-[var(--admin-text)]">Accesos directos Retroville</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 text-sm font-semibold text-[var(--admin-text)] transition hover:border-[var(--admin-accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--admin-text)]">Ultimos registros en La Senal de Retroville</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[var(--admin-text-muted)]">
              <tr>
                <th className="pb-3">Email</th>
                <th className="pb-3">Perfil</th>
                <th className="pb-3">Fuente</th>
                <th className="pb-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {snapshot.recentWaitlist.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 text-[var(--admin-text)]">{row.email_masked}</td>
                  <td className="py-3 text-[var(--admin-text-muted)]">{row.role_label || 'Sin etiqueta'}</td>
                  <td className="py-3 text-[var(--admin-text-muted)]">{row.source || 'Web publica'}</td>
                  <td className="py-3 text-[var(--admin-text)]">{toDateTimeLabel(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
