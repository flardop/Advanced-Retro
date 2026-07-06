'use client';

import { Activity, AlertTriangle, Clock3, Globe2, MailPlus, MonitorPlay, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LineChart } from '@/components/admin/ui/Charts';
import { Badge } from '@/components/admin/ui/Badge';
import { toRelativeLabel } from '@/lib/admin/format';
import { formatAdminDuration, formatAdminPercent } from '@/lib/retroville-admin/theme';

type DashboardData = {
  summary: {
    todayViews: number;
    yesterdayViews: number;
    viewsChangePct: number;
    newSubscribersToday: number;
    topPageToday: string;
    avgSessionDurationToday: number;
    errorsLast24h: number;
    siteStatus: 'online' | 'degradado' | 'error' | string;
    activeNow: number;
  };
  hourlyViews: Array<{ label: string; value: number }>;
  recentFeed: Array<{
    id: string;
    type: string;
    timestamp: string;
    label: string;
    detail: string;
  }>;
};

function SummaryCard({
  label,
  value,
  helper,
  icon,
  mono = true,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">{label}</p>
          <p
            className={`mt-3 text-3xl text-[var(--admin-text)] ${
              mono ? '[font-family:var(--admin-mono)] font-semibold tracking-tight' : 'font-semibold tracking-tight'
            }`}
          >
            {value}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-3 text-[var(--admin-primary)]">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--admin-text-muted)]">{helper}</p>
    </div>
  );
}

function statusVariant(value: string) {
  if (value === 'online') return 'success' as const;
  if (value === 'degradado') return 'warning' as const;
  return 'error' as const;
}

export default function RetrovilleAdminDashboardClient({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        const response = await fetch('/api/retroville/admin/dashboard', {
          signal: controller.signal,
          cache: 'no-store',
        });
        window.clearTimeout(timeout);
        const payload = (await response.json()) as { success?: boolean; data?: DashboardData; error?: string };
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'No se pudo actualizar el dashboard');
        }
        if (!cancelled) {
          setData(payload.data);
          setError('');
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'No se pudo actualizar el dashboard');
        }
      }
    };

    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Visitas hoy"
          value={data.summary.todayViews.toLocaleString('es-ES')}
          helper={`${formatAdminPercent(data.summary.viewsChangePct)} vs ayer`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <SummaryCard
          label="Suscriptores hoy"
          value={data.summary.newSubscribersToday.toLocaleString('es-ES')}
          helper="Altas registradas hoy en La Señal"
          icon={<MailPlus className="h-5 w-5" />}
        />
        <SummaryCard
          label="Página más vista"
          value={data.summary.topPageToday}
          helper="Ruta que más interés concentró hoy"
          icon={<Globe2 className="h-5 w-5" />}
          mono={false}
        />
        <SummaryCard
          label="Tiempo medio sesión"
          value={formatAdminDuration(data.summary.avgSessionDurationToday)}
          helper="Media agregada de la jornada actual"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <SummaryCard
          label="Errores 24h"
          value={data.summary.errorsLast24h.toLocaleString('es-ES')}
          helper="Incidencias registradas en Retroville"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <SummaryCard
          label="Activos ahora"
          value={data.summary.activeNow.toLocaleString('es-ES')}
          helper="Sesiones activas en tiempo real"
          icon={<MonitorPlay className="h-5 w-5" />}
        />
        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Estado del sitio</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--admin-text)]">
                {data.summary.siteStatus === 'online'
                  ? 'Online'
                  : data.summary.siteStatus === 'degradado'
                    ? 'Degradado'
                    : 'Error'}
              </p>
            </div>
            <Badge variant={statusVariant(data.summary.siteStatus)}>
              <span className="[font-family:var(--admin-mono)] uppercase tracking-[0.2em]">
                {data.summary.siteStatus}
              </span>
            </Badge>
          </div>
          <p className="mt-3 text-sm text-[var(--admin-text-muted)]">
            El estado cae a degradado si hay errores pendientes recientes y a error si un fallo crítico se repite en ráfaga.
          </p>
          {error ? <p className="mt-4 text-sm text-[var(--admin-error)]">{error}</p> : null}
        </div>
      </div>

      <LineChart data={data.hourlyViews} title="Visitas por hora durante las últimas 24 horas" />

      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Feed en tiempo real</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">Últimos 10 eventos</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-3 py-2 text-xs text-[var(--admin-text-muted)]">
            <Activity className="h-3.5 w-3.5" />
            Polling cada 30s
          </div>
        </div>

        <div className="space-y-3">
          {data.recentFeed.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--admin-text)]">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{item.detail}</p>
              </div>
              <div className="shrink-0 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                {toRelativeLabel(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
