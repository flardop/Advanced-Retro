import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AreaChart, BarChart, DonutChart, LineChart } from '@/components/admin/ui/Charts';
import { getAnalyticsSnapshot } from '@/lib/admin/data';
import { toPercent } from '@/lib/admin/format';

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

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: { preset?: string; from?: string; to?: string };
}) {
  const preset = searchParams?.preset || '30d';
  const range = resolveRange(preset, searchParams?.from, searchParams?.to);
  const snapshot = await getAnalyticsSnapshot(range);

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Analytics" description="Tráfico, comportamiento y rendimiento por dispositivo, sesión y fuente." breadcrumbs={[{ label: 'Admin' }, { label: 'Analytics' }]} />

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <a key={preset.id} href={`/admin/analytics?preset=${preset.id}`} className={`rounded-full px-4 py-2 text-sm ${searchParams?.preset === preset.id || (!searchParams?.preset && preset.id === '30d') ? 'bg-[var(--admin-primary)] text-white' : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'}`}>{preset.label}</a>
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
        <button type="submit" className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white md:self-end">Aplicar rango</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total page views', snapshot.summary.totalPageViews],
          ['Unique sessions', snapshot.summary.uniqueSessions],
          ['Avg session duration (s)', Math.round(snapshot.summary.avgSessionDuration)],
          ['Bounce rate', `${toPercent(snapshot.summary.bounceRate)}`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
            <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">{value}</p>
          </div>
        ))}
      </div>

      <AreaChart data={snapshot.pageViewsOverTime} title="Page views over time" />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.trafficSources} title="Traffic Sources" />
        <LineChart data={snapshot.activeHours} title="Most Active Hours" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DonutChart data={snapshot.deviceBreakdown} title="Device Types" />
        <DonutChart data={snapshot.browserBreakdown} title="Browser Breakdown" />
      </div>

      <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--admin-text)]">Top Pages</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[var(--admin-text-muted)]">
              <tr>
                <th className="pb-3">URL</th>
                <th className="pb-3">Page Title</th>
                <th className="pb-3">Views</th>
                <th className="pb-3">Unique Sessions</th>
                <th className="pb-3">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {snapshot.topPages.slice(0, 25).map((row) => (
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Heatmap</h3>
          <div className="mt-5 grid grid-cols-[60px_repeat(24,minmax(0,1fr))] gap-2 text-[10px] text-[var(--admin-text-muted)]">
            <div />
            {Array.from({ length: 24 }, (_, hour) => <div key={hour} className="text-center">{hour}</div>)}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="contents">
                <div key={`${day}-label`} className="flex items-center font-semibold text-[var(--admin-text-muted)]">{day}</div>
                {snapshot.heatmap.filter((cell) => cell.day === day).map((cell) => {
                  const opacity = Math.min(1, cell.views / Math.max(1, ...snapshot.heatmap.map((entry) => entry.views)));
                  return <div key={`${day}-${cell.hour}`} title={`${day} ${cell.hour}:00 · ${cell.views} visitas`} className="aspect-square rounded-md" style={{ background: `rgba(108,99,255,${0.1 + opacity * 0.9})` }} />;
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Geographic Data</h3>
          <div className="mt-4 space-y-3">
            {snapshot.geography.slice(0, 15).map((row) => (
              <div key={`${row.country}-${row.city}`} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--admin-text)]">{row.country}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">{row.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--admin-text)]">{row.sessions}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">{toPercent(row.percentage)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BarChart data={snapshot.newVsReturning} title="New vs Returning visitors" />
    </div>
  );
}
