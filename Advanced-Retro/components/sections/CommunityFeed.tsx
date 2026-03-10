'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  calculateCommunityShippingQuoteFromArenys,
  inferShippingZoneFromAddress,
  type CommunityShippingZone,
} from '@/lib/shipping';

type CommunityListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  images?: string[];
  created_at: string;
  category?: string;
  condition?: string;
  originality_status?: string;
  pegi_rating?: string;
  genre?: string;
  package_size?: string;
  item_color?: string;
  commission_rate?: number;
  commission_cents?: number;
  is_featured?: boolean;
  featured_days?: number;
  is_showcase?: boolean;
  showcase_days?: number;
  delivery_status?: string;
  user?: {
    id?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    is_verified_seller?: boolean;
    public_location?: {
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postal_code?: string | null;
      label?: string | null;
    } | null;
  } | null;
};

type MarketPolicy = {
  publish_fee_cents: number;
  commission_rate: number;
  featured_fee_per_day_cents?: number;
  showcase_fee_per_day_cents?: number;
};

type CommunitySellerRankingRow = {
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

type CommunityListingCardSocialSummary = {
  visits: number;
  likes: number;
  commentsCount: number;
  likedByCurrentVisitor: boolean;
};

type RankingPeriod = 'today' | '7d' | 'historical';

function toDeliveryLabel(status: string): string {
  const key = String(status || '').toLowerCase();
  if (key === 'processing') return 'Preparando envío';
  if (key === 'shipped') return 'Enviado';
  if (key === 'delivered') return 'Entregado';
  if (key === 'cancelled') return 'Cancelado';
  return 'Pendiente';
}

function toCategoryLabel(category: string): string {
  const key = String(category || '').toLowerCase();
  if (key.includes('gameboy-advance')) return 'Game Boy Advance';
  if (key.includes('gameboy-color')) return 'Game Boy Color';
  if (key.includes('super-nintendo')) return 'Super Nintendo';
  if (key.includes('gamecube')) return 'GameCube';
  if (key.includes('consolas')) return 'Consolas';
  if (key.includes('manual')) return 'Manuales';
  if (key.includes('cajas')) return 'Cajas';
  if (key.includes('accesorios')) return 'Accesorios';
  return 'Game Boy';
}

function toConditionLabel(value: string): string {
  const key = String(value || '').toLowerCase();
  if (key === 'new') return 'Nuevo';
  if (key === 'restored') return 'Restaurado';
  return 'Usado';
}

function toOriginalityLabel(value: string): string {
  const key = String(value || '').toLowerCase();
  if (key === 'original_verificado') return 'Original verificado';
  if (key === 'original_sin_verificar') return 'Original sin verificar';
  if (key === 'repro_1_1') return 'Repro 1:1';
  if (key === 'mixto') return 'Mixto';
  return 'Sin definir';
}

function toCategoryGroup(category: string): 'juegos' | 'cajas-manuales' | 'accesorios' | 'consolas' | 'otros' {
  const key = String(category || '').toLowerCase();
  if (key.includes('consolas')) return 'consolas';
  if (key.includes('accesorios')) return 'accesorios';
  if (key.includes('manual') || key.includes('cajas')) return 'cajas-manuales';
  if (key.includes('juegos')) return 'juegos';
  return 'otros';
}

function toPrice(cents: number): string {
  return `${(Math.max(0, Number(cents || 0)) / 100).toFixed(2)} €`;
}

function buildSellerInitial(name: string): string {
  const clean = String(name || '').trim();
  if (!clean) return 'AR';
  return clean.slice(0, 2).toUpperCase();
}

function toRelativeDate(value: string): string {
  const time = new Date(String(value || '')).getTime();
  if (!Number.isFinite(time)) return 'Hace poco';
  const deltaMs = Date.now() - time;
  const deltaHours = Math.floor(deltaMs / (1000 * 60 * 60));
  if (deltaHours < 1) return 'Hace menos de 1h';
  if (deltaHours < 24) return `Hace ${deltaHours}h`;
  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 30) return `Hace ${deltaDays} día${deltaDays === 1 ? '' : 's'}`;
  return new Date(time).toLocaleDateString('es-ES');
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'advanced-retro-visitor-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(key, next);
  return next;
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [marketListings, setMarketListings] = useState<CommunityListing[]>([]);
  const [marketPolicy, setMarketPolicy] = useState<MarketPolicy>({
    publish_fee_cents: 0,
    commission_rate: 5,
  });
  const [sellerRanking, setSellerRanking] = useState<CommunitySellerRankingRow[]>([]);
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('historical');
  const [rankingLoading, setRankingLoading] = useState(false);
  const [visitorId, setVisitorId] = useState('');
  const [listingSocialMetrics, setListingSocialMetrics] = useState<Record<string, CommunityListingCardSocialSummary>>(
    {}
  );
  const [cardLikeLoadingById, setCardLikeLoadingById] = useState<Record<string, boolean>>({});
  const [viewerShippingZone, setViewerShippingZone] = useState<CommunityShippingZone>('espana_peninsula');
  const [showFilters, setShowFilters] = useState(false);

  const [marketQuery, setMarketQuery] = useState('');
  const [marketSort, setMarketSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>(
    'all'
  );
  const [categoryGroupFilter, setCategoryGroupFilter] = useState<
    'all' | 'juegos' | 'cajas-manuales' | 'accesorios' | 'consolas'
  >('all');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'used' | 'new' | 'restored'>('all');
  const [originalityFilter, setOriginalityFilter] = useState<
    'all' | 'original_verificado' | 'original_sin_verificar' | 'repro_1_1' | 'mixto'
  >('all');

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/community/posts', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar publicaciones');
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
    } catch {
      setPosts([]);
    }
  };

  const loadMarketplace = async () => {
    try {
      const res = await fetch('/api/community/listings?limit=80', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el marketplace');

      setMarketPolicy({
        publish_fee_cents: Number(data?.policy?.publish_fee_cents || 0),
        commission_rate: Number(data?.policy?.commission_rate || 5),
        featured_fee_per_day_cents: Number(data?.policy?.featured_fee_per_day_cents || 100),
        showcase_fee_per_day_cents: Number(data?.policy?.showcase_fee_per_day_cents || 500),
      });
      setMarketListings(Array.isArray(data?.listings) ? data.listings : []);
    } catch {
      setMarketListings([]);
    }
  };

  const loadRanking = useCallback(async (period: RankingPeriod) => {
    setRankingLoading(true);
    try {
      const res = await fetch(`/api/community/ranking?limit=8&period=${encodeURIComponent(period)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar ranking');
      setSellerRanking(Array.isArray(data?.ranking) ? data.ranking : []);
    } catch {
      setSellerRanking([]);
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadViewerZone = async () => {
      try {
        const res = await fetch('/api/auth/profile', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        const address = data?.user?.profile?.shipping_address;
        if (!address) return;
        setViewerShippingZone(inferShippingZoneFromAddress(address));
      } catch {
        // Zona por defecto.
      }
    };
    void loadViewerZone();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadPosts();
    loadMarketplace();
  }, []);

  useEffect(() => {
    void loadRanking(rankingPeriod);
  }, [rankingPeriod, loadRanking]);

  useEffect(() => {
    if (!visitorId || marketListings.length === 0) return;

    let cancelled = false;

    const loadListingSocialBatch = async () => {
      try {
        const listingIds = marketListings.map((item) => String(item.id || '')).filter(Boolean);
        if (listingIds.length === 0) return;
        const res = await fetch('/api/community/listings/social/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingIds, visitorId }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar métricas sociales');
        if (cancelled) return;
        setListingSocialMetrics(
          data?.metrics && typeof data.metrics === 'object' && !Array.isArray(data.metrics) ? data.metrics : {}
        );
      } catch {
        if (cancelled) return;
        setListingSocialMetrics({});
      }
    };

    void loadListingSocialBatch();

    return () => {
      cancelled = true;
    };
  }, [visitorId, marketListings]);

  const toggleCardLike = async (listingId: string) => {
    const safeId = String(listingId || '').trim();
    if (!safeId || !visitorId || cardLikeLoadingById[safeId]) return;

    setCardLikeLoadingById((prev) => ({ ...prev, [safeId]: true }));
    try {
      const res = await fetch(`/api/community/listings/${encodeURIComponent(safeId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_like', visitorId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar me gusta');
      if (data?.summary) {
        setListingSocialMetrics((prev) => ({ ...prev, [safeId]: data.summary }));
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar me gusta');
    } finally {
      setCardLikeLoadingById((prev) => ({ ...prev, [safeId]: false }));
    }
  };

  const visibleListings = useMemo(() => {
    const q = marketQuery.trim().toLowerCase();
    let list = [...marketListings];

    if (q) {
      list = list.filter((listing) => {
        const text = `${String(listing.title || '')} ${String(listing.description || '')}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (deliveryFilter !== 'all') {
      list = list.filter((listing) => String(listing.delivery_status || 'pending') === deliveryFilter);
    }
    if (categoryGroupFilter !== 'all') {
      list = list.filter((listing) => toCategoryGroup(String(listing.category || '')) === categoryGroupFilter);
    }
    if (conditionFilter !== 'all') {
      list = list.filter((listing) => String(listing.condition || 'used') === conditionFilter);
    }
    if (originalityFilter !== 'all') {
      list = list.filter((listing) => String(listing.originality_status || '') === originalityFilter);
    }

    if (marketSort === 'price_asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (marketSort === 'price_desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else {
      list.sort(
        (a, b) =>
          new Date(String(b.created_at || 0)).getTime() - new Date(String(a.created_at || 0)).getTime()
      );
    }

    return list;
  }, [marketListings, marketQuery, marketSort, deliveryFilter, categoryGroupFilter, conditionFilter, originalityFilter]);

  const visibleStats = useMemo(() => {
    const sellerCount = new Map<string, { name: string; count: number }>();
    let totalValue = 0;

    for (const listing of visibleListings) {
      totalValue += Number(listing.price || 0);
      const sellerName = String(listing.user?.name || 'Vendedor verificado');
      const key = sellerName.toLowerCase();
      const current = sellerCount.get(key);
      if (current) current.count += 1;
      else sellerCount.set(key, { name: sellerName, count: 1 });
    }

    const topSeller =
      [...sellerCount.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0] || null;

    return {
      count: visibleListings.length,
      totalValueCents: totalValue,
      topSeller,
    };
  }, [visibleListings]);

  const policyText = useMemo(() => {
    const fee = toPrice(Number(marketPolicy.publish_fee_cents || 0));
    const commissionRate = Number(marketPolicy.commission_rate || 5).toFixed(0);
    return `Publicar ${fee} · Comisión tienda ${commissionRate}% al vender`;
  }, [marketPolicy]);

  return (
    <section className="section" id="comunidad">
      <div className="mx-auto w-full max-w-[1720px] space-y-5 px-4 sm:px-6 lg:px-8">
        <div className="glass p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Comunidad marketplace</p>
              <h2 className="title-display mt-2 text-3xl sm:text-4xl lg:text-5xl">Compra y vende sin fricción</h2>
              <p className="mt-3 max-w-3xl text-textMuted">
                Feed estilo marketplace con filtros claros, envío calculado y perfil público de vendedor.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="chip border-primary/50 text-primary">{policyText}</span>
                <span className="chip">Chat comprador ↔ tienda</span>
                <span className="chip">Estado de envío trazable</span>
              </div>
            </div>

            <div className="grid min-w-[250px] gap-2 sm:grid-cols-2">
              <Link href="/comunidad/publicar" className="button-primary justify-center">Publicar anuncio</Link>
              <Link href="/comunidad/mis-anuncios" className="button-secondary justify-center">Mis anuncios</Link>
              <Link href="/comunidad/vendedores" className="button-secondary justify-center">Ver vendedores</Link>
              <Link href="/perfil?tab=tickets" className="button-secondary justify-center">Soporte compra segura</Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
              <p className="text-xs text-textMuted">Anuncios visibles</p>
              <p className="mt-2 text-2xl font-black text-text">{visibleStats.count}</p>
            </div>
            <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
              <p className="text-xs text-textMuted">Valor publicado</p>
              <p className="mt-2 text-2xl font-black text-primary">{toPrice(visibleStats.totalValueCents)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
              <p className="text-xs text-textMuted">Vendedor más activo</p>
              <p className="mt-2 text-lg font-semibold text-text line-clamp-1">{visibleStats.topSeller?.name || 'Sin datos aún'}</p>
            </div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="min-w-[240px] flex-1 rounded-xl border border-line bg-[rgba(12,20,34,0.55)] px-4 py-3 text-sm"
              placeholder="Buscar en comunidad (Pokémon, Zelda, consola, manual...)"
              value={marketQuery}
              onChange={(e) => setMarketQuery(e.target.value)}
            />
            <select
              className="rounded-xl border border-line bg-[rgba(12,20,34,0.55)] px-3 py-3 text-sm"
              value={marketSort}
              onChange={(e) => setMarketSort(e.target.value as typeof marketSort)}
            >
              <option value="newest">Novedades</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setShowFilters((value) => !value)}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>

          {showFilters ? (
            <div className="mt-3 grid gap-2 lg:grid-cols-5">
              <select
                className="rounded-xl border border-line bg-[rgba(12,20,34,0.55)] px-3 py-2.5 text-sm"
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value as typeof deliveryFilter)}
              >
                <option value="all">Estado: todos</option>
                <option value="pending">Pendiente</option>
                <option value="processing">Preparando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
              </select>
              <select
                className="rounded-xl border border-line bg-[rgba(12,20,34,0.55)] px-3 py-2.5 text-sm"
                value={categoryGroupFilter}
                onChange={(e) => setCategoryGroupFilter(e.target.value as any)}
              >
                <option value="all">Categoría: todo</option>
                <option value="juegos">Juegos</option>
                <option value="cajas-manuales">Cajas y manuales</option>
                <option value="accesorios">Accesorios</option>
                <option value="consolas">Consolas</option>
              </select>
              <select
                className="rounded-xl border border-line bg-[rgba(12,20,34,0.55)] px-3 py-2.5 text-sm"
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value as typeof conditionFilter)}
              >
                <option value="all">Estado del artículo</option>
                <option value="used">Usado</option>
                <option value="restored">Restaurado</option>
                <option value="new">Nuevo</option>
              </select>
              <select
                className="rounded-xl border border-line bg-[rgba(12,20,34,0.55)] px-3 py-2.5 text-sm"
                value={originalityFilter}
                onChange={(e) => setOriginalityFilter(e.target.value as typeof originalityFilter)}
              >
                <option value="all">Originalidad</option>
                <option value="original_verificado">Original verificado</option>
                <option value="original_sin_verificar">Original sin verificar</option>
                <option value="repro_1_1">Repro 1:1</option>
                <option value="mixto">Mixto</option>
              </select>
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => {
                  setMarketQuery('');
                  setMarketSort('newest');
                  setDeliveryFilter('all');
                  setCategoryGroupFilter('all');
                  setConditionFilter('all');
                  setOriginalityFilter('all');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6">
          <div>
            {visibleListings.length === 0 ? (
              <div className="glass p-6">
                <p className="font-semibold">No hay anuncios con esos filtros</p>
                <p className="mt-2 text-sm text-textMuted">
                  Prueba a limpiar filtros o publica tu primer anuncio en comunidad.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/comunidad/publicar" className="button-primary">Publicar anuncio</Link>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => {
                      setMarketQuery('');
                      setMarketSort('newest');
                      setDeliveryFilter('all');
                      setCategoryGroupFilter('all');
                      setConditionFilter('all');
                      setOriginalityFilter('all');
                    }}
                  >
                    Quitar filtros
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {visibleListings.map((listing) => {
                  const image =
                    Array.isArray(listing.images) && listing.images.length > 0
                      ? String(listing.images[0])
                      : '/logo.png';
                  const sellerName = String(listing.user?.name || 'Vendedor');
                  const sellerAvatar = String(listing.user?.avatar_url || '');
                  const sellerId = String(listing.user?.id || '').trim();
                  const sellerLocationLabel = String(listing.user?.public_location?.label || '').trim();

                  const shippingQuote = calculateCommunityShippingQuoteFromArenys({
                    zone: viewerShippingZone,
                    packageSize: listing.package_size || 'medium',
                    itemPriceCents: Number(listing.price || 0),
                  });
                  const totalPriceCents = Math.max(0, Number(listing.price || 0)) + shippingQuote.costCents;

                  const social = listingSocialMetrics[String(listing.id)] || {
                    visits: 0,
                    likes: 0,
                    commentsCount: 0,
                    likedByCurrentVisitor: false,
                  };
                  const likeBusy = Boolean(cardLikeLoadingById[String(listing.id)]);

                  return (
                    <article key={listing.id} className="overflow-hidden rounded-2xl border border-line bg-[rgba(12,19,31,0.88)] shadow-[0_12px_26px_rgba(1,8,18,0.28)] transition hover:-translate-y-0.5 hover:shadow-glow">
                      <Link href={`/comunidad/anuncio/${listing.id}`} className="block relative h-56 bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            const target = event.currentTarget;
                            if (target.src.endsWith('/logo.png')) return;
                            target.src = '/logo.png';
                            target.classList.remove('object-cover');
                            target.classList.add('object-contain');
                          }}
                        />
                        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                          <span className="rounded-full border border-white/35 bg-black/55 px-2 py-1 text-[11px] text-white">
                            {toDeliveryLabel(String(listing.delivery_status || 'pending'))}
                          </span>
                          {listing.is_featured ? (
                            <span className="rounded-full border border-amber-300/60 bg-amber-300/20 px-2 py-1 text-[11px] text-amber-100">
                              Destacado
                            </span>
                          ) : null}
                          {listing.is_showcase ? (
                            <span className="rounded-full border border-fuchsia-300/60 bg-fuchsia-300/20 px-2 py-1 text-[11px] text-fuchsia-100">
                              Vitrina
                            </span>
                          ) : null}
                        </div>
                      </Link>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-2xl font-black text-primary">{toPrice(totalPriceCents)}</p>
                            <p className="text-[11px] text-textMuted">
                              incl. envío ({toPrice(shippingQuote.costCents)})
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={social.likedByCurrentVisitor ? 'Quitar favorito' : 'Guardar favorito'}
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                              social.likedByCurrentVisitor
                                ? 'border-primary bg-primary/15 text-primary'
                                : 'border-line text-textMuted hover:text-text'
                            } ${likeBusy ? 'opacity-70' : ''}`}
                            disabled={likeBusy || !visitorId}
                            onClick={() => toggleCardLike(String(listing.id))}
                          >
                            {social.likedByCurrentVisitor ? '♥ Guardado' : '♡ Me gusta'}
                          </button>
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-base font-semibold">
                          <Link href={`/comunidad/anuncio/${listing.id}`} className="hover:text-primary">
                            {listing.title}
                          </Link>
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-textMuted">{listing.description}</p>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                          <span className="chip">{toCategoryLabel(String(listing.category || ''))}</span>
                          <span className="chip">{toConditionLabel(String(listing.condition || 'used'))}</span>
                          <span className="chip">{toOriginalityLabel(String(listing.originality_status || ''))}</span>
                          {String(listing.pegi_rating || 'none') !== 'none' ? (
                            <span className="chip">PEGI {String(listing.pegi_rating)}</span>
                          ) : null}
                        </div>

                        <div className="mt-3 rounded-xl border border-line bg-[rgba(10,18,30,0.62)] p-2.5">
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-textMuted">
                            <span className="chip">{social.likes} likes</span>
                            <span className="chip">{social.commentsCount} comentarios</span>
                            <span className="chip">{social.visits} visitas</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full border border-line bg-surface overflow-hidden flex items-center justify-center text-xs font-semibold">
                            {sellerAvatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sellerAvatar}
                                alt={sellerName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              buildSellerInitial(sellerName)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-medium">{sellerName}</p>
                            <p className="text-[11px] text-textMuted line-clamp-1">
                              {sellerLocationLabel || 'Ubicación no publicada'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-textMuted">
                          <span>{toRelativeDate(String(listing.created_at || ''))}</span>
                          {sellerId ? (
                            <Link href={`/comunidad/vendedor/${sellerId}`} className="text-primary hover:underline">
                              Ver vendedor
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="grid gap-4 lg:grid-cols-3">
            <div className="glass p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">Top vendedores</h3>
                <button type="button" className="chip" onClick={() => loadRanking(rankingPeriod)}>
                  {rankingLoading ? '...' : 'Actualizar'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: '7d', label: '7 días' },
                  { id: 'historical', label: 'Histórico' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRankingPeriod(tab.id as RankingPeriod)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      rankingPeriod === tab.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-line text-textMuted hover:text-text'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 space-y-2">
                {sellerRanking.length === 0 ? (
                  <p className="text-sm text-textMuted">Aún no hay ranking para este periodo.</p>
                ) : (
                  sellerRanking.slice(0, 5).map((row, index) => {
                    const sellerId = String(row?.seller?.id || '').trim();
                    return (
                      <div key={`${sellerId}-${index}`} className="rounded-xl border border-line bg-[rgba(10,18,30,0.55)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold line-clamp-1">#{index + 1} {String(row.seller?.name || 'Vendedor')}</p>
                          {row.seller?.is_verified_seller ? <span className="chip border-primary text-primary">Verificado</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                          <span className="chip">{Number(row.stats?.total_likes || 0)} likes</span>
                          <span className="chip">{Number(row.stats?.active_listings || 0)} activos</span>
                          <span className="chip">{Number(row.stats?.delivered_sales || 0)} ventas</span>
                        </div>
                        {sellerId ? (
                          <Link href={`/comunidad/vendedor/${sellerId}`} className="mt-2 inline-flex text-xs text-primary hover:underline">
                            Ver perfil
                          </Link>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <Link href="/comunidad/vendedores" className="button-secondary mt-3 w-full justify-center">Ver ranking completo</Link>
            </div>

            <div className="glass p-4">
              <h3 className="font-semibold">Cómo funciona</h3>
              <ol className="mt-3 space-y-2 text-sm text-textMuted">
                <li className="rounded-xl border border-line bg-[rgba(10,18,30,0.55)] p-2.5">
                  <span className="font-semibold text-text">1.</span> Publicas anuncio con fotos y datos.
                </li>
                <li className="rounded-xl border border-line bg-[rgba(10,18,30,0.55)] p-2.5">
                  <span className="font-semibold text-text">2.</span> La tienda revisa y aprueba.
                </li>
                <li className="rounded-xl border border-line bg-[rgba(10,18,30,0.55)] p-2.5">
                  <span className="font-semibold text-text">3.</span> Compra segura + comisión al cerrar venta.
                </li>
              </ol>
            </div>

            <div className="glass p-4">
              <h3 className="font-semibold">Últimas publicaciones</h3>
              <div className="mt-3 space-y-2">
                {posts.length === 0 ? (
                  <p className="text-sm text-textMuted">Aún no hay posts de comunidad.</p>
                ) : (
                  posts.slice(0, 4).map((post) => (
                    <article key={post.id} className="rounded-xl border border-line bg-[rgba(10,18,30,0.55)] p-2.5">
                      <p className="text-sm font-semibold line-clamp-2">{String(post.title || 'Publicación')}</p>
                      <p className="mt-1 text-xs text-textMuted line-clamp-2">{String(post.content || '')}</p>
                    </article>
                  ))
                )}
              </div>
              <Link href="/blog" className="button-secondary mt-3 w-full justify-center">Ir al blog</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
