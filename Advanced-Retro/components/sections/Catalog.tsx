'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { sampleCategories, sampleProducts } from '@/lib/sampleData';
import { getProductImageUrl } from '@/lib/imageUrl';
import { buildCategoriesFromProducts } from '@/lib/productCategories';
import { isManualProduct } from '@/lib/productClassification';

const MANUALS_CATEGORY = 'manuales';

function getCategoryKey(category: any): string {
  return String(category?.id ?? category?.slug ?? category?.name ?? '');
}

function getProductCategoryKey(product: any): string {
  return String(product?.category_id ?? product?.category ?? product?.category?.id ?? '');
}

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [active, setActive] = useState<string>('all');
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
        setCategories(sampleCategories);
        setProducts(sampleProducts);
        loadMetrics(sampleProducts.map((product) => String(product.id)));
        return;
      }
      const { data: prods } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
      const safeProducts = prods || [];
      const { data: cats } = await supabaseClient.from('categories').select('*').order('name');

      const derivedCategories = buildCategoriesFromProducts(safeProducts);
      const safeCategories = cats && cats.length > 0 ? cats : derivedCategories;

      setProducts(safeProducts);
      setCategories(safeCategories.length > 0 ? safeCategories : sampleCategories);
      loadMetrics(safeProducts.map((product) => String(product.id)));
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const categoryParam = String(params.get('category') || '').trim();
    if (!categoryParam) return;
    setActive(categoryParam);
  }, []);

  const catalogCategories = useMemo(() => {
    const hasManuals = products.some((product) => isManualProduct(product));
    if (!hasManuals) return categories;

    const existsManualCategory = categories.some(
      (category) => getCategoryKey(category).toLowerCase() === MANUALS_CATEGORY
    );

    if (existsManualCategory) return categories;
    return [
      ...categories,
      {
        id: MANUALS_CATEGORY,
        slug: MANUALS_CATEGORY,
        name: 'Manuales',
      },
    ];
  }, [categories, products]);

  const filtered = useMemo(() => {
    if (active === 'all') {
      return products.filter((product) => !isManualProduct(product));
    }

    if (String(active).toLowerCase() === MANUALS_CATEGORY) {
      return products.filter((product) => isManualProduct(product));
    }

    return products.filter((product) => {
      const isCategoryMatch = getProductCategoryKey(product) === String(active);
      if (!isCategoryMatch) return false;
      return !isManualProduct(product);
    });
  }, [products, active]);

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="title-display text-3xl">Catálogo</h1>
            <p className="text-textMuted">Explora colecciones completas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={`chip ${active === 'all' ? 'text-primary' : ''}`} onClick={() => setActive('all')}>
              Todos
            </button>
            {catalogCategories.map((c) => (
              <button
                key={getCategoryKey(c)}
                className={`chip ${String(active) === getCategoryKey(c) ? 'text-primary' : ''}`}
                onClick={() => setActive(getCategoryKey(c))}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Link key={product.id} href={`/producto/${product.id}`} className="glass p-4 hover:shadow-glow transition-shadow">
              <div className="relative w-full h-56 bg-surface border border-line overflow-hidden">
                <Image
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  fill
                  className="object-contain p-2"
                />
                <span className="absolute top-3 left-3 chip text-xs">{product.status}</span>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-text">{product.name}</h3>
                <p className="text-textMuted text-sm line-clamp-2">{product.description}</p>
                <p className="text-primary font-semibold mt-2">
                  {(product.price / 100).toFixed(2)} €
                </p>
                <p className="text-xs text-textMuted mt-1">Stock: {product.stock}</p>
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
