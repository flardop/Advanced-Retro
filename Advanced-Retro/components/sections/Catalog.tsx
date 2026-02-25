'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { sampleProducts } from '@/lib/sampleData';
import { getProductFallbackImageUrl, getProductImageUrl } from '@/lib/imageUrl';
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
const PLATFORM_PREFIX = 'platform:';
const QUICK_FILTERS = [
  { id: 'all', label: 'Todos' },
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

const SORT_OPTIONS = [
  { id: 'newest', label: 'Novedades' },
  { id: 'name_asc', label: 'A-Z' },
  { id: 'name_desc', label: 'Z-A' },
  { id: 'price_asc', label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
  { id: 'likes_desc', label: 'Más me gusta' },
  { id: 'visits_desc', label: 'Más visitas' },
  { id: 'stock_desc', label: 'Más stock' },
];

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

function matchPlatform(product: any, filterId: string): boolean {
  const source = normalizeText(
    `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.category || '')}`
  );

  if (filterId === 'consolas') {
    return source.includes('consola');
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
  return name.startsWith('consola ');
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

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [active, setActive] = useState<string>('all');
  const [metrics, setMetrics] = useState<Record<string, ProductMetric>>({});
  const [visitorId, setVisitorId] = useState('');

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [stockOnly, setStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const loadMetrics = async (productIds: string[], currentVisitorId: string) => {
    if (productIds.length === 0) return;
    try {
      const res = await fetch('/api/products/social/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          visitorId: currentVisitorId || undefined,
        }),
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
      setMetrics(next);
    } catch {
      setMetrics({});
    }
  };

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!supabaseClient) {
        setProducts(sampleProducts);
        loadMetrics(sampleProducts.map((product) => String(product.id)), visitorId);
        return;
      }
      const { data: prods } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      const safeProducts = prods || [];

      setProducts(safeProducts);
      loadMetrics(
        safeProducts.map((product) => String(product.id)),
        visitorId
      );
    };
    load();
  }, [visitorId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const categoryParam = String(params.get('category') || '').trim();
    if (categoryParam) setActive(categoryParam);

    const q = String(params.get('q') || '').trim();
    if (q) setSearch(q);
  }, []);

  const completeProductIds = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (isCompleteGameProduct(product, products)) {
        set.add(String(product.id));
      }
    }
    return set;
  }, [products]);

  const isMysteryView = String(active).toLowerCase() === MYSTERY_FILTER;

  const filtered = useMemo(() => {
    let list = products;
    const mysteryView = String(active).toLowerCase() === MYSTERY_FILTER;

    if (active === 'all') {
      list = list.filter((product) => isPrimaryStoreProduct(product));
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
      const searchQuery = normalizeText(search);
      if (searchQuery) {
        list = list.filter((product) => {
          const haystack = normalizeText(
            `${String(product?.name || '')} ${String(product?.description || '')} ${String(product?.long_description || '')}`
          );
          return haystack.includes(searchQuery);
        });
      }

      if (favoritesOnly) {
        list = list.filter((product) => Boolean(metrics[String(product.id)]?.likedByCurrentVisitor));
      }

      if (stockOnly) {
        list = list.filter((product) => Number(product?.stock || 0) > 0);
      }

      const minCents = minPrice.trim() ? Math.max(0, Math.round(Number(minPrice) * 100)) : 0;
      const maxCents = maxPrice.trim() ? Math.max(0, Math.round(Number(maxPrice) * 100)) : 0;

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
    favoritesOnly,
    stockOnly,
    minPrice,
    maxPrice,
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

  const featuredTrending = useMemo(
    () =>
      [...sorted]
        .sort(
          (a, b) =>
            Number(metrics[String(b.id)]?.visits || 0) +
            Number(metrics[String(b.id)]?.likes || 0) -
            (Number(metrics[String(a.id)]?.visits || 0) + Number(metrics[String(a.id)]?.likes || 0))
        )
        .slice(0, 3),
    [sorted, metrics]
  );

  const featuredBestRated = useMemo(
    () =>
      [...sorted]
        .sort((a, b) => Number(metrics[String(b.id)]?.likes || 0) - Number(metrics[String(a.id)]?.likes || 0))
        .slice(0, 3),
    [sorted, metrics]
  );

  const featuredLatest = useMemo(
    () =>
      [...sorted]
        .sort(
          (a, b) =>
            new Date(String(b?.created_at || 0)).getTime() - new Date(String(a?.created_at || 0)).getTime()
        )
        .slice(0, 3),
    [sorted]
  );

  const renderMiniProduct = (product: any, label: string) => {
    const productId = String(product.id);
    return (
      <Link
        key={`${label}-${productId}`}
        href={`/producto/${productId}`}
        className="glass p-3 hover:shadow-glow transition-shadow group"
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

  return (
    <section className="section">
      <div className="container">
        <div className="glass p-5 mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
            <p className="text-primary text-sm font-semibold">Envíos desde España</p>
            <p className="text-xs text-textMuted mt-1">Preparación y salida en 24-48h laborables.</p>
          </div>
          <div className="rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
            <p className="text-primary text-sm font-semibold">Revisado y testado</p>
            <p className="text-xs text-textMuted mt-1">Cada pieza se comprueba antes de publicarse.</p>
          </div>
          <div className="rounded-xl border border-line p-3 bg-[rgba(12,22,36,0.66)]">
            <p className="text-primary text-sm font-semibold">Garantía coleccionista</p>
            <p className="text-xs text-textMuted mt-1">Soporte por ticket y seguimiento real del pedido.</p>
          </div>
        </div>

        <div className="glass p-5 mb-8">
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
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`chip ${active === filter.id ? 'text-text border-primary bg-[rgba(75,228,214,0.14)]' : ''}`}
                  onClick={() => setActive(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`chip ${active === filter.id ? 'text-text border-primary bg-[rgba(75,228,214,0.14)]' : ''}`}
                  onClick={() => setActive(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!hasNoProducts && !isMysteryView ? (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div>
              <h2 className="font-semibold mb-2 text-lg">Trending retro</h2>
              <div className="grid gap-3">{featuredTrending.map((product) => renderMiniProduct(product, 'Trending'))}</div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-lg">Más valorados</h2>
              <div className="grid gap-3">{featuredBestRated.map((product) => renderMiniProduct(product, 'Top'))}</div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-lg">Últimas entradas</h2>
              <div className="grid gap-3">{featuredLatest.map((product) => renderMiniProduct(product, 'Nuevo'))}</div>
            </div>
          </div>
        ) : null}

        {isMysteryView ? (
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
          <div className="glass p-5 mb-6 grid gap-3 lg:grid-cols-[1.55fr,1fr,1fr,1fr,1fr]">
            <input
              className="w-full bg-transparent border border-line px-3 py-2"
              placeholder="Buscar por nombre o descripción"
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
              className={`chip ${favoritesOnly ? 'text-primary border-primary' : ''}`}
              onClick={() => setFavoritesOnly((prev) => !prev)}
            >
              Solo favoritos
            </button>

            <button
              className={`chip ${stockOnly ? 'text-primary border-primary' : ''}`}
              onClick={() => setStockOnly((prev) => !prev)}
            >
              Solo con stock
            </button>
          </div>
        )}

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((product) => {
              const productId = String(product.id);
              const isComplete = completeProductIds.has(productId);
              const isCompleteView = String(active).toLowerCase() === COMPLETE_GAMES_CATEGORY;
              const href = isCompleteView ? `/producto/${productId}?complete=1` : `/producto/${productId}`;
              const productMetrics = metrics[productId];

              return (
                <Link
                  key={product.id}
                  href={href}
                  className="glass p-4 hover:shadow-glow transition-shadow group"
                >
                  <div className="relative w-full h-56 bg-surface border border-line rounded-xl overflow-hidden">
                    <SafeImage
                      src={getProductImageUrl(product)}
                      fallbackSrc={getProductFallbackImageUrl(product)}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                    />
                    <span className="absolute top-3 left-3 chip text-xs">{product.status}</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-text leading-tight min-h-[42px]">{product.name}</h3>
                    <p className="text-textMuted text-sm line-clamp-2 mt-2 min-h-[40px]">{product.description}</p>
                    <p className="text-primary font-semibold mt-3 text-lg">{(Number(product.price || 0) / 100).toFixed(2)} €</p>
                    <p className="text-xs text-textMuted mt-1">Stock: {product.stock}</p>
                    {!isMysteryView ? (
                      <p className="text-xs text-textMuted mt-1">
                        Visitas: {productMetrics?.visits ?? 0} · Me gusta: {productMetrics?.likes ?? 0}
                        {productMetrics?.likedByCurrentVisitor ? ' · Favorito' : ''}
                      </p>
                    ) : null}
                    {isComplete ? <p className="text-xs text-primary mt-1">Pack completo disponible</p> : null}
                    <p className="text-xs text-textMuted mt-2 group-hover:text-text">Abrir ficha del producto</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
