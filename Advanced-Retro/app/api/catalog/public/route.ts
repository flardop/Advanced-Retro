import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sampleProducts } from '@/lib/sampleData';

const PUBLIC_CATALOG_COLUMNS = [
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
const PUBLIC_CATALOG_LIMIT = 600;

function sanitizeCatalogRows(rows: any[]): any[] {
  return rows.map((item) => ({
    id: item?.id,
    name: item?.name,
    description: item?.description || '',
    long_description: item?.long_description || '',
    price: Number(item?.price || 0),
    stock: Number(item?.stock || 0),
    image: item?.image || '',
    images: Array.isArray(item?.images) ? item.images : [],
    status: item?.status || '',
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null,
    category: item?.category || '',
    category_id: item?.category_id || '',
    is_mystery_box: Boolean(item?.is_mystery_box),
    component_type: item?.component_type || '',
    collection_key: item?.collection_key || '',
    edition: item?.edition || '',
    platform: item?.platform || '',
  }));
}

async function fetchWithAnonFallback(): Promise<any[]> {
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
      .limit(PUBLIC_CATALOG_LIMIT);
    if (error || !Array.isArray(data)) return [];
    return sanitizeCatalogRows(data);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    let products: any[] = [];
    let source = 'sample';

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(PUBLIC_CATALOG_COLUMNS)
        .order('updated_at', { ascending: false })
        .limit(PUBLIC_CATALOG_LIMIT);

      if (!error && Array.isArray(data) && data.length > 0) {
        products = sanitizeCatalogRows(data);
        source = 'supabase_admin';
      }
    }

    if (products.length === 0) {
      const anonProducts = await fetchWithAnonFallback();
      if (anonProducts.length > 0) {
        products = anonProducts;
        source = 'supabase_anon';
      }
    }

    if (products.length === 0) {
      products = sanitizeCatalogRows(sampleProducts);
      source = 'sample';
    }

    return NextResponse.json(
      {
        ok: true,
        source,
        count: products.length,
        products,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=90, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'catalog_unavailable',
        source: 'error_fallback',
        count: sampleProducts.length,
        products: sanitizeCatalogRows(sampleProducts),
      },
      { status: 200 }
    );
  }
}
