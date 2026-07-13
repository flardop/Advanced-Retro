'use client';

import { Globe2, MapPinned, Radar, ScanSearch, Smartphone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BarChart } from '@/components/admin/ui/Charts';
import { toRelativeLabel } from '@/lib/admin/format';
import { formatAdminDuration, formatAdminPercent } from '@/lib/retroville-admin/theme';
import type { RetrovilleAdminRealtimeData } from '@/types/retroville-admin';

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">{label}</p>
          <p className="mt-3 [font-family:var(--admin-mono)] text-3xl font-semibold tracking-tight text-[var(--admin-text)]">{value}</p>
        </div>
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-3 text-[var(--admin-primary)]">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--admin-text-muted)]">{helper}</p>
    </div>
  );
}

function BucketList({
  eyebrow,
  title,
  items,
  emptyLabel,
}: {
  eyebrow: string;
  title: string;
  items: Array<{ label: string; detail: string; meta: string }>;
  emptyLabel: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={`${item.label}-${item.meta}`} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--admin-text)]">{item.label}</p>
                  <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{item.detail}</p>
                </div>
                <p className="shrink-0 [font-family:var(--admin-mono)] text-sm text-[var(--admin-text)]">{item.meta}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-5 text-sm text-[var(--admin-text-muted)]">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}

export default function RetrovilleAdminRealtimeClient({
  initialData,
}: {
  initialData: RetrovilleAdminRealtimeData;
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
        const payload = (await response.json()) as { success?: boolean; data?: RetrovilleAdminRealtimeData; error?: string };
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
              {data.summary.activeUsers.toLocaleString('es-ES')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/retroville/admin/realtime/export"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-2 text-sm text-[var(--admin-text)] transition hover:border-[var(--admin-primary)] hover:text-white"
            >
              <ScanSearch className="h-4 w-4" />
              Exportar CSV live
            </a>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-2 text-sm text-[var(--admin-text-muted)]">
              <Radar className="h-4 w-4" />
              Actualización cada 10s
            </div>
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--admin-error)]">{error}</p> : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Activos en España"
          value={data.summary.activeInSpain.toLocaleString('es-ES')}
          helper={data.summary.topSpainLocation !== '—' ? `Zona líder: ${data.summary.topSpainLocation}` : 'Todavía no hay foco claro dentro de España'}
          icon={<MapPinned className="h-5 w-5" />}
        />
        <SummaryCard
          label="Países activos"
          value={data.summary.countriesActive.toLocaleString('es-ES')}
          helper={data.summary.topCountry !== '—' ? `País dominante ahora: ${data.summary.topCountry}` : 'Sin concentración suficiente todavía'}
          icon={<Globe2 className="h-5 w-5" />}
        />
        <SummaryCard
          label="Zonas detectadas"
          value={data.summary.locationsActive.toLocaleString('es-ES')}
          helper="Localidades distintas vivas en este momento"
          icon={<UserRound className="h-5 w-5" />}
        />
        <SummaryCard
          label="Dispositivo dominante"
          value={data.deviceBuckets[0]?.label || '—'}
          helper={data.deviceBuckets[0] ? `${data.deviceBuckets[0].value} sesiones · ${formatAdminPercent(data.deviceBuckets[0].share)}` : 'Sin lectura suficiente'}
          icon={<Smartphone className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="mb-5 flex items-center gap-3">
            <UserRound className="h-5 w-5 text-[var(--admin-primary)]" />
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Sesiones activas</p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">Quién está ahora mismo</h2>
            </div>
          </div>

          <div className="space-y-3">
            {data.sessions.length ? (
              data.sessions.map((session) => (
                <div
                  key={session.id}
                  className="grid gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4 md:grid-cols-[1.25fr_1fr_0.8fr_0.7fr]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{session.currentPage}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
                      {toRelativeLabel(session.lastHeartbeat)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Zona</p>
                    <p className="mt-1 text-sm text-[var(--admin-text)]">{session.country}</p>
                    <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                      {session.locationLabel !== '—'
                        ? session.region !== '—'
                          ? `${session.city} · ${session.region}`
                          : session.city
                        : 'Zona sin resolver'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Dispositivo</p>
                    <p className="mt-1 text-sm text-[var(--admin-text)]">{session.deviceType}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Tiempo</p>
                    <p className="mt-1 [font-family:var(--admin-mono)] text-sm text-[var(--admin-text)]">
                      {formatAdminDuration(session.durationSeconds)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-6 text-sm text-[var(--admin-text-muted)]">
                Ahora mismo no hay sesiones activas dentro de Retroville. En cuanto entre tráfico, aquí verás página, país, zona y dispositivo en vivo.
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <BucketList
            eyebrow="España ahora"
            title="Qué parte de España está viva"
            items={data.spainBuckets.slice(0, 6).map((item) => ({
              label: item.label,
              detail: `Página dominante: ${item.primaryPage}`,
              meta: `${item.sessions} activas · ${formatAdminPercent(item.share)}`,
            }))}
            emptyLabel="Aún no hay suficiente actividad española en este momento para dibujar un foco claro."
          />

          <BucketList
            eyebrow="Focos activos"
            title="Dónde se concentra la audiencia ahora"
            items={data.geoBuckets.slice(0, 6).map((item) => ({
              label: item.label,
              detail: `${item.country} · ${item.primaryPage}`,
              meta: `${item.sessions} activas`,
            }))}
            emptyLabel="Cuando entren más visitantes, aquí verás las zonas que más se están moviendo."
          />

          <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Lectura estratégica</p>
            <div className="mt-4 space-y-3">
              {data.strategyNotes.length ? (
                data.strategyNotes.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--admin-text)]">{item.title}</p>
                    <p className="mt-2 text-sm text-[var(--admin-text-muted)]">{item.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-5 text-sm text-[var(--admin-text-muted)]">
                  Cuando haya tráfico suficiente, este bloque traducirá los focos activos en pistas útiles para campañas, copies y piezas sociales.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart
          data={data.countryBuckets.map((item) => ({
            label: item.label,
            value: Number(item.share.toFixed(2)),
          }))}
          title="Países con más actividad en directo"
          horizontal
        />

        <BarChart
          data={data.clickLeaderboard.map((item) => ({
            label: item.label,
            value: Number(item.percentage.toFixed(2)),
          }))}
          title="Bloques más clicados del home"
          horizontal
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
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
  );
}
