'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import { sampleProducts } from '@/lib/sampleData';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
import { getProductHref } from '@/lib/productUrl';
import {
  buildBaseGameTitle,
  isBoxProduct,
  isCompleteGameProduct,
  isMainGameProduct,
  isManualProduct,
} from '@/lib/productClassification';

const MANUALS_CATEGORY = 'manuales';
const COMPLETE_GAMES_CATEGORY = 'juego-completo';
const GAMES_FILTER = 'juegos';
const BOXES_FILTER = 'cajas';
const MYSTERY_FILTER = 'cajas-misteriosas';
const SPECIAL_CONSOLES_FILTER = 'special-consoles';
const PLATFORM_PREFIX = 'platform:';
const QUICK_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: `${PLATFORM_PREFIX}consolas`, label: 'Consolas y hardware' },
  { id: SPECIAL_CONSOLES_FILTER, label: 'Ediciones especiales' },
  { id: MYSTERY_FILTER, label: 'Mystery Box' },
];
const PLATFORM_FILTERS = [
  { id: `${PLATFORM_PREFIX}game-boy`, label: 'Game Boy' },
  { id: `${PLATFORM_PREFIX}game-boy-color`, label: 'Game Boy Color' },
  { id: `${PLATFORM_PREFIX}game-boy-advance`, label: 'Game Boy Advance' },
  { id: `${PLATFORM_PREFIX}super-nintendo`, label: 'Super Nintendo' },
  { id: `${PLATFORM_PREFIX}gamecube`, label: 'GameCube' },
  { id: `${PLATFORM_PREFIX}consolas`, label: 'Consolas' },
];
const PLATFORM_FACET_OPTIONS = [
  { id: 'game-boy', label: 'Game Boy' },
  { id: 'game-boy-color', label: 'Game Boy Color' },
  { id: 'game-boy-advance', label: 'Game Boy Advance' },
  { id: 'super-nintendo', label: 'Super Nintendo' },
  { id: 'gamecube', label: 'GameCube' },
  { id: 'consolas', label: 'Consolas' },
];
const TYPE_FACET_OPTIONS = [
  { id: 'juego', label: 'Juegos' },
  { id: 'juego-completo', label: 'Juego completo' },
  { id: 'consola', label: 'Consolas' },
  { id: 'caja', label: 'Cajas' },
  { id: 'manual', label: 'Manuales' },
  { id: 'insert', label: 'Inserts' },
  { id: 'protector', label: 'Protectores' },
  { id: 'mystery', label: 'Mystery Box' },
];
const EDITION_FACET_OPTIONS = [
  { id: 'original', label: 'Original' },
  { id: 'repro', label: 'Repro 1:1' },
  { id: 'sin-etiqueta', label: 'Sin etiqueta' },
];
const PRICE_RANGE_PRESETS = [
  { id: 'all', label: 'Todo' },
  { id: 'lt25', label: 'Hasta 25€' },
  { id: '25_50', label: '25€ - 50€' },
  { id: '50_100', label: '50€ - 100€' },
  { id: '100_200', label: '100€ - 200€' },
  { id: 'gt200', label: 'Más de 200€' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Novedades' },
  { id: 'name_asc', label: 'A-Z' },
  { id: 'name_desc', label: 'Z-A' },
  { id: 'price_asc', label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
  { id: 'likes_desc', label: 'Más favoritos' },
  { id: 'visits_desc', label: 'Más visitas' },
  { id: 'stock_desc', label: 'Más stock' },
];

const CATALOG_QUERY_COLUMNS = [
  'id',
  'name',
  'description',
  'long_description',
  'price',
  'stock',
  'image',
  'images',
  'status',
  'created_at',
  'category',
  'category_id',
  'is_mystery_box',
  'component_type',
  'collection_key',
  'edition',
  'platform',
].join(',');
const MAX_METRICS_BATCH_IDS = 180;

type ProductMetric = {
  visits: number;
  likes: number;
  likedByCurrentVisitor: boolean;
};

function getProductCategoryKey(product: any): string {
  return String(product?.category_id ?? product?.category ?? product?.category?.id ?? '');
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchPlatform(product: any, filterId: string): boolean {
  const name = normalizeText(String(product?.name || ''));
  const description = normalizeText(String(product?.description || ''));
  const category = normalizeText(String(product?.category || product?.category_id || ''));
  const platform = normalizeText(String(product?.platform || ''));
  const componentType = normalizeText(String(product?.component_type || ''));
  const source = `${name} ${description} ${category} ${platform} ${componentType}`.trim();

  if (filterId === 'consolas') {
    return (
      category.includes('consolas retro') ||
      category.includes('consola') ||
      name.startsWith('consola ') ||
      name.includes(' consola ') ||
      name.includes('dmg 01') ||
      componentType === 'consola' ||
      componentType === 'console'
    );
  }
  if (filterId === 'game-boy-color') {
    return source.includes('game boy color') || source.includes('gameboy color');
  }
  if (filterId === 'game-boy-advance') {
    return source.includes('game boy advance') || source.includes('gameboy advance');
  }
  if (filterId === 'super-nintendo') {
    return source.includes('super nintendo') || source.includes('snes');
  }
  if (filterId === 'gamecube') {
    return source.includes('gamecube') || source.includes('game cube');
  }
  if (filterId === 'game-boy') {
    const isOtherSpecific =
      source.includes('game boy color') ||
      source.includes('gameboy color') ||
      source.includes('game boy advance') ||
      source.includes('gameboy advance');
    if (isOtherSpecific) return false;
    return source.includes('game boy') || source.includes('gameboy');
  }
  return false;
}

function isMysteryBoxProduct(product: any): boolean {
  const category = String(product?.category || product?.category_id || '').toLowerCase();
  if (category === 'cajas-misteriosas') return true;
  return Boolean(product?.is_mystery_box);
}

function isConsoleBaseProduct(product: any): boolean {
  const name = normalizeText(String(product?.name || ''));
  const category = normalizeText(String(product?.category || product?.category_id || ''));
  const componentType = normalizeText(String(product?.component_type || ''));
  return (
    category.includes('consolas retro') ||
    category.includes('consola') ||
    componentType === 'consola' ||
    componentType === 'console' ||
    name.startsWith('consola ') ||
    name.includes(' consola ') ||
    name.includes('dmg 01')
  );
}

function isSpecialConsoleEditionProduct(product: any): boolean {
  if (!isConsoleBaseProduct(product)) return false;
  if (isMysteryBoxProduct(product)) return false;

  const source = normalizeText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')} ${String(product?.collection_key || '')}`
  );

  return (
    source.includes('edicion especial') ||
    source.includes('edicion limitada') ||
    source.includes('limited edition') ||
    source.includes('collector') ||
    source.includes('coleccionista') ||
    source.includes('rare') ||
    source.includes('panasonic q') ||
    source.includes('game boy light') ||
    source.includes('pokemon center') ||
    source.includes('nes classic') ||
    source.includes('famicom jr') ||
    source.includes('snes jr')
  );
}

function isPrimaryStoreProduct(product: any): boolean {
  return isMainGameProduct(product) || isMysteryBoxProduct(product) || isConsoleBaseProduct(product);
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isLikelyComponentProduct(product: any): boolean {
  const componentType = String(product?.component_type || '').toLowerCase();
  if (componentType && componentType !== 'full_game' && componentType !== 'cartucho') return true;

  const source = normalizeText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
  );

  return (
    source.includes('manual') ||
    source.includes('insert') ||
    source.includes('inlay') ||
    source.includes('protector') ||
    source.includes('pegatina')
  );
}

function normalizeEditionFacet(value: unknown): string {
  const source = normalizeText(String(value || ''));
  if (!source) return 'sin-etiqueta';
  if (source.includes('original')) return 'original';
  if (source.includes('repro') || source.includes('replica') || source.includes('reproduccion')) return 'repro';
  return 'sin-etiqueta';
}

function normalizeStatusFacet(value: unknown): string {
  const source = normalizeText(String(value || ''));
  return source || 'sin-estado';
}

function prettifyStatusLabel(value: string): string {
  const normalized = value.replace(/[-_]+/g, ' ').trim();
  if (!normalized) return 'Sin estado';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getProductTypeFacets(product: any, completeProductIds: Set<string>): string[] {
  const facets = new Set<string>();
  const id = String(product?.id || '');
  const component = normalizeText(String(product?.component_type || ''));
  const name = normalizeText(String(product?.name || ''));
  const description = normalizeText(String(product?.description || ''));
  const source = `${name} ${description} ${component}`.trim();

  if (isMysteryBoxProduct(product)) facets.add('mystery');
  if (isConsoleBaseProduct(product)) facets.add('consola');
  if (isMainGameProduct(product)) facets.add('juego');
  if (completeProductIds.has(id)) facets.add('juego-completo');
  if (isBoxProduct(product) || component === 'caja') facets.add('caja');
  if (isManualProduct(product) || component === 'manual') facets.add('manual');
  if (component === 'insert' || source.includes('insert') || source.includes('inlay')) facets.add('insert');
  if (
    component.includes('protector') ||
    source.includes('protector')
  ) {
    facets.add('protector');
  }

  if (facets.size === 0) {
    facets.add('juego');
  }

  return Array.from(facets);
}

function getPresetRangeCents(preset: string): { min: number; max: number } {
  switch (preset) {
    case 'lt25':
      return { min: 0, max: 2500 };
    case '25_50':
      return { min: 2500, max: 5000 };
    case '50_100':
      return { min: 5000, max: 10000 };
    case '100_200':
      return { min: 10000, max: 20000 };
    case 'gt200':
      return { min: 20000, max: 0 };
    case 'all':
    default:
      return { min: 0, max: 0 };
  }
}

function sortProducts(input: any[], sortBy: string, metrics: Record<string, ProductMetric>): any[] {
  const list = [...input];
  const sortByName = (a: any, b: any) =>
    String(a?.name || '').localeCompare(String(b?.name || ''), 'es', { sensitivity: 'base' });
  const sortByPrice = (a: any, b: any) => Number(a?.price || 0) - Number(b?.price || 0);

  switch (sortBy) {
    case 'name_asc':
      list.sort(sortByName);
      break;
    case 'name_desc':
      list.sort((a, b) => sortByName(b, a));
      break;
    case 'price_asc':
      list.sort(sortByPrice);
      break;
    case 'price_desc':
      list.sort((a, b) => sortByPrice(b, a));
      break;
    case 'likes_desc':
      list.sort((a, b) => Number(metrics[String(b.id)]?.likes || 0) - Number(metrics[String(a.id)]?.likes || 0));
      break;
    case 'visits_desc':
      list.sort((a, b) => Number(metrics[String(b.id)]?.visits || 0) - Number(metrics[String(a.id)]?.visits || 0));
      break;
    case 'stock_desc':
      list.sort((a, b) => Number(b?.stock || 0) - Number(a?.stock || 0));
      break;
    case 'newest':
    default:
      list.sort(
        (a, b) =>
          new Date(String(b?.created_at || 0)).getTime() - new Date(String(a?.created_at || 0)).getTime()
      );
      break;
  }

  return list;
}

function hasRealCardImage(product: any): boolean {
  const selected = getProductImageUrl(product);
  const fallback = getProductFallbackImageUrl(product);
  return selected !== fallback && selected !== '/placeholder.svg';
}

function getEngagementScore(product: any, metrics: Record<string, ProductMetric>): number {
  const metric = metrics[String(product?.id)] || { visits: 0, likes: 0, likedByCurrentVisitor: false };
  return Number(metric.visits || 0) + Number(metric.likes || 0) * 2;
}

function pickFeaturedColumn(source: any[], take: number, used: Set<string>): any[] {
  const picked: any[] = [];

  for (const product of source) {
    if (picked.length >= take) break;
    const id = String(product?.id || '');
    if (!id || used.has(id)) continue;
    picked.push(product);
    used.add(id);
  }

  if (picked.length >= take) return picked;

  for (const product of source) {
    if (picked.length >= take) break;
    const id = String(product?.id || '');
    if (!id) continue;
    if (picked.some((item) => String(item?.id) === id)) continue;
    picked.push(product);
  }

  return picked;
}

export default function Catalog() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [active, setActive] = useState<string>('all');
  const [metrics, setMetrics] = useState<Record<string, ProductMetric>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [stockOnly, setStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [pricePreset, setPricePreset] = useState('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEditions, setSelectedEditions] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [hasRealImageOnly, setHasRealImageOnly] = useState(false);
  const [completePackOnly, setCompletePackOnly] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const loadedMetricIdsRef = useRef<Set<string>>(new Set());

  const loadMetrics = useCallback(async (productIds: string[], force = false) => {
    const uniqueProductIds = [...new Set(productIds.map((id) => String(id || '').trim()).filter(Boolean))];
    if (uniqueProductIds.length === 0) return;

    const pendingIds = force
      ? uniqueProductIds
      : uniqueProductIds.filter((id) => !loadedMetricIdsRef.current.has(id));
    if (pendingIds.length === 0) return;

    const requestIds = pendingIds.slice(0, MAX_METRICS_BATCH_IDS);
    try {
      const session = await supabaseClient?.auth.getSession();
      const accessToken = session?.data?.session?.access_token || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const res = await fetch('/api/products/social/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productIds: requestIds }),
      });
      const data = await res.json();
      if (!res.ok) return;

      const next: Record<string, ProductMetric> = {};
      for (const [id, summary] of Object.entries<any>(data?.metrics || {})) {
        next[id] = {
          visits: Number(summary?.visits || 0),
          likes: Number(summary?.likes || 0),
          likedByCurrentVisitor: Boolean(summary?.likedByCurrentVisitor),
        };
      }

      setMetrics((prev) => ({
        ...prev,
        ...next,
      }));

      for (const id of requestIds) {
        loadedMetricIdsRef.current.add(id);
      }
    } catch {
      // Keep existing metrics if a refresh fails.
    }
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
      try {
        const res = await fetch('/api/catalog/public', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && Array.isArray(data?.products) && data.products.length > 0) {
          setProducts(data.products);
          return;
        }
      } catch {
        // Fallbacks below.
      }

      if (supabaseClient) {
        const { data: prods } = await supabaseClient
          .from('products')
          .select(CATALOG_QUERY_COLUMNS)
          .order('created_at', { ascending: false });
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
          return;
        }
      }

      setProducts(sampleProducts);
    };
    void load();
  }, []);

  useEffect(() => {
    loadedMetricIdsRef.current.clear();
    setMetrics({});
  }, [isLoggedIn]);

  useEffect(() => {
    if (products.length === 0) return;
    const metricTargetIds = products
      .filter((product) => isPrimaryStoreProduct(product) || isMysteryBoxProduct(product))
      .map((product) => String(product.id))
      .slice(0, MAX_METRICS_BATCH_IDS);
    void loadMetrics(metricTargetIds, true);
  }, [products, isLoggedIn, loadMetrics]);

  useEffect(() => {
    if (!isLoggedIn && favoritesOnly) {
      setFavoritesOnly(false);
    }
  }, [isLoggedIn, favoritesOnly]);

  useEffect(() => {
    const categoryParamRaw = String(searchParams.get('category') || '').trim();
    const categoryParamNormalized = normalizeText(categoryParamRaw);

    const normalizedCategoryParam =
      categoryParamNormalized === 'mystery' ||
      categoryParamNormalized === 'mystery box' ||
      categoryParamNormalized === 'mystery boxes' ||
      categoryParamNormalized === 'caja misteriosa' ||
      categoryParamNormalized === 'cajas misteriosas'
        ? MYSTERY_FILTER
        : categoryParamRaw;

    setActive(normalizedCategoryParam || 'all');

    const q = String(searchParams.get('q') || '').trim();
    setSearch(q);
  }, [searchParams]);

  const completeProductIds = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (isCompleteGameProduct(product, products)) {
        set.add(String(product.id));
      }
    }
    return set;
  }, [products]);

  const statusFacetOptions = useMemo(() => {
    const raw = Array.from(
      new Set(
        products
          .map((product) => normalizeStatusFacet(product?.status))
          .filter((value) => Boolean(value) && value !== 'sin-estado')
      )
    );
    return raw
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((value) => ({
        id: value,
        label: prettifyStatusLabel(value),
      }));
  }, [products]);

  const toggleMultiFilter = useCallback((value: string, setter: (next: (prev: string[]) => string[]) => void) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  }, []);

  const isMysteryView = String(active).toLowerCase() === MYSTERY_FILTER;

  const filtered = useMemo(() => {
    let list = products;
    const mysteryView = String(active).toLowerCase() === MYSTERY_FILTER;

    if (active === 'all') {
      list = list.filter((product) => isPrimaryStoreProduct(product));
    } else if (String(active).toLowerCase() === SPECIAL_CONSOLES_FILTER) {
      list = list.filter((product) => isSpecialConsoleEditionProduct(product) && hasRealCardImage(product));
    } else if (String(active).toLowerCase() === MYSTERY_FILTER) {
      list = list.filter((product) => isMysteryBoxProduct(product));
    } else if (String(active).toLowerCase() === MANUALS_CATEGORY) {
      list = list.filter((product) => isManualProduct(product));
    } else if (String(active).toLowerCase() === COMPLETE_GAMES_CATEGORY) {
      list = list.filter((product) => completeProductIds.has(String(product.id)));
    } else if (String(active).toLowerCase() === GAMES_FILTER) {
      list = list.filter((product) => isMainGameProduct(product));
    } else if (String(active).toLowerCase() === BOXES_FILTER) {
      list = list.filter((product) => isBoxProduct(product));
    } else if (String(active).toLowerCase().startsWith(PLATFORM_PREFIX)) {
      const key = String(active).toLowerCase().slice(PLATFORM_PREFIX.length);
      list = list.filter((product) => matchPlatform(product, key) && isPrimaryStoreProduct(product));
    } else {
      list = list.filter((product) => {
        const isCategoryMatch = getProductCategoryKey(product) === String(active);
        if (!isCategoryMatch) return false;
        return !isManualProduct(product);
      });
    }

    if (!mysteryView) {
      const searchTerms = normalizeText(search)
        .split(' ')
        .map((term) => term.trim())
        .filter((term) => term.length >= 2);
      if (searchTerms.length > 0) {
        list = list.filter((product) => {
          const haystack = normalizeText(
            `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
          );
          return searchTerms.every((term) => haystack.includes(term));
        });
      }

      if (selectedPlatforms.length > 0) {
        list = list.filter((product) =>
          selectedPlatforms.some((platformKey) => matchPlatform(product, platformKey))
        );
      }

      if (selectedTypes.length > 0) {
        list = list.filter((product) => {
          const typeFacets = getProductTypeFacets(product, completeProductIds);
          return selectedTypes.some((typeKey) => typeFacets.includes(typeKey));
        });
      }

      if (selectedEditions.length > 0) {
        list = list.filter((product) => {
          const editionFacet = normalizeEditionFacet(product?.edition);
          return selectedEditions.includes(editionFacet);
        });
      }

      if (selectedStatuses.length > 0) {
        list = list.filter((product) => selectedStatuses.includes(normalizeStatusFacet(product?.status)));
      }

      if (favoritesOnly) {
        list = list.filter((product) => Boolean(metrics[String(product.id)]?.likedByCurrentVisitor));
      }

      if (stockOnly) {
        list = list.filter((product) => Number(product?.stock || 0) > 0);
      }

      if (hasRealImageOnly) {
        list = list.filter((product) => hasRealCardImage(product));
      }

      if (completePackOnly) {
        list = list.filter((product) => completeProductIds.has(String(product.id)));
      }

      const presetRange = getPresetRangeCents(pricePreset);
      const manualMinCents = minPrice.trim() ? Math.max(0, Math.round(Number(minPrice) * 100)) : 0;
      const manualMaxCents = maxPrice.trim() ? Math.max(0, Math.round(Number(maxPrice) * 100)) : 0;
      const minCents = Math.max(presetRange.min, manualMinCents);
      const maxCandidates = [presetRange.max, manualMaxCents].filter((value) => value > 0);
      const maxCents = maxCandidates.length > 0 ? Math.min(...maxCandidates) : 0;

      if (minCents > 0) {
        list = list.filter((product) => Number(product?.price || 0) >= minCents);
      }

      if (maxCents > 0) {
        list = list.filter((product) => Number(product?.price || 0) <= maxCents);
      }
    }

    return list;
  }, [
    products,
    active,
    completeProductIds,
    search,
    selectedPlatforms,
    selectedTypes,
    selectedEditions,
    selectedStatuses,
    favoritesOnly,
    stockOnly,
    hasRealImageOnly,
    completePackOnly,
    minPrice,
    maxPrice,
    pricePreset,
    metrics,
  ]);

  const sorted = useMemo(() => {
    const sortedPrimary = sortProducts(filtered, sortBy, metrics);
    if (sortedPrimary.length > 0) return sortedPrimary;

    const fallbackPool = products.filter((product) => {
      if (isMysteryBoxProduct(product)) return true;
      if (isPrimaryStoreProduct(product)) return true;
      if (isLikelyComponentProduct(product)) return false;
      const category = String(product?.category || product?.category_id || '').toLowerCase();
      if (category && !isUuidLike(category) && category.includes('manual')) return false;
      return buildBaseGameTitle(String(product?.name || '')).length >= 2;
    });

    return sortProducts(fallbackPool, sortBy, metrics);
  }, [filtered, products, sortBy, metrics]);

  const usingFallbackCatalog = filtered.length === 0 && sorted.length > 0;
  const hasNoProducts = sorted.length === 0;

  const { featuredTrending, featuredBestRated, featuredLatest } = useMemo(() => {
    const withImagePriority = (a: any, b: any) => Number(hasRealCardImage(b)) - Number(hasRealCardImage(a));
    const byNewest = (a: any, b: any) =>
      new Date(String(b?.created_at || 0)).getTime() - new Date(String(a?.created_at || 0)).getTime();

    const engagementSorted = [...sorted].sort((a, b) => {
      const scoreDiff = getEngagementScore(b, metrics) - getEngagementScore(a, metrics);
      if (scoreDiff !== 0) return scoreDiff;
      const imageDiff = withImagePriority(a, b);
      if (imageDiff !== 0) return imageDiff;
      return byNewest(a, b);
    });

    const bestRatedSorted = [...sorted].sort((a, b) => {
      const likesDiff = Number(metrics[String(b?.id)]?.likes || 0) - Number(metrics[String(a?.id)]?.likes || 0);
      if (likesDiff !== 0) return likesDiff;
      const visitsDiff = Number(metrics[String(b?.id)]?.visits || 0) - Number(metrics[String(a?.id)]?.visits || 0);
      if (visitsDiff !== 0) return visitsDiff;
      const imageDiff = withImagePriority(a, b);
      if (imageDiff !== 0) return imageDiff;
      return byNewest(a, b);
    });

    const latestSorted = [...sorted].sort((a, b) => {
      const newestDiff = byNewest(a, b);
      if (newestDiff !== 0) return newestDiff;
      return withImagePriority(a, b);
    });

    const used = new Set<string>();
    return {
      featuredTrending: pickFeaturedColumn(engagementSorted, 3, used),
      featuredBestRated: pickFeaturedColumn(bestRatedSorted, 3, used),
      featuredLatest: pickFeaturedColumn(latestSorted, 3, used),
    };
  }, [sorted, metrics]);

  const consoleHighlights = useMemo(() => {
    const consoleList = products.filter((product) => matchPlatform(product, 'consolas') && !isMysteryBoxProduct(product));
    return sortProducts(consoleList, 'newest', metrics).slice(0, 4);
  }, [products, metrics]);

  const specialConsoleHighlights = useMemo(() => {
    const specials = products.filter(
      (product) => isSpecialConsoleEditionProduct(product) && hasRealCardImage(product)
    );
    return sortProducts(specials, 'newest', metrics).slice(0, 4);
  }, [products, metrics]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (sortBy !== 'newest') count += 1;
    if (pricePreset !== 'all') count += 1;
    if (selectedPlatforms.length > 0) count += selectedPlatforms.length;
    if (selectedTypes.length > 0) count += selectedTypes.length;
    if (selectedEditions.length > 0) count += selectedEditions.length;
    if (selectedStatuses.length > 0) count += selectedStatuses.length;
    if (favoritesOnly) count += 1;
    if (stockOnly) count += 1;
    if (hasRealImageOnly) count += 1;
    if (completePackOnly) count += 1;
    if (minPrice.trim()) count += 1;
    if (maxPrice.trim()) count += 1;
    if (active !== 'all') count += 1;
    return count;
  }, [
    search,
    sortBy,
    pricePreset,
    selectedPlatforms,
    selectedTypes,
    selectedEditions,
    selectedStatuses,
    favoritesOnly,
    stockOnly,
    hasRealImageOnly,
    completePackOnly,
    minPrice,
    maxPrice,
    active,
  ]);

  const totalVisibleStock = useMemo(
    () => sorted.reduce((sum, product) => sum + Math.max(0, Number(product?.stock || 0)), 0),
    [sorted]
  );

  const visibleProducts = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const hasMoreProducts = visibleCount < sorted.length;

  useEffect(() => {
    setVisibleCount(24);
  }, [
    active,
    search,
    sortBy,
    pricePreset,
    selectedPlatforms,
    selectedTypes,
    selectedEditions,
    selectedStatuses,
    favoritesOnly,
    stockOnly,
    hasRealImageOnly,
    completePackOnly,
    minPrice,
    maxPrice,
  ]);

  const renderMiniProduct = (product: any, label: string, className = '') => {
    const productId = String(product.id);
    const productHref = getProductHref(product);
    return (
      <Link
        key={`${label}-${productId}`}
        href={productHref}
        className={`glass p-3 hover:shadow-glow transition-shadow group ${className}`.trim()}
      >
        <div className="relative w-full h-36 bg-surface border border-line rounded-xl overflow-hidden">
          <SafeImage
            src={getProductImageUrl(product)}
            fallbackSrc={getProductFallbackImageUrl(product)}
            alt={product.name}
            fill
            className="object-contain p-2"
          />
        </div>
        <p className="text-xs text-primary mt-3">{label}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mt-1">{product.name}</h3>
        <p className="text-xs text-textMuted mt-1">{(Number(product.price || 0) / 100).toFixed(2)} €</p>
        <p className="text-xs text-textMuted mt-2 group-hover:text-text">Ver producto</p>
      </Link>
    );
  };

  const filterPanel = isMysteryView ? (
    <div className="glass p-5 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p className="font-semibold text-primary">Vista mystery simplificada</p>
        <p className="text-sm text-textMuted mt-1">
          Sin filtros extra. Elige caja y compra tirada directamente.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/ruleta" className="button-primary">
          Ir a ruleta
        </Link>
        <Link href="/perfil" className="button-secondary">
          Ver mis tickets
        </Link>
      </div>
    </div>
  ) : (
    <div className="glass p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold">Filtros</p>
          <p className="text-xs text-textMuted">
            {activeFilterCount} filtros activos · Búsqueda ordenada sin bloquear la vista del catálogo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="chip"
            onClick={() => {
              setActive('all');
              setSearch('');
              setSortBy('newest');
              setPricePreset('all');
              setSelectedPlatforms([]);
              setSelectedTypes([]);
              setSelectedEditions([]);
              setSelectedStatuses([]);
              setFavoritesOnly(false);
              setStockOnly(false);
              setHasRealImageOnly(false);
              setCompletePackOnly(false);
              setMinPrice('');
              setMaxPrice('');
            }}
          >
            Limpiar
          </button>
          <button
            className={`chip ${isMobileFiltersOpen ? 'text-primary border-primary' : ''}`}
            onClick={() => setIsMobileFiltersOpen((value) => !value)}
            aria-expanded={isMobileFiltersOpen}
          >
            {isMobileFiltersOpen ? 'Cerrar filtros' : 'Abrir filtros'}
          </button>
        </div>
      </div>

      {!isMobileFiltersOpen ? (
        <div className="rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
          <p className="text-xs text-textMuted">
            Filtros ocultos para vista limpia. Pulsa en <span className="text-text">“Abrir filtros”</span> para desplegar.
          </p>
        </div>
      ) : null}

      <div className={`${isMobileFiltersOpen ? 'grid' : 'hidden'} gap-4`}>
        <div className="grid gap-3 lg:grid-cols-[1.55fr,1fr,1fr,1fr,1fr]">
          <input
            className="w-full bg-transparent border border-line px-3 py-2"
            placeholder="Buscar por nombre, descripción o palabras clave"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="w-full bg-transparent border border-line px-3 py-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full bg-transparent border border-line px-3 py-2"
              placeholder="Min €"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              className="w-full bg-transparent border border-line px-3 py-2"
              placeholder="Max €"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <button
            className={`chip justify-center ${favoritesOnly ? 'text-primary border-primary' : ''}`}
            onClick={() => setFavoritesOnly((prev) => !prev)}
            disabled={!isLoggedIn}
          >
            {isLoggedIn ? 'Solo favoritos' : 'Solo favoritos (login)'}
          </button>

          <button
            className={`chip justify-center ${stockOnly ? 'text-primary border-primary' : ''}`}
            onClick={() => setStockOnly((prev) => !prev)}
          >
            Solo con stock
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-primary">Búsqueda avanzada</p>
            <p className="text-xs text-textMuted mt-1">Combina plataforma, tipo, edición, estado y rango.</p>
          </div>
          <button
            className={`chip ${isAdvancedFiltersOpen ? 'text-primary border-primary' : ''}`}
            onClick={() => setIsAdvancedFiltersOpen((prev) => !prev)}
          >
            {isAdvancedFiltersOpen ? 'Ocultar avanzado' : 'Mostrar avanzado'}
          </button>
        </div>

        {isAdvancedFiltersOpen ? (
          <div className="grid gap-3">
            <div>
              <p className="text-xs text-textMuted mb-2">Rango rápido de precio</p>
              <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                {PRICE_RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`chip shrink-0 ${pricePreset === preset.id ? 'text-primary border-primary' : ''}`}
                    onClick={() => setPricePreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-textMuted mb-2">Plataforma</p>
              <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                {PLATFORM_FACET_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`chip shrink-0 ${selectedPlatforms.includes(option.id) ? 'text-primary border-primary' : ''}`}
                    onClick={() => toggleMultiFilter(option.id, setSelectedPlatforms)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-textMuted mb-2">Tipo de artículo</p>
              <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                {TYPE_FACET_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`chip shrink-0 ${selectedTypes.includes(option.id) ? 'text-primary border-primary' : ''}`}
                    onClick={() => toggleMultiFilter(option.id, setSelectedTypes)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <p className="text-xs text-textMuted mb-2">Edición</p>
                <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                  {EDITION_FACET_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`chip shrink-0 ${selectedEditions.includes(option.id) ? 'text-primary border-primary' : ''}`}
                      onClick={() => toggleMultiFilter(option.id, setSelectedEditions)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {statusFacetOptions.length > 0 ? (
                <div>
                  <p className="text-xs text-textMuted mb-2">Estado</p>
                  <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                    {statusFacetOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`chip shrink-0 ${selectedStatuses.includes(option.id) ? 'text-primary border-primary' : ''}`}
                        onClick={() => toggleMultiFilter(option.id, setSelectedStatuses)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <p className="text-xs text-textMuted mb-2">Extras visuales</p>
              <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
                <button
                  type="button"
                  className={`chip shrink-0 ${hasRealImageOnly ? 'text-primary border-primary' : ''}`}
                  onClick={() => setHasRealImageOnly((prev) => !prev)}
                >
                  Solo con imagen real
                </button>
                <button
                  type="button"
                  className={`chip shrink-0 ${completePackOnly ? 'text-primary border-primary' : ''}`}
                  onClick={() => setCompletePackOnly((prev) => !prev)}
                >
                  Solo juego completo
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isMobileFiltersOpen ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
            <p className="text-xs text-textMuted">Resultados visibles</p>
            <p className="text-primary text-lg font-semibold mt-1">{sorted.length}</p>
            <p className="text-xs text-textMuted mt-1">{activeFilterCount} filtros activos</p>
          </div>
          <div className="rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
            <p className="text-xs text-textMuted">Stock total visible</p>
            <p className="text-primary text-lg font-semibold mt-1">{totalVisibleStock}</p>
            <p className="text-xs text-textMuted mt-1">Suma de stock en esta vista</p>
          </div>
          <div className="rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)] flex flex-col justify-between">
            <div>
              <p className="text-xs text-textMuted">Acción rápida</p>
              <p className="text-sm mt-1">Restablecer filtros y volver al catálogo general</p>
            </div>
            <button
              className="chip mt-2 self-start"
              onClick={() => {
                setActive('all');
                setSearch('');
                setSortBy('newest');
                setPricePreset('all');
                setSelectedPlatforms([]);
                setSelectedTypes([]);
                setSelectedEditions([]);
                setSelectedStatuses([]);
                setFavoritesOnly(false);
                setStockOnly(false);
                setHasRealImageOnly(false);
                setCompletePackOnly(false);
                setMinPrice('');
                setMaxPrice('');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-4 sm:p-5 mb-6">
          <div className="mobile-scroll-row no-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            <div className="min-w-[240px] md:min-w-0 rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
              <p className="text-primary text-sm font-semibold">Envíos desde España</p>
              <p className="text-xs text-textMuted mt-1">Preparación y salida en 24-48h laborables.</p>
            </div>
            <div className="min-w-[240px] md:min-w-0 rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
              <p className="text-primary text-sm font-semibold">Revisado y testado</p>
              <p className="text-xs text-textMuted mt-1">Cada pieza se comprueba antes de publicarse.</p>
            </div>
            <div className="min-w-[240px] md:min-w-0 rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
              <p className="text-primary text-sm font-semibold">Garantía coleccionista</p>
              <p className="text-xs text-textMuted mt-1">Soporte por ticket y seguimiento real del pedido.</p>
            </div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 mb-8">
          <p className="text-sm text-textMuted leading-relaxed">
            Cada cartucho tiene historia. Mystery Box es azar con tiradas y premios; Ruleta es el panel de giro; Encargos es compra asistida 1 a 1.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Catálogo profesional</p>
            <h1 className="title-display text-3xl">Catálogo</h1>
            <p className="text-textMuted">Retro revisado por coleccionistas y listo para tu vitrina.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`chip shrink-0 ${active === filter.id ? 'text-text border-primary bg-[rgba(75,228,214,0.14)]' : ''}`}
                  onClick={() => setActive(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
              {PLATFORM_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`chip shrink-0 ${active === filter.id ? 'text-text border-primary bg-[rgba(75,228,214,0.14)]' : ''}`}
                  onClick={() => setActive(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filterPanel}

        {active === 'all' && consoleHighlights.length > 0 ? (
          <div className="glass p-4 sm:p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Acceso rápido</p>
                <h2 className="title-display text-2xl mt-1">Consolas y cosas de consola</h2>
                <p className="text-sm text-textMuted mt-1">
                  Apartado dedicado para hardware, cajas, manuales y protectores de consola.
                </p>
              </div>
              <button
                className="button-secondary self-start"
                onClick={() => setActive(`${PLATFORM_PREFIX}consolas`)}
              >
                Ver apartado consolas
              </button>
            </div>
            <div className="mobile-scroll-row no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
              {consoleHighlights.map((product) => (
                <Link
                  key={`console-highlight-${String(product.id)}`}
                  href={getProductHref(product)}
                  className="w-[230px] shrink-0 sm:w-auto rounded-xl border border-line bg-[rgba(10,20,34,0.82)] p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="relative h-32 rounded-lg border border-line bg-surface overflow-hidden">
                    <SafeImage
                      src={getProductImageUrl(product)}
                      fallbackSrc={getProductFallbackImageUrl(product)}
                      alt={String(product?.name || 'Producto de consola')}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <p className="text-sm font-semibold mt-3 line-clamp-2">{String(product?.name || '')}</p>
                  <p className="text-xs text-textMuted mt-1">{(Number(product?.price || 0) / 100).toFixed(2)} €</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {active === 'all' && specialConsoleHighlights.length > 0 ? (
          <div className="glass p-4 sm:p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Coleccionismo</p>
                <h2 className="title-display text-2xl mt-1">Ediciones especiales de consolas</h2>
                <p className="text-sm text-textMuted mt-1">
                  Solo hardware especial o raro de Game Boy, GBC, GBA, SNES y GameCube.
                </p>
              </div>
              <button className="button-secondary self-start" onClick={() => setActive(SPECIAL_CONSOLES_FILTER)}>
                Ver ediciones especiales
              </button>
            </div>
            <div className="mobile-scroll-row no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
              {specialConsoleHighlights.map((product) => (
                <Link
                  key={`special-console-highlight-${String(product.id)}`}
                  href={getProductHref(product)}
                  className="w-[230px] shrink-0 sm:w-auto rounded-xl border border-line bg-[rgba(10,20,34,0.82)] p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="relative h-32 rounded-lg border border-line bg-surface overflow-hidden">
                    <SafeImage
                      src={getProductImageUrl(product)}
                      fallbackSrc={getProductFallbackImageUrl(product)}
                      alt={String(product?.name || 'Edición especial')}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <p className="text-sm font-semibold mt-3 line-clamp-2">{String(product?.name || '')}</p>
                  <p className="text-xs text-textMuted mt-1">{(Number(product?.price || 0) / 100).toFixed(2)} €</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {!hasNoProducts && !isMysteryView ? (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div>
              <h2 className="font-semibold mb-2 text-lg">Trending retro</h2>
              <div className="mobile-scroll-row no-scrollbar md:grid md:overflow-visible md:pb-0 gap-3">
                {featuredTrending.map((product) => renderMiniProduct(product, 'Trending', 'w-[230px] shrink-0 md:w-auto'))}
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-lg">Más valorados</h2>
              <div className="mobile-scroll-row no-scrollbar md:grid md:overflow-visible md:pb-0 gap-3">
                {featuredBestRated.map((product) => renderMiniProduct(product, 'Top', 'w-[230px] shrink-0 md:w-auto'))}
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-lg">Últimas entradas</h2>
              <div className="mobile-scroll-row no-scrollbar md:grid md:overflow-visible md:pb-0 gap-3">
                {featuredLatest.map((product) => renderMiniProduct(product, 'Nuevo', 'w-[230px] shrink-0 md:w-auto'))}
              </div>
            </div>
          </div>
        ) : null}

        <p className="text-sm text-textMuted mb-4">
          Resultados: {sorted.length}{isMysteryView ? ' · Cajas misteriosas activas' : ''}
          {usingFallbackCatalog ? ' · Mostrando selección recomendada mientras ajustas filtros/categorías.' : ''}
        </p>

        {hasNoProducts ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`placeholder-${index}`} className="glass p-4">
                <div className="w-full h-56 bg-surface border border-line animate-pulse" />
                <div className="mt-4 h-4 bg-surface animate-pulse" />
                <div className="mt-2 h-4 bg-surface animate-pulse w-2/3" />
                <p className="text-xs text-textMuted mt-4">Próximas entradas retro</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => {
              const productId = String(product.id);
              const isComplete = completeProductIds.has(productId);
              const isCompleteView = String(active).toLowerCase() === COMPLETE_GAMES_CATEGORY;
              const href = getProductHref(product, { complete: isCompleteView });
              const productMetrics = metrics[productId];

              return (
                <Link
                  key={product.id}
                  href={href}
                  className="glass p-3 sm:p-4 hover:shadow-glow transition-all group hover:-translate-y-0.5 flex gap-3 sm:block"
                >
                  <div className="relative h-28 w-[116px] shrink-0 sm:w-full sm:h-56 bg-surface border border-line rounded-xl overflow-hidden">
                    <SafeImage
                      src={getProductImageUrl(product)}
                      fallbackSrc={getProductFallbackImageUrl(product)}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="chip text-xs">{product.status}</span>
                      {Number(product.stock || 0) <= 0 ? (
                        <span className="chip text-xs border-red-400 text-red-300">Sin stock</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-0 sm:mt-4 min-w-0 flex-1">
                    <h3 className="font-semibold text-text leading-tight line-clamp-2 sm:min-h-[42px]">{product.name}</h3>
                    <p className="text-textMuted text-sm line-clamp-2 mt-2 sm:min-h-[40px]">{product.description}</p>
                    <p className="text-primary font-semibold mt-2 sm:mt-3 text-base sm:text-lg">{(Number(product.price || 0) / 100).toFixed(2)} €</p>
                    <p className="text-xs text-textMuted mt-1">Stock: {product.stock}</p>
                    {!isMysteryView ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="chip">Visitas: {productMetrics?.visits ?? 0}</span>
                        <span className="chip">Favoritos: {productMetrics?.likes ?? 0}</span>
                        {productMetrics?.likedByCurrentVisitor ? (
                          <span className="chip border-primary text-primary">Favorito</span>
                        ) : null}
                      </div>
                    ) : null}
                    {isComplete ? <p className="text-xs text-primary mt-1">Pack completo disponible</p> : null}
                    <span className="mt-3 inline-flex items-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors group-hover:border-primary group-hover:bg-primary/20">
                      Abrir ficha del producto
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!hasNoProducts && hasMoreProducts ? (
          <div className="mt-6 flex justify-center">
            <button className="button-secondary" onClick={() => setVisibleCount((count) => count + 24)}>
              Cargar más productos
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
