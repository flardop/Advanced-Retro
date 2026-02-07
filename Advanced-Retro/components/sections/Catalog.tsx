'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { sampleCategories, sampleProducts } from '@/lib/sampleData';
import { getProductImageUrl } from '@/lib/imageUrl';

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [active, setActive] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      if (!supabaseClient) {
        setCategories(sampleCategories);
        setProducts(sampleProducts);
        return;
      }
      const { data: cats } = await supabaseClient.from('categories').select('*').order('name');
      const { data: prods } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
      setCategories(cats || []);
      setProducts(prods || []);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (active === 'all') return products;
    return products.filter((p) => String(p?.category_id ?? p?.category ?? p?.category?.id) === String(active));
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
            {categories.map((c) => (
              <button
                key={c.id ?? c.slug ?? c.name}
                className={`chip ${String(active) === String(c.id ?? c.slug ?? c.name) ? 'text-primary' : ''}`}
                onClick={() => setActive(String(c.id ?? c.slug ?? c.name))}
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
                <p className="text-xs text-textMuted mt-1">Stock: {product.stock}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
