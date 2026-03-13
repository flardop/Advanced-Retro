'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { sampleProducts } from '@/lib/sampleData';
import { useCartStore } from '@/store/cartStore';
import { getProductImageUrl, getProductImageUrls } from '@/lib/imageUrl';
import { getProductHref, parseProductRouteParam } from '@/lib/productUrl';
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
type PlatformKey = 'gameboy' | 'gbc' | 'gba' | 'snes' | 'gamecube' | 'retro';

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

type EbayComparable = {
  itemId: string | null;
  title: string | null;
  itemWebUrl: string | null;
  imageUrl: string | null;
  condition: string | null;
  currency: string | null;
  price: number | null;
  listingDate?: string | null;
  endDate?: string | null;
};

type EbayMarketGuide = {
  available: boolean;
  provider: 'ebay';
  note?: string;
  query?: string;
  marketplaceId: string;
  attemptedMarketplaces?: string[];
  currency: string | null;
  sampleSize: number;
  totalResults: number;
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  comparables: EbayComparable[];
};

function toValidCents(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

function buildEbayFallbackPoints(market: EbayMarketGuide | null): PriceHistoryPoint[] {
  if (!market?.available) return [];

  const comparableRows = Array.isArray(market.comparables)
    ? market.comparables
        .map((item) => ({
          price: toValidCents(item?.price),
          listingDate: typeof item?.listingDate === 'string' ? String(item.listingDate) : null,
        }))
        .filter((item): item is { price: number; listingDate: string | null } => typeof item.price === 'number' && item.price > 0)
        .slice(0, 40)
    : [];

  const datedRows = comparableRows
    .filter((item) => Boolean(item.listingDate) && Number.isFinite(new Date(String(item.listingDate)).getTime()))
    .sort((a, b) => new Date(String(a.listingDate)).getTime() - new Date(String(b.listingDate)).getTime());

  if (datedRows.length >= 2) {
    return datedRows.map((item) => ({
      date: new Date(String(item.listingDate)).toISOString(),
      price: item.price,
    }));
  }

  if (comparableRows.length >= 2) {
    const now = Date.now();
    const start = now - (comparableRows.length - 1) * 24 * 60 * 60 * 1000;
    return comparableRows.map((item, index) => ({
      date: new Date(start + index * 24 * 60 * 60 * 1000).toISOString(),
      price: item.price,
    }));
  }

  const statPrices = [
    toValidCents(market.minPrice),
    toValidCents(market.medianPrice),
    toValidCents(market.averagePrice),
    toValidCents(market.maxPrice),
  ].filter((value): value is number => typeof value === 'number' && value > 0);

  const uniqueStats = [...new Set(statPrices)].sort((a, b) => a - b);
  if (uniqueStats.length < 2) return [];

  const now = Date.now();
  const start = now - (uniqueStats.length - 1) * 24 * 60 * 60 * 1000;
  return uniqueStats.map((price, index) => ({
    date: new Date(start + index * 24 * 60 * 60 * 1000).toISOString(),
    price,
  }));
}

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
const PLATFORM_LABEL: Record<PlatformKey, string> = {
  gameboy: 'Game Boy',
  gbc: 'Game Boy Color',
  gba: 'Game Boy Advance',
  snes: 'Super Nintendo',
  gamecube: 'GameCube',
  retro: 'Retro',
};

function normalizePlatformKey(value: string): PlatformKey | '' {
  const source = normalizeText(value);
  if (!source) return '';
  if (source === 'gameboy' || source === 'game boy' || source === 'game-boy') return 'gameboy';
  if (source === 'gbc' || source === 'gameboy color' || source === 'game boy color' || source === 'game-boy-color') {
    return 'gbc';
  }
  if (source === 'gba' || source === 'gameboy advance' || source === 'game boy advance' || source === 'game-boy-advance') {
    return 'gba';
  }
  if (source === 'snes' || source === 'super nintendo' || source === 'super-nintendo') return 'snes';
  if (source === 'gamecube' || source === 'game cube' || source === 'game-cube') return 'gamecube';
  if (source === 'retro') return 'retro';
  return '';
}
const COMPONENT_DEFAULT_PRICE: Record<BundleOptionType, number> = {
  cartucho: 0,
  caja: 700,
  manual: 800,
  insert: 300,
  protector_juego: 300,
  protector_caja: 350,
  protector: 300,
};

const EDITION_ORDER: EditionKind[] = ['original', 'repro', 'sin-especificar'];
const PLACEHOLDER = '/placeholder.svg';
const PRODUCT_DETAIL_COLUMNS = [
  'id',
  'name',
  'description',
  'long_description',
  'price',
  'stock',
  'image',
  'images',
  'status',
  'category',
  'component_type',
  'edition',
  'collection_key',
  'trailer_url',
  'curiosities',
  'tips',
].join(',');
const RELATED_PRODUCTS_COLUMNS_MODERN = [
  'id',
  'name',
  'price',
  'image',
  'images',
  'stock',
  'category',
  'description',
  'component_type',
  'edition',
  'collection_key',
  'created_at',
].join(',');
const RELATED_PRODUCTS_COLUMNS_LEGACY = [
  'id',
  'name',
  'price',
  'image',
  'images',
  'stock',
  'category',
  'description',
  'created_at',
].join(',');

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

function detectPlatformKey(product: any): PlatformKey {
  const explicit = normalizePlatformKey(String(product?.platform || ''));
  if (explicit) return explicit;

  const category = normalizeText(String(product?.category || ''));
  const name = normalizeText(String(product?.name || ''));
  const source = `${category} ${name}`;

  if (source.includes('gamecube')) return 'gamecube';
  if (source.includes('super nintendo') || source.includes('snes')) return 'snes';
  if (source.includes('game boy color') || source.includes('gameboy color') || source.includes('gbc')) return 'gbc';
  if (source.includes('game boy advance') || source.includes('gameboy advance') || source.includes('gba')) return 'gba';
  if (source.includes('game boy') || source.includes('gameboy')) return 'gameboy';
  return 'retro';
}

function getPlatformGenericInsertLabel(platform: PlatformKey): string {
  switch (platform) {
    case 'gameboy':
      return 'Insert Game Boy';
    case 'gbc':
      return 'Insert Game Boy Color';
    case 'gba':
      return 'Insert Game Boy Advance';
    case 'snes':
      return 'Insert Super Nintendo';
    case 'gamecube':
      return 'Insert GameCube';
    default:
      return 'Insert Retro';
  }
}

function scoreGenericInsertCandidate(platform: PlatformKey, product: any): number {
  const source = normalizeText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.collection_key || '')}`
  );
  if (!source) return 0;

  let score = 0;
  if (source.includes('insert') || source.includes('inlay') || source.includes('interior')) score += 10;
  if (source.includes('universal')) score += 8;
  if (normalizeText(String(product?.component_type || '')) === 'insert') score += 6;

  if (platform === 'gameboy' && source.includes('game boy')) score += 7;
  if (platform === 'gbc' && (source.includes('game boy color') || source.includes('gbc'))) score += 7;
  if (platform === 'gba' && (source.includes('game boy advance') || source.includes('gba'))) score += 7;
  if (platform === 'snes' && (source.includes('super nintendo') || source.includes('snes'))) score += 7;
  if (platform === 'gamecube' && source.includes('gamecube')) score += 7;

  if (source.includes('consola')) score -= 2;
  return score;
}

function pickGenericInsertCandidate(basePlatform: PlatformKey, baseProductId: string, allProducts: any[]): any | null {
  const insertCandidates = allProducts.filter((candidate) => {
    if (!candidate || String(candidate.id) === baseProductId) return false;
    if (Number(candidate.stock || 0) <= 0) return false;
    if (Number(candidate.price || 0) <= 0) return false;
    if (detectOptionType(candidate) !== 'insert') return false;
    return detectPlatformKey(candidate) === basePlatform;
  });
  if (insertCandidates.length === 0) return null;

  return insertCandidates
    .map((candidate) => ({ candidate, score: scoreGenericInsertCandidate(basePlatform, candidate) }))
    .sort((a, b) => b.score - a.score)[0]?.candidate || null;
}

function toComponentTypeSlug(type: BundleOptionType): string {
  switch (type) {
    case 'protector_juego':
      return 'protector-juego';
    case 'protector_caja':
      return 'protector-caja';
    default:
      return type;
  }
}

function getComponentDefaultImage(platform: PlatformKey, type: BundleOptionType): string {
  return `/images/components/${platform}-${toComponentTypeSlug(type)}.svg`;
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

function dedupeById(input: any[]): any[] {
  const output: any[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const id = String(item?.id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    output.push(item);
  }
  return output;
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
    if (!Number.isFinite(Number(product.price)) || Number(product.price || 0) <= 0) continue;
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
  const basePlatform = detectPlatformKey(baseProduct);

  const extras: BundleOption[] = [];
  for (const type of requiredTypes) {
    let selected: any | null = null;
    if (type === 'insert') {
      selected = pickGenericInsertCandidate(basePlatform, String(baseProduct.id), allProducts);
    }

    if (!selected) {
      const byEdition = matchesByTypeEdition[type] || {};
      const variants = EDITION_ORDER.map((edition) => byEdition[edition]).filter(
        (item): item is { product: any; score: number } => Boolean(item)
      );

      const candidates =
        variants.length > 0
          ? variants.map((item) => item.product)
          : allProducts.filter((candidate) => {
              if (!candidate || String(candidate.id) === String(baseProduct.id)) return false;
              if (detectOptionType(candidate) !== type) return false;
              if (Number(candidate.stock || 0) <= 0) return false;
              if (Number(candidate.price || 0) <= 0) return false;
              return detectPlatformKey(candidate) === basePlatform;
            });

      if (candidates.length === 0) continue;
      selected = candidates[0];
    }

    const selectedEdition = detectEditionKind(selected);
    const selectedEditionLabel = EDITION_LABEL[selectedEdition];
    const platformLabel = PLATFORM_LABEL[basePlatform];
    const rawImage = getProductImageUrl(selected);
    const fallbackImage = getComponentDefaultImage(basePlatform, type);
    const resolvedImage = rawImage === PLACEHOLDER ? fallbackImage : rawImage;
    const resolvedImages = uniqueStrings([resolvedImage, ...getProductImageUrls(selected)]);

    extras.push({
      id: String(selected.id),
      name:
        type === 'insert'
          ? getPlatformGenericInsertLabel(basePlatform)
          : `${String(selected.name || `${BUNDLE_TYPE_LABEL[type]} ${platformLabel}`)} · ${selectedEditionLabel}`,
      price:
        Number(selected.price || 0) > 0
          ? Number(selected.price || 0)
          : COMPONENT_DEFAULT_PRICE[type],
      image: resolvedImage,
      images: resolvedImages.length > 0 ? resolvedImages : [fallbackImage],
      stock: Number(selected.stock || 0),
      type,
      defaultSelected: false,
    });
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
  initialProduct = null,
}: {
  productId: string;
  prefillComplete?: boolean;
  initialProduct?: any | null;
}) {
  const [product, setProduct] = useState<any | null>(initialProduct);
  const [loadingProduct, setLoadingProduct] = useState(!initialProduct);
  const [productLoadError, setProductLoadError] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const buySectionRef = useRef<HTMLDivElement | null>(null);
  const reviewsSectionRef = useRef<HTMLDivElement | null>(null);

  const [bundleOptions, setBundleOptions] = useState<BundleOption[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<Record<string, boolean>>({});
  const [editionOptions, setEditionOptions] = useState<EditionOption[]>([]);
  const [showCompleteGameOptions, setShowCompleteGameOptions] = useState(false);

  const [visitorId, setVisitorId] = useState('');
  const [socialSummary, setSocialSummary] = useState<ProductSocialSummary>(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState<ProductSocialReview[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [requiresPurchaseForReview, setRequiresPurchaseForReview] = useState(true);

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [priceSource, setPriceSource] = useState<'orders' | 'ebay' | 'current' | 'none'>('none');
  const [marketGuideEbay, setMarketGuideEbay] = useState<EbayMarketGuide | null>(null);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState('');

  const add = useCartStore((s) => s.add);

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    if (!supabaseClient) {
      setIsLoggedIn(false);
      return;
    }

    let mounted = true;
    supabaseClient.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setIsLoggedIn(Boolean(data?.user));
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      let nextInitialProduct = initialProduct;
      if (nextInitialProduct) {
        setProduct(nextInitialProduct);
        setBundleOptions(buildBundleOptions(nextInitialProduct, [nextInitialProduct]));
        setEditionOptions(buildEditionOptions(nextInitialProduct, [nextInitialProduct]));
      }

      setLoadingProduct(true);
      setProductLoadError('');

      if (!supabaseClient) {
        const parsed = parseProductRouteParam(String(productId || ''));
        const fallback =
          nextInitialProduct ||
          (parsed.idCandidate
            ? sampleProducts.find((p) => String(p.id) === String(parsed.idCandidate))
            : null) ||
          (parsed.idPrefixCandidate
            ? sampleProducts.find((p) => String(p.id || '').toLowerCase().startsWith(String(parsed.idPrefixCandidate)))
            : null) ||
          (parsed.slugCandidate
            ? sampleProducts.find((p: any) => {
                const slug = String((p as any)?.slug || '')
                  .trim()
                  .toLowerCase();
                return slug && slug === parsed.slugCandidate;
              })
            : null) ||
          sampleProducts.find((p) => String(p.id) === String(productId)) ||
          null;

        setProduct(fallback);

        if (fallback) {
          const options = buildBundleOptions(fallback, sampleProducts);
          setBundleOptions(options);
          setEditionOptions(buildEditionOptions(fallback, sampleProducts));
          setProductLoadError('');
        } else {
          setProductLoadError('No se pudo cargar este producto.');
        }
        setLoadingProduct(false);
        return;
      }

      const parsed = parseProductRouteParam(String(productId || ''));
      let detail: any | null = null;

      if (parsed.idCandidate) {
        const { data } = await supabaseClient
          .from('products')
          .select(PRODUCT_DETAIL_COLUMNS)
          .eq('id', parsed.idCandidate)
          .maybeSingle();
        if (data) detail = data;
      }

      if (!detail && parsed.idPrefixCandidate) {
        const safePrefix = String(parsed.idPrefixCandidate || '').trim().toLowerCase();
        if (safePrefix) {
          const fast = await supabaseClient
            .from('products')
            .select(PRODUCT_DETAIL_COLUMNS)
            .ilike('id', `${safePrefix}%`)
            .limit(2);

          if (!fast.error && Array.isArray(fast.data) && fast.data.length === 1) {
            detail = fast.data[0];
          }

          // UUID fallback: when ilike on id is not supported by DB type/policies.
          if (!detail) {
            const scan = await supabaseClient
              .from('products')
              .select('id')
              .order('updated_at', { ascending: false })
              .limit(3000);

            if (!scan.error && Array.isArray(scan.data) && scan.data.length > 0) {
              const matches = scan.data.filter((row: any) =>
                String(row?.id || '').toLowerCase().startsWith(safePrefix)
              );

              if (matches.length === 1) {
                const resolvedId = String(matches[0]?.id || '').trim();
                if (resolvedId) {
                  const full = await supabaseClient
                    .from('products')
                    .select(PRODUCT_DETAIL_COLUMNS)
                    .eq('id', resolvedId)
                    .maybeSingle();
                  if (full.data) {
                    detail = full.data;
                  }
                }
              }
            }
          }
        }
      }

      if (!detail && parsed.slugCandidate) {
        // Algunos esquemas tienen "slug", otros no. Si falla, seguimos con fallback.
        const { data, error } = await supabaseClient
          .from('products')
          .select(PRODUCT_DETAIL_COLUMNS)
          .eq('slug', parsed.slugCandidate)
          .order('updated_at', { ascending: false })
          .limit(1);
        if (!error && Array.isArray(data) && data.length > 0) {
          detail = data[0];
        }
      }

      if (!detail) {
        const { data } = await supabaseClient
          .from('products')
          .select(PRODUCT_DETAIL_COLUMNS)
          .eq('id', productId)
          .maybeSingle();
        if (data) detail = data;
      }

      if (!detail) {
        if (nextInitialProduct) {
          setProduct(nextInitialProduct);
          setProductLoadError('');
        } else {
          setProduct(null);
          setProductLoadError('No se pudo cargar este producto.');
        }
        setLoadingProduct(false);
        return;
      }

      setProduct(detail);
      setProductLoadError('');

      const pool: any[] = [detail];
      const pushCandidates = (items: any[] | null | undefined) => {
        if (!Array.isArray(items) || items.length === 0) return;
        pool.push(...items);
      };

      const collectionKey = String((detail as any)?.collection_key || '').trim();
      const category = String((detail as any)?.category || '').trim();
      const baseToken =
        cleanBaseTitle(String((detail as any)?.name || ''))
          .split(' ')
          .find((token) => token.length >= 4) || '';

      const relatedByCollection = collectionKey
        ? await supabaseClient
            .from('products')
            .select(RELATED_PRODUCTS_COLUMNS_MODERN)
            .eq('collection_key', collectionKey)
            .order('created_at', { ascending: false })
            .limit(180)
        : null;

      if (relatedByCollection && !relatedByCollection.error) {
        pushCandidates(relatedByCollection.data);
      }

      if (pool.length < 40 && category) {
        const relatedByCategory = await supabaseClient
          .from('products')
          .select(RELATED_PRODUCTS_COLUMNS_MODERN)
          .eq('category', category)
          .order('created_at', { ascending: false })
          .limit(260);

        if (!relatedByCategory.error) {
          pushCandidates(relatedByCategory.data);
        }
      }

      if (pool.length < 80 && baseToken) {
        const relatedByName = await supabaseClient
          .from('products')
          .select(RELATED_PRODUCTS_COLUMNS_MODERN)
          .ilike('name', `%${baseToken}%`)
          .order('created_at', { ascending: false })
          .limit(220);

        if (!relatedByName.error) {
          pushCandidates(relatedByName.data);
        }
      }

      const componentCatalog = await supabaseClient
        .from('products')
        .select(RELATED_PRODUCTS_COLUMNS_MODERN)
        .or('name.ilike.%manual%,name.ilike.%insert%,name.ilike.%protector%,name.ilike.%caja%')
        .gt('stock', 0)
        .gt('price', 0)
        .limit(320);

      if (!componentCatalog.error) {
        const basePlatform = detectPlatformKey(detail);
        const componentCandidates = (componentCatalog.data || []).filter((item: any) => {
          const type = detectOptionType(item);
          if (!type || type === 'cartucho') return false;
          return detectPlatformKey(item) === basePlatform;
        });
        pushCandidates(componentCandidates);
      }

      if (pool.length <= 1) {
        const legacyPool = await supabaseClient
          .from('products')
          .select(RELATED_PRODUCTS_COLUMNS_LEGACY)
          .order('created_at', { ascending: false })
          .limit(240);
        if (!legacyPool.error) {
          pushCandidates(legacyPool.data);
        }
      }

      const dedupedPool = dedupeById(pool).slice(0, 420);
      setBundleOptions(buildBundleOptions(detail, dedupedPool));
      setEditionOptions(buildEditionOptions(detail, dedupedPool));
      setLoadingProduct(false);
    };

    load().catch(() => {
      if (initialProduct) {
        setProduct(initialProduct);
        setBundleOptions(buildBundleOptions(initialProduct, [initialProduct]));
        setEditionOptions(buildEditionOptions(initialProduct, [initialProduct]));
        setProductLoadError('');
      } else {
        setProductLoadError('No se pudo cargar este producto.');
      }
      setLoadingProduct(false);
    });
  }, [productId, initialProduct]);

  useEffect(() => {
    if (!loadingProduct) return;

    const timer = window.setTimeout(() => {
      setLoadingProduct((current) => {
        if (!current) return current;
        setProductLoadError((prev) =>
          prev || 'La carga del producto está tardando más de lo normal. Recarga la página.'
        );
        return false;
      });
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [loadingProduct]);

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

  const getAuthHeaders = useCallback(
    async (includeJson = false): Promise<Record<string, string>> => {
      const headers: Record<string, string> = {};
      if (includeJson) headers['Content-Type'] = 'application/json';

      const session = await supabaseClient?.auth.getSession();
      const accessToken = session?.data?.session?.access_token || '';
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      return headers;
    },
    []
  );

  const refreshSocial = useCallback(async () => {
    if (!productId) return;
    try {
      const visitorParam = visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : '';
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/social${visitorParam}`, {
        headers: await getAuthHeaders(false),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar actividad');

      setSocialSummary(data.summary || EMPTY_SUMMARY);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setCanReview(Boolean(data?.canReview));
      setRequiresPurchaseForReview(Boolean(data?.requiresPurchaseForReview ?? true));
    } catch (error: any) {
      console.warn('Error loading social data:', error?.message || error);
    }
  }, [productId, visitorId, getAuthHeaders]);

  useEffect(() => {
    if (!productId) return;

    refreshSocial();
    if (visitorId) {
      void (async () => {
        const headers = await getAuthHeaders(true);
        fetch(`/api/products/${encodeURIComponent(productId)}/social`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'visit', visitorId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.summary) setSocialSummary(data.summary);
          })
          .catch(() => undefined);
      })();
    }
  }, [productId, visitorId, refreshSocial, getAuthHeaders]);

  useEffect(() => {
    if (reviews.length === 0) {
      setActiveReviewIndex(0);
      return;
    }
    setActiveReviewIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= reviews.length) return reviews.length - 1;
      return prev;
    });
  }, [reviews]);

  const refreshPriceHistory = useCallback(async () => {
    if (!productId) return;
    if (!product) return;
    if (isMysteryOrRouletteProduct(product as any)) {
      setPriceHistory([]);
      setMarketGuideEbay(null);
      setPriceSource('none');
      setPriceHistoryError('');
      return;
    }
    setLoadingPriceHistory(true);
    setPriceHistoryError('');

    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(productId)}/price-history?refresh=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el historico de precios');

      const nextMarketGuideEbay =
        data?.marketGuideEbay && typeof data.marketGuideEbay === 'object'
          ? (data.marketGuideEbay as EbayMarketGuide)
          : null;
      setMarketGuideEbay(nextMarketGuideEbay);

      const nextPoints = Array.isArray(data?.points)
        ? data.points
            .map((point: any) => ({
              date: String(point?.date || ''),
              price: Number(point?.price || 0),
            }))
            .filter((point: PriceHistoryPoint) => point.date && Number.isFinite(point.price) && point.price > 0)
        : [];

      const fallbackFromEbay = nextMarketGuideEbay?.available
        ? buildEbayFallbackPoints(nextMarketGuideEbay)
        : [];
      const canPromoteEbaySeries =
        fallbackFromEbay.length >= 2 &&
        (nextPoints.length <= 1 ||
          (data?.source === 'current' && nextPoints.length < fallbackFromEbay.length));

      if (canPromoteEbaySeries) {
        setPriceHistory(fallbackFromEbay);
        setPriceSource('ebay');
      } else if (nextPoints.length > 0) {
        setPriceHistory(nextPoints);
        setPriceSource(
          data?.source === 'orders'
            ? 'orders'
            : data?.source === 'ebay'
              ? 'ebay'
              : 'current'
        );
      } else if (nextMarketGuideEbay?.available) {
        if (fallbackFromEbay.length > 0) {
          setPriceHistory(fallbackFromEbay);
          setPriceSource('ebay');
          return;
        }
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

  const buildProductHref = (target: { id: string | number; name?: string; slug?: string } | string | number): string => {
    if (typeof target === 'string' || typeof target === 'number') {
      return getProductHref({ id: String(target) }, { complete: prefillComplete });
    }
    return getProductHref(target, { complete: prefillComplete });
  };

  const selectedTotalPrice = selectedUnitPrice * Math.max(1, qty);
  const purchasableSelectedCount = selectedBundleOptions.filter((option) => option.stock > 0 && !option.isVirtual).length;
  const hideMarketPricing = isMysteryOrRouletteProduct(product as any);
  const shouldLabelAsEbaySource =
    priceSource === 'ebay' ||
    (priceSource === 'current' &&
      Boolean(marketGuideEbay?.available) &&
      Number(marketGuideEbay?.sampleSize || 0) >= 2);
  const ebayDiagnosticHref = `/api/market/ebay-diagnostic?q=${encodeURIComponent(String(product?.name || ''))}`;
  const scrollToBuySection = () => {
    buySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToReviewsSection = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loadingProduct && !product) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6 text-textMuted">Cargando producto...</div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6">
            <p className="text-text font-semibold">Producto no disponible</p>
            <p className="text-textMuted mt-2">{productLoadError || 'No hemos podido cargar esta ficha.'}</p>
            <Link href="/tienda" className="button-secondary mt-4 inline-flex">
              Volver a tienda
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const safeCuriosities = Array.isArray(product.curiosities)
    ? product.curiosities
        .map((item: unknown) => String(item || '').trim())
        .filter((item: string) => item.length > 0)
    : [];
  const safeTips = Array.isArray(product.tips)
    ? product.tips
        .map((item: unknown) => String(item || '').trim())
        .filter((item: string) => item.length > 0)
    : [];
  const editionLabel = EDITION_LABEL[detectEditionKind(product)];
  const categoryLabel = String(product.category || 'coleccionismo retro');

  const detailItems =
    safeCuriosities.length > 0
      ? safeCuriosities
      : [
          `${product.name} pertenece a la categoría ${categoryLabel}.`,
          `Edición detectada: ${editionLabel}. Revisa fotos y descripción para confirmar estado exacto.`,
        ];

  const collectorTips =
    safeTips.length > 0
      ? safeTips
      : [
          'Guarda la pieza en funda libre de PVC y evita exposición directa al sol.',
          'Conserva pruebas de compra y fotos de estado para mantener valor de colección.',
        ];

  const currentReview = reviews.length > 0 ? reviews[activeReviewIndex] : null;

  const getReviewProfileHref = (review: ProductSocialReview): string | null => {
    const raw = String(review?.visitorId || '').trim();
    if (!raw) return null;
    if (raw.startsWith('auth-') && raw.length > 10) {
      return `/comunidad/vendedor/${encodeURIComponent(raw.replace(/^auth-/, ''))}`;
    }
    return null;
  };

  const toggleLike = async () => {
    if (!isLoggedIn) {
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }

    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/social`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'toggle_like', visitorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar favorito');
      if (data?.summary) setSocialSummary(data.summary);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar favorito');
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
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/social`, {
        method: 'POST',
        headers,
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
      setReviewModalOpen(false);
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
    <section className="section pb-32 lg:pb-14">
      <div className="container grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="glass p-4 sm:p-6">
          <div className="photo-frame-glow relative w-full h-[320px] sm:h-[500px] bg-surface border border-line rounded-2xl flex items-center justify-center overflow-hidden">
            <Image
              src={images[selectedImage] || images[0] || PLACEHOLDER}
              alt={product.name}
              fill
              className="object-contain p-4 photo-breath photo-hover-pop"
              priority
              sizes="(max-width: 1024px) 96vw, 48vw"
            />
            {product.status ? <span className="absolute top-3 left-3 chip text-[11px]">{product.status}</span> : null}
            <span className="absolute bottom-3 right-3 chip text-[11px]">Foto {selectedImage + 1} / {images.length}</span>
          </div>

          <div className="mt-4 mobile-scroll-row no-scrollbar sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
            {images.slice(0, 12).map((img: string, index: number) => (
              <button
                type="button"
                key={`${img}-${index}`}
                className={`group relative h-20 w-20 shrink-0 sm:w-auto rounded-xl border bg-surface overflow-hidden transition-colors ${
                  selectedImage === index ? 'border-primary' : 'border-line'
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <Image
                  src={img}
                  alt={`${product.name} miniatura ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-contain p-1 photo-hover-pop"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-textMuted font-mono">Stock: {product.stock}</p>
            <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:overflow-visible sm:pb-0 text-xs text-textMuted">
              <span className="chip">Visitas: {socialSummary.visits}</span>
              <span className="chip">Favoritos: {socialSummary.likes}</span>
              <span className="chip">Valoraciones: {socialSummary.reviewsCount}</span>
            </div>
          </div>

          <h1 className="title-display text-[1.85rem] sm:text-4xl mt-3 leading-[1.1]">{product.name}</h1>
          <p className="text-primary text-[1.9rem] sm:text-3xl mt-3 sm:mt-4 font-semibold">{(Number(product.price || 0) / 100).toFixed(2)} €</p>
          <p className="text-textMuted mt-3 sm:mt-4 leading-relaxed text-[0.94rem] sm:text-base">{product.long_description || product.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
            <button type="button" className="button-primary !px-4 !py-2 !w-full" onClick={scrollToBuySection}>
              Comprar ahora
            </button>
            <button type="button" className="button-secondary !px-4 !py-2 !w-full" onClick={scrollToReviewsSection}>
              Ver valoraciones
            </button>
          </div>

          <div className="mt-4 mobile-scroll-row no-scrollbar sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
            <div className="min-w-[240px] sm:min-w-0 rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Compra segura</p>
              <p className="text-sm mt-1">Soporte por ticket y seguimiento del pedido</p>
            </div>
            <div className="min-w-[240px] sm:min-w-0 rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
              <p className="text-xs text-textMuted">Opciones de compra</p>
              <p className="text-sm mt-1">Cartucho, caja, manual, insert y protectores</p>
            </div>
            <div className="min-w-[240px] sm:min-w-0 rounded-xl border border-line p-3 bg-[rgba(10,18,30,0.55)]">
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

          <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              className={`chip ${socialSummary.likedByCurrentVisitor ? 'text-text border-primary bg-[rgba(75,228,214,0.14)]' : ''}`}
              onClick={toggleLike}
              disabled={!isLoggedIn}
            >
              {socialSummary.likedByCurrentVisitor ? 'Quitar favorito' : 'Añadir a favoritos'}
            </button>
            {!isLoggedIn ? <span className="text-xs text-textMuted">Inicia sesión para usar favoritos.</span> : null}
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
                      href={buildProductHref({ id: edition.id, name: edition.name })}
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
                {detailItems.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-lg">Tips de coleccionista</p>
              <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
                {collectorTips.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div ref={buySectionRef} className="mt-7 border-t border-line pt-5 sm:mt-8 sm:pt-6">
            <div className="rounded-2xl border border-line bg-[linear-gradient(145deg,rgba(11,22,38,0.92),rgba(8,16,30,0.72))] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-primary">Componentes y extras</p>
              <p className="font-semibold text-lg mt-1">Configura tu compra completa</p>
              <p className="text-sm text-textMuted mt-2">
                Combina cartucho, caja, manual, insert y protectores. Solo se añade lo que selecciones.
              </p>
            </div>
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
            <div className="space-y-3">
              {displayedBundleOptions.map((option) => {
                const isCurrentProduct = String(option.id) === String(product.id);
                const canOpenProduct = !option.isVirtual && !isCurrentProduct;
                const optionImage =
                  option.image && option.image !== PLACEHOLDER
                    ? option.image
                    : getComponentDefaultImage(detectPlatformKey(product), option.type);
                const showStockForOption = option.type === 'cartucho' && option.stock > 0;

                return (
                  <div
                    key={option.id}
                    className="group flex flex-col gap-3 rounded-2xl border border-line px-3 py-3 bg-[rgba(12,22,36,0.7)] transition-colors hover:border-primary/45 sm:flex-row sm:items-center sm:justify-between"
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
                      <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-line bg-[rgba(9,18,30,0.75)] shrink-0">
                        <Image
                          src={optionImage}
                          alt={`${BUNDLE_TYPE_LABEL[option.type]} ${option.name}`}
                          fill
                          className="object-contain p-1"
                          sizes="56px"
                        />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="text-textMuted">{BUNDLE_TYPE_LABEL[option.type]}:</span>{' '}
                          {isCurrentProduct ? (
                            <span className="font-semibold">{option.name}</span>
                          ) : canOpenProduct ? (
                            <Link href={buildProductHref({ id: option.id, name: option.name })} className="text-primary hover:underline">
                              {option.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-textMuted">{option.name}</span>
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="chip text-[11px]">{BUNDLE_TYPE_LABEL[option.type]}</span>
                          {option.stock <= 0 ? <span className="chip text-[11px] border-red-400 text-red-300">Sin stock</span> : null}
                        </div>
                        {canOpenProduct ? (
                          <Link
                            href={buildProductHref({ id: option.id, name: option.name })}
                            className="mt-2 inline-flex items-center rounded-lg border border-primary/45 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary/20"
                          >
                            Ver componente
                          </Link>
                        ) : null}
                        {option.isVirtual && option.stock <= 0 ? (
                          <p className="text-xs text-textMuted mt-1">No disponible todavía para este juego.</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-base font-semibold text-primary">{(option.price / 100).toFixed(2)} €</p>
                      {showStockForOption ? <p className="text-xs text-textMuted">Stock {option.stock}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center rounded-xl border border-line overflow-hidden w-fit">
                <button
                  type="button"
                  className="px-3 py-2 text-sm border-r border-line hover:bg-[rgba(75,228,214,0.08)]"
                  onClick={() => setQty((value) => Math.max(1, Number(value || 1) - 1))}
                >
                  -
                </button>
                <input
                  className="w-16 text-center bg-transparent px-2 py-2"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="px-3 py-2 text-sm border-l border-line hover:bg-[rgba(75,228,214,0.08)]"
                  onClick={() => setQty((value) => Math.max(1, Number(value || 1) + 1))}
                >
                  +
                </button>
              </div>
              <button className="button-primary w-full sm:w-auto" onClick={addSelectedToCart}>
                {prefillComplete ? 'Añadir pack completo al carrito' : 'Añadir selección al carrito'}
              </button>
            </div>

            <p className="mt-3 text-sm text-textMuted">
              Total seleccion ({Math.max(1, qty)} ud):{' '}
              <span className="text-primary">{(selectedTotalPrice / 100).toFixed(2)} €</span>
            </p>
          </div>

        </div>
      </div>

      {hideMarketPricing ? null : (
        <div className="container mt-8">
          <div className="glass p-4 sm:p-6">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-3">
              <p className="font-semibold">Historico de precio del producto</p>
              <button type="button" className="chip" onClick={refreshPriceHistory} disabled={loadingPriceHistory}>
                {loadingPriceHistory ? 'Cargando...' : 'Actualizar grafica'}
              </button>
            </div>

            {priceHistory.length > 0 ? (
              <div className="mx-auto w-full max-w-[1180px]">
                <PriceHistoryChart points={priceHistory} marketOverlay={marketGuideEbay} />
              </div>
            ) : (
              <p className="text-sm text-textMuted">Aun no hay datos suficientes para mostrar tendencia.</p>
            )}

            <p className="text-xs text-textMuted mt-2">
              Fuente:{' '}
              {priceSource === 'orders'
                ? 'ventas reales de la tienda'
                : shouldLabelAsEbaySource
                  ? 'muestras de mercado eBay (listados activos)'
                : priceSource === 'current'
                  ? 'precio actual del catalogo'
                  : 'sin datos'}
            </p>
            {priceHistoryError ? <p className="text-xs text-red-400 mt-1">{priceHistoryError}</p> : null}
            {marketGuideEbay && !marketGuideEbay.available ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={ebayDiagnosticHref} target="_blank" rel="noreferrer" className="chip text-xs">
                  Abrir diagnóstico eBay
                </a>
                <button type="button" className="chip text-xs" onClick={refreshPriceHistory}>
                  Reintentar comparativa
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgba(7,13,22,0.95)] backdrop-blur-md">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-textMuted uppercase tracking-[0.08em]">Selección actual</p>
              <p className="text-primary font-semibold">{(selectedTotalPrice / 100).toFixed(2)} €</p>
              <p className="text-[11px] text-textMuted">
                {Math.max(1, qty)} ud · {purchasableSelectedCount} items
              </p>
            </div>

            <div className="flex items-center rounded-xl border border-line overflow-hidden shrink-0">
              <button
                type="button"
                className="px-3 py-2 text-sm border-r border-line"
                onClick={() => setQty((value) => Math.max(1, Number(value || 1) - 1))}
              >
                -
              </button>
              <span className="px-3 py-2 text-sm">{Math.max(1, qty)}</span>
              <button
                type="button"
                className="px-3 py-2 text-sm border-l border-line"
                onClick={() => setQty((value) => Math.max(1, Number(value || 1) + 1))}
              >
                +
              </button>
            </div>
          </div>

          <button className="button-primary w-full mt-3 !text-base" onClick={addSelectedToCart}>
            Añadir al carrito
          </button>
        </div>
      </div>

      <div ref={reviewsSectionRef} className="container mt-10">
        <div className="glass p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="title-display text-2xl">Valoraciones</h2>
            <p className="text-textMuted text-sm">
              Nota media: {socialSummary.ratingAverage.toFixed(2)} / 5 ({socialSummary.reviewsCount} reseñas)
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-line p-4 bg-[rgba(12,22,36,0.62)]">
              {reviews.length === 0 || !currentReview ? (
                <p className="text-textMuted">Aun no hay reseñas. Se el primero en opinar.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{currentReview.authorName}</p>
                      <p className="text-xs text-textMuted">
                        {new Date(currentReview.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="chip">Puntuación {currentReview.rating}/5</span>
                      {getReviewProfileHref(currentReview) ? (
                        <Link className="chip text-primary border-primary/45" href={String(getReviewProfileHref(currentReview))}>
                          Ver perfil público
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-sm mt-3 text-textMuted">{currentReview.comment}</p>
                  {currentReview.photos?.length ? (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {currentReview.photos.map((photo) => (
                        <div key={photo} className="relative h-24 rounded-lg border border-line bg-surface overflow-hidden">
                          <Image src={photo} alt="review-photo" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {reviews.length > 1 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-line p-3 bg-[rgba(9,18,30,0.58)]">
                <div className="flex flex-wrap gap-2">
                  {reviews.slice(0, 8).map((review, index) => (
                    <button
                      type="button"
                      key={`review-dot-${review.id}`}
                      className={`chip ${index === activeReviewIndex ? 'text-primary border-primary' : ''}`}
                      onClick={() => setActiveReviewIndex(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setActiveReviewIndex((value) => (value <= 0 ? reviews.length - 1 : value - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setActiveReviewIndex((value) => (value + 1) % reviews.length)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="button-primary"
                onClick={() => setReviewModalOpen(true)}
                disabled={requiresPurchaseForReview && !canReview}
              >
                Publicar valoración
              </button>
              {requiresPurchaseForReview && !canReview ? (
                <span className="text-xs text-textMuted">
                  Para publicar valoración debes haber comprado este producto con tu cuenta.
                </span>
              ) : (
                <span className="text-xs text-textMuted">
                  Tu valoración se guarda y aparece en este carrusel.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {reviewModalOpen ? (
        <div className="fixed inset-0 z-[90] bg-[rgba(2,6,16,0.75)] backdrop-blur-sm p-4 sm:p-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-[rgba(8,16,30,0.98)] p-5 sm:p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="title-display text-xl">Publicar valoración</h3>
              <button type="button" className="chip" onClick={() => setReviewModalOpen(false)}>
                Cerrar
              </button>
            </div>

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
                className="w-full bg-transparent border border-line px-3 py-2 min-h-[140px]"
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
                    <div key={`${photo.slice(0, 20)}-${index}`} className="relative h-20 rounded-lg border border-line bg-surface overflow-hidden">
                      <Image src={photo} alt={`preview-${index + 1}`} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button className="button-primary" onClick={submitReview} disabled={submittingReview}>
                {submittingReview ? 'Publicando...' : 'Publicar valoración'}
              </button>
              <button type="button" className="chip" onClick={() => setReviewModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
