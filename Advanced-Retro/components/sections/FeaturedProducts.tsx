'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { sampleProducts } from '@/lib/sampleData';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
import { isManualProduct } from '@/lib/productClassification';

function filterFeaturedProducts(input: any[]): any[] {
  return input.filter((product) => !isManualProduct(product)).slice(0, 8);
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>(filterFeaturedProducts(sampleProducts));
  const [metrics, setMetrics] = useState<Record<string, { visits: number; likes: number }>>({});

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

  useEffect(() => {
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
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);
        if (error) {
          console.warn('Error fetching featured products:', error);
          const fallback = filterFeaturedProducts(sampleProducts);
          setProducts(fallback);
          loadMetrics(fallback.map((product) => String(product.id)));
          return;
        }
        if (data && data.length > 0) {
          const filtered = filterFeaturedProducts(data);
          setProducts(filtered);
          loadMetrics(filtered.map((product) => String(product.id)));
          return;
        }
        const fallback = filterFeaturedProducts(sampleProducts);
        setProducts(fallback);
        loadMetrics(fallback.map((product) => String(product.id)));
      } catch (error) {
        console.warn('Exception fetching featured products:', error);
        const fallback = filterFeaturedProducts(sampleProducts);
        setProducts(fallback);
        loadMetrics(fallback.map((product) => String(product.id)));
      }
    };
    load();
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Selección editorial</p>
            <h2 className="title-display text-3xl mt-2">Productos destacados</h2>
            <p className="text-textMuted">Piezas con mayor interés reciente y stock activo.</p>
          </div>
          <Link href="/tienda" className="button-secondary">Ver catálogo</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/producto/${product.id}`}
              className="glass p-4 hover:shadow-glow transition-shadow group"
            >
              <div className="relative w-full h-48 bg-surface border border-line rounded-xl overflow-hidden">
                <SafeImage
                  src={getProductImageUrl(product)}
                  fallbackSrc={getProductFallbackImageUrl(product)}
                  alt={product.name}
                  fill
                  className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {product.status ? <span className="absolute top-3 left-3 chip text-xs">{product.status}</span> : null}
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-text leading-tight line-clamp-2 min-h-[42px]">{product.name}</h3>
                <p className="text-textMuted text-sm line-clamp-2 mt-2 min-h-[40px]">{product.description}</p>
                <p className="text-primary font-semibold mt-3 text-lg">
                  {(product.price / 100).toFixed(2)} €
                </p>
                <p className="text-xs text-textMuted mt-1 flex items-center justify-between gap-2">
                  <span>Visitas: {metrics[product.id]?.visits ?? 0}</span>
                  <span>Me gusta: {metrics[product.id]?.likes ?? 0}</span>
                </p>
                <p className="text-xs text-primary mt-2">
                  Ver detalle del producto
                </p>
                <p className="sr-only">
                  Visitas: {metrics[product.id]?.visits ?? 0} · Me gusta: {metrics[product.id]?.likes ?? 0}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
