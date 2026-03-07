'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type RankingPeriod = 'today' | '7d' | 'historical';

type SellerRow = {
  seller: {
    id: string;
    name: string;
    avatar_url?: string | null;
    tagline?: string | null;
    is_verified_seller?: boolean;
  };
  stats: {
    approved_listings: number;
    active_listings: number;
    delivered_sales: number;
    average_price_cents: number;
    total_likes: number;
    listing_comments: number;
  };
  score: number;
  last_activity_at?: string | null;
};

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(cents || 0)) / 100);
}

function toRelativeDate(raw?: string | null): string {
  const value = String(raw || '').trim();
  if (!value) return 'Actividad reciente';
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return 'Actividad reciente';
  const hours = Math.floor((Date.now() - ts) / (1000 * 60 * 60));
  if (hours < 1) return 'Hace menos de 1h';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return new Date(ts).toLocaleDateString('es-ES');
}

function initials(name: string): string {
  const safe = String(name || '').trim();
  if (!safe) return 'AR';
  return safe.slice(0, 2).toUpperCase();
}

export default function CommunitySellersDirectory() {
  const [period, setPeriod] = useState<RankingPeriod>('historical');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SellerRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/community/ranking?limit=30&period=${encodeURIComponent(period)}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el ranking');
        if (!cancelled) setRows(Array.isArray(data?.ranking) ? data.ranking : []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const summary = useMemo(() => {
    const totalSellers = rows.length;
    const totalDelivered = rows.reduce((acc, row) => acc + Number(row.stats?.delivered_sales || 0), 0);
    const totalActive = rows.reduce((acc, row) => acc + Number(row.stats?.active_listings || 0), 0);
    return { totalSellers, totalDelivered, totalActive };
  }, [rows]);

  return (
    <section className="section">
      <div className="container space-y-6">
        <div className="glass p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Comunidad · Vendedores</p>
              <h1 className="title-display mt-2 text-3xl sm:text-4xl">Directorio de vendedores</h1>
              <p className="mt-3 max-w-3xl text-textMuted">
                Ranking por actividad real en comunidad: anuncios activos, ventas entregadas, likes y conversación.
              </p>
            </div>
            <Link href="/comunidad" className="button-secondary">Volver a comunidad</Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Hoy' },
              { id: '7d', label: '7 días' },
              { id: 'historical', label: 'Histórico' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id as RankingPeriod)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  period === tab.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line bg-[rgba(12,20,34,0.55)] text-textMuted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line p-4 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Vendedores</p>
              <p className="mt-2 text-2xl font-black">{summary.totalSellers}</p>
            </div>
            <div className="rounded-2xl border border-line p-4 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Anuncios activos</p>
              <p className="mt-2 text-2xl font-black text-primary">{summary.totalActive}</p>
            </div>
            <div className="rounded-2xl border border-line p-4 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Ventas entregadas</p>
              <p className="mt-2 text-2xl font-black text-emerald-300">{summary.totalDelivered}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass p-6 text-textMuted">Cargando ranking...</div>
        ) : rows.length === 0 ? (
          <div className="glass p-6 text-textMuted">No hay datos suficientes para este periodo.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row, index) => {
              const sellerId = String(row.seller?.id || '').trim();
              const sellerName = String(row.seller?.name || 'Coleccionista');
              const avatar = String(row.seller?.avatar_url || '');

              return (
                <article key={`${sellerId}-${index}`} className="glass p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                      #{index + 1}
                    </div>
                    <div className="h-12 w-12 rounded-full border border-line bg-surface overflow-hidden flex items-center justify-center text-xs font-bold text-textMuted">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatar}
                          alt={sellerName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        initials(sellerName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold line-clamp-1">{sellerName}</p>
                        {row.seller?.is_verified_seller ? (
                          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Verificado
                          </span>
                        ) : null}
                      </div>
                      {row.seller?.tagline ? (
                        <p className="mt-1 text-xs text-textMuted line-clamp-1">{String(row.seller.tagline)}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <span className="chip justify-center">{Number(row.stats?.total_likes || 0)} likes</span>
                    <span className="chip justify-center">{Number(row.stats?.active_listings || 0)} activos</span>
                    <span className="chip justify-center">{Number(row.stats?.delivered_sales || 0)} ventas</span>
                    <span className="chip justify-center">{Number(row.stats?.listing_comments || 0)} comentarios</span>
                  </div>

                  <div className="mt-3 rounded-xl border border-line bg-[rgba(10,18,30,0.55)] p-3">
                    <p className="text-xs text-textMuted">Precio medio anuncios</p>
                    <p className="mt-1 font-semibold text-primary">{toEuro(Number(row.stats?.average_price_cents || 0))}</p>
                    <p className="mt-1 text-xs text-textMuted">Actividad {toRelativeDate(row.last_activity_at)}</p>
                  </div>

                  {sellerId ? (
                    <Link href={`/comunidad/vendedor/${sellerId}`} className="button-secondary mt-3 w-full justify-center">
                      Ver perfil de vendedor
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
