import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CalendarCheck2,
  Clock3,
  ExternalLink,
  Globe2,
  MailPlus,
  MapPinned,
  MousePointerClick,
  Radar,
  Repeat2,
  Settings2,
  Shield,
} from 'lucide-react';
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

const quickLinks = [
  { href: '/retroville', label: 'Landing Retroville' },
  { href: '/retroville/presentaciones', label: 'Presentacion oficial' },
  { href: '/retroville/personajes', label: 'Personajes' },
  { href: '/retroville/sketches', label: 'Sketchbook' },
  { href: '/retroville/press', label: 'Press kit' },
  { href: '/retroville/faq', label: 'FAQ' },
  { href: '/retroville/legal', label: 'Legal' },
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

function formatCount(value: number) {
  return new Intl.NumberFormat('es-ES').format(value);
}

function formatSeconds(value: number) {
  const total = Math.max(0, Math.round(value));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function formatInputDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function compactSessionId(value: string) {
  if (!value) return 'sin-sesion';
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] text-[var(--admin-accent)]">
          {icon}
        </div>
        <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold text-[var(--admin-text)]">{value}</p>
      <p className="mt-2 text-xs leading-6 text-[var(--admin-text-muted)]">{description}</p>
    </div>
  );
}

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
        title="Retroville Intelligence"
        description="Centro de lectura comercial de Retroville: quién entra, desde dónde, qué consume, cuánto tiempo se queda y qué acciones de intención genera."
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
        <input type="hidden" name="preset" value="custom" />
        <label className="text-sm text-[var(--admin-text-muted)]">
          Desde
          <input
            type="date"
            name="from"
            defaultValue={formatInputDate(searchParams?.from)}
            className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          />
        </label>
        <label className="text-sm text-[var(--admin-text-muted)]">
          Hasta
          <input
            type="date"
            name="to"
            defaultValue={formatInputDate(searchParams?.to)}
            className="mt-2 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3 text-[var(--admin-text)] outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white md:self-end"
        >
          Aplicar rango
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Globe2 className="h-4 w-4" />}
          label="Audiencia total"
          value={`${formatCount(snapshot.summary.uniqueSessions)} sesiones`}
          description={`${formatCount(snapshot.summary.totalPageViews)} vistas internas en Retroville durante el rango seleccionado.`}
        />
        <MetricCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Calidad de visita"
          value={formatSeconds(snapshot.summary.avgSessionDuration)}
          description={`${snapshot.summary.avgPagesPerSession.toFixed(1)} páginas por sesión de media. Aquí vemos si el universo realmente retiene.`}
        />
        <MetricCard
          icon={<MapPinned className="h-4 w-4" />}
          label="Alcance geográfico"
          value={`${snapshot.summary.countriesReached} países`}
          description={`${snapshot.summary.citiesReached} ciudades detectadas con actividad dentro de Retroville.`}
        />
        <MetricCard
          icon={<Repeat2 className="h-4 w-4" />}
          label="Repetición"
          value={formatPercentValue(snapshot.summary.returningRate)}
          description={`${formatCount(snapshot.summary.returningSessions)} sesiones pertenecen a gente que ya había pasado antes por Retroville.`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<MailPlus className="h-4 w-4" />}
          label="Conversión newsletter"
          value={formatPercentValue(snapshot.summary.newsletterConversionRate)}
          description={`${formatCount(snapshot.summary.newsletterSignupsInRange)} altas a la newsletter en este rango.`}
        />
        <MetricCard
          icon={<CalendarCheck2 className="h-4 w-4" />}
          label="Conversión evento"
          value={formatPercentValue(snapshot.summary.eventConversionRate)}
          description={`${formatCount(snapshot.summary.eventSignupsInRange)} personas se han registrado al reveal público.`}
        />
        <MetricCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Intención comprador"
          value={formatCount(snapshot.summary.buyerCtaClicksInRange)}
          description={`${formatCount(snapshot.summary.calendarSavesInRange)} guardados de calendario y clicks claros de interés comercial.`}
        />
        <MetricCard
          icon={<Shield className="h-4 w-4" />}
          label="Acceso privado"
          value={formatCount(snapshot.summary.privateDocumentInteractionsInRange)}
          description="Interacciones con documentos privados como la biblia o materiales que requieren contacto directo."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-sm text-[var(--admin-text-muted)]">Peso de Retroville dentro de AdvancedRetro</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">
            {formatPercentValue(snapshot.summary.trafficShare)}
          </p>
          <p className="mt-2 text-xs leading-6 text-[var(--admin-text-muted)]">
            Qué parte del tráfico global del rango está cayendo dentro del ecosistema Retroville.
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-sm text-[var(--admin-text-muted)]">Newsletter últimos 30 días</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">
            {formatCount(snapshot.summary.waitlistLast30Days)}
          </p>
          <p className="mt-2 text-xs leading-6 text-[var(--admin-text-muted)]">
            Volumen acumulado reciente en la señal de Retroville para medir inercia y calentamiento.
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-sm text-[var(--admin-text-muted)]">Fecha objetivo del reveal</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--admin-text)]">
            {toDateLabel(snapshot.summary.launchDate)}
          </p>
          <p className="mt-2 text-xs leading-6 text-[var(--admin-text-muted)]">
            Punto de referencia de lanzamiento para cruzarlo con ritmo de visitas, altas y guardados.
          </p>
        </div>
      </div>

      <AreaChart data={snapshot.pageViewsOverTime} title="Evolución diaria del tráfico Retroville" />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.trafficSources} title="Cómo llegan a Retroville" />
        <DonutChart data={snapshot.deviceBreakdown} title="Dispositivos predominantes" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DonutChart data={snapshot.browserBreakdown} title="Navegadores" />
        <DonutChart data={snapshot.osBreakdown} title="Sistemas operativos" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.topCountries} title="Países con más sesiones" horizontal />
        <BarChart data={snapshot.topCities} title="Ciudades más activas" horizontal />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Dónde pasan más tiempo dentro de Retroville</h3>
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
                    <td className="py-3 text-[var(--admin-text)]">{formatCount(row.views)}</td>
                    <td className="py-3 text-[var(--admin-text)]">{formatCount(row.uniqueSessions)}</td>
                    <td className="py-3 text-[var(--admin-text)]">{formatSeconds(row.avgDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Páginas con más tiempo acumulado</h3>
          <div className="mt-4 space-y-3">
            {snapshot.engagementPages.map((row) => (
              <div
                key={row.url}
                className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-[var(--admin-text)]">{row.url}</p>
                    <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{row.page_title || 'Sin título capturado'}</p>
                  </div>
                  <div className="text-right text-xs text-[var(--admin-text-muted)]">
                    <p>{formatCount(row.views)} vistas</p>
                    <p>{formatCount(row.uniqueSessions)} sesiones</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--admin-text-muted)]">
                  <span>Tiempo total: {formatSeconds(row.totalDuration)}</span>
                  <span>Media por vista: {formatSeconds(row.avgDuration)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.entryPages} title="Puertas de entrada" horizontal />
        <BarChart data={snapshot.exitPages} title="Páginas donde más salen" horizontal />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Geografía detallada</h3>
          <div className="mt-4 space-y-3">
            {snapshot.geography.map((row) => (
              <div
                key={`${row.country}-${row.city}`}
                className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--admin-text)]">{row.country}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">{row.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--admin-text)]">{formatCount(row.sessions)}</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">{formatPercentValue(row.percentage)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.eventBreakdown} title="Eventos que genera Retroville" horizontal />
        <BarChart data={snapshot.buyerIntentBreakdown} title="Dónde nace la intención de comprador" horizontal />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DonutChart data={snapshot.calendarSaveChannels} title="Canales de guardado del reveal" />
        <BarChart data={snapshot.privateDocumentActions} title="Interés en documentos privados" horizontal />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.waitlistSources} title="Origen de registros a la newsletter" horizontal />
        <DonutChart data={snapshot.waitlistRoles} title="Perfiles declarados en el registro" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart data={snapshot.newsletterSignupPages} title="Páginas que mejor convierten" horizontal />
        <DonutChart data={snapshot.newsletterSignupDevices} title="Dispositivos que convierten a la newsletter" />
      </div>

      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--admin-text)]">Últimas sesiones y recorrido real dentro de Retroville</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[var(--admin-text-muted)]">
              <tr>
                <th className="pb-3">Sesión</th>
                <th className="pb-3">País / ciudad</th>
                <th className="pb-3">Fuente</th>
                <th className="pb-3">Tecnología</th>
                <th className="pb-3">Entrada / salida</th>
                <th className="pb-3">Actividad</th>
                <th className="pb-3">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {snapshot.sessionJourneys.map((row) => (
                <tr key={`${row.session_id}-${row.last_seen_at}`}>
                  <td className="py-3 text-[var(--admin-text)]">
                    <div className="space-y-1">
                      <p>{compactSessionId(row.session_id)}</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        {row.is_returning ? 'Visitante recurrente' : 'Primera visita detectada'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 text-[var(--admin-text-muted)]">
                    <div>
                      <p className="text-[var(--admin-text)]">{row.country}</p>
                      <p className="text-xs">{row.city}</p>
                    </div>
                  </td>
                  <td className="py-3 text-[var(--admin-text)]">{row.source}</td>
                  <td className="py-3 text-[var(--admin-text-muted)]">
                    {row.device_type} · {row.browser} · {row.os}
                  </td>
                  <td className="py-3 text-[var(--admin-text-muted)]">
                    <div>
                      <p className="text-[var(--admin-text)]">{row.first_page}</p>
                      <p className="text-xs">Sale por {row.last_page}</p>
                    </div>
                  </td>
                  <td className="py-3 text-[var(--admin-text-muted)]">
                    <div>
                      <p className="text-[var(--admin-text)]">{formatCount(row.page_views)} vistas</p>
                      <p className="text-xs">
                        {formatCount(row.unique_pages)} páginas únicas · {formatSeconds(row.total_duration)}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 text-[var(--admin-text)]">{toDateTimeLabel(row.last_seen_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Eventos recientes de Retroville</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[var(--admin-text-muted)]">
                <tr>
                  <th className="pb-3">Evento</th>
                  <th className="pb-3">Ruta</th>
                  <th className="pb-3">País</th>
                  <th className="pb-3">Fuente</th>
                  <th className="pb-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {snapshot.recentEvents.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 text-[var(--admin-text)]">
                      <div>
                        <p>{row.label}</p>
                        <p className="text-xs text-[var(--admin-text-muted)]">{row.event_name}</p>
                      </div>
                    </td>
                    <td className="py-3 text-[var(--admin-text-muted)]">{row.path || '—'}</td>
                    <td className="py-3 text-[var(--admin-text-muted)]">
                      {row.country}
                      <span className="block text-xs">{row.city}</span>
                    </td>
                    <td className="py-3 text-[var(--admin-text)]">{row.source}</td>
                    <td className="py-3 text-[var(--admin-text)]">{toDateTimeLabel(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Últimos registros en La Señal de Retroville</h3>
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
    </div>
  );
}
