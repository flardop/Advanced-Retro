'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

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
  commission_rate?: number;
  commission_cents?: number;
  buyer_email?: string | null;
  shipping_tracking_code?: string | null;
  delivery_status?: string;
  user?: { id?: string | null; name?: string | null; avatar_url?: string | null } | null;
};

type MarketPolicy = {
  publish_fee_cents: number;
  commission_rate: number;
};

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
  if (key.includes('gameboy-advance')) return 'GBA';
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

function toOriginalityChipClass(value: string): string {
  const key = String(value || '').toLowerCase();
  if (key === 'original_verificado') return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  if (key === 'original_sin_verificar') return 'border-amber-300 bg-amber-50 text-amber-800';
  if (key === 'repro_1_1') return 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800';
  if (key === 'mixto') return 'border-slate-300 bg-slate-50 text-slate-700';
  return 'border-slate-300 bg-slate-50 text-slate-700';
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
  if (!Number.isFinite(time)) return 'Publicado hace poco';
  const deltaMs = Date.now() - time;
  const deltaHours = Math.floor(deltaMs / (1000 * 60 * 60));
  if (deltaHours < 1) return 'Hace menos de 1h';
  if (deltaHours < 24) return `Hace ${deltaHours}h`;
  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 30) return `Hace ${deltaDays} día${deltaDays === 1 ? '' : 's'}`;
  return new Date(time).toLocaleDateString('es-ES');
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [marketListings, setMarketListings] = useState<CommunityListing[]>([]);
  const [marketPolicy, setMarketPolicy] = useState<MarketPolicy>({
    publish_fee_cents: 0,
    commission_rate: 10,
  });

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

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [sending, setSending] = useState(false);

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
      const res = await fetch('/api/community/listings?limit=36', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el marketplace');

      setMarketPolicy({
        publish_fee_cents: Number(data?.policy?.publish_fee_cents || 0),
        commission_rate: Number(data?.policy?.commission_rate || 10),
      });
      setMarketListings(Array.isArray(data?.listings) ? data.listings : []);
    } catch {
      setMarketListings([]);
    }
  };

  useEffect(() => {
    loadPosts();
    loadMarketplace();
  }, []);

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

  const publish = async () => {
    const images = imageUrls
      .split(/\n|,|;/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

    if (title.trim().length < 4) {
      toast.error('Pon un título de al menos 4 caracteres');
      return;
    }
    if (content.trim().length < 20) {
      toast.error('Escribe al menos 20 caracteres en la publicación');
      return;
    }
    if (images.length === 0) {
      toast.error('Añade al menos una foto para que la publicación destaque');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, images }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo publicar');

      setTitle('');
      setContent('');
      setImageUrls('');
      setPosts((prev) => [data.post, ...prev]);
      toast.success('Publicación creada');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo publicar');
    } finally {
      setSending(false);
    }
  };

  const policyText = useMemo(() => {
    const fee = toPrice(Number(marketPolicy.publish_fee_cents || 0));
    const commissionRate = Number(marketPolicy.commission_rate || 10).toFixed(0);
    return `Publicar ${fee} · Comisión tienda ${commissionRate}% al vender`;
  }, [marketPolicy]);

  const featuredListings = useMemo(() => visibleListings.slice(0, 3), [visibleListings]);

  return (
    <section className="section" id="comunidad">
      <div className="container space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-[0_18px_45px_rgba(2,6,23,0.12)]">
          <div className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_45%)]" />
            <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Comunidad · Marketplace</p>
                <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                  Compra y vende entre coleccionistas con revisión de la tienda
                </h2>
                <p className="mt-3 max-w-3xl text-slate-600">
                  Estilo marketplace: anuncios de usuarios, control de autenticidad/originalidad, seguimiento por chat
                  y estados de entrega con soporte desde Advanced Retro.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-900">
                    {policyText}
                  </span>
                  <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                    Chat comprador ↔ tienda
                  </span>
                  <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                    Email de seguimiento
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Anuncios visibles</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{visibleStats.count}</p>
                  <p className="text-xs text-slate-500">Con los filtros actuales</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Valor listado</p>
                  <p className="mt-2 text-2xl font-black text-cyan-700">{toPrice(visibleStats.totalValueCents)}</p>
                  <p className="text-xs text-slate-500">Suma de anuncios visibles</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:col-span-2 xl:col-span-1">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vendedor destacado</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {visibleStats.topSeller?.name || 'Sin datos aún'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {visibleStats.topSeller ? `${visibleStats.topSeller.count} anuncios activos` : 'Aparecerá al listar productos'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/80 p-4 md:p-6">
            <div className="grid gap-3 lg:grid-cols-[1.8fr,1fr,1fr,auto]">
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
                placeholder="Buscar en comunidad (Pokémon, Zelda, consola, manual...)"
                value={marketQuery}
                onChange={(e) => setMarketQuery(e.target.value)}
              />
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                value={marketSort}
                onChange={(e) => setMarketSort(e.target.value as typeof marketSort)}
              >
                <option value="newest">Novedades</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
              </select>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value as typeof deliveryFilter)}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="processing">Preparando envío</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
              </select>
              <Link
                href="/perfil"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                Publicar anuncio
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Todo' },
                { id: 'juegos', label: 'Juegos' },
                { id: 'cajas-manuales', label: 'Cajas y manuales' },
                { id: 'accesorios', label: 'Accesorios' },
                { id: 'consolas', label: 'Consolas' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCategoryGroupFilter(chip.id as any)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    categoryGroupFilter === chip.id
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              <select
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value as typeof conditionFilter)}
              >
                <option value="all">Estado: todos</option>
                <option value="used">Usado</option>
                <option value="restored">Restaurado</option>
                <option value="new">Nuevo</option>
              </select>

              <select
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                value={originalityFilter}
                onChange={(e) => setOriginalityFilter(e.target.value as typeof originalityFilter)}
              >
                <option value="all">Originalidad: todas</option>
                <option value="original_verificado">Original verificado</option>
                <option value="original_sin_verificar">Original sin verificar</option>
                <option value="repro_1_1">Repro 1:1</option>
                <option value="mixto">Mixto</option>
              </select>

              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
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

            {featuredListings.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {featuredListings.map((listing) => (
                  <div key={`featured-${listing.id}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">Destacado</p>
                    <p className="mt-1 font-semibold text-slate-900 line-clamp-1">{listing.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-600">
                        {toCategoryLabel(String(listing.category || ''))}
                      </span>
                      <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-600">
                        {toConditionLabel(String(listing.condition || 'used'))}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-black text-cyan-700">{toPrice(Number(listing.price || 0))}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr,0.9fr]">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-white">Anuncios de la comunidad</h3>
                <p className="text-sm text-textMuted">
                  Productos entre coleccionistas con control de originalidad y soporte de tienda.
                </p>
              </div>
              <Link href="/perfil" className="chip">
                Gestionar mis anuncios
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleListings.length === 0 ? (
                <div className="glass p-6 text-textMuted sm:col-span-2 xl:col-span-3">
                  <p className="font-semibold text-text">No hay anuncios con esos filtros</p>
                  <p className="mt-2 text-sm">
                    Prueba a quitar filtros o cambia a “Todo”. También puedes publicar el primero desde tu perfil.
                  </p>
                </div>
              ) : (
                visibleListings.map((listing) => {
                  const image =
                    Array.isArray(listing.images) && listing.images.length > 0
                      ? String(listing.images[0])
                      : '/logo.png';
                  const sellerName = String(listing.user?.name || 'Vendedor verificado');
                  const sellerAvatar = String(listing.user?.avatar_url || '');
                  const sellerId = String(listing.user?.id || '').trim();
                  const commissionCents = Number(listing.commission_cents || 0);
                  return (
                    <article
                      key={listing.id}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(2,6,23,0.14)]"
                    >
                      <div className="relative h-44 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={listing.title}
                          className="h-full w-full object-contain bg-slate-100 p-2"
                          loading="lazy"
                          onError={(event) => {
                            const target = event.currentTarget;
                            if (target.src.endsWith('/logo.png')) return;
                            target.src = '/logo.png';
                            target.classList.remove('object-contain');
                            target.classList.add('object-cover', 'p-0');
                          }}
                        />
                        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
                            {toDeliveryLabel(String(listing.delivery_status || 'pending'))}
                          </span>
                          <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] text-slate-700 shadow-sm">
                            {toCategoryLabel(String(listing.category || ''))}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 text-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-2xl font-black text-cyan-700">{toPrice(Number(listing.price || 0))}</p>
                          <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-600">
                            {toRelativeDate(String(listing.created_at || ''))}
                          </span>
                        </div>

                        <h3 className="mt-2 font-semibold leading-snug line-clamp-2 min-h-[2.7rem]">
                          <Link href={`/comunidad/anuncio/${listing.id}`} className="hover:text-cyan-700">
                            {listing.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
                          {listing.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-600">
                            {toConditionLabel(String(listing.condition || 'used'))}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] ${toOriginalityChipClass(
                              String(listing.originality_status || '')
                            )}`}
                          >
                            {toOriginalityLabel(String(listing.originality_status || ''))}
                          </span>
                        </div>

                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
                              {sellerAvatar ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
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
                              <p className="text-sm font-medium text-slate-800 line-clamp-1">{sellerName}</p>
                              <p className="text-[11px] text-slate-500">
                                Comisión tienda {Number(listing.commission_rate || 10).toFixed(0)}% ·{' '}
                                {toPrice(commissionCents)}
                              </p>
                              {sellerId ? (
                                <Link
                                  href={`/comunidad/vendedor/${sellerId}`}
                                  className="text-[11px] text-cyan-700 hover:underline"
                                >
                                  Ver perfil del vendedor
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2">
                          <Link
                            href={`/comunidad/anuncio/${listing.id}`}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Ver anuncio completo
                          </Link>
                          <Link
                            href="/perfil?tab=tickets"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Hablar con tienda (compra segura)
                          </Link>
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              if (typeof window === 'undefined') return;
                              const url = `${window.location.origin}/comunidad`;
                              if (!navigator?.clipboard?.writeText) {
                                toast.error('Tu navegador no permite copiar automáticamente');
                                return;
                              }
                              navigator.clipboard
                                .writeText(url)
                                .then(() => toast.success('Enlace de comunidad copiado'))
                                .catch(() => toast.error('No se pudo copiar el enlace'));
                            }}
                          >
                            Compartir anuncio
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">Publicar en el blog de comunidad</h3>
              <p className="text-slate-500 text-sm mt-2">
                Restauraciones, hallazgos, comparativas y experiencias. Aporta valor a la comunidad y mejora tu perfil.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  placeholder="Título (ej. Restauración de Game Boy Pocket)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 min-h-[120px] text-slate-900"
                  placeholder="Comparte tu experiencia retro, proceso o consejo..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <textarea
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 min-h-[88px] text-slate-900"
                  placeholder="URLs de fotos (1 por línea). Recomendado: 1-4 imágenes"
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">Consejo: añade una foto para mejorar la visibilidad.</p>
                  <button
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    onClick={publish}
                    disabled={sending}
                  >
                    {sending ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold mb-3 text-slate-900">Cómo funciona la venta en comunidad</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">1. Publicas tu anuncio</p>
                  <p className="mt-1">La publicación es gratuita y la tienda revisa la información antes de aprobarla.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">2. Se abre chat de compra segura</p>
                  <p className="mt-1">El comprador habla con la tienda y se gestiona seguimiento, pago y entrega.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">3. Comisión al cerrar la venta</p>
                  <p className="mt-1">{policyText}. El resto va a la cartera del usuario vendedor.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold mb-3 text-slate-900">Últimas publicaciones</h3>
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {posts.length === 0 ? (
                  <p className="text-slate-500 text-sm">Aún no hay publicaciones. Sé el primero en compartir una restauración.</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                      <p className="font-semibold text-slate-900">{post.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {post.user?.name || post.user?.email || 'Usuario'} ·{' '}
                        {new Date(post.created_at).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap line-clamp-4">{post.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
