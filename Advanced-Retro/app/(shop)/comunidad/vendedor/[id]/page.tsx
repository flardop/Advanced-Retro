import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicSellerProfileByUserId } from '@/lib/userListings';
import CommunitySellerProfileSocial from '@/components/sections/CommunitySellerProfileSocial';
import SafeImage from '@/components/SafeImage';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
import { getProductHref } from '@/lib/productUrl';
import { supabaseServer } from '@/lib/supabaseServer';
import { buildPageMetadata } from '@/lib/seo';
import { BADGE_RARITY_STYLES, getBadgeDefinition, getBadgeIconPng } from '@/lib/gamificationBadges';

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

function relativeDate(value: string | null): string {
  if (!value) return 'Hace poco';
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return 'Hace poco';
  const hours = Math.floor((Date.now() - ts) / (1000 * 60 * 60));
  if (hours < 1) return 'Hace menos de 1h';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return new Date(ts).toLocaleDateString('es-ES');
}

function themeBannerClass(theme: string | null): string {
  const key = String(theme || 'neon-grid');
  if (key === 'sunset-glow') {
    return 'bg-[radial-gradient(circle_at_18%_22%,rgba(251,146,60,0.30),transparent_42%),radial-gradient(circle_at_86%_12%,rgba(236,72,153,0.25),transparent_46%),linear-gradient(135deg,#120d17,#1a1224,#201733)]';
  }
  if (key === 'arcade-purple') {
    return 'bg-[radial-gradient(circle_at_20%_15%,rgba(168,85,247,0.30),transparent_42%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.26),transparent_50%),linear-gradient(135deg,#0d1022,#171334,#0d1022)]';
  }
  if (key === 'mint-wave') {
    return 'bg-[radial-gradient(circle_at_18%_18%,rgba(45,212,191,0.22),transparent_44%),radial-gradient(circle_at_80%_12%,rgba(34,211,238,0.20),transparent_52%),linear-gradient(135deg,#07111a,#0d1b24,#0c1420)]';
  }
  return 'bg-[radial-gradient(circle_at_15%_20%,rgba(75,228,214,.22),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,.18),transparent_48%),linear-gradient(135deg,#07111b,#0d1827,#07101a)]';
}

function activityTypeLabel(type: string): string {
  if (type === 'listing_delivered') return 'Venta entregada';
  if (type === 'listing_approved') return 'Aprobado';
  if (type === 'community_post') return 'Post comunidad';
  return 'Nuevo anuncio';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = params;
    const data = await getPublicSellerProfileByUserId(id);
    const name = data?.seller?.name || 'Vendedor';
    return buildPageMetadata({
      title: `Comunidad · ${name}`,
      description: `Perfil público de vendedor en Advanced Retro con anuncios activos y estadísticas de comunidad.`,
      path: `/comunidad/vendedor/${id}`,
      keywords: ['perfil vendedor retro', name, 'comunidad advanced retro'],
    });
  } catch {
    return buildPageMetadata({
      title: 'Vendedor comunidad',
      description: 'Perfil público de vendedor en Advanced Retro.',
      path: '/comunidad',
      keywords: ['vendedor comunidad retro'],
    });
  }
}

export default async function CommunitySellerPage({ params }: PageProps) {
  const { id } = params;
  const supabase = supabaseServer();
  const {
    data: { user: viewerUser },
  } = await supabase.auth.getUser();

  let data: Awaited<ReturnType<typeof getPublicSellerProfileByUserId>>;
  try {
    data = await getPublicSellerProfileByUserId(id, viewerUser?.id || null);
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('no encontrado')) {
      notFound();
    }
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6">
            <p className="text-red-400">No se pudo cargar el perfil del vendedor: {error?.message || 'Error'}</p>
            <Link href="/comunidad" className="chip mt-4 inline-flex">
              Volver a comunidad
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { seller, stats, listings, favorites } = data;
  const showcaseListings = Array.isArray(listings)
    ? listings.filter((listing: any) => Boolean(listing?.is_showcase)).slice(0, 12)
    : [];
  const bannerUrl = seller.banner_url || '';
  const avatarUrl = seller.avatar_url || '';
  const sellerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: seller.name,
    url: `https://advancedretro.es/comunidad/vendedor/${seller.id}`,
    image: avatarUrl || undefined,
    description: seller.bio || seller.tagline || 'Perfil público de vendedor en AdvancedRetro.es',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sellerSchema) }}
      />
      <section className="section">
        <div className="container space-y-6">
        <div className="glass overflow-hidden">
          <div className={`relative min-h-[180px] sm:min-h-[220px] border-b border-line ${themeBannerClass(seller.profile_theme)}`}>
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt={`Banner de ${seller.name}`}
                className="absolute inset-0 h-full w-full object-cover opacity-95"
                loading="eager"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a11]/70 via-transparent to-transparent" />
            <div className="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border border-white/20 bg-black/30 overflow-hidden flex items-center justify-center text-2xl font-bold">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={seller.name}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  seller.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="title-display text-2xl sm:text-3xl">{seller.name}</h1>
                  {seller.is_verified_seller ? (
                    <span className="chip border-primary text-primary">Vendedor verificado</span>
                  ) : (
                    <span className="chip">Comunidad</span>
                  )}
                </div>
                {seller.tagline ? <p className="text-text mt-2">{seller.tagline}</p> : null}
                <p className="text-xs text-textMuted mt-2">
                  En comunidad desde {relativeDate(seller.created_at)}
                  {seller.favorite_console ? ` · Consola favorita: ${seller.favorite_console}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.52)]">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Bio</p>
                <p className="mt-2 text-textMuted whitespace-pre-wrap">
                  {seller.bio || 'Este vendedor aún no ha añadido biografía pública.'}
                </p>
              </div>

              {Array.isArray(seller.badges) && seller.badges.length > 0 ? (
                <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.52)]">
                  <p className="text-xs uppercase tracking-[0.16em] text-primary">Insignias</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {seller.badges.map((badge) => {
                      const badgeDef = getBadgeDefinition(badge);
                      const badgeLabel = badgeDef?.label || badge.replaceAll('-', ' ');
                      const badgeIcon = badgeDef?.iconPng || getBadgeIconPng(badge);
                      const badgeRarity = (badgeDef?.rarity || 'common') as keyof typeof BADGE_RARITY_STYLES;
                      const rarityStyle = BADGE_RARITY_STYLES[badgeRarity];
                      const exclusive =
                        Boolean(badgeDef?.animated) || badgeRarity === 'legendary' || badgeRarity === 'mythic';
                      return (
                        <span
                          key={badge}
                          className={`chip inline-flex items-center gap-2 ${rarityStyle.chipClass} ${
                            exclusive ? `badge-exclusive-chip badge-${badgeRarity}` : ''
                          }`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-slate-900/80 border border-primary/30 overflow-hidden ${
                              exclusive ? 'badge-exclusive-icon' : ''
                            }`}
                          >
                            <SafeImage
                              src={badgeIcon}
                              fallbackSrc="/images/badges/default.png"
                              alt={badgeLabel}
                              width={20}
                              height={20}
                              className="h-full w-full object-contain p-[2px]"
                            />
                          </span>
                          {badgeLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <CommunitySellerProfileSocial sellerId={seller.id} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs text-textMuted">Anuncios aprobados</p>
                <p className="text-2xl font-semibold text-primary mt-1">{stats.approved_listings}</p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs text-textMuted">Anuncios activos</p>
                <p className="text-2xl font-semibold text-primary mt-1">{stats.active_listings}</p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs text-textMuted">Ventas entregadas</p>
                <p className="text-2xl font-semibold text-primary mt-1">{stats.delivered_sales}</p>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs text-textMuted">Precio medio</p>
                <p className="text-2xl font-semibold text-primary mt-1">{toEuro(stats.average_price_cents)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Favoritos públicos</p>
              <h2 className="title-display text-2xl mt-1">Juegos favoritos del vendedor</h2>
            </div>
            <span className="chip">
              {favorites?.total || 0} favoritos
            </span>
          </div>

          {!favorites?.can_view ? (
            <p className="text-textMuted">
              Este usuario mantiene sus favoritos en modo privado.
            </p>
          ) : Array.isArray(favorites?.items) && favorites.items.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {favorites.items.map((item) => (
                <Link
                  key={`fav-${item.id}`}
                  href={getProductHref(item)}
                  className="min-w-[220px] max-w-[220px] snap-start rounded-2xl border border-line bg-[rgba(8,16,28,0.52)] p-3 hover:shadow-glow transition-shadow"
                >
                  <div className="relative h-36 rounded-xl border border-line bg-surface overflow-hidden">
                    <SafeImage
                      src={getProductImageUrl(item)}
                      fallbackSrc={getProductFallbackImageUrl(item)}
                      alt={item.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold line-clamp-2">{item.name}</p>
                  <p className="text-xs text-textMuted mt-1">{toEuro(Number(item.price || 0))}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-textMuted">Este usuario todavía no tiene favoritos marcados.</p>
          )}
        </div>

        <div className="glass p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Anuncios del vendedor</p>
              <h2 className="title-display text-2xl mt-1">Catálogo público de comunidad</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/comunidad" className="chip">
                Volver a comunidad
              </Link>
              <Link href="/comunidad/vendedores" className="chip">
                Ver ranking
              </Link>
              <Link href="/perfil?tab=tickets" className="button-primary">
                Abrir chat con tienda
              </Link>
            </div>
          </div>

          {stats.categories.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {stats.categories.map((category) => (
                <span key={category} className="chip">
                  {category}
                </span>
              ))}
            </div>
          ) : null}

          {showcaseListings.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-primary/30 bg-[rgba(75,228,214,0.06)] p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">Vitrina del vendedor</p>
                <span className="chip border-primary text-primary">{showcaseListings.length} anuncio(s)</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {showcaseListings.map((listing: any) => {
                  const cover = Array.isArray(listing.images) && listing.images.length > 0 ? String(listing.images[0]) : '/logo.png';
                  return (
                    <Link
                      key={`showcase-${listing.id}`}
                      href={`/comunidad/anuncio/${listing.id}`}
                      className="rounded-xl border border-line bg-[rgba(8,16,28,0.5)] p-2 hover:shadow-glow transition-shadow"
                    >
                      <div className="relative h-28 rounded-lg border border-line bg-surface overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cover} alt={listing.title} className="h-full w-full object-contain p-2" loading="lazy" />
                      </div>
                      <p className="mt-2 text-xs font-semibold line-clamp-2">{String(listing.title || '')}</p>
                      <p className="text-xs text-primary mt-1">{toEuro(Number(listing.price || 0))}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {listings.length === 0 ? (
            <div className="border border-line p-4 text-textMuted">
              Este vendedor aún no tiene anuncios aprobados visibles.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing: any) => {
                const image = Array.isArray(listing.images) && listing.images.length > 0 ? String(listing.images[0]) : '/logo.png';
                return (
                  <article key={listing.id} className="rounded-2xl border border-line bg-[rgba(8,16,28,0.52)] overflow-hidden">
                    <div className="relative h-44 bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={listing.title}
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
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold line-clamp-2">
                          <Link href={`/comunidad/anuncio/${listing.id}`} className="hover:text-primary">
                            {listing.title}
                          </Link>
                        </h3>
                        <span className="text-primary font-semibold whitespace-nowrap">{toEuro(Number(listing.price || 0))}</span>
                      </div>
                      <p className="text-xs text-textMuted mt-2 line-clamp-2">{listing.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="chip">{String(listing.condition || 'used')}</span>
                        <span className="chip">{String(listing.originality_status || 'sin-definir')}</span>
                        <span className="chip">{String(listing.delivery_status || 'pending')}</span>
                        {listing.is_featured ? <span className="chip border-primary text-primary">Destacado</span> : null}
                        {listing.is_showcase ? <span className="chip border-primary text-primary">Vitrina</span> : null}
                      </div>
                      <p className="text-xs text-textMuted mt-3">Publicado {relativeDate(String(listing.created_at || ''))}</p>
                      <Link href={`/comunidad/anuncio/${listing.id}`} className="chip mt-3 inline-flex">
                        Ver anuncio
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Actividad pública</p>
              <h2 className="title-display text-2xl mt-1">Timeline del vendedor</h2>
            </div>
          </div>

          {Array.isArray((data as any).activity) && (data as any).activity.length > 0 ? (
            <div className="space-y-3">
              {(data as any).activity.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.46)]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip text-xs">{activityTypeLabel(String(item.type || ''))}</span>
                        {item.listing_id ? (
                          <Link href={`/comunidad/anuncio/${item.listing_id}`} className="text-xs text-primary hover:underline">
                            Ver anuncio
                          </Link>
                        ) : null}
                      </div>
                      <p className="font-semibold mt-2">{String(item.title || 'Actividad')}</p>
                      <p className="text-sm text-textMuted mt-1">{String(item.subtitle || '')}</p>
                    </div>
                    <p className="text-xs text-textMuted">{relativeDate(String(item.at || ''))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-textMuted">Aún no hay actividad pública registrada.</p>
          )}
        </div>
        </div>
      </section>
    </>
  );
}
