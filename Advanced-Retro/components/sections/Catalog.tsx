'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { sampleCategories, sampleProducts } from '@/lib/sampleData';
import { getProductImageUrl } from '@/lib/imageUrl';
import { buildCategoriesFromProducts } from '@/lib/productCategories';
import {
  isBoxProduct,
  isCompleteGameProduct,
  isMainGameProduct,
  isManualProduct,
} from '@/lib/productClassification';

const MANUALS_CATEGORY = 'manuales';
const COMPLETE_GAMES_CATEGORY = 'juego-completo';
const QUICK_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'juegos-gameboy', label: 'Juegos' },
  { id: 'cajas-gameboy', label: 'Cajas' },
  { id: MANUALS_CATEGORY, label: 'Manuales' },
  { id: COMPLETE_GAMES_CATEGORY, label: 'Juego completo' },
];

function getCategoryKey(category: any): string {
  return String(category?.id ?? category?.slug ?? category?.name ?? '');
}

function getProductCategoryKey(product: any): string {
  return String(product?.category_id ?? product?.category ?? product?.category?.id ?? '');
}

const QUICK_FILTER_IDS = new Set(QUICK_FILTERS.map((filter) => filter.id));

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
    const hasComplete = products.some((product) => isCompleteGameProduct(product, products));

    let next = [...categories];

    const hasManualCategory = next.some(
      (category) => getCategoryKey(category).toLowerCase() === MANUALS_CATEGORY
    );
    if (hasManuals && !hasManualCategory) {
      next = [
        ...next,
        {
          id: MANUALS_CATEGORY,
          slug: MANUALS_CATEGORY,
          name: 'Manuales',
        },
      ];
    }

    const hasCompleteCategory = next.some(
      (category) => getCategoryKey(category).toLowerCase() === COMPLETE_GAMES_CATEGORY
    );
    if (hasComplete && !hasCompleteCategory) {
      next = [
        ...next,
        {
          id: COMPLETE_GAMES_CATEGORY,
          slug: COMPLETE_GAMES_CATEGORY,
          name: 'Juego completo',
        },
      ];
    }

    return next;
  }, [categories, products]);

  const completeProductIds = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (isCompleteGameProduct(product, products)) {
        set.add(String(product.id));
      }
    }
    return set;
  }, [products]);

  const filtered = useMemo(() => {
    if (active === 'all') {
      return products.filter((product) => !isManualProduct(product));
    }

    if (String(active).toLowerCase() === MANUALS_CATEGORY) {
      return products.filter((product) => isManualProduct(product));
    }

    if (String(active).toLowerCase() === COMPLETE_GAMES_CATEGORY) {
      return products.filter((product) => completeProductIds.has(String(product.id)));
    }

    if (String(active).toLowerCase() === 'juegos-gameboy') {
      return products.filter((product) => isMainGameProduct(product));
    }

    if (String(active).toLowerCase() === 'cajas-gameboy') {
      return products.filter((product) => isBoxProduct(product));
    }

    return products.filter((product) => {
      const isCategoryMatch = getProductCategoryKey(product) === String(active);
      if (!isCategoryMatch) return false;
      return !isManualProduct(product);
    });
  }, [products, active, completeProductIds]);

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="title-display text-3xl">Catálogo</h1>
            <p className="text-textMuted">Explora colecciones completas.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`chip ${active === filter.id ? 'text-primary border-primary' : ''}`}
                  onClick={() => setActive(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
            {catalogCategories
              .filter((category) => !QUICK_FILTER_IDS.has(getCategoryKey(category)))
              .map((c) => (
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
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const productId = String(product.id);
            const isComplete = completeProductIds.has(productId);
            const isCompleteView = String(active).toLowerCase() === COMPLETE_GAMES_CATEGORY;
            const href = isCompleteView ? `/producto/${productId}?complete=1` : `/producto/${productId}`;

            return (
            <Link key={product.id} href={href} className="glass p-4 hover:shadow-glow transition-shadow">
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
                {isComplete ? (
                  <p className="text-xs text-primary mt-1">
                    Pack completo disponible
                  </p>
                ) : null}
              </div>
            </Link>
          )})}
        </div>
      </div>
    </section>
  );
}
