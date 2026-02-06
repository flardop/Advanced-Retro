'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { sampleProducts } from '@/lib/sampleData';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getProductImageUrl, getProductImageUrls } from '@/lib/imageUrl';

export default function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any | null>(null);
  const [qty, setQty] = useState(1);
  const add = useCartStore((s) => s.add);

  useEffect(() => {
    const load = async () => {
      if (!supabaseClient) {
        setProduct(sampleProducts.find((p) => p.id === productId));
        return;
      }
      const { data } = await supabaseClient.from('products').select('*').eq('id', productId).single();
      setProduct(data);
    };
    load();
  }, [productId]);

  if (!product) return null;
  const images = getProductImageUrls(product);

  return (
    <section className="section">
      <div className="container grid gap-10 lg:grid-cols-2">
        <div className="glass p-6">
          <div className="relative w-full h-[460px] bg-surface border border-line">
            <Image src={images[0]} alt={product.name} fill className="object-cover" />
            <span className="absolute top-4 left-4 chip text-xs">{product.status}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {images.slice(0, 4).map((img: string) => (
              <div key={img} className="relative h-20 border border-line bg-surface">
                <Image src={img} alt={product.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass p-6">
          <p className="text-xs text-textMuted font-mono">Stock: {product.stock}</p>
          <h1 className="title-display text-3xl mt-2">{product.name}</h1>
          <p className="text-primary text-2xl mt-4">{(product.price / 100).toFixed(2)} €</p>
          <p className="text-textMuted mt-4">{product.long_description}</p>
          <div className="mt-6 grid gap-4">
            <div>
              <p className="font-semibold">Curiosidades retro</p>
              <ul className="list-disc list-inside text-textMuted">
                {product.curiosities?.map((c: string) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Tips de coleccionista</p>
              <ul className="list-disc list-inside text-textMuted">
                {product.tips?.map((t: string) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <input
              className="w-20 bg-transparent border border-line px-3 py-2"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            <button
              className="button-primary"
              onClick={() => {
                add({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: getProductImageUrl(product),
                  quantity: qty,
                });
                toast.success('Añadido al carrito');
              }}
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
