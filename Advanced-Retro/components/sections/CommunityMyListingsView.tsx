'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { resolveCommunityListingCover } from '@/lib/communityImageUrl';

type ListingStatus = 'pending_review' | 'approved' | 'rejected' | string;

type MyListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  images?: string[];
  status: ListingStatus;
  created_at?: string;
  updated_at?: string;
  condition?: string;
  category?: string;
  originality_status?: string;
  is_featured?: boolean;
  is_showcase?: boolean;
  delivery_status?: string;
};

type Policy = {
  listing_fee_cents: number;
  commission_rate: number;
  featured_fee_per_day_cents: number;
  showcase_fee_per_day_cents: number;
};

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(cents || 0)) / 100);
}

function toRelativeDate(raw: string | undefined): string {
  if (!raw) return 'Hace poco';
  const ts = new Date(raw).getTime();
  if (!Number.isFinite(ts)) return 'Hace poco';
  const hours = Math.floor((Date.now() - ts) / (1000 * 60 * 60));
  if (hours < 1) return 'Hace menos de 1h';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return new Date(ts).toLocaleDateString('es-ES');
}

function statusLabel(status: ListingStatus): string {
  const key = String(status || '').toLowerCase();
  if (key === 'approved') return 'Aprobado';
  if (key === 'rejected') return 'Rechazado';
  if (key === 'pending_review') return 'Pendiente revisión';
  return 'Pendiente';
}

function statusClass(status: ListingStatus): string {
  const key = String(status || '').toLowerCase();
  if (key === 'approved') return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  if (key === 'rejected') return 'border-rose-300 bg-rose-50 text-rose-800';
  return 'border-amber-300 bg-amber-50 text-amber-800';
}

export default function CommunityMyListingsView() {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [policy, setPolicy] = useState<Policy>({
    listing_fee_cents: 0,
    commission_rate: 5,
    featured_fee_per_day_cents: 100,
    showcase_fee_per_day_cents: 500,
  });
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/profile/listings', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          if (!cancelled) setAuthRequired(true);
          return;
        }
        if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar tus anuncios');

        if (cancelled) return;
        setAuthRequired(false);
        setListings(Array.isArray(data?.listings) ? data.listings : []);
        setPolicy({
          listing_fee_cents: Number(data?.policy?.listing_fee_cents || 0),
          commission_rate: Number(data?.policy?.commission_rate || 5),
          featured_fee_per_day_cents: Number(data?.policy?.featured_fee_per_day_cents || 100),
          showcase_fee_per_day_cents: Number(data?.policy?.showcase_fee_per_day_cents || 500),
        });
      } catch (error: any) {
        if (cancelled) return;
        toast.error(error?.message || 'No se pudieron cargar tus anuncios');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const counters = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    for (const item of listings) {
      const key = String(item.status || '').toLowerCase();
      if (key === 'approved') approved += 1;
      else if (key === 'rejected') rejected += 1;
      else pending += 1;
    }

    return { total: listings.length, approved, pending, rejected };
  }, [listings]);

  if (authRequired) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Comunidad</p>
            <h1 className="title-display mt-2 text-3xl">Mis anuncios</h1>
            <p className="mt-3 text-textMuted">Necesitas iniciar sesión para ver y gestionar tus publicaciones.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/login?redirect=/comunidad/mis-anuncios" className="button-primary">
                Iniciar sesión
              </Link>
              <Link href="/comunidad" className="button-secondary">
                Volver a comunidad
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container space-y-6">
        <div className="glass p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Comunidad · Gestión</p>
              <h1 className="title-display mt-2 text-3xl sm:text-4xl">Mis anuncios</h1>
              <p className="mt-3 max-w-2xl text-textMuted">
                Estado de revisión, métricas rápidas y accesos a publicación o soporte.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/comunidad/publicar" className="button-primary">Publicar nuevo</Link>
              <Link href="/perfil?tab=tickets" className="button-secondary">Abrir ticket</Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
              <p className="text-xs text-textMuted">Total</p>
              <p className="mt-2 text-2xl font-black text-text">{counters.total}</p>
            </div>
            <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
              <p className="text-xs text-textMuted">Aprobados</p>
              <p className="mt-2 text-2xl font-black text-emerald-300">{counters.approved}</p>
            </div>
            <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
              <p className="text-xs text-textMuted">Pendientes</p>
              <p className="mt-2 text-2xl font-black text-amber-300">{counters.pending}</p>
            </div>
            <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.55)] p-4">
              <p className="text-xs text-textMuted">Comisión tienda</p>
              <p className="mt-2 text-2xl font-black text-primary">{policy.commission_rate.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass p-6 text-textMuted">Cargando tus anuncios...</div>
        ) : listings.length === 0 ? (
          <div className="glass p-6 sm:p-8">
            <p className="font-semibold">Aún no tienes publicaciones en comunidad</p>
            <p className="mt-2 text-textMuted">
              Empieza con tu primer anuncio para activar tu vitrina de vendedor y acumular reputación.
            </p>
            <div className="mt-4">
              <Link href="/comunidad/publicar" className="button-primary">Crear mi primer anuncio</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => {
              const image = resolveCommunityListingCover(
                listing.images,
                `${String(listing.id || '')}-${String(listing.title || '')}`
              );

              return (
                <article key={listing.id} className="glass overflow-hidden">
                  <div className="relative h-52 bg-surface">
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
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold leading-snug line-clamp-2">{listing.title}</h2>
                      <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClass(listing.status)}`}>
                        {statusLabel(listing.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-xl font-black text-primary">{toEuro(Number(listing.price || 0))}</p>
                    <p className="mt-2 text-sm text-textMuted line-clamp-2">{listing.description || 'Sin descripción'}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="chip">{listing.category || 'Sin categoría'}</span>
                      <span className="chip">{listing.condition || 'used'}</span>
                      <span className="chip">{listing.originality_status || 'sin-definir'}</span>
                    </div>

                    <p className="mt-3 text-xs text-textMuted">
                      Actualizado {toRelativeDate(listing.updated_at || listing.created_at)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {String(listing.status).toLowerCase() === 'approved' ? (
                        <Link href={`/comunidad/anuncio/${listing.id}`} className="button-secondary">
                          Ver anuncio público
                        </Link>
                      ) : (
                        <Link href="/perfil?tab=tickets" className="button-secondary">
                          Contactar revisión
                        </Link>
                      )}
                      <Link href="/comunidad/publicar" className="chip">Publicar otro</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
