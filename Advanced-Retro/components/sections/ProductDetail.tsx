'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { sampleProducts } from '@/lib/sampleData';
import { useCartStore } from '@/store/cartStore';
import { getProductImageUrl, getProductImageUrls } from '@/lib/imageUrl';
import PriceHistoryChart, { type PriceHistoryPoint } from '@/components/ui/PriceHistoryChart';

type BundleOptionType = 'cartucho' | 'caja' | 'manual' | 'insert' | 'protector';
type EditionKind = 'original' | 'repro' | 'sin-especificar';

type BundleOption = {
  id: string;
  name: string;
  price: number;
  image?: string;
  images: string[];
  stock: number;
  type: BundleOptionType;
  defaultSelected: boolean;
};

type EditionOption = {
  id: string;
  name: string;
  edition: EditionKind;
  price: number;
  stock: number;
  image?: string;
  score: number;
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

const EDITION_LABEL: Record<EditionKind, string> = {
  original: 'Original',
  repro: 'Repro 1:1',
  'sin-especificar': 'Sin etiqueta',
};

const EDITION_ORDER: EditionKind[] = ['original', 'repro', 'sin-especificar'];
const PLACEHOLDER = '/placeholder.svg';

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
    .replace(
      /\b(caja|repro|replica|reproduccion|manual|insert|interior|protector|cartucho|pegatina|funda|game boy|color|advance|original|oficial|autentico|authentic|oem|version|edicion|completo|solo)\b/g,
      ' '
    )
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

function isGameCategory(category: unknown): boolean {
  return String(category || '').trim() === 'juegos-gameboy';
}

function detectOptionType(product: any): BundleOptionType | null {
  const n = normalizeText(String(product?.name || ''));
  if (!n) return null;
  if (n.includes('manual')) return 'manual';
  if (n.includes('insert') || n.includes('inlay') || n.includes('interior')) return 'insert';
  if (n.includes('protector')) return 'protector';
  if (n.includes('caja') || String(product?.category || '').trim() === 'cajas-gameboy') return 'caja';
  return null;
}

function detectEditionKind(product: any): EditionKind {
  const source = normalizeText(`${String(product?.name || '')} ${String(product?.description || '')}`);
  if (
    /\b(repro|replica|reproduccion|1 1|1x1|copy|copia|fanmade|replacement)\b/.test(source)
  ) {
    return 'repro';
  }
  if (/\b(original|oficial|autentico|authentic|oem|genuine)\b/.test(source)) {
    return 'original';
  }
  return 'sin-especificar';
}

function uniqueStrings(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function buildBundleOptions(baseProduct: any, allProducts: any[]): BundleOption[] {
  const base: BundleOption = {
    id: String(baseProduct.id),
    name: String(baseProduct.name || 'Cartucho'),
    price: Number(baseProduct.price || 0),
    image: getProductImageUrl(baseProduct),
    images: getProductImageUrls(baseProduct),
    stock: Number(baseProduct.stock || 0),
    type: 'cartucho',
    defaultSelected: true,
  };

  if (!isGameCategory(baseProduct?.category)) {
    return [base];
  }

  const baseTitle = cleanBaseTitle(String(baseProduct.name || ''));
  const matchesByType: Partial<Record<BundleOptionType, { product: any; score: number }>> = {};

  for (const product of allProducts) {
    if (!product || String(product.id) === String(baseProduct.id)) continue;
    if (!Number.isFinite(Number(product.price))) continue;
    if (Number(product.stock || 0) <= 0) continue;

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
        images: getProductImageUrls(found.product),
        stock: Number(found.product.stock || 0),
        type,
        defaultSelected: false,
      } as BundleOption;
    })
    .filter((item): item is BundleOption => Boolean(item));

  return [base, ...extras];
}

function buildEditionOptions(baseProduct: any, allProducts: any[]): EditionOption[] {
  const byEdition = new Map<EditionKind, EditionOption>();
  const baseEdition = detectEditionKind(baseProduct);
  const baseCategory = normalizeText(String(baseProduct?.category || ''));
  const baseTitle = cleanBaseTitle(String(baseProduct?.name || ''));

  byEdition.set(baseEdition, {
    id: String(baseProduct.id),
    name: String(baseProduct.name || 'Producto'),
    edition: baseEdition,
    price: Number(baseProduct.price || 0),
    stock: Number(baseProduct.stock || 0),
    image: getProductImageUrl(baseProduct),
    score: 1,
  });

  for (const product of allProducts) {
    if (!product || String(product.id) === String(baseProduct.id)) continue;

    const productCategory = normalizeText(String(product?.category || ''));
    if (baseCategory && productCategory !== baseCategory) continue;

    const candidateTitle = cleanBaseTitle(String(product.name || ''));
    const score = scoreByTokens(baseTitle, candidateTitle);
    if (score < 0.5) continue;

    const edition = detectEditionKind(product);
    const current = byEdition.get(edition);
    if (!current || score > current.score) {
      byEdition.set(edition, {
        id: String(product.id),
        name: String(product.name || 'Producto'),
        edition,
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        image: getProductImageUrl(product),
        score,
      });
    }
  }

  const list = EDITION_ORDER.map((edition) => byEdition.get(edition)).filter(
    (item): item is EditionOption => Boolean(item)
  );

  if (!list.find((item) => item.id === String(baseProduct.id))) {
    list.unshift({
      id: String(baseProduct.id),
      name: String(baseProduct.name || 'Producto'),
      edition: baseEdition,
      price: Number(baseProduct.price || 0),
      stock: Number(baseProduct.stock || 0),
      image: getProductImageUrl(baseProduct),
      score: 1,
    });
  }

  return list;
}

function buildGalleryImages(product: any, bundleOptions: BundleOption[]): string[] {
  const main = getProductImageUrls(product);
  const extras = bundleOptions.flatMap((option) => option.images || []);
  const merged = uniqueStrings([...main, ...extras]);
  return merged.length > 0 ? merged.slice(0, 16) : [PLACEHOLDER];
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
  const [editionOptions, setEditionOptions] = useState<EditionOption[]>([]);

  const [visitorId, setVisitorId] = useState('');
  const [socialSummary, setSocialSummary] = useState<ProductSocialSummary>(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState<ProductSocialReview[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [priceSource, setPriceSource] = useState<'orders' | 'current' | 'none'>('none');
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState('');

  const add = useCartStore((s) => s.add);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!supabaseClient) {
        const fallback = sampleProducts.find((p) => String(p.id) === String(productId)) || null;
        setProduct(fallback);

        if (fallback) {
          const options = buildBundleOptions(fallback, sampleProducts);
          setBundleOptions(options);
          setEditionOptions(buildEditionOptions(fallback, sampleProducts));
        }
        return;
      }

      const { data } = await supabaseClient.from('products').select('*').eq('id', productId).single();
      setProduct(data || null);

      if (!data) return;

      const { data: candidates } = await supabaseClient
        .from('products')
        .select('id,name,price,image,images,stock,category,description')
        .order('created_at', { ascending: false })
        .limit(1200);

      const pool = candidates && candidates.length > 0 ? candidates : [data];
      setBundleOptions(buildBundleOptions(data, pool));
      setEditionOptions(buildEditionOptions(data, pool));
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

  const refreshPriceHistory = useCallback(async () => {
    if (!productId) return;
    setLoadingPriceHistory(true);
    setPriceHistoryError('');

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/price-history`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el historico de precios');

      const nextPoints = Array.isArray(data?.points)
        ? data.points
            .map((point: any) => ({
              date: String(point?.date || ''),
              price: Number(point?.price || 0),
            }))
            .filter((point: PriceHistoryPoint) => point.date && Number.isFinite(point.price) && point.price > 0)
        : [];

      if (nextPoints.length > 0) {
        setPriceHistory(nextPoints);
        setPriceSource(data?.source === 'orders' ? 'orders' : 'current');
      } else if (Number.isFinite(Number(product?.price)) && Number(product.price) > 0) {
        setPriceHistory([{ date: new Date().toISOString(), price: Number(product.price) }]);
        setPriceSource('current');
      } else {
        setPriceHistory([]);
        setPriceSource('none');
      }
    } catch (error: any) {
      setPriceHistoryError(error?.message || 'No se pudo cargar la grafica de precios');
      if (Number.isFinite(Number(product?.price)) && Number(product.price) > 0) {
        setPriceHistory([{ date: new Date().toISOString(), price: Number(product.price) }]);
        setPriceSource('current');
      }
    } finally {
      setLoadingPriceHistory(false);
    }
  }, [productId, product?.price]);

  useEffect(() => {
    refreshPriceHistory();
  }, [refreshPriceHistory]);

  const images = useMemo(
    () => (product ? buildGalleryImages(product, bundleOptions) : [PLACEHOLDER]),
    [product, bundleOptions]
  );

  useEffect(() => {
    if (selectedImage > images.length - 1) {
      setSelectedImage(0);
    }
  }, [images, selectedImage]);

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
      toast.error('La valoracion debe ser entre 1 y 5');
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
      toast.error('Selecciona al menos una opcion');
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

    toast.success(`Añadidos ${picked.length} articulo(s) al carrito`);
  };

  return (
    <section className="section">
      <div className="container grid gap-10 lg:grid-cols-2">
        <div className="glass p-6">
          <div className="relative w-full h-[500px] bg-surface border border-line flex items-center justify-center overflow-hidden">
            <Image
              src={images[selectedImage] || images[0] || PLACEHOLDER}
              alt={product.name}
              fill
              className="object-contain p-4"
            />
            {product.status ? <span className="absolute top-4 left-4 chip text-xs">{product.status}</span> : null}
            <span className="absolute bottom-4 right-4 chip text-xs">Foto {selectedImage + 1} / {images.length}</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {images.slice(0, 12).map((img: string, index: number) => (
              <button
                type="button"
                key={`${img}-${index}`}
                className={`relative h-20 border bg-surface overflow-hidden ${
                  selectedImage === index ? 'border-primary' : 'border-line'
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <Image src={img} alt={`${product.name} miniatura ${index + 1}`} fill className="object-contain p-1" />
              </button>
            ))}
          </div>
          <p className="text-xs text-textMuted mt-2">Sin recortes: la imagen se muestra completa.</p>
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
          <p className="text-primary text-2xl mt-4">{(Number(product.price || 0) / 100).toFixed(2)} €</p>
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

          {editionOptions.length > 1 ? (
            <div className="mt-6 border-t border-line pt-6">
              <p className="font-semibold">Elige version del producto</p>
              <p className="text-sm text-textMuted mt-1">
                Puedes cambiar rapido entre original y repro 1:1 cuando existan variantes.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {editionOptions.map((edition) => {
                  const isCurrent = String(edition.id) === String(product.id);
                  const label = EDITION_LABEL[edition.edition];
                  const labelPrice = `${(edition.price / 100).toFixed(2)} €`;

                  return (
                    <Link
                      key={`${edition.id}-${edition.edition}`}
                      href={`/producto/${edition.id}`}
                      className={`chip ${isCurrent ? 'text-primary border-primary' : ''}`}
                    >
                      {label} · {labelPrice}
                      {edition.stock <= 0 ? ' · sin stock' : ''}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

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
            <p className="font-semibold mb-2">Completa tu juego (caja, manual, insert, protector)</p>
            <p className="text-sm text-textMuted mb-3">
              Marca lo que quieres comprar y, si quieres, abre cada ficha para ver mas fotos y detalles.
            </p>
            <div className="space-y-2">
              {bundleOptions.map((option) => {
                const isCurrentProduct = String(option.id) === String(product.id);

                return (
                  <div key={option.id} className="flex items-center justify-between gap-3 border border-line px-3 py-2">
                    <div className="flex items-start gap-3">
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
                      <div>
                        <p className="text-sm">
                          <span className="text-textMuted">{BUNDLE_TYPE_LABEL[option.type]}:</span>{' '}
                          {isCurrentProduct ? (
                            <span className="font-semibold">{option.name}</span>
                          ) : (
                            <Link href={`/producto/${option.id}`} className="text-primary hover:underline">
                              {option.name}
                            </Link>
                          )}
                        </p>
                        {!isCurrentProduct ? (
                          <Link href={`/producto/${option.id}`} className="text-xs text-textMuted hover:text-primary">
                            Abrir producto
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-primary">{(option.price / 100).toFixed(2)} €</p>
                      <p className="text-xs text-textMuted">Stock {option.stock}</p>
                    </div>
                  </div>
                );
              })}
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
                Añadir seleccion al carrito
              </button>
            </div>

            <p className="mt-3 text-sm text-textMuted">
              Total seleccion ({Math.max(1, qty)} ud):{' '}
              <span className="text-primary">{(selectedTotalPrice / 100).toFixed(2)} €</span>
            </p>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="font-semibold">Historico de precio del producto</p>
              <button type="button" className="chip" onClick={refreshPriceHistory} disabled={loadingPriceHistory}>
                {loadingPriceHistory ? 'Cargando...' : 'Actualizar grafica'}
              </button>
            </div>

            {priceHistory.length > 0 ? (
              <PriceHistoryChart points={priceHistory} />
            ) : (
              <p className="text-sm text-textMuted">Aun no hay datos suficientes para mostrar tendencia.</p>
            )}

            <p className="text-xs text-textMuted mt-2">
              Fuente:{' '}
              {priceSource === 'orders'
                ? 'ventas reales de la tienda'
                : priceSource === 'current'
                  ? 'precio actual del catalogo'
                  : 'sin datos'}
            </p>
            {priceHistoryError ? <p className="text-xs text-red-400 mt-1">{priceHistoryError}</p> : null}
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

              <label className="block text-sm text-textMuted">Tu valoracion</label>
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

              <label className="block text-sm text-textMuted">Fotos (max. 3)</label>
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
                    <div key={`${photo.slice(0, 20)}-${index}`} className="relative h-20 border border-line bg-surface">
                      <Image src={photo} alt={`preview-${index + 1}`} fill className="object-contain" unoptimized />
                    </div>
                  ))}
                </div>
              ) : null}

              <button className="button-primary" onClick={submitReview} disabled={submittingReview}>
                {submittingReview ? 'Publicando...' : 'Publicar valoracion'}
              </button>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
              {reviews.length === 0 ? (
                <p className="text-textMuted">Aun no hay reseñas. Se el primero en opinar.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{review.authorName}</p>
                      <p className="text-xs text-textMuted">{new Date(review.createdAt).toLocaleDateString('es-ES')}</p>
                    </div>
                    <p className="text-sm text-primary mt-1">Puntuacion: {review.rating}/5</p>
                    <p className="text-sm mt-2 text-textMuted">{review.comment}</p>
                    {review.photos?.length ? (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {review.photos.map((photo) => (
                          <div key={photo} className="relative h-20 border border-line bg-surface">
                            <Image src={photo} alt="review-photo" fill className="object-contain" />
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
