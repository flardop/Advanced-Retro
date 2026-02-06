import { NextRequest, NextResponse } from 'next/server';
import { searchGameImages, getBestGameImage } from '@/lib/gameImages';

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
    const platform = searchParams.get('platform') as
      | 'game-boy'
      | 'game-boy-color'
      | 'game-boy-advance'
      | null;
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
      platform: platform || 'game-boy-color',
      preferSource: preferSource || 'libretro',
    });

    return NextResponse.json({
      success: true,
      gameName,
      platform: platform || 'game-boy-color',
      images: results,
      count: results.length,
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
