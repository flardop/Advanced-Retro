import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sampleProducts } from '@/lib/sampleData';

export const PUBLIC_CATALOG_COLUMNS = [
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
  'updated_at',
  'category',
  'category_id',
  'is_mystery_box',
  'component_type',
  'collection_key',
  'edition',
  'platform',
].join(',');

export const PUBLIC_CATALOG_LIMIT = 600;

export type PublicCatalogProduct = {
  id: string;
  name: string;
  description: string;
  long_description: string;
  price: number;
  stock: number;
  image: string;
  images: string[];
  status: string;
  created_at: string | null;
  updated_at: string | null;
  category: string;
  category_id: string;
  is_mystery_box: boolean;
  component_type: string;
  collection_key: string;
  edition: string;
  platform: string;
};

export function sanitizeCatalogRows(rows: any[]): PublicCatalogProduct[] {
  return rows.map((item) => ({
    id: String(item?.id || ''),
    name: String(item?.name || ''),
    description: String(item?.description || ''),
    long_description: String(item?.long_description || ''),
    price: Number(item?.price || 0),
    stock: Number(item?.stock || 0),
    image: String(item?.image || ''),
    images: Array.isArray(item?.images) ? item.images.map((entry: unknown) => String(entry || '')).filter(Boolean) : [],
    status: String(item?.status || ''),
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null,
    category: String(item?.category || ''),
    category_id: String(item?.category_id || ''),
    is_mystery_box: Boolean(item?.is_mystery_box),
    component_type: String(item?.component_type || ''),
    collection_key: String(item?.collection_key || ''),
    edition: String(item?.edition || ''),
    platform: String(item?.platform || ''),
  }));
}

async function fetchWithAnonFallback(limit: number): Promise<PublicCatalogProduct[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.ANON ||
    '';
  if (!supabaseUrl || !anonKey) return [];

  try {
    const anon = createClient(supabaseUrl, anonKey);
    const { data, error } = await anon
      .from('products')
      .select(PUBLIC_CATALOG_COLUMNS)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error || !Array.isArray(data)) return [];
    return sanitizeCatalogRows(data);
  } catch {
    return [];
  }
}

export async function getPublicCatalogProducts(limit = PUBLIC_CATALOG_LIMIT): Promise<{
  products: PublicCatalogProduct[];
  source: 'supabase_admin' | 'supabase_anon' | 'sample';
}> {
  let products: PublicCatalogProduct[] = [];
  let source: 'supabase_admin' | 'supabase_anon' | 'sample' = 'sample';

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(PUBLIC_CATALOG_COLUMNS)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data) && data.length > 0) {
      products = sanitizeCatalogRows(data);
      source = 'supabase_admin';
    }
  }

  if (products.length === 0) {
    const anonProducts = await fetchWithAnonFallback(limit);
    if (anonProducts.length > 0) {
      products = anonProducts;
      source = 'supabase_anon';
    }
  }

  if (products.length === 0) {
    products = sanitizeCatalogRows(sampleProducts);
    source = 'sample';
  }

  return { products, source };
}
