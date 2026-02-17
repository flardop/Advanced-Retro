'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { sampleProducts } from '@/lib/sampleData';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getProductImageUrl, getProductImageUrls } from '@/lib/imageUrl';

type BundleOptionType = 'cartucho' | 'caja' | 'manual' | 'insert' | 'protector';

type BundleOption = {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  type: BundleOptionType;
  defaultSelected: boolean;
};

type ProductSocialReview = {
  id: string;
  visitorId: string;
  authorName: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
};

type ProductSocialSummary = {
  visits: number;
  likes: number;
  reviewsCount: number;
  ratingAverage: number;
  likedByCurrentVisitor: boolean;
};

const EMPTY_SUMMARY: ProductSocialSummary = {
  visits: 0,
  likes: 0,
  reviewsCount: 0,
  ratingAverage: 0,
  likedByCurrentVisitor: false,
};

const BUNDLE_TYPE_LABEL: Record<BundleOptionType, string> = {
  cartucho: 'Cartucho',
  caja: 'Caja',
  manual: 'Manual',
  insert: 'Insert',
  protector: 'Protector',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanBaseTitle(name: string): string {
  return normalizeText(name)
    .replace(/\b(caja|repro|manual|insert|interior|protector|cartucho|pegatina|funda|game boy|universal)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreByTokens(base: string, candidate: string): number {
  const baseTokens = new Set(base.split(' ').filter((token) => token.length >= 3));
  const candidateTokens = new Set(candidate.split(' ').filter((token) => token.length >= 3));

  if (baseTokens.size === 0 || candidateTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of baseTokens) {
    if (candidateTokens.has(token)) overlap += 1;
  }
  return overlap / Math.max(baseTokens.size, candidateTokens.size);
}

function detectOptionType(product: any): BundleOptionType | null {
  const n = normalizeText(String(product?.name || ''));
  if (!n) return null;
  if (n.includes('manual')) return 'manual';
  if (n.includes('insert')) return 'insert';
  if (n.includes('protector')) return 'protector';
  if (n.includes('caja') || String(product?.category || '').trim() === 'cajas-gameboy') return 'caja';
  return null;
}

function buildBundleOptions(baseProduct: any, allProducts: any[]): BundleOption[] {
  const base: BundleOption = {
    id: String(baseProduct.id),
    name: String(baseProduct.name || 'Cartucho'),
    price: Number(baseProduct.price || 0),
    image: getProductImageUrl(baseProduct),
    stock: Number(baseProduct.stock || 0),
    type: 'cartucho',
    defaultSelected: true,
  };

  const baseTitle = cleanBaseTitle(String(baseProduct.name || ''));
  const matchesByType: Partial<Record<BundleOptionType, { product: any; score: number }>> = {};

  for (const product of allProducts) {
    if (!product || String(product.id) === String(baseProduct.id)) continue;
    if (!Number.isFinite(Number(product.price))) continue;

    const type = detectOptionType(product);
    if (!type) continue;

    const candidateTitle = cleanBaseTitle(String(product.name || ''));
    const score = scoreByTokens(baseTitle, candidateTitle);
    if (score < 0.45) continue;

    const current = matchesByType[type];
    if (!current || score > current.score) {
      matchesByType[type] = { product, score };
    }
  }

  const extras: BundleOption[] = (['caja', 'manual', 'insert', 'protector'] as BundleOptionType[])
    .map((type) => {
      const found = matchesByType[type];
      if (!found) return null;
      return {
        id: String(found.product.id),
        name: String(found.product.name || BUNDLE_TYPE_LABEL[type]),
        price: Number(found.product.price || 0),
        image: getProductImageUrl(found.product),
        stock: Number(found.product.stock || 0),
        type,
        defaultSelected: false,
      } as BundleOption;
    })
    .filter((item): item is BundleOption => Boolean(item));

  return [base, ...extras];
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'advanced-retro-visitor-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const nextId =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(key, nextId);
  return nextId;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la foto'));
    reader.readAsDataURL(file);
  });
}

export default function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const [bundleOptions, setBundleOptions] = useState<BundleOption[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<Record<string, boolean>>({});

  const [visitorId, setVisitorId] = useState('');
  const [socialSummary, setSocialSummary] = useState<ProductSocialSummary>(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState<ProductSocialReview[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const add = useCartStore((s) => s.add);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!supabaseClient) {
        const fallback = sampleProducts.find((p) => p.id === productId) || null;
        setProduct(fallback);
        if (fallback) setBundleOptions(buildBundleOptions(fallback, sampleProducts));
        return;
      }

      const { data } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      setProduct(data || null);

      if (!data) return;

      const shouldOfferBundle = String(data.category || '') === 'juegos-gameboy';
      if (!shouldOfferBundle) {
        setBundleOptions([
          {
            id: String(data.id),
            name: String(data.name || 'Producto'),
            price: Number(data.price || 0),
            image: getProductImageUrl(data),
            stock: Number(data.stock || 0),
            type: 'cartucho',
            defaultSelected: true,
          },
        ]);
        return;
      }

      const { data: candidates } = await supabaseClient
        .from('products')
        .select('id,name,price,image,images,stock,category')
        .in('category', ['juegos-gameboy', 'cajas-gameboy', 'accesorios'])
        .gt('stock', 0)
        .limit(600);

      setBundleOptions(buildBundleOptions(data, candidates || []));
    };

    load();
  }, [productId]);

  useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    for (const option of bundleOptions) {
      initialSelection[option.id] = option.defaultSelected;
    }
    setSelectedBundleIds(initialSelection);
  }, [bundleOptions]);

  const refreshSocial = useCallback(async () => {
    if (!productId || !visitorId) return;
    setSocialLoading(true);
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(productId)}/social?visitorId=${encodeURIComponent(visitorId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar actividad');

      setSocialSummary(data.summary || EMPTY_SUMMARY);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (error: any) {
      console.warn('Error loading social data:', error?.message || error);
    } finally {
      setSocialLoading(false);
    }
  }, [productId, visitorId]);

  useEffect(() => {
    if (!visitorId || !productId) return;

    refreshSocial();
    fetch(`/api/products/${encodeURIComponent(productId)}/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'visit', visitorId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.summary) setSocialSummary(data.summary);
      })
      .catch(() => undefined);
  }, [productId, visitorId, refreshSocial]);

  const images = useMemo(() => (product ? getProductImageUrls(product) : []), [product]);

  const selectedBundleOptions = useMemo(
    () => bundleOptions.filter((option) => selectedBundleIds[option.id]),
    [bundleOptions, selectedBundleIds]
  );
  const selectedUnitPrice = useMemo(
    () => selectedBundleOptions.reduce((sum, option) => sum + option.price, 0),
    [selectedBundleOptions]
  );
  const selectedTotalPrice = selectedUnitPrice * Math.max(1, qty);

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6 text-textMuted">Cargando producto...</div>
        </div>
      </section>
    );
  }

  const toggleLike = async () => {
    if (!visitorId) return;

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_like', visitorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar me gusta');
      if (data?.summary) setSocialSummary(data.summary);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar me gusta');
    }
  };

  const submitReview = async () => {
    if (!visitorId) return;
    if (reviewComment.trim().length < 2) {
      toast.error('Escribe al menos 2 caracteres en la reseña');
      return;
    }
    if (!Number.isInteger(reviewRating) || reviewRating < 1 || reviewRating > 5) {
      toast.error('La valoración debe ser entre 1 y 5');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_review',
          visitorId,
          authorName: reviewName,
          rating: reviewRating,
          comment: reviewComment,
          photos: reviewPhotos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo publicar reseña');

      if (data?.summary) setSocialSummary(data.summary);
      if (Array.isArray(data?.reviews)) setReviews(data.reviews);

      setReviewComment('');
      setReviewRating(5);
      setReviewPhotos([]);
      toast.success('Reseña publicada');
    } catch (error: any) {
      toast.error(error?.message || 'Error publicando reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  const addSelectedToCart = () => {
    const safeQty = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;
    const picked = selectedBundleOptions.filter((option) => option.stock > 0);

    if (picked.length === 0) {
      toast.error('Selecciona al menos una opción');
      return;
    }

    for (const option of picked) {
      add({
        id: option.id,
        name: option.name,
        price: option.price,
        image: option.image,
        quantity: safeQty,
        optionType: option.type,
        bundleParentId: String(product.id),
      });
    }

    toast.success(`Añadidos ${picked.length} artículo(s) al carrito`);
  };

  return (
    <section className="section">
      <div className="container grid gap-10 lg:grid-cols-2">
        <div className="glass p-6">
          <div className="relative w-full h-[460px] bg-surface border border-line">
            <Image src={images[selectedImage] || images[0]} alt={product.name} fill className="object-cover" />
            {product.status ? <span className="absolute top-4 left-4 chip text-xs">{product.status}</span> : null}
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {images.slice(0, 8).map((img: string, index: number) => (
              <button
                type="button"
                key={`${img}-${index}`}
                className={`relative h-20 border bg-surface ${selectedImage === index ? 'border-primary' : 'border-line'}`}
                onClick={() => setSelectedImage(index)}
              >
                <Image src={img} alt={product.name} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-textMuted font-mono">Stock: {product.stock}</p>
            <div className="flex items-center gap-2 text-xs text-textMuted">
              <span>Visitas: {socialSummary.visits}</span>
              <span>Me gusta: {socialSummary.likes}</span>
              <span>Valoraciones: {socialSummary.reviewsCount}</span>
            </div>
          </div>

          <h1 className="title-display text-3xl mt-2">{product.name}</h1>
          <p className="text-primary text-2xl mt-4">{(product.price / 100).toFixed(2)} €</p>
          <p className="text-textMuted mt-4">{product.long_description || product.description}</p>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className={`chip ${socialSummary.likedByCurrentVisitor ? 'text-primary border-primary' : ''}`}
              onClick={toggleLike}
            >
              {socialSummary.likedByCurrentVisitor ? 'Quitar me gusta' : 'Me gusta'}
            </button>
            <button type="button" className="chip" onClick={refreshSocial} disabled={socialLoading}>
              {socialLoading ? 'Actualizando...' : 'Actualizar actividad'}
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <p className="font-semibold">Curiosidades retro</p>
              <ul className="list-disc list-inside text-textMuted">
                {(product.curiosities || []).map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Tips de coleccionista</p>
              <ul className="list-disc list-inside text-textMuted">
                {(product.tips || []).map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <p className="font-semibold mb-3">Configura tu compra</p>
            <div className="space-y-2">
              {bundleOptions.map((option) => (
                <label key={option.id} className="flex items-center justify-between gap-3 border border-line px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedBundleIds[option.id])}
                      onChange={(e) =>
                        setSelectedBundleIds((prev) => ({
                          ...prev,
                          [option.id]: e.target.checked,
                        }))
                      }
                      disabled={option.stock <= 0}
                    />
                    <span className="text-sm">{BUNDLE_TYPE_LABEL[option.type]}: {option.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary">{(option.price / 100).toFixed(2)} €</p>
                    <p className="text-xs text-textMuted">Stock {option.stock}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                className="w-20 bg-transparent border border-line px-3 py-2"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button className="button-primary" onClick={addSelectedToCart}>
                Añadir selección al carrito
              </button>
            </div>

            <p className="mt-3 text-sm text-textMuted">
              Total selección ({Math.max(1, qty)} ud): <span className="text-primary">{(selectedTotalPrice / 100).toFixed(2)} €</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container mt-10">
        <div className="glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="title-display text-2xl">Valoraciones</h2>
            <p className="text-textMuted text-sm">
              Nota media: {socialSummary.ratingAverage.toFixed(2)} / 5 ({socialSummary.reviewsCount} reseñas)
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm text-textMuted">Tu nombre (opcional)</label>
              <input
                className="w-full bg-transparent border border-line px-3 py-2"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="Coleccionista"
              />

              <label className="block text-sm text-textMuted">Tu valoración</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`chip ${reviewRating >= value ? 'text-primary border-primary' : ''}`}
                    onClick={() => setReviewRating(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <label className="block text-sm text-textMuted">Comentario</label>
              <textarea
                className="w-full bg-transparent border border-line px-3 py-2 min-h-[120px]"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Comparte tu experiencia con este producto..."
              />

              <label className="block text-sm text-textMuted">Fotos (máx. 3)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []).slice(0, 3);
                  try {
                    const photos = await Promise.all(files.map((file) => fileToDataUrl(file)));
                    setReviewPhotos(photos);
                  } catch {
                    toast.error('No se pudieron cargar las fotos');
                  }
                }}
              />

              {reviewPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {reviewPhotos.map((photo, index) => (
                    <div key={`${photo.slice(0, 20)}-${index}`} className="relative h-20 border border-line">
                      <Image src={photo} alt={`preview-${index + 1}`} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              ) : null}

              <button className="button-primary" onClick={submitReview} disabled={submittingReview}>
                {submittingReview ? 'Publicando...' : 'Publicar valoración'}
              </button>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
              {reviews.length === 0 ? (
                <p className="text-textMuted">Aún no hay reseñas. Sé el primero en opinar.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{review.authorName}</p>
                      <p className="text-xs text-textMuted">
                        {new Date(review.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <p className="text-sm text-primary mt-1">Puntuación: {review.rating}/5</p>
                    <p className="text-sm mt-2 text-textMuted">{review.comment}</p>
                    {review.photos?.length ? (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {review.photos.map((photo) => (
                          <div key={photo} className="relative h-20 border border-line">
                            <Image src={photo} alt="review-photo" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
