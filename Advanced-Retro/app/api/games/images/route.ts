import { NextRequest, NextResponse } from 'next/server';
import { searchGameImages } from '@/lib/gameImages';
import type { CatalogImagePlatform } from '@/lib/catalogPlatform';

export const dynamic = 'force-dynamic';

/**
 * API Route para buscar imágenes de juegos
 * 
 * GET /api/games/images?gameName=Pokemon Red&platform=game-boy-color
 * 
 * Retorna un array de imágenes encontradas desde múltiples fuentes
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameName = searchParams.get('gameName');
    const platform = searchParams.get('platform') as CatalogImagePlatform | null;
    const preferSource = searchParams.get('preferSource') as
      | 'libretro'
      | 'igdb'
      | 'splash'
      | null;

    if (!gameName) {
      return NextResponse.json(
        { error: 'gameName parameter is required' },
        { status: 400 }
      );
    }

    const results = await searchGameImages({
      gameName,
      platform: platform || 'game-boy',
      preferSource: preferSource || 'libretro',
    });

    // Log para debugging
    console.log(`Searching images for: "${gameName}" on ${platform || 'game-boy'}`);
    console.log(`Found ${results.length} result(s):`, results.map(r => ({ source: r.source, url: r.url })));

    return NextResponse.json({
      success: true,
      gameName,
      platform: platform || 'game-boy',
      images: results,
      count: results.length,
      debug: {
        searchedName: gameName,
        platform: platform || 'game-boy',
        sourcesTried: ['libretro', 'splash', 'igdb'],
      },
    });
  } catch (error) {
    console.error('Error in /api/games/images:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search game images',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
