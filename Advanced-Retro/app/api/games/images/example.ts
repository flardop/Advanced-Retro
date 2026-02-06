/**
 * Ejemplos de uso de la API de imágenes de juegos
 * 
 * Este archivo muestra cómo usar la API desde diferentes contextos
 */

// ============================================================================
// Ejemplo 1: Uso desde el Frontend (React Component)
// ============================================================================

export async function ExampleFrontendUsage() {
  'use client';

  async function loadGameImage(gameName: string) {
    const response = await fetch(
      `/api/games/images?gameName=${encodeURIComponent(gameName)}&platform=game-boy-color`
    );
    const data = await response.json();
    
    if (data.success && data.images.length > 0) {
      return data.images[0].url;
    }
    return '/placeholder.svg';
  }

  // Uso en un componente:
  // const imageUrl = await loadGameImage('Pokemon Red');
}

// ============================================================================
// Ejemplo 2: Uso desde el Backend (Server Component o API Route)
// ============================================================================

import { getBestGameImage } from '@/lib/gameImages';

export async function ExampleBackendUsage() {
  // Obtener la mejor imagen disponible
  const imageUrl = await getBestGameImage('Pokemon Red', 'game-boy-color');
  
  // O obtener todas las opciones
  const { searchGameImages } = await import('@/lib/gameImages');
  const allImages = await searchGameImages({
    gameName: 'Pokemon Red',
    platform: 'game-boy-color',
    preferSource: 'libretro',
  });

  return imageUrl;
}

// ============================================================================
// Ejemplo 3: Actualizar un Producto Existente
// ============================================================================

import { supabaseServer } from '@/lib/supabaseServer';

export async function ExampleUpdateProduct(productId: string, gameName: string) {
  const imageUrl = await getBestGameImage(gameName, 'game-boy-color');
  
  const supabase = supabaseServer();
  const { error } = await supabase
    .from('products')
    .update({ images: [imageUrl] })
    .eq('id', productId);

  if (error) {
    console.error('Error actualizando producto:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Ejemplo 4: Crear Producto con Imagen Automática
// ============================================================================

export async function ExampleCreateProduct() {
  const gameName = 'Pokemon Red';
  const imageUrl = await getBestGameImage(gameName, 'game-boy-color');
  
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: gameName,
      slug: 'pokemon-red',
      description: 'Clásico RPG de Game Boy',
      price: 3999,
      status: 'new',
      stock: 25,
      images: [imageUrl],
      // category_id: ... (obtener de categories)
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando producto:', error);
    return null;
  }

  return data;
}

// ============================================================================
// Ejemplo 5: Buscar Múltiples Juegos en Batch
// ============================================================================

export async function ExampleBatchSearch() {
  const gameNames = [
    'Pokemon Red',
    'Pokemon Blue',
    'Zelda Links Awakening',
    'Super Mario Land',
  ];

  const results = await Promise.all(
    gameNames.map(async (name) => {
      const imageUrl = await getBestGameImage(name, 'game-boy-color');
      return { name, imageUrl };
    })
  );

  return results;
}
