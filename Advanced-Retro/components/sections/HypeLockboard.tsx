'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SafeImage from '@/components/SafeImage';

type HypeLaunchKind = 'mystery_drop' | 'auction_season';

type HypeLaunch = {
  launch_key: string;
  kind: HypeLaunchKind;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  lock_until: string;
  is_active: boolean;
  pinned: boolean;
  priority: number;
  reservations_count: number;
  reserved_by_current_user: boolean;
};

type HypeLockboardProps = {
  compact?: boolean;
};

function getRemaining(lockUntil: string, nowMs: number) {
  const target = new Date(lockUntil).getTime();
  if (!Number.isFinite(target)) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, locked: false };
  const delta = Math.max(0, target - nowMs);
  const days = Math.floor(delta / (1000 * 60 * 60 * 24));
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);
  return { total: delta, days, hours, minutes, seconds, locked: delta > 0 };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export default function HypeLockboard({ compact = false }: HypeLockboardProps) {
  const [launches, setLaunches] = useState<HypeLaunch[]>([]);
  const [setupRequired, setSetupRequired] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [reservingKey, setReservingKey] = useState('');

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hype/roadmap', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || 'No se pudo cargar el roadmap');
        return;
      }
      setSetupRequired(Boolean(data?.setupRequired));
      setLaunches(Array.isArray(data?.launches) ? data.launches : []);
    } catch {
      toast.error('No se pudo cargar el roadmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoadmap();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const launchesSorted = useMemo(() => {
    return [...launches].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return Number(a.priority || 0) - Number(b.priority || 0);
    });
  }, [launches]);

  const reserveSpot = async (launchKey: string) => {
    if (!launchKey) return;
    setReservingKey(launchKey);
    try {
      const res = await fetch('/api/hype/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ launchKey }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        toast.error('Inicia sesión para reservar plaza.');
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        toast.error(data?.error || 'No se pudo reservar plaza');
        return;
      }
      toast.success('Plaza reservada. Te avisaremos cuando se desbloquee.');
      await loadRoadmap();
    } catch {
      toast.error('No se pudo reservar plaza');
    } finally {
      setReservingKey('');
    }
  };

  return (
    <section className={`section ${compact ? 'pt-6 sm:pt-8' : ''}`}>
      <div className="container">
        <div className="glass p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary">Drops bloqueados · hype mode</p>
              <h2 className="title-display text-2xl sm:text-3xl mt-2">
                Lo que viene en Advanced Retro
              </h2>
              <p className="text-textMuted mt-2">
                Contadores activos, plazas limitadas y apertura automática cuando termine la cuenta atrás.
              </p>
            </div>
            <Link href="/subastas" className="button-secondary">
              Ver zona de subastas
            </Link>
          </div>

          {setupRequired ? (
            <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              Roadmap en modo fallback. Para persistencia real en Supabase, ejecuta:
              <span className="ml-2 text-primary">database/hype_future_launches.sql</span>
            </div>
          ) : null}

          {loading ? (
            <div className="text-sm text-textMuted">Cargando lanzamientos...</div>
          ) : (
            <div className={`grid gap-4 ${compact ? 'lg:grid-cols-2' : 'md:grid-cols-2'}`}>
              {launchesSorted.map((launch) => {
                const remaining = getRemaining(launch.lock_until, nowMs);
                const isAuction = launch.kind === 'auction_season';
                const ctaHref = isAuction ? '/subastas' : '/tienda?category=cajas-misteriosas';

                return (
                  <article
                    key={launch.launch_key}
                    className="hype-card relative overflow-hidden rounded-2xl border border-line bg-[linear-gradient(145deg,rgba(14,22,37,.92),rgba(11,18,31,.9))] p-3 sm:p-4 shadow-glow"
                  >
                    <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(75,228,214,.23),rgba(75,228,214,0))] pointer-events-none" />
                    <div className="relative grid gap-4">
                      <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden border border-line">
                        <SafeImage
                          src={launch.image_url || '/placeholder.svg'}
                          fallbackSrc="/placeholder.svg"
                          alt={launch.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,18,.2),rgba(4,8,16,.78))]" />
                        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between gap-2">
                          <span className="chip border-primary/50 text-primary bg-[rgba(2,14,24,.8)]">
                            {launch.pinned ? 'Pineado' : 'Próximo'}
                          </span>
                          <span className="chip border-warning/50 text-warning bg-[rgba(24,16,5,.55)]">
                            {remaining.locked ? 'Bloqueado' : 'Desbloqueado'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="title-display text-xl sm:text-2xl">{launch.title}</h3>
                        <p className="text-primary text-sm mt-1">{launch.subtitle}</p>
                        <p className="text-textMuted text-sm mt-2 leading-relaxed">{launch.description}</p>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="rounded-xl border border-line p-2 text-center">
                          <p className="text-xl font-semibold text-primary">{remaining.days}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-textMuted">Días</p>
                        </div>
                        <div className="rounded-xl border border-line p-2 text-center">
                          <p className="text-xl font-semibold text-primary">{pad(remaining.hours)}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-textMuted">Horas</p>
                        </div>
                        <div className="rounded-xl border border-line p-2 text-center">
                          <p className="text-xl font-semibold text-primary">{pad(remaining.minutes)}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-textMuted">Min</p>
                        </div>
                        <div className="rounded-xl border border-line p-2 text-center">
                          <p className="text-xl font-semibold text-primary">{pad(remaining.seconds)}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-textMuted">Seg</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-textMuted">
                          Reservas activas: <span className="text-primary">{Number(launch.reservations_count || 0)}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className={`button-primary ${launch.reserved_by_current_user ? 'opacity-80' : ''}`}
                            onClick={() => void reserveSpot(launch.launch_key)}
                            disabled={Boolean(reservingKey) || launch.reserved_by_current_user}
                          >
                            {launch.reserved_by_current_user
                              ? 'Plaza reservada'
                              : reservingKey === launch.launch_key
                                ? 'Reservando...'
                                : 'Reservar plaza'}
                          </button>
                          <Link href={ctaHref} className="button-secondary">
                            Ver detalles
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
