import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { listAdminProducts } from '@/lib/admin/data';
import { supabaseService } from '@/lib/supabase/service';

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  return withAdminRoute(async () => listAdminProducts());
}

export async function POST(request: NextRequest) {
  return withAdminRoute(async () => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const description = String(payload.description || '');

    const { data: product, error } = await supabaseService
      .from('products')
      .insert({
        name: String(payload.name || 'Nuevo producto'),
        slug: String(payload.slug || '').trim() || null,
        description: stripHtml(description),
        long_description: description,
        image: payload.image || null,
        images: Array.isArray(payload.images) ? payload.images : [],
        category: payload.category || null,
        price: Number(payload.price || 0),
        stock: Number(payload.stock || 0),
        is_active: payload.is_active !== false,
        ebay_query: payload.ebay_query || null,
      })
      .select('*')
      .single();

    if (error || !product) throw error || new Error('No se pudo crear el producto');

    await supabaseService.from('admin_product_meta').upsert({
      product_id: product.id,
      compare_at_price_cents: Number(payload.meta?.compare_at_price_cents || 0) || null,
      sku: payload.meta?.sku || null,
      tags: Array.isArray(payload.meta?.tags) ? payload.meta.tags : [],
      seo_title: payload.meta?.seo_title || null,
      seo_description: payload.meta?.seo_description || null,
      seo_handle: payload.meta?.seo_handle || payload.slug || null,
      image_paths: Array.isArray(payload.meta?.image_paths) ? payload.meta.image_paths : Array.isArray(payload.images) ? payload.images : [],
      updated_at: new Date().toISOString(),
    });

    return product;
  });
}
