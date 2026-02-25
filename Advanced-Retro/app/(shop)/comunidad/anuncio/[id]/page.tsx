import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicApprovedListingWithSellerById } from '@/lib/userListings';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { id: string };
};

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(cents || 0)) / 100);
}

function relativeDate(value: string | null | undefined): string {
  const raw = String(value || '').trim();
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

function labelForOriginality(value: string) {
  const key = String(value || '').toLowerCase();
  if (key === 'original_verificado') return 'Original verificado';
  if (key === 'original_sin_verificar') return 'Original sin verificar';
  if (key === 'repro_1_1') return 'Repro 1:1';
  if (key === 'mixto') return 'Mixto';
  return 'Sin definir';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const data = await getPublicApprovedListingWithSellerById(params.id);
    const listing = data.listing;
    return {
      title: `Comunidad · ${listing.title}`,
      description: `${listing.description || 'Anuncio de comunidad'} · ${toEuro(Number(listing.price || 0))}`,
      alternates: {
        canonical: `/comunidad/anuncio/${params.id}`,
      },
    };
  } catch {
    return {
      title: 'Anuncio de comunidad',
      description: 'Detalle de anuncio de comunidad en Advanced Retro.',
      alternates: { canonical: '/comunidad' },
    };
  }
}

export default async function CommunityListingDetailPage({ params }: PageProps) {
  let data: Awaited<ReturnType<typeof getPublicApprovedListingWithSellerById>>;
  try {
    data = await getPublicApprovedListingWithSellerById(params.id);
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('no encontrada')) {
      notFound();
    }
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6">
            <p className="text-red-400">No se pudo cargar el anuncio: {error?.message || 'Error'}</p>
            <Link href="/comunidad" className="chip mt-4 inline-flex">Volver a comunidad</Link>
          </div>
        </div>
      </section>
    );
  }

  const { listing, relatedBySeller } = data;
  const images = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : ['/logo.png'];

  return (
    <section className="section">
      <div className="container space-y-6">
        <div className="glass p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Comunidad · Anuncio</p>
              <h1 className="title-display text-2xl sm:text-3xl mt-1">{listing.title}</h1>
              <p className="text-xs text-textMuted mt-2">
                Publicado {relativeDate(listing.created_at)} · Estado {String(listing.delivery_status || 'pending')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/comunidad" className="chip">Volver a comunidad</Link>
              <Link href="/perfil?tab=tickets" className="button-primary">Hablar con tienda</Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {images.slice(0, 6).map((image: string, index: number) => (
                  <div key={`${image}-${index}`} className="relative h-52 sm:h-60 rounded-2xl border border-line bg-surface overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${listing.title} imagen ${index + 1}`}
                      className="h-full w-full object-contain p-2"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      onError={(event) => {
                        const t = event.currentTarget;
                        if (t.src.endsWith('/logo.png')) return;
                        t.src = '/logo.png';
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.46)]">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Descripción</p>
                <p className="mt-2 text-textMuted whitespace-pre-wrap">{String(listing.description || 'Sin descripción')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs text-textMuted">Precio anunciado</p>
                <p className="text-3xl font-semibold text-primary mt-2">{toEuro(Number(listing.price || 0))}</p>
                <p className="text-xs text-textMuted mt-2">
                  Comisión tienda: {Number(listing.commission_rate || 10).toFixed(0)}% · {toEuro(Number(listing.commission_cents || 0))}
                </p>
              </div>

              <div className="rounded-2xl border border-line p-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Datos del anuncio</p>
                <div className="flex flex-wrap gap-2">
                  <span className="chip">{String(listing.category || 'sin categoría')}</span>
                  <span className="chip">{String(listing.condition || 'used')}</span>
                  <span className="chip">{labelForOriginality(String(listing.originality_status || ''))}</span>
                  <span className="chip">Entrega: {String(listing.delivery_status || 'pending')}</span>
                </div>
                {listing.originality_notes ? (
                  <div className="rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
                    <p className="text-xs text-textMuted">Notas de autenticidad</p>
                    <p className="text-sm mt-1 text-textMuted whitespace-pre-wrap">{String(listing.originality_notes)}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Vendedor</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl border border-line bg-surface overflow-hidden flex items-center justify-center text-sm font-semibold">
                    {listing.user?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.user.avatar_url}
                        alt={listing.user?.name || 'Vendedor'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      String(listing.user?.name || 'VD').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold line-clamp-1">{String(listing.user?.name || 'Vendedor')}</p>
                    <p className="text-xs text-textMuted">
                      {listing.user?.is_verified_seller ? 'Vendedor verificado' : 'Comunidad'}
                    </p>
                  </div>
                </div>
                {listing.user?.id ? (
                  <Link href={`/comunidad/vendedor/${listing.user.id}`} className="chip mt-3 inline-flex text-primary border-primary">
                    Ver perfil público del vendedor
                  </Link>
                ) : null}
              </div>

              <div className="rounded-2xl border border-line p-4 bg-[rgba(10,18,30,0.55)]">
                <p className="text-xs text-textMuted">Compra segura gestionada por tienda</p>
                <p className="text-sm mt-1">
                  La comunicación y seguimiento se canalizan por ticket privado con Advanced Retro.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/perfil?tab=tickets" className="button-primary">
                    Abrir ticket de compra
                  </Link>
                  <Link href="/servicio-compra" className="chip">
                    Encargo 1:1
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {Array.isArray(relatedBySeller) && relatedBySeller.length > 0 ? (
          <div className="glass p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="title-display text-2xl">Más anuncios de este vendedor</h2>
              {listing.user?.id ? (
                <Link href={`/comunidad/vendedor/${listing.user.id}`} className="chip">
                  Ver perfil completo
                </Link>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {relatedBySeller.map((item: any) => {
                const cover = Array.isArray(item.images) && item.images.length > 0 ? String(item.images[0]) : '/logo.png';
                return (
                  <Link
                    key={item.id}
                    href={`/comunidad/anuncio/${item.id}`}
                    className="rounded-2xl border border-line bg-[rgba(8,16,28,0.46)] overflow-hidden hover:shadow-glow transition-all hover:-translate-y-0.5"
                  >
                    <div className="relative h-40 bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover}
                        alt={item.title}
                        className="h-full w-full object-contain p-2"
                        loading="lazy"
                        onError={(event) => {
                          const t = event.currentTarget;
                          if (t.src.endsWith('/logo.png')) return;
                          t.src = '/logo.png';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold line-clamp-2">{String(item.title || '')}</p>
                      <p className="text-primary font-semibold mt-2">{toEuro(Number(item.price || 0))}</p>
                      <p className="text-xs text-textMuted mt-1">{relativeDate(item.created_at)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

