import { NextResponse } from 'next/server';
import { getPublicCatalogProducts } from '@/lib/publicCatalog';

export async function GET() {
  try {
    const { products, source } = await getPublicCatalogProducts();

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
    const { products } = await getPublicCatalogProducts();
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'catalog_unavailable',
        source: 'error_fallback',
        count: products.length,
        products,
      },
      { status: 200 }
    );
  }
}
