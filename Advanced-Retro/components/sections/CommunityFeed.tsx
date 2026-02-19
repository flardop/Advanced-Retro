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
  delivery_status?: string;
  user?: { name?: string | null; avatar_url?: string | null } | null;
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

function toPrice(cents: number): string {
  return `${(Math.max(0, Number(cents || 0)) / 100).toFixed(2)} €`;
}

function buildSellerInitial(name: string): string {
  const clean = String(name || '').trim();
  if (!clean) return 'AR';
  return clean.slice(0, 2).toUpperCase();
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
  }, [marketListings, marketQuery, marketSort, deliveryFilter]);

  const publish = async () => {
    const images = imageUrls
      .split(/\n|,|;/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

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

  return (
    <section className="section" id="comunidad">
      <div className="container space-y-6">
        <div className="rounded-3xl border border-emerald-200/70 bg-[#f3faf8] p-6 text-slate-900 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Marketplace Comunidad</p>
              <h2 className="text-3xl font-black mt-2">Compra y venta entre coleccionistas</h2>
              <p className="text-slate-600 mt-2">
                Estilo mercado real: productos de usuarios verificados, revisión previa y seguimiento por chat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                {policyText}
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700">
                Avisos por email de revisión y entrega
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.8fr,1fr,1fr]">
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
              placeholder="Buscar en la comunidad (Pokémon, Zelda, consola, etc.)"
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
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/perfil" className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
              Publicar en comunidad
            </Link>
            <Link href="/perfil" className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Mis publicaciones
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleListings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 sm:col-span-2 xl:col-span-4">
              No hay productos que coincidan con ese filtro.
            </div>
          ) : (
            visibleListings.map((listing) => {
              const image =
                Array.isArray(listing.images) && listing.images.length > 0 ? String(listing.images[0]) : '/logo.png';
              const sellerName = String(listing.user?.name || 'Vendedor verificado');
              const sellerAvatar = String(listing.user?.avatar_url || '');
                  return (
                <article key={listing.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-44 bg-slate-100">
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
                      }}
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-slate-800">
                      {toDeliveryLabel(String(listing.delivery_status || 'pending'))}
                    </span>
                  </div>
                  <div className="p-4 text-slate-900">
                    <p className="text-2xl font-black text-emerald-600">{toPrice(Number(listing.price || 0))}</p>
                    <h3 className="mt-2 font-semibold leading-snug line-clamp-2">{listing.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{listing.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
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
                      <p className="text-xs text-slate-500">{sellerName}</p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="glass p-6">
            <h3 className="font-semibold">Blog de comunidad</h3>
            <p className="text-textMuted text-sm mt-2">
              Publica restauraciones, curiosidades y experiencias con tus compras.
            </p>
            <div className="mt-4 space-y-3">
              <input
                className="w-full bg-transparent border border-line px-3 py-2"
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-transparent border border-line px-3 py-2 min-h-[120px]"
                placeholder="Comparte tu experiencia retro..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <textarea
                className="w-full bg-transparent border border-line px-3 py-2 min-h-[70px]"
                placeholder="URLs de fotos (opcional, separadas por línea)"
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
              />
              <button className="button-primary" onClick={publish} disabled={sending}>
                {sending ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>

          <div className="glass p-6">
            <h3 className="font-semibold mb-3">Últimas publicaciones</h3>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {posts.length === 0 ? (
                <p className="text-textMuted text-sm">Aún no hay publicaciones.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="border border-line p-3">
                    <p className="font-semibold">{post.title}</p>
                    <p className="text-xs text-textMuted mt-1">
                      {post.user?.name || post.user?.email || 'Usuario'} ·{' '}
                      {new Date(post.created_at).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm text-textMuted mt-2 whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
