'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { sampleProducts } from '@/lib/sampleData';
import Link from 'next/link';
import Image from 'next/image';
import { getProductImageUrl } from '@/lib/imageUrl';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>(sampleProducts.slice(0, 8));
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
        const fallback = sampleProducts.slice(0, 8);
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
          setProducts(sampleProducts.slice(0, 8));
          return;
        }
        if (data && data.length > 0) {
          setProducts(data);
          loadMetrics(data.map((product) => String(product.id)));
          return;
        }
        const fallback = sampleProducts.slice(0, 8);
        setProducts(fallback);
        loadMetrics(fallback.map((product) => String(product.id)));
      } catch (error) {
        console.warn('Exception fetching featured products:', error);
        const fallback = sampleProducts.slice(0, 8);
        setProducts(fallback);
        loadMetrics(fallback.map((product) => String(product.id)));
      }
    };
    load();
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="title-display text-3xl">Productos destacados</h2>
            <p className="text-textMuted">Curados para una experiencia premium.</p>
          </div>
          <Link href="/tienda" className="button-secondary">Ver todo</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product: any) => (
            <Link key={product.id} href={`/producto/${product.id}`} className="glass p-4 hover:shadow-glow transition-shadow">
              <div className="relative w-full h-48 bg-surface border border-line overflow-hidden">
                <Image
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-3 left-3 chip text-xs">{product.status}</span>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-text">{product.name}</h3>
                <p className="text-textMuted text-sm line-clamp-2">{product.description}</p>
                <p className="text-primary font-semibold mt-2">
                  {(product.price / 100).toFixed(2)} €
                </p>
                <p className="text-xs text-textMuted mt-1">
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
