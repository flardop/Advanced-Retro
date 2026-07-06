'use client';

import { Radar, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BarChart } from '@/components/admin/ui/Charts';
import { toRelativeLabel } from '@/lib/admin/format';
import { formatAdminDuration, formatAdminPercent } from '@/lib/retroville-admin/theme';

type RealtimeData = {
  activeUsers: number;
  sessions: Array<{
    id: string;
    currentPage: string;
    durationSeconds: number;
    deviceType: string;
    country: string;
    city: string;
    lastHeartbeat: string;
  }>;
  clickLeaderboard: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
  scrollLeaderboard: Array<{
    path: string;
    averageDepth: number;
    sessions: number;
  }>;
};

export default function RetrovilleAdminRealtimeClient({
  initialData,
}: {
  initialData: RealtimeData;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        const response = await fetch('/api/retroville/admin/realtime', {
          signal: controller.signal,
          cache: 'no-store',
        });
        window.clearTimeout(timeout);
        const payload = (await response.json()) as { success?: boolean; data?: RealtimeData; error?: string };
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'No se pudo actualizar el seguimiento en tiempo real');
        }
        if (!cancelled) {
          setData(payload.data);
          setError('');
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'No se pudo actualizar el seguimiento en tiempo real');
        }
      }
    };

    const timer = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Usuarios activos ahora</p>
            <p className="mt-3 [font-family:var(--admin-mono)] text-6xl font-semibold tracking-tight text-[var(--admin-text)]">
              {data.activeUsers.toLocaleString('es-ES')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-2 text-sm text-[var(--admin-text-muted)]">
            <Radar className="h-4 w-4" />
            Actualización cada 10s
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--admin-error)]">{error}</p> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="mb-5 flex items-center gap-3">
            <UserRound className="h-5 w-5 text-[var(--admin-primary)]" />
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Sesiones activas</p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">Quién está ahora mismo</h2>
            </div>
          </div>

          <div className="space-y-3">
            {data.sessions.map((session) => (
              <div
                key={session.id}
                className="grid gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 md:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{session.currentPage}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                    {toRelativeLabel(session.lastHeartbeat)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Tiempo</p>
                  <p className="mt-1 [font-family:var(--admin-mono)] text-sm text-[var(--admin-text)]">
                    {formatAdminDuration(session.durationSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Dispositivo</p>
                  <p className="mt-1 text-sm text-[var(--admin-text)]">{session.deviceType}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">País</p>
                  <p className="mt-1 text-sm text-[var(--admin-text)]">{session.country}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Ciudad</p>
                  <p className="mt-1 text-sm text-[var(--admin-text)]">{session.city}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <BarChart
            data={data.clickLeaderboard.map((item) => ({
              label: item.label,
              value: Number(item.percentage.toFixed(2)),
            }))}
            title="Bloques más clicados del home"
            horizontal
          />
          <BarChart
            data={data.scrollLeaderboard.map((item) => ({
              label: item.path,
              value: Number(item.averageDepth.toFixed(2)),
            }))}
            title="Scroll depth medio por sección"
            horizontal
          />

          <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Lectura rápida</p>
            <div className="mt-4 space-y-3">
              {data.scrollLeaderboard.slice(0, 5).map((item) => (
                <div key={item.path} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--admin-text)]">{item.path}</p>
                    <p className="text-sm [font-family:var(--admin-mono)] text-[var(--admin-text)]">
                      {formatAdminPercent(item.averageDepth)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{item.sessions} sesiones medidas</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
