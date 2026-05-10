'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { RetroStorageAuctionListItem } from '@/lib/retroStorageAuctionTypes';

type AuctionsResponse = {
  auctions: RetroStorageAuctionListItem[];
  leaderboard: Array<{ name: string; liveWins: number; totalBidValueCents: number }>;
  summary: {
    totalSeeds: number;
    minimumGuaranteedValueCents: number;
    maximumRevealedValueCents: number;
  };
  currentUserId: string | null;
  isAuthenticated: boolean;
};

type FilterValue = 'all' | 'live' | 'upcoming' | 'ended';

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format((Number(cents || 0) || 0) / 100);
}

function formatRelativeCountdown(targetIso: string, now: number): string {
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  if (diff <= 0) return 'Cerrado';
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status: RetroStorageAuctionListItem['status']) {
  switch (status) {
    case 'live':
      return 'En subasta';
    case 'upcoming':
      return 'Proximamente';
    default:
      return 'Finalizado';
  }
}

function statusClasses(status: RetroStorageAuctionListItem['status']) {
  switch (status) {
    case 'live':
      return 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200';
    case 'upcoming':
      return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
    default:
      return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
  }
}

export default function RetroStorageAuctionsHub({ initialData = null }: { initialData?: AuctionsResponse | null }) {
  const [payload, setPayload] = useState<AuctionsResponse | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [now, setNow] = useState(() => Date.now());
  const [actionSlug, setActionSlug] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const res = await fetch('/api/auctions', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar las subastas');
      setPayload(data);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las subastas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => load('refresh'), 15000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [load]);

  const auctions = useMemo(() => payload?.auctions || [], [payload?.auctions]);
  const visibleAuctions = useMemo(() => {
    if (filter === 'all') return auctions;
    return auctions.filter((auction) => auction.status === filter);
  }, [auctions, filter]);

  const liveCount = auctions.filter((auction) => auction.status === 'live').length;
  const totalReminderCount = auctions.reduce((total, auction) => total + auction.remindersCount, 0);

  const toggleReminder = async (slug: string) => {
    if (!payload?.isAuthenticated) {
      toast('Inicia sesion para guardar recordatorios.');
      return;
    }
    setActionSlug(slug);
    try {
      const res = await fetch(`/api/auctions/${slug}/reminder`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar el recordatorio');
      await load('refresh');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar el recordatorio');
    } finally {
      setActionSlug(null);
    }
  };

  return (
    <section className="section">
      <div className="wide-content-rail space-y-8">
        <div className="glass overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-start">
            <div className="min-w-0 space-y-5">
              <p className="chip w-fit border-cyan-400/40 bg-cyan-400/10 text-cyan-200">RETRO STORAGE AUCTIONS</p>
              <div className="space-y-3">
                <h1 className="title-display text-4xl sm:text-5xl">Almacenes digitales con puja, trazabilidad y revelado real</h1>
                <p className="max-w-3xl text-base leading-relaxed text-textMuted">
                  Advanced Retro documenta lotes fisicos reales, oculta solo una parte del contenido y abre el
                  almacen al cierre para mantener emocion sin perder transparencia. Puedes pujar, guardar
                  recordatorio, reservar compra directa o solicitar almacenamiento.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#retro-storage-grid" className="button-primary">
                  Ver almacenes activos
                </a>
                <Link href="/comunidad" className="button-secondary">
                  Conectar con marketplace
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Directo ahora</p>
                <p className="mt-3 text-3xl font-semibold">{liveCount}</p>
                <p className="mt-2 text-sm text-textMuted">Subastas en vivo con extension automatica si entra una puja al final.</p>
              </div>
              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Recordatorios guardados</p>
                <p className="mt-3 text-3xl font-semibold">{totalReminderCount}</p>
                <p className="mt-2 text-sm text-textMuted">Usuarios pendientes de apertura y ultima llamada de cada lote.</p>
              </div>
              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Valor minimo garantizado</p>
                <p className="mt-3 text-2xl font-semibold">{toEuro(payload?.summary.minimumGuaranteedValueCents || 0)}</p>
                <p className="mt-2 text-sm text-textMuted">Todos los lotes muestran un contenido minimo documentado antes de pujar.</p>
              </div>
              <div className="glass p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Top revelado</p>
                <p className="mt-3 text-2xl font-semibold">{toEuro(payload?.summary.maximumRevealedValueCents || 0)}</p>
                <p className="mt-2 text-sm text-textMuted">Valor maximo mostrado tras apertura publica dentro de la plataforma.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 space-y-4">
            <div className="glass p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Panel de lotes</p>
                  <h2 className="mt-2 text-2xl font-semibold">Listado de almacenes</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'live', 'upcoming', 'ended'] as FilterValue[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`chip ${filter === value ? 'border-primary/60 bg-primary/10 text-primary' : ''}`}
                    >
                      {value === 'all'
                        ? 'Todos'
                        : value === 'live'
                          ? 'En subasta'
                          : value === 'upcoming'
                            ? 'Proximamente'
                            : 'Finalizados'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div id="retro-storage-grid" className="grid gap-5">
              {loading ? (
                <div className="glass p-6 text-textMuted">Cargando almacenes...</div>
              ) : visibleAuctions.length === 0 ? (
                <div className="glass p-6 text-textMuted">No hay almacenes en este filtro ahora mismo.</div>
              ) : (
                visibleAuctions.map((auction) => (
                  <article
                    key={auction.slug}
                    className={`glass overflow-hidden p-4 transition-all sm:p-5 ${
                      auction.status === 'live' ? 'auction-live-shell' : ''
                    }`}
                  >
                    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] border border-line/80 bg-[radial-gradient(circle_at_top,rgba(90,170,255,0.18),rgba(8,14,25,0.92))]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(38,229,255,0.16),transparent_38%),radial-gradient(circle_at_80%_18%,rgba(255,78,207,0.18),transparent_36%)]" />
                        <Image
                          src={auction.image}
                          alt={auction.title}
                          fill
                          className={`object-cover transition duration-700 ${
                            auction.previewMode === 'blur' && !auction.isRevealed
                              ? 'scale-[1.06] blur-[12px] opacity-72'
                              : auction.previewMode === 'partial' && !auction.isRevealed
                                ? 'scale-[1.04] opacity-92'
                                : 'opacity-100'
                          }`}
                        />
                        {auction.previewMode === 'partial' && !auction.isRevealed ? (
                          <div className="absolute inset-y-0 right-0 w-[30%] bg-[linear-gradient(90deg,transparent,rgba(8,14,25,0.62)_28%,rgba(8,14,25,0.96))]" />
                        ) : null}
                        <div className="absolute left-3 top-3">
                          <span className={`chip ${statusClasses(auction.status)}`}>{statusLabel(auction.status)}</span>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <span className="chip border-white/10 bg-[rgba(8,14,25,0.72)] text-white/80">{auction.warehouseCode}</span>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <span className="chip border-white/10 bg-[rgba(8,14,25,0.72)] text-white/80">Vista del almacén</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 max-w-3xl">
                            <p className="text-xs uppercase tracking-[0.18em] text-primary">{auction.category}</p>
                            <h3 className="mt-2 text-2xl font-semibold text-balance sm:text-[2rem]">{auction.title}</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-textMuted sm:text-[0.95rem]">
                              {auction.subtitle}
                            </p>
                          </div>
                          <span className="chip border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100">
                            {auction.rarityLabel}
                          </span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                          <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Puja actual</p>
                            <p className="mt-2 text-xl font-semibold text-primary">{toEuro(auction.currentBidCents)}</p>
                            <p className="mt-1 text-xs text-textMuted">Siguiente: {toEuro(auction.nextBidCents)}</p>
                          </div>
                          <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Tiempo</p>
                            <p className="mt-2 text-xl font-semibold">
                              {auction.status === 'ended'
                                ? 'Cerrado'
                                : formatRelativeCountdown(
                                    auction.status === 'upcoming' ? auction.startsAt : auction.effectiveEndsAt,
                                    now
                                  )}
                            </p>
                            <p className="mt-1 text-xs text-textMuted">
                              {auction.status === 'upcoming' ? 'Empieza' : 'Cierra'} {formatDateTime(
                                auction.status === 'upcoming' ? auction.startsAt : auction.effectiveEndsAt
                              )}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Trazabilidad</p>
                            <p className="mt-2 text-xl font-semibold">{toEuro(auction.minimumEstimatedValueCents)}</p>
                            <p className="mt-1 text-xs text-textMuted">Valor minimo garantizado</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-primary">Minimo garantizado</p>
                          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-textMuted">{auction.guaranteedMinimum}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-textMuted">
                          {auction.bidsCount > 0 ? <span className="chip">Pujas {auction.bidsCount}</span> : null}
                          {auction.remindersCount > 0 ? <span className="chip">Recordatorios {auction.remindersCount}</span> : null}
                          {auction.buyRequestsCount > 0 ? <span className="chip">Compra directa {auction.buyRequestsCount}</span> : null}
                          {auction.rentRequestsCount > 0 ? <span className="chip">Alquiler {auction.rentRequestsCount}</span> : null}
                          {auction.leaderName ? <span className="chip text-primary">Lider {auction.leaderName}</span> : null}
                          {auction.isExtended ? <span className="chip border-cyan-400/30 bg-cyan-400/10 text-cyan-200">Extension activa</span> : null}
                          {auction.isRevealed ? <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-200">Contenido revelado</span> : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
                          <Link href={`/subastas/${auction.slug}`} className="button-primary w-full text-center">
                            Ver lote
                          </Link>
                          <button
                            type="button"
                            className="button-secondary w-full text-center"
                            onClick={() => toggleReminder(auction.slug)}
                            disabled={actionSlug === auction.slug}
                          >
                            {auction.isReminderActive ? 'Quitar recordatorio' : 'Guardar recordatorio'}
                          </button>
                          <a
                            href={`/api/auctions/${auction.slug}/calendar`}
                            className="button-secondary w-full text-center"
                          >
                            Anadir a calendario
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <div className="glass p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Mejores pujadores</p>
              <h3 className="mt-2 text-xl font-semibold">Ranking activo</h3>
              <div className="mt-4 space-y-3">
                {(payload?.leaderboard || []).map((entry, index) => (
                  <div key={entry.name} className="rounded-2xl border border-line/80 bg-[rgba(8,14,25,0.42)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{index + 1}. {entry.name}</p>
                        <p className="mt-1 text-xs text-textMuted">Liderando {entry.liveWins} lotes</p>
                      </div>
                      <span className="chip text-primary">{toEuro(entry.totalBidValueCents)}</span>
                    </div>
                  </div>
                ))}
                {!payload?.leaderboard?.length ? (
                  <p className="text-sm text-textMuted">El ranking se llenara con la actividad real de las primeras pujas.</p>
                ) : null}
              </div>
            </div>

            <div className="glass p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Como funciona</p>
              <div className="mt-4 space-y-3 text-sm text-textMuted">
                <p>1. Publicamos un lote fisico verificado con contenido minimo garantizado.</p>
                <p>2. Los usuarios guardan recordatorio, entran al directo y pujan con extension final.</p>
                <p>3. Al cerrar, se abre el almacen y se muestra el inventario completo.</p>
                <p>4. El ganador puede conservarlo, almacenarlo o mover piezas al marketplace.</p>
              </div>
            </div>

            <div className="glass p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Estado de panel</p>
              <p className="mt-3 text-sm text-textMuted">
                {refreshing ? 'Refrescando actividad de lotes...' : 'Actividad sincronizada. El panel se actualiza periodicamente.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
