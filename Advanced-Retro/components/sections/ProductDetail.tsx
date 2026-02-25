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
import { isMysteryOrRouletteProduct } from '@/lib/productMarket';

type BundleOptionType =
  | 'cartucho'
  | 'caja'
  | 'manual'
  | 'insert'
  | 'protector_juego'
  | 'protector_caja'
  | 'protector';
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
  isVirtual?: boolean;
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

type MarketGuide = {
  available: boolean;
  provider: 'pricecharting';
  note?: string;
  query?: string;
  productId: string | null;
  productName: string | null;
  consoleName: string | null;
  releaseDate: string | null;
  loosePrice: number | null;
  cibPrice: number | null;
  newPrice: number | null;
  boxOnlyPrice: number | null;
  manualOnlyPrice: number | null;
  gradedPrice: number | null;
};

type EbayComparable = {
  itemId: string | null;
  title: string | null;
  itemWebUrl: string | null;
  imageUrl: string | null;
  condition: string | null;
  currency: string | null;
  price: number | null;
};

type EbayMarketGuide = {
  available: boolean;
  provider: 'ebay';
  note?: string;
  query?: string;
  marketplaceId: string;
  currency: string | null;
  sampleSize: number;
  totalResults: number;
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  comparables: EbayComparable[];
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
  protector_juego: 'Protector de juego',
  protector_caja: 'Protector de caja',
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

function getCollectionKey(product: any): string {
  const explicit = normalizeText(String(product?.collection_key || ''));
  if (explicit) return explicit;
  return cleanBaseTitle(String(product?.name || ''));
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
  const key = String(category || '').trim().toLowerCase();
  if (!key) return false;
  if (key.startsWith('juegos-')) return true;
  return key === 'consolas-retro';
}

function detectOptionType(product: any): BundleOptionType | null {
  const component = normalizeText(String(product?.component_type || ''));
  if (component === 'manual') return 'manual';
  if (component === 'insert') return 'insert';
  if (component === 'caja') return 'caja';
  if (component === 'protector juego' || component === 'protector_juego') return 'protector_juego';
  if (component === 'protector caja' || component === 'protector_caja') return 'protector_caja';

  const n = normalizeText(String(product?.name || ''));
  if (!n) return null;
  if (n.includes('manual')) return 'manual';
  if (n.includes('insert') || n.includes('inlay') || n.includes('interior')) return 'insert';
  if (n.includes('protector')) {
    if (n.includes('caja') || n.includes('box')) return 'protector_caja';
    if (n.includes('juego') || n.includes('cartucho') || n.includes('game')) return 'protector_juego';
    return 'protector';
  }
  const category = String(product?.category || '').trim().toLowerCase();
  if (n.includes('caja') || category.includes('cajas')) return 'caja';
  return null;
}

function detectEditionKind(product: any): EditionKind {
  const explicit = normalizeText(String(product?.edition || ''));
  if (explicit === 'original') return 'original';
  if (explicit === 'repro') return 'repro';

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
  const baseCollectionKey = getCollectionKey(baseProduct);
  const matchesByTypeEdition: Partial<
    Record<BundleOptionType, Partial<Record<EditionKind, { product: any; score: number }>>>
  > = {};

  for (const product of allProducts) {
    if (!product || String(product.id) === String(baseProduct.id)) continue;
    if (!Number.isFinite(Number(product.price))) continue;
    if (Number(product.stock || 0) <= 0) continue;

    const type = detectOptionType(product);
    if (!type) continue;

    const candidateTitle = cleanBaseTitle(String(product.name || ''));
    const candidateCollectionKey = getCollectionKey(product);
    const score =
      baseCollectionKey && candidateCollectionKey === baseCollectionKey
        ? 1
        : scoreByTokens(baseTitle, candidateTitle);
    if (score < 0.45) continue;

    const edition = detectEditionKind(product);
    const byEdition = matchesByTypeEdition[type] || {};
    const current = byEdition[edition];
    if (!current || score > current.score) {
      byEdition[edition] = { product, score };
      matchesByTypeEdition[type] = byEdition;
    }
  }

  const requiredTypes: BundleOptionType[] = [
    'caja',
    'manual',
    'insert',
    'protector_juego',
    'protector_caja',
  ];

  const extras: BundleOption[] = [];
  for (const type of requiredTypes) {
    const byEdition = matchesByTypeEdition[type] || {};
    const variants = EDITION_ORDER.map((edition) => byEdition[edition]).filter(
      (item): item is { product: any; score: number } => Boolean(item)
    );

    if (variants.length === 0) {
      extras.push({
        id: `virtual-${base.id}-${type}`,
        name: `${BUNDLE_TYPE_LABEL[type]} (no disponible)`,
        price: 0,
        image: PLACEHOLDER,
        images: [PLACEHOLDER],
        stock: 0,
        type,
        defaultSelected: false,
        isVirtual: true,
      });
      continue;
    }

    for (const found of variants) {
      const edition = detectEditionKind(found.product);
      const editionLabel = EDITION_LABEL[edition];
      extras.push({
        id: String(found.product.id),
        name: `${String(found.product.name || BUNDLE_TYPE_LABEL[type])} · ${editionLabel}`,
        price: Number(found.product.price || 0),
        image: getProductImageUrl(found.product),
        images: getProductImageUrls(found.product),
        stock: Number(found.product.stock || 0),
        type,
        defaultSelected: false,
      });
    }
  }

  return [base, ...extras];
}

function buildEditionOptions(baseProduct: any, allProducts: any[]): EditionOption[] {
  const byEdition = new Map<EditionKind, EditionOption>();
  const baseEdition = detectEditionKind(baseProduct);
  const baseCategory = normalizeText(String(baseProduct?.category || ''));
  const baseTitle = cleanBaseTitle(String(baseProduct?.name || ''));
  const baseCollectionKey = getCollectionKey(baseProduct);

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
    const candidateCollectionKey = getCollectionKey(product);
    const score =
      baseCollectionKey && candidateCollectionKey === baseCollectionKey
        ? 1
        : scoreByTokens(baseTitle, candidateTitle);
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

function buildGalleryImages(product: any): string[] {
  const main = uniqueStrings(getProductImageUrls(product));
  return main.length > 0 ? main.slice(0, 16) : [PLACEHOLDER];
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

export default function ProductDetail({
  productId,
  prefillComplete = false,
}: {
  productId: string;
  prefillComplete?: boolean;
}) {
  const [product, setProduct] = useState<any | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const [bundleOptions, setBundleOptions] = useState<BundleOption[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<Record<string, boolean>>({});
  const [editionOptions, setEditionOptions] = useState<EditionOption[]>([]);
  const [showCompleteGameOptions, setShowCompleteGameOptions] = useState(false);

  const [visitorId, setVisitorId] = useState('');
  const [socialSummary, setSocialSummary] = useState<ProductSocialSummary>(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState<ProductSocialReview[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [requiresPurchaseForReview, setRequiresPurchaseForReview] = useState(true);

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [priceSource, setPriceSource] = useState<'orders' | 'current' | 'none'>('none');
  const [marketGuide, setMarketGuide] = useState<MarketGuide | null>(null);
  const [marketGuideEbay, setMarketGuideEbay] = useState<EbayMarketGuide | null>(null);
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

      let candidates: any[] | null = null;
      const modernQuery = await supabaseClient
        .from('products')
        .select('id,name,price,image,images,stock,category,description,component_type,edition,collection_key')
        .order('created_at', { ascending: false })
        .limit(1200);

      if (!modernQuery.error && Array.isArray(modernQuery.data)) {
        candidates = modernQuery.data;
      } else {
        const legacyQuery = await supabaseClient
          .from('products')
          .select('id,name,price,image,images,stock,category,description')
          .order('created_at', { ascending: false })
          .limit(1200);
        candidates = Array.isArray(legacyQuery.data) ? legacyQuery.data : null;
      }

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

    if (prefillComplete) {
      const byType = new Map<BundleOptionType, BundleOption[]>();
      for (const option of bundleOptions) {
        const list = byType.get(option.type) || [];
        list.push(option);
        byType.set(option.type, list);
      }

      for (const [type, options] of byType.entries()) {
        const selectable = options.filter((option) => option.stock > 0 && !option.isVirtual);
        if (selectable.length === 0) continue;

        const preferred = selectable[0];
        for (const option of options) {
          initialSelection[option.id] = String(option.id) === String(preferred.id);
        }

        if (type === 'cartucho') {
          initialSelection[preferred.id] = true;
        }
      }
    }

    setSelectedBundleIds(initialSelection);
    setShowCompleteGameOptions(prefillComplete);
  }, [bundleOptions, prefillComplete]);

  useEffect(() => {
    if (showCompleteGameOptions) return;

    const hasAnyManual = bundleOptions.some(
      (option) => option.type === 'manual' && Boolean(selectedBundleIds[option.id])
    );
    if (!hasAnyManual) return;

    setSelectedBundleIds((prev) => {
      const next = { ...prev };
      for (const option of bundleOptions) {
        if (option.type === 'manual') {
          next[option.id] = false;
        }
      }
      return next;
    });
  }, [bundleOptions, selectedBundleIds, showCompleteGameOptions]);

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
      setCanReview(Boolean(data?.canReview));
      setRequiresPurchaseForReview(Boolean(data?.requiresPurchaseForReview ?? true));
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
    if (!product) return;
    if (isMysteryOrRouletteProduct(product as any)) {
      setPriceHistory([]);
      setMarketGuide(null);
      setMarketGuideEbay(null);
      setPriceSource('none');
      setPriceHistoryError('');
      return;
    }
    setLoadingPriceHistory(true);
    setPriceHistoryError('');

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/price-history`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el historico de precios');

      if (data?.marketGuide && typeof data.marketGuide === 'object') {
        setMarketGuide(data.marketGuide as MarketGuide);
      } else {
        setMarketGuide(null);
      }

      if (data?.marketGuideEbay && typeof data.marketGuideEbay === 'object') {
        setMarketGuideEbay(data.marketGuideEbay as EbayMarketGuide);
      } else {
        setMarketGuideEbay(null);
      }

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
      setMarketGuideEbay(null);
    } finally {
      setLoadingPriceHistory(false);
    }
  }, [productId, product]);

  useEffect(() => {
    refreshPriceHistory();
  }, [refreshPriceHistory]);

  const images = useMemo(() => (product ? buildGalleryImages(product) : [PLACEHOLDER]), [product]);

  useEffect(() => {
    if (selectedImage > images.length - 1) {
      setSelectedImage(0);
    }
  }, [images, selectedImage]);

  const selectedBundleOptions = useMemo(
    () => bundleOptions.filter((option) => selectedBundleIds[option.id]),
    [bundleOptions, selectedBundleIds]
  );

  const displayedBundleOptions = useMemo(
    () =>
      bundleOptions.filter((option) => {
        if (option.type !== 'manual') return true;
        return showCompleteGameOptions;
      }),
    [bundleOptions, showCompleteGameOptions]
  );

  const selectedUnitPrice = useMemo(
    () => selectedBundleOptions.reduce((sum, option) => sum + option.price, 0),
    [selectedBundleOptions]
  );

  const buildProductHref = (id: string | number): string =>
    prefillComplete ? `/producto/${id}?complete=1` : `/producto/${id}`;

  const selectedTotalPrice = selectedUnitPrice * Math.max(1, qty);
  const hideMarketPricing = isMysteryOrRouletteProduct(product as any);
  const ebayDiagnosticHref = `/api/market/ebay-diagnostic?q=${encodeURIComponent(String(product?.name || ''))}`;

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
    if (requiresPurchaseForReview && !canReview) {
      toast.error('Solo pueden valorar usuarios que hayan comprado este producto');
      return;
    }
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

  const applyCompletePack = () => {
    setShowCompleteGameOptions(true);
    setSelectedBundleIds(() => {
      const next: Record<string, boolean> = {};
      const byType = new Map<BundleOptionType, BundleOption[]>();

      for (const option of bundleOptions) {
        const list = byType.get(option.type) || [];
        list.push(option);
        byType.set(option.type, list);
        next[option.id] = false;
      }

      for (const options of byType.values()) {
        const selectable = options.filter((option) => option.stock > 0 && !option.isVirtual);
        if (selectable.length === 0) continue;
        next[selectable[0].id] = true;
      }

      return next;
    });
    toast.success('Pack completo seleccionado');
  };

  const addSelectedToCart = () => {
    const safeQty = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;
    const picked = selectedBundleOptions.filter((option) => option.stock > 0 && !option.isVirtual);

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
      <div className="container grid gap-8 lg:grid-cols-2">
        <div className="glass p-5 sm:p-6">
          <div className="relative w-full h-[420px] sm:h-[500px] bg-surface border border-line rounded-2xl flex items-center justify-center overflow-hidden">
            <Image
              src={images[selectedImage] || images[0] || PLACEHOLDER}
              alt={product.name}
              fill
              className="object-contain p-4"
            />
            {product.status ? <span className="absolute top-4 left-4 chip text-xs">{product.status}</span> : null}
            <span className="absolute bottom-4 right-4 chip text-xs">Foto {selectedImage + 1} / {images.length}</span>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4">
            {images.slice(0, 12).map((img: string, index: number) => (
              <button
                type="button"
                key={`${img}-${index}`}
                className={`relative h-20 w-20 shrink-0 sm:w-auto rounded-xl border bg-surface overflow-hidden transition-colors ${
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

        <div className="glass p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-textMuted font-mono">Stock: {product.stock}</p>
            <div className="flex items-center gap-2 text-xs text-textMuted">
              <span className="chip">Visitas: {socialSummary.visits}</span>
              <span className="chip">Me gusta: {socialSummary.likes}</span>
              <span className="chip">Valoraciones: {socialSummary.reviewsCount}</span>
            </div>
          </div>

          <h1 className="title-display text-3xl sm:text-4xl mt-3">{product.name}</h1>
          <p className="text-primary text-3xl mt-4 font-semibold">{(Number(product.price || 0) / 100).toFixed(2)} €</p>
          <p className="text-textMuted mt-4 leading-relaxed">{product.long_description || product.description}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Compra segura</p>
              <p className="text-sm mt-1">Soporte por ticket y seguimiento del pedido</p>
            </div>
            <div className="rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Opciones de compra</p>
              <p className="text-sm mt-1">Cartucho, caja, manual, insert y protectores</p>
            </div>
            <div className="rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Ayuda personalizada</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Link href="/perfil?tab=tickets" className="chip border-primary text-primary">
                  Abrir ticket
                </Link>
                <Link href="/servicio-compra" className="chip">
                  Encargo
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className={`chip ${socialSummary.likedByCurrentVisitor ? 'text-text border-primary bg-[rgba(75,228,214,0.14)]' : ''}`}
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
              <p className="font-semibold text-lg">Elige versión del producto</p>
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
                      href={buildProductHref(edition.id)}
                      className={`chip ${isCurrent ? 'text-text border-primary bg-[rgba(75,228,214,0.14)]' : ''}`}
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
              <p className="font-semibold text-lg">Detalles del producto</p>
              <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
                {(product.curiosities || []).map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-lg">Tips de coleccionista</p>
              <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
                {(product.tips || []).map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <p className="font-semibold mb-2">Opciones adicionales al comprar (caja, manual, insert, protector)</p>
            <p className="text-sm text-textMuted mb-3">
              La caja puede ser original o repro según el producto enlazado. Marca solo lo que quieras añadir.
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="chip"
                onClick={applyCompletePack}
              >
                Seleccionar pack completo
              </button>
              <button
                type="button"
                className={`chip ${showCompleteGameOptions ? 'text-primary border-primary' : ''}`}
                onClick={() => setShowCompleteGameOptions((value) => !value)}
              >
                {showCompleteGameOptions ? 'Ocultar manuales' : 'Juego completo: mostrar manuales'}
              </button>
            </div>
            {prefillComplete ? (
              <p className="text-xs text-primary mb-3">Modo juego completo activado: opciones preseleccionadas.</p>
            ) : null}
            <div className="space-y-2">
              {displayedBundleOptions.map((option) => {
                const isCurrentProduct = String(option.id) === String(product.id);
                const canOpenProduct = !option.isVirtual && !isCurrentProduct;

                return (
                  <div
                    key={option.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 bg-[rgba(12,22,36,0.64)]"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedBundleIds[option.id])}
                        onChange={(e) =>
                          setSelectedBundleIds((prev) => {
                            const next = { ...prev, [option.id]: e.target.checked };
                            if (e.target.checked) {
                              for (const candidate of displayedBundleOptions) {
                                if (candidate.type !== option.type) continue;
                                if (candidate.id === option.id) continue;
                                next[candidate.id] = false;
                              }
                            }
                            return next;
                          })
                        }
                        disabled={option.stock <= 0}
                      />
                      <div>
                        <p className="text-sm">
                          <span className="text-textMuted">{BUNDLE_TYPE_LABEL[option.type]}:</span>{' '}
                          {isCurrentProduct ? (
                            <span className="font-semibold">{option.name}</span>
                          ) : canOpenProduct ? (
                            <Link href={buildProductHref(option.id)} className="text-primary hover:underline">
                              {option.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-textMuted">{option.name}</span>
                          )}
                        </p>
                        {canOpenProduct ? (
                          <Link href={buildProductHref(option.id)} className="text-xs text-textMuted hover:text-primary">
                            Abrir producto
                          </Link>
                        ) : null}
                        {option.isVirtual ? (
                          <p className="text-xs text-textMuted mt-1">No disponible todavía para este juego.</p>
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
                {prefillComplete ? 'Añadir pack completo al carrito' : 'Añadir seleccion al carrito'}
              </button>
            </div>

            <p className="mt-3 text-sm text-textMuted">
              Total seleccion ({Math.max(1, qty)} ud):{' '}
              <span className="text-primary">{(selectedTotalPrice / 100).toFixed(2)} €</span>
            </p>
          </div>

          {hideMarketPricing ? null : (
            <>
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

              <div className="mt-6 border-t border-line pt-6">
                <p className="font-semibold mb-2">Comparativa de mercado (PriceCharting)</p>
                {!marketGuide ? (
                  <p className="text-sm text-textMuted">Sin datos de mercado por ahora.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {marketGuide.available ? (
                      <>
                        <p className="text-textMuted">
                          {marketGuide.productName || product.name}
                          {marketGuide.consoleName ? ` · ${marketGuide.consoleName}` : ''}
                        </p>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          <p className="chip">Loose: {marketGuide.loosePrice ? `${(marketGuide.loosePrice / 100).toFixed(2)} €` : '—'}</p>
                          <p className="chip">CIB: {marketGuide.cibPrice ? `${(marketGuide.cibPrice / 100).toFixed(2)} €` : '—'}</p>
                          <p className="chip">Nuevo: {marketGuide.newPrice ? `${(marketGuide.newPrice / 100).toFixed(2)} €` : '—'}</p>
                          <p className="chip">Solo caja: {marketGuide.boxOnlyPrice ? `${(marketGuide.boxOnlyPrice / 100).toFixed(2)} €` : '—'}</p>
                          <p className="chip">Solo manual: {marketGuide.manualOnlyPrice ? `${(marketGuide.manualOnlyPrice / 100).toFixed(2)} €` : '—'}</p>
                          <p className="chip">Graded: {marketGuide.gradedPrice ? `${(marketGuide.gradedPrice / 100).toFixed(2)} €` : '—'}</p>
                        </div>
                        <p className="text-xs text-textMuted">
                          PriceCharting no ofrece histórico de ventas por API; esta sección muestra valores actuales de mercado.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-textMuted">
                        No se pudo consultar PriceCharting{marketGuide.note ? `: ${marketGuide.note}` : '.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-6">
                <p className="font-semibold mb-2">Comparativa de mercado (eBay)</p>
                {!marketGuideEbay ? (
                  <p className="text-sm text-textMuted">Sin datos de eBay por ahora.</p>
                ) : marketGuideEbay.available ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-textMuted">
                      Marketplace: {marketGuideEbay.marketplaceId} · Muestras: {marketGuideEbay.sampleSize}
                      {marketGuideEbay.totalResults ? ` · Resultados: ${marketGuideEbay.totalResults}` : ''}
                    </p>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <p className="chip">
                        Mínimo:{' '}
                        {marketGuideEbay.minPrice ? `${(marketGuideEbay.minPrice / 100).toFixed(2)} €` : '—'}
                      </p>
                      <p className="chip">
                        Mediana:{' '}
                        {marketGuideEbay.medianPrice ? `${(marketGuideEbay.medianPrice / 100).toFixed(2)} €` : '—'}
                      </p>
                      <p className="chip">
                        Media:{' '}
                        {marketGuideEbay.averagePrice ? `${(marketGuideEbay.averagePrice / 100).toFixed(2)} €` : '—'}
                      </p>
                      <p className="chip">
                        Máximo:{' '}
                        {marketGuideEbay.maxPrice ? `${(marketGuideEbay.maxPrice / 100).toFixed(2)} €` : '—'}
                      </p>
                    </div>

                    {Array.isArray(marketGuideEbay.comparables) && marketGuideEbay.comparables.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {marketGuideEbay.comparables.slice(0, 4).map((item, index) => (
                          <a
                            key={`${item.itemId || item.itemWebUrl || 'ebay'}-${index}`}
                            href={item.itemWebUrl || '#'}
                            target={item.itemWebUrl ? '_blank' : undefined}
                            rel={item.itemWebUrl ? 'noreferrer noopener' : undefined}
                            className={`flex items-center justify-between gap-2 border border-line p-2 ${
                              item.itemWebUrl ? 'hover:border-primary' : ''
                            }`}
                          >
                            <span className="text-xs text-textMuted line-clamp-1">
                              {item.title || 'Producto eBay'}
                            </span>
                            <span className="text-xs text-primary">
                              {item.price ? `${(item.price / 100).toFixed(2)} €` : '—'}
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-xs text-textMuted">
                      eBay refleja listados activos del mercado, no ventas cerradas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-textMuted">
                      No se pudo consultar eBay{marketGuideEbay.note ? `: ${marketGuideEbay.note}` : '.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a href={ebayDiagnosticHref} target="_blank" rel="noreferrer" className="chip text-xs">
                        Abrir diagnóstico eBay
                      </a>
                      <button type="button" className="chip text-xs" onClick={refreshPriceHistory}>
                        Reintentar comparativa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="container lg:hidden mt-4">
        <div className="glass p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-textMuted">Selección actual</p>
            <p className="text-primary font-semibold">{(selectedTotalPrice / 100).toFixed(2)} €</p>
            <p className="text-xs text-textMuted">{Math.max(1, qty)} ud · {selectedBundleOptions.filter((o) => o.stock > 0 && !o.isVirtual).length} items</p>
          </div>
          <button className="button-primary" onClick={addSelectedToCart}>
            Añadir al carrito
          </button>
        </div>
      </div>

      <div className="container mt-10">
        <div className="glass p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="title-display text-2xl">Valoraciones</h2>
            <p className="text-textMuted text-sm">
              Nota media: {socialSummary.ratingAverage.toFixed(2)} / 5 ({socialSummary.reviewsCount} reseñas)
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-line p-4 bg-[rgba(12,22,36,0.62)]">
              {requiresPurchaseForReview && !canReview ? (
                <div className="border border-line rounded-lg p-3 text-sm text-textMuted">
                  Para publicar valoración debes haber comprado este producto con tu cuenta.
                </div>
              ) : null}
              <label className="block text-sm text-textMuted">Tu nombre (opcional)</label>
              <input
                className="w-full bg-transparent border border-line px-3 py-2"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="Coleccionista"
                disabled={requiresPurchaseForReview && !canReview}
              />

              <label className="block text-sm text-textMuted">Tu valoracion</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`chip ${reviewRating >= value ? 'text-primary border-primary' : ''}`}
                    onClick={() => setReviewRating(value)}
                    disabled={requiresPurchaseForReview && !canReview}
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
                disabled={requiresPurchaseForReview && !canReview}
              />

              <label className="block text-sm text-textMuted">Fotos (max. 3)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={requiresPurchaseForReview && !canReview}
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

              <button
                className="button-primary"
                onClick={submitReview}
                disabled={submittingReview || (requiresPurchaseForReview && !canReview)}
              >
                {submittingReview ? 'Publicando...' : 'Publicar valoracion'}
              </button>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
              {reviews.length === 0 ? (
                <p className="text-textMuted">Aun no hay reseñas. Se el primero en opinar.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="border border-line rounded-xl p-4 bg-[rgba(12,22,36,0.58)]">
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
