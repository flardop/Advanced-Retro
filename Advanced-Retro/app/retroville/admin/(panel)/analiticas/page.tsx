import Link from 'next/link';
import { BarChart, LineChart } from '@/components/admin/ui/Charts';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { buildRetrovilleAdminQuery } from '@/lib/retroville-admin/query';
import { getRetrovilleAdminPageAnalyticsData } from '@/lib/retroville-admin/data';
import { formatAdminDuration, formatAdminPercent } from '@/lib/retroville-admin/theme';

export const dynamic = 'force-dynamic';

type SearchParams = {
  preset?: 'today' | '7d' | '30d' | 'custom';
  from?: string;
  to?: string;
  focus?: string;
  compare?: string;
};

const presets = [
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: 'Esta semana' },
  { id: '30d', label: 'Este mes' },
] as const;

function getAnalyticsHref(searchParams: SearchParams, overrides: Partial<SearchParams> = {}) {
  const next = { ...searchParams, ...overrides };
  return buildRetrovilleAdminQuery('/retroville/admin/analiticas', {
    preset: next.preset || '',
    from: next.from || '',
    to: next.to || '',
    focus: next.focus || '',
    compare: next.compare || '',
  });
}

function MetricCard({
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

export default async function RetrovilleAdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const data = await getRetrovilleAdminPageAnalyticsData({
    preset: searchParams?.preset || '30d',
    from: searchParams?.from || '',
    to: searchParams?.to || '',
  });

  const focusPath = searchParams?.focus || data.pages[0]?.path || '/retroville';
  const comparePath = searchParams?.compare || data.pages[1]?.path || '/retroville/personajes';
  const focusPage = data.pages.find((item) => item.path === focusPath) || data.pages[0];
  const comparePage = data.pages.find((item) => item.path === comparePath) || data.pages[1] || focusPage;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analíticas de páginas"
        description="Rendimiento por URL de Retroville: visitas, tiempo, rebote, profundidad de scroll y origen del tráfico."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'Analíticas de páginas' }]}
      />

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Link
            key={preset.id}
            href={getAnalyticsHref(searchParams || {}, { preset: preset.id })}
            className={`rounded-full px-4 py-2 text-sm ${
              (searchParams?.preset || '30d') === preset.id
                ? 'bg-[var(--admin-primary)] text-white'
                : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'
            }`}
          >
            {preset.label}
          </Link>
        ))}
      </div>

      <form className="grid gap-3 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <input type="hidden" name="preset" value="custom" />
        <input
          type="date"
          name="from"
          defaultValue={searchParams?.from || ''}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        />
        <input
          type="date"
          name="to"
          defaultValue={searchParams?.to || ''}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        />
        <select
          name="focus"
          defaultValue={focusPage?.path}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        >
          {data.pages.map((page) => (
            <option key={page.path} value={page.path}>
              {page.path}
            </option>
          ))}
        </select>
        <select
          name="compare"
          defaultValue={comparePage?.path}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none"
        >
          {data.pages.map((page) => (
            <option key={page.path} value={page.path}>
              {page.path}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white"
        >
          Aplicar
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {data.pages.map((page) => (
          <Link
            key={page.path}
            href={getAnalyticsHref(searchParams || {}, { focus: page.path })}
            className={`rounded-full px-4 py-2 text-sm ${
              focusPage.path === page.path
                ? 'bg-[var(--admin-primary)] text-white'
                : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'
            }`}
          >
            {page.path}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visitas totales"
          value={focusPage.totalViews.toLocaleString('es-ES')}
          helper={`${focusPage.uniqueSessions.toLocaleString('es-ES')} sesiones únicas`}
        />
        <MetricCard
          label="Tiempo medio"
          value={formatAdminDuration(focusPage.avgTimeSeconds)}
          helper="Permanencia media en la página"
        />
        <MetricCard
          label="Tasa de rebote"
          value={formatAdminPercent(focusPage.bounceRate)}
          helper="Sesiones que salen sin navegar a otra página"
        />
        <MetricCard
          label="Scroll depth"
          value={formatAdminPercent(focusPage.scrollDepthAverage)}
          helper="Hasta dónde llega la audiencia antes de salir"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <LineChart data={focusPage.trend} title={`Evolución de ${focusPage.path}`} />
        <div className="space-y-6">
          <BarChart
            data={focusPage.topCountries.map((item) => ({ label: item.label, value: item.value }))}
            title="Top países"
            horizontal
          />
          <BarChart
            data={focusPage.topDevices.map((item) => ({ label: item.label, value: item.value }))}
            title="Top dispositivos"
            horizontal
          />
          <BarChart
            data={focusPage.topSources.map((item) => ({ label: item.label, value: item.value }))}
            title="Top fuentes"
            horizontal
          />
        </div>
      </div>

      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Comparativa</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {[focusPage, comparePage].map((page) => (
            <div key={page.path} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-5">
              <p className="text-sm font-semibold text-[var(--admin-text)]">{page.path}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Visitas</p>
                  <p className="mt-1 [font-family:var(--admin-mono)] text-xl text-[var(--admin-text)]">{page.totalViews}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Únicas</p>
                  <p className="mt-1 [font-family:var(--admin-mono)] text-xl text-[var(--admin-text)]">{page.uniqueSessions}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Tiempo medio</p>
                  <p className="mt-1 [font-family:var(--admin-mono)] text-xl text-[var(--admin-text)]">
                    {formatAdminDuration(page.avgTimeSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Rebote</p>
                  <p className="mt-1 [font-family:var(--admin-mono)] text-xl text-[var(--admin-text)]">
                    {formatAdminPercent(page.bounceRate)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
