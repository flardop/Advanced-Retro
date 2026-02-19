import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { searchGameImages } from '@/lib/gameImages';
import { detectImagePlatformFromProduct, stripProductNameForExternalSearch } from '@/lib/catalogPlatform';

export const dynamic = 'force-dynamic';

const requireAdmin = async () => {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Unauthorized');
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (userRow?.role !== 'admin') throw new Error('Forbidden');
  return data.user;
};

/**
 * POST /api/admin/products/update-images
 * 
 * Actualiza automáticamente las imágenes de todos los productos que no tienen imágenes válidas
 * Busca imágenes basándose en el nombre del producto
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { forceUpdate } = await req.json().catch(() => ({}));

    let usesCategoryId = true;
    let productsQuery: any = await supabaseAdmin
      .from('products')
      .select('id, name, images, category_id')
      .order('name');

    if (productsQuery.error && productsQuery.error.message.includes('category_id')) {
      usesCategoryId = false;
      productsQuery = await supabaseAdmin
        .from('products')
        .select('id, name, images, category')
        .order('name');
    }

    const { data: products, error: fetchError } = productsQuery;

    if (fetchError) {
      return NextResponse.json(
        { error: 'Error fetching products', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found',
        updated: 0,
        skipped: 0,
        errors: 0,
      });
    }

    let categoryMap = new Map<string, string>();
    if (usesCategoryId) {
      const { data: categories } = await supabaseAdmin
        .from('categories')
        .select('id, slug');

      categoryMap = new Map(categories?.map((cat) => [cat.id, cat.slug]) || []);
    }

    const results = {
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ name: string; status: string; imageUrl?: string }>,
    };

    // Procesar productos en lotes para no sobrecargar
    for (const product of products as any[]) {
      const categorySlug = usesCategoryId
        ? categoryMap.get(product.category_id)
        : product.category;

      // Verificar si ya tiene imágenes válidas (a menos que forceUpdate esté activado)
      if (!forceUpdate) {
        const hasValidImages =
          product.images &&
          Array.isArray(product.images) &&
          product.images.length > 0 &&
          product.images.some((img: string) => img && !img.includes('placeholder') && !img.includes('/placeholder.svg'));

        if (hasValidImages) {
          results.skipped++;
          results.details.push({
            name: product.name,
            status: 'skipped',
          });
          continue;
        }
      }

      try {
        // Intentar variantes del nombre para mejorar matching
        const nameVariants = [
          product.name,
          stripProductNameForExternalSearch(product.name),
          product.name.replace(/Pokémon/g, 'Pokemon'),
          product.name.replace(/Pokemon/g, 'Pokémon'),
          product.name.replace(/[^a-zA-Z0-9\s]/g, ''),
        ];

        let imageUrls: string[] = [];

        const platform = detectImagePlatformFromProduct({ category: categorySlug, name: product.name });
        for (const variant of nameVariants) {
          if (!variant || !variant.trim()) continue;
          const found = await searchGameImages({
            gameName: variant,
            platform,
            preferSource: 'libretro',
          });
          imageUrls = [...new Set(found.map((item) => item.url).filter(Boolean))].slice(0, 6);
          if (imageUrls.length > 0 && imageUrls[0] !== '/placeholder.svg') {
            break;
          }
        }

        const imageUrl = imageUrls[0] || '';
        if (!imageUrl || imageUrl === '/placeholder.svg') {
          results.skipped++;
          results.details.push({
            name: product.name,
            status: 'not_found',
          });
          continue;
        }

        // Actualizar producto con nueva imagen
        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({
            image: imageUrl,
            images: imageUrls,
          })
          .eq('id', product.id);

        if (updateError) {
          results.errors++;
          results.details.push({
            name: product.name,
            status: 'error',
          });
        } else {
          results.updated++;
          results.details.push({
            name: product.name,
            status: 'updated',
            imageUrl,
          });
        }

        // Pequeña pausa para no sobrecargar las APIs
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        results.errors++;
        results.details.push({
          name: product.name,
          status: 'error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${products.length} products`,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors,
      details: results.details,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update product images' },
      { status: err.message === 'Unauthorized' || err.message === 'Forbidden' ? 403 : 500 }
    );
  }
}
