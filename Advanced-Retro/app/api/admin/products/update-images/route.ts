import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getBestGameImage } from '@/lib/gameImages';

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

    // Obtener todos los productos
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('name');

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

    // Obtener categorías para determinar plataforma
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, slug');

    const categoryMap = new Map(
      categories?.map((cat) => [cat.id, cat.slug]) || []
    );

    const results = {
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ name: string; status: string; imageUrl?: string }>,
    };

    // Procesar productos en lotes para no sobrecargar
    for (const product of products) {
      const categorySlug = categoryMap.get(product.category_id ?? product.category);
      
      // Determinar plataforma según categoría
      let platform: 'game-boy' | 'game-boy-color' | 'game-boy-advance' = 'game-boy-color';
      if (categorySlug?.includes('game-boy')) {
        platform = 'game-boy-color';
      }

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
        // Normalizar nombre del juego para búsqueda
        // Intentar diferentes variantes del nombre
        const nameVariants = [
          product.name, // Nombre original
          product.name.replace(/Pokémon/g, 'Pokemon'), // Sin acentos
          product.name.replace(/Pokemon/g, 'Pokémon'), // Con acentos
          product.name.replace(/[^a-zA-Z0-9\s]/g, ''), // Sin caracteres especiales
        ];

        let imageUrl: string | null = null;

        // Intentar con cada variante del nombre
        for (const variant of nameVariants) {
          imageUrl = await getBestGameImage(variant, platform);
          if (imageUrl && imageUrl !== '/placeholder.svg') {
            break;
          }
        }

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
            images: [imageUrl],
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
