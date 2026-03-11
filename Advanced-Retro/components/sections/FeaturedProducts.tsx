'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabaseClient';
import { sampleProducts } from '@/lib/sampleData';
import SafeImage from '@/components/SafeImage';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
import { isManualProduct } from '@/lib/productClassification';
import { getProductHref } from '@/lib/productUrl';

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

function filterFeaturedProducts(input: any[]): any[] {
  return input.filter((product) => !isManualProduct(product)).slice(0, 12);
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>(filterFeaturedProducts(sampleProducts));
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
        const fallback = filterFeaturedProducts(sampleProducts);
        setProducts(fallback);
        loadMetrics(fallback.map((product) => String(product.id)));
        return;
      }
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .select(FEATURED_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(8);
        if (error || !data || data.length === 0) {
          const fallback = filterFeaturedProducts(sampleProducts);
          setProducts(fallback);
          loadMetrics(fallback.map((product) => String(product.id)));
          return;
        }

        const filtered = filterFeaturedProducts(data);
        setProducts(filtered);
        loadMetrics(filtered.map((product) => String(product.id)));
      } catch {
        const fallback = filterFeaturedProducts(sampleProducts);
        setProducts(fallback);
        loadMetrics(fallback.map((product) => String(product.id)));
      }
    };

    void load();
  }, []);

  return (
    <section className="section pt-3">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Selección destacada</p>
            <h2 className="title-display mt-2 text-3xl sm:text-4xl">Trending en la tienda</h2>
            <p className="text-textMuted">Productos con mejor tracción para empezar rápido.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">Top valorados</span>
            <span className="chip">Últimas entradas</span>
            <Link href="/tienda" className="button-secondary">Ver catálogo</Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={getProductHref(product)}
              className="featured-product-card group glass overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="relative h-52 border-b border-line bg-surface">
                <SafeImage
                  src={getProductImageUrl(product)}
                  fallbackSrc={getProductFallbackImageUrl(product)}
                  alt={product.name}
                  fill
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 min-h-[2.7rem] text-base font-semibold">{product.name}</h3>
                <p className="mt-2 line-clamp-2 min-h-[2.45rem] text-sm text-textMuted">{product.description}</p>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <p className="text-2xl font-black text-primary">{(product.price / 100).toFixed(2)} €</p>
                  <span className="text-xs text-textMuted">Ver ficha</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="chip">{metrics[product.id]?.visits ?? 0} visitas</span>
                  <span className="chip">{metrics[product.id]?.likes ?? 0} likes</span>
                  <span className="chip">Stock {Number(product.stock || 0)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
