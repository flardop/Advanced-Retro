'use client';

import Image from 'next/image';
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

export default function CommunityFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [marketListings, setMarketListings] = useState<CommunityListing[]>([]);
  const [marketPolicy, setMarketPolicy] = useState<MarketPolicy>({
    publish_fee_cents: 0,
    commission_rate: 10,
  });
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
      const res = await fetch('/api/community/listings?limit=24', { cache: 'no-store' });
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

  const marketHeader = useMemo(() => {
    const fee = (Math.max(0, Number(marketPolicy.publish_fee_cents || 0)) / 100).toFixed(2);
    const commissionRate = Number(marketPolicy.commission_rate || 10).toFixed(0);
    return `Publicar: ${fee} € · Comisión tienda: ${commissionRate}% al vender`;
  }, [marketPolicy]);

  return (
    <section className="section" id="comunidad">
      <div className="container">
        <div className="glass p-6 mb-6">
          <h2 className="title-display text-3xl">Mercado de la comunidad</h2>
          <p className="text-textMuted mt-2">
            Usuarios verificados venden sus piezas retro con revisión previa del equipo.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="chip text-primary border-primary">{marketHeader}</span>
            <span className="chip">Notificaciones por email en revisión y entrega</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/perfil" className="button-primary">
              Publicar mi producto
            </Link>
            <Link href="/perfil" className="button-secondary">
              Ver mis publicaciones
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {marketListings.length === 0 ? (
            <div className="glass p-5 lg:col-span-3">
              <p className="text-textMuted">Todavía no hay productos aprobados de la comunidad.</p>
            </div>
          ) : (
            marketListings.map((listing) => {
              const image = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : '/logo.png';
              const sellerName = listing.user?.name || 'Vendedor verificado';
              return (
                <article key={listing.id} className="glass p-4">
                  <div className="relative h-48 w-full border border-line bg-surface overflow-hidden">
                    <Image src={image} alt={listing.title} fill className="object-contain p-2" />
                  </div>
                  <h3 className="font-semibold mt-3 line-clamp-2">{listing.title}</h3>
                  <p className="text-xs text-textMuted mt-1">
                    {sellerName} · {(Number(listing.price || 0) / 100).toFixed(2)} €
                  </p>
                  <p className="text-xs text-primary mt-1">
                    Entrega: {String(listing.delivery_status || 'pending')}
                  </p>
                  <p className="text-sm text-textMuted line-clamp-3 mt-2">{listing.description}</p>
                </article>
              );
            })
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="glass p-6">
            <h3 className="font-semibold">Blog de comunidad</h3>
            <p className="text-textMuted text-sm mt-2">
              Comparte restauraciones, compras y consejos con otros coleccionistas.
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
                      {post.user?.name || post.user?.email || 'Usuario'} · {new Date(post.created_at).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm text-textMuted mt-2 whitespace-pre-wrap">{post.content}</p>
                    {Array.isArray(post.images) && post.images.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {post.images.slice(0, 4).map((image: string) => (
                          <a key={image} href={image} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate">
                            {image}
                          </a>
                        ))}
                      </div>
                    ) : null}
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
