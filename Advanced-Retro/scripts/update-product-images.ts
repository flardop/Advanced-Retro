/**
 * Script para actualizar imágenes de productos existentes
 * 
 * Uso:
 * 1. Configura las variables de entorno en .env.local
 * 2. Ejecuta: npx tsx scripts/update-product-images.ts
 * 
 * Este script:
 * - Obtiene todos los productos de la base de datos
 * - Busca imágenes para cada producto usando la API de imágenes
 * - Actualiza el campo images[] de cada producto
 */

import { createClient } from '@supabase/supabase-js';
import { searchGameImages } from '../lib/gameImages';
import { detectImagePlatformFromProduct, stripProductNameForExternalSearch } from '../lib/catalogPlatform';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const forceUpdate = process.argv.includes('--force');

async function updateProductImages() {
  console.log('🔍 Obteniendo productos de la base de datos...');
  console.log(`⚙️  Modo: ${forceUpdate ? 'FORCE (reescribe imágenes existentes)' : 'NORMAL (solo faltantes)'}`);

  let usesCategoryId = true;
  let productsQuery: any = await supabase
    .from('products')
    .select('id, name, images, category_id')
    .order('name');

  // Compatibilidad con esquema antiguo (products.category en texto)
  if (productsQuery.error && productsQuery.error.message.includes('category_id')) {
    usesCategoryId = false;
    productsQuery = await supabase
      .from('products')
      .select('id, name, images, category')
      .order('name');
  }

  const { data: products, error: fetchError } = productsQuery;

  if (fetchError) {
    console.error('❌ Error obteniendo productos:', fetchError);
    return;
  }

  if (!products || products.length === 0) {
    console.log('⚠️  No se encontraron productos');
    return;
  }

  console.log(`📦 Encontrados ${products.length} productos\n`);

  let categoryMap = new Map<string, string>();
  if (usesCategoryId) {
    const { data: categories } = await supabase.from('categories').select('id, slug');
    categoryMap = new Map(categories?.map((cat) => [cat.id, cat.slug]) || []);
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products as any[]) {
    const categorySlug = usesCategoryId
      ? categoryMap.get(product.category_id)
      : product.category;

    // Si ya tiene imágenes válidas, podemos saltarlo (opcional)
    const hasValidImages =
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0 &&
      product.images.some((img: string) => img && !img.includes('placeholder'));

    if (hasValidImages && !forceUpdate) {
      console.log(`⏭️  Saltando "${product.name}" (ya tiene imágenes)`);
      skipped++;
      continue;
    }

    try {
      console.log(`🔍 Buscando imagen para: "${product.name}"...`);

      const searchTerm = stripProductNameForExternalSearch(product.name) || product.name;
      const imageResults = await searchGameImages({
        gameName: searchTerm,
        platform: detectImagePlatformFromProduct({ category: categorySlug, name: product.name }),
        preferSource: 'libretro',
      });

      const imageUrls = [...new Set(imageResults.map((item) => item.url).filter(Boolean))].slice(0, 6);
      const imageUrl = imageUrls[0] || '';

      if (!imageUrl || imageUrl === '/placeholder.svg') {
        console.log(`⚠️  No se encontró imagen para "${product.name}"`);
        skipped++;
        continue;
      }

      // Actualizar producto con nueva imagen
      const { error: updateError } = await supabase
        .from('products')
        .update({
          image: imageUrl,
          images: imageUrls,
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error actualizando "${product.name}":`, updateError);
        errors++;
      } else {
        console.log(`✅ Actualizado "${product.name}" → ${imageUrl}`);
        updated++;
      }

      // Pequeña pausa para no sobrecargar las APIs
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error procesando "${product.name}":`, error);
      errors++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`✅ Actualizados: ${updated}`);
  console.log(`⏭️  Saltados: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
}

// Ejecutar script
updateProductImages()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
