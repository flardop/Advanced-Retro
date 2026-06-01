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
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusLabel(status: RetroStorageAuctionListItem['status']) {
  switch (status) {
    case 'live':
      return 'En directo';
    case 'upcoming':
      return 'Próxima';
    default:
      return 'Finalizada';
  }
}

function statusClasses(status: RetroStorageAuctionListItem['status']) {
  switch (status) {
    case 'live':
      return 'border-primary/50 bg-primary/12 text-primary';
    case 'upcoming':
      return 'border-amber-300/40 bg-amber-300/10 text-amber-100';
    default:
      return 'border-white/12 bg-white/[0.04] text-textMuted';
  }
}

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'live', label: 'En directo' },
  { value: 'upcoming', label: 'Próximas' },
  { value: 'ended', label: 'Finalizadas' },
];

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
    const poll = window.setInterval(() => load('refresh'), 20000);
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
  const upcomingCount = auctions.filter((auction) => auction.status === 'upcoming').length;

  const toggleReminder = async (slug: string) => {
    if (!payload?.isAuthenticated) {
      toast('Inicia sesión para guardar recordatorios.');
      return;
    }

    setActionSlug(slug);
    try {
      const res = await fetch(`/api/auctions/${slug}/reminder`, { method: 'POST' });
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
      <div className="wide-content-rail space-y-7">
        <header className="overflow-hidden rounded-[2rem] border border-line/80 bg-[linear-gradient(135deg,rgba(14,22,34,0.96),rgba(8,12,22,0.98))] p-6 shadow-[0_26px_80px_rgba(0,0,0,0.24)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-end">
            <div className="min-w-0">
              <p className="w-fit rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Subastas AdvancedRetro
              </p>
              <h1 className="title-display mt-5 max-w-4xl text-[clamp(2.7rem,7vw,6.2rem)] leading-[0.9] tracking-tight">
                Pujas retro claras, simples y verificadas.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-textMuted sm:text-lg">
                Lotes seleccionados por AdvancedRetro con contenido mínimo documentado. Entra, revisa el lote y puja sin ruido visual ni bloques innecesarios.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#retro-storage-grid" className="button-primary justify-center text-center">
                  Ver subastas
                </a>
                <Link href="/tienda" className="button-secondary justify-center text-center">
                  Volver a tienda
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-line/70 bg-white/[0.035] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-textMuted">En directo</p>
                <p className="mt-3 text-4xl font-semibold text-primary">{liveCount}</p>
              </div>
              <div className="rounded-3xl border border-line/70 bg-white/[0.035] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Próximas</p>
                <p className="mt-3 text-4xl font-semibold">{upcomingCount}</p>
              </div>
              <div className="col-span-2 rounded-3xl border border-line/70 bg-white/[0.035] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-textMuted">Valor mínimo total</p>
                <p className="mt-3 text-3xl font-semibold">{toEuro(payload?.summary.minimumGuaranteedValueCents || 0)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-[1.5rem] border border-line/80 bg-[rgba(10,16,27,0.72)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Listado</p>
              <h2 className="mt-1 text-2xl font-semibold">Subastas disponibles</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`min-h-[42px] rounded-full border px-4 text-sm transition ${
                    filter === item.value
                      ? 'border-primary/60 bg-primary/12 text-primary'
                      : 'border-line/80 bg-white/[0.02] text-textMuted hover:border-primary/30 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="retro-storage-grid" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-[1.5rem] border border-line/80 bg-[rgba(10,16,27,0.72)] p-6 text-textMuted md:col-span-2 xl:col-span-3">
              Cargando subastas...
            </div>
          ) : visibleAuctions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-line/80 bg-[rgba(10,16,27,0.72)] p-6 text-textMuted md:col-span-2 xl:col-span-3">
              No hay subastas en este filtro ahora mismo.
            </div>
          ) : (
            visibleAuctions.map((auction) => {
              const countdownTarget = auction.status === 'upcoming' ? auction.startsAt : auction.effectiveEndsAt;
              const timeLabel = auction.status === 'ended' ? 'Cerrado' : formatRelativeCountdown(countdownTarget, now);

              return (
                <article
                  key={auction.slug}
                  className="group overflow-hidden rounded-[1.65rem] border border-line/80 bg-[rgba(11,17,29,0.86)] shadow-[0_18px_52px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-primary/35"
                >
                  <Link href={`/subastas/${auction.slug}`} className="block" aria-label={`Ver subasta ${auction.title}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(90,170,255,0.14),rgba(8,14,25,0.94))]">
                      <Image
                        src={auction.image}
                        alt={auction.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className={`object-cover transition duration-700 group-hover:scale-[1.04] ${
                          auction.previewMode === 'blur' && !auction.isRevealed
                            ? 'scale-[1.04] blur-[10px] opacity-80'
                            : auction.previewMode === 'partial' && !auction.isRevealed
                              ? 'scale-[1.03] opacity-95'
                              : 'opacity-100'
                        }`}
                      />
                      {auction.previewMode === 'partial' && !auction.isRevealed ? (
                        <div className="absolute inset-y-0 right-0 w-[32%] bg-[linear-gradient(90deg,transparent,rgba(8,14,25,0.64)_28%,rgba(8,14,25,0.96))]" />
                      ) : null}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(auction.status)}`}>
                          {statusLabel(auction.status)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-[rgba(8,14,25,0.72)] px-3 py-1 text-xs text-white/78">
                          {auction.warehouseCode}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="space-y-4 p-5">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-primary">{auction.category}</p>
                      <h3 className="mt-2 text-balance text-2xl font-semibold leading-tight">{auction.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-textMuted">{auction.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-line/70 bg-white/[0.03] p-3">
                        <p className="text-xs text-textMuted">Puja actual</p>
                        <p className="mt-1 text-xl font-semibold text-primary">{toEuro(auction.currentBidCents)}</p>
                      </div>
                      <div className="rounded-2xl border border-line/70 bg-white/[0.03] p-3">
                        <p className="text-xs text-textMuted">Tiempo</p>
                        <p className="mt-1 text-xl font-semibold">{timeLabel}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-textMuted">
                      <span className="rounded-full border border-line/80 px-3 py-1">Siguiente {toEuro(auction.nextBidCents)}</span>
                      <span className="rounded-full border border-line/80 px-3 py-1">Mínimo {toEuro(auction.minimumEstimatedValueCents)}</span>
                      {auction.bidsCount > 0 ? <span className="rounded-full border border-line/80 px-3 py-1">{auction.bidsCount} pujas</span> : null}
                      {auction.isExtended ? <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-primary">Extensión activa</span> : null}
                    </div>

                    <p className="text-xs leading-5 text-textMuted">
                      {auction.status === 'upcoming' ? 'Empieza' : auction.status === 'ended' ? 'Finalizó' : 'Cierra'} {formatDateTime(countdownTarget)}
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link href={`/subastas/${auction.slug}`} className="button-primary justify-center text-center">
                        Ver lote
                      </Link>
                      <button
                        type="button"
                        className="button-secondary justify-center text-center"
                        onClick={() => toggleReminder(auction.slug)}
                        disabled={actionSlug === auction.slug}
                      >
                        {auction.isReminderActive ? 'Quitar aviso' : 'Recordarme'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <section className="grid gap-4 rounded-[1.5rem] border border-line/80 bg-[rgba(10,16,27,0.62)] p-5 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">1. Revisas</p>
            <p className="mt-2 text-sm leading-6 text-textMuted">Cada lote muestra estado, mínimo garantizado y puja actual.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">2. Pujas</p>
            <p className="mt-2 text-sm leading-6 text-textMuted">Entras en el detalle y decides si quieres competir por el lote.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">3. Se revela</p>
            <p className="mt-2 text-sm leading-6 text-textMuted">Al cierre, el contenido completo queda documentado en AdvancedRetro.</p>
          </div>
        </section>

        <p className="text-center text-xs text-textMuted">
          {refreshing ? 'Actualizando subastas...' : 'Panel sincronizado automáticamente.'}
        </p>
      </div>
    </section>
  );
}
