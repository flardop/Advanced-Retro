'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabaseClient';
import { dedupeCatalogProducts } from '@/lib/catalogProduct';
import SafeImage from '@/components/SafeImage';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
import { isManualProduct } from '@/lib/productClassification';
import { getProductHref } from '@/lib/productUrl';
import { useLocale } from '@/components/LocaleProvider';

const FEATURED_COLUMNS = [
  'id',
  'name',
  'description',
  'price',
  'stock',
  'image',
  'images',
  'status',
  'created_at',
  'category',
  'component_type',
].join(',');

function humanizeValue(value: string): string {
  const source = String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .toLowerCase();

  if (!source) return '';
  if (source === 'game boy' || source === 'gameboy') return 'Game Boy';
  if (source === 'game boy color' || source === 'gameboy color' || source === 'gbc') return 'Game Boy Color';
  if (source === 'game boy advance' || source === 'gameboy advance' || source === 'gba') return 'Game Boy Advance';
  if (source === 'super nintendo' || source === 'snes') return 'Super Nintendo';
  if (source === 'gamecube' || source === 'game cube') return 'GameCube';

  return source
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function filterFeaturedProducts(input: any[]): any[] {
  return dedupeCatalogProducts(input).filter((product) => !isManualProduct(product)).slice(0, 6);
}

type FeaturedProductsProps = {
  initialProducts?: any[];
};

export default function FeaturedProducts({ initialProducts = [] }: FeaturedProductsProps) {
  const { t } = useLocale();
  const [products, setProducts] = useState<any[]>(filterFeaturedProducts(initialProducts));
  const [metrics, setMetrics] = useState<Record<string, { visits: number; likes: number }>>({});

  useEffect(() => {
    const loadMetrics = async (productIds: string[]) => {
      if (productIds.length === 0) return;
      try {
        const res = await fetch('/api/products/social/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        });
        const data = await res.json();
        if (!res.ok) return;

        const next: Record<string, { visits: number; likes: number }> = {};
        for (const [id, summary] of Object.entries<any>(data?.metrics || {})) {
          next[id] = {
            visits: Number(summary?.visits || 0),
            likes: Number(summary?.likes || 0),
          };
        }
        setMetrics(next);
      } catch {
        setMetrics({});
      }
    };

    const load = async () => {
      if (!supabaseClient) {
        return;
      }
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .select(FEATURED_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(18);
        if (error || !data || data.length === 0) {
          return;
        }

        const filtered = filterFeaturedProducts(data);
        setProducts(filtered);
        loadMetrics(filtered.map((product) => String(product.id)));
      } catch {}
    };

    void load();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    void (async () => {
      try {
        const res = await fetch('/api/products/social/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: products.map((product) => String(product.id)).filter(Boolean) }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) return;
        const next: Record<string, { visits: number; likes: number }> = {};
        for (const [id, summary] of Object.entries<any>(data?.metrics || {})) {
          next[id] = {
            visits: Number(summary?.visits || 0),
            likes: Number(summary?.likes || 0),
          };
        }
        setMetrics(next);
      } catch {}
    })();
  }, [products]);

  return (
    <section className="section pt-3">
      <div className="container">
        <div className="section-heading">
          <div className="section-copy">
            <p className="section-kicker">{t('home.featured.badge', 'Selección destacada')}</p>
            <h2 className="title-display mt-3 text-3xl sm:text-4xl">{t('home.featured.title', 'Trending en la tienda')}</h2>
            <p className="section-subtitle">{t('home.featured.subtitle', 'Productos con mejor tracción para empezar rápido.')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{t('home.featured.chip_top', 'Top valorados')}</span>
            <Link href="/tienda" className="button-secondary">{t('home.featured.cta_catalog', 'Ver catálogo')}</Link>
          </div>
        </div>

        <div className="content-rail grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product: any, index) => {
            const productMetrics = metrics[String(product.id)] || { visits: 0, likes: 0 };
            const platformLabel = humanizeValue(String(product?.platform || ''));
            const statusLabel = String(product?.status || '').trim();
            const metricChips = [
              platformLabel || null,
              statusLabel || null,
              productMetrics.visits > 0 ? `${productMetrics.visits} ${t('home.featured.visits', 'visitas')}` : null,
              productMetrics.likes > 0 ? `${productMetrics.likes} ${t('home.featured.likes', 'likes')}` : null,
            ].filter((value): value is string => Boolean(value));

            return (
              <Link
                key={product.id}
                href={getProductHref(product)}
                className="featured-product-card group glass flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div className="photo-frame-glow relative h-56 border-b border-line bg-surface">
                  <SafeImage
                    src={getProductImageUrl(product)}
                    fallbackSrc={getProductFallbackImageUrl(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 30vw"
                    priority={index < 3}
                    className="object-contain p-3 photo-breath photo-hover-pop"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 text-lg font-semibold">{product.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-textMuted">{product.description}</p>
                  {metricChips.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                      {metricChips.map((chip) => (
                        <span key={`${product.id}-${chip}`} className="chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <p className="text-2xl font-black text-primary">{(product.price / 100).toFixed(2)} €</p>
                    <span className="text-xs text-textMuted">{t('home.featured.view', 'Ver ficha')}</span>
                  </div>
                  <p className="mt-3 text-xs text-textMuted">{t('home.featured.stock', 'Stock')} {Number(product.stock || 0)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
