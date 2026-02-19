import { NextRequest, NextResponse } from 'next/server';
import { searchGameImages } from '@/lib/gameImages';
import type { CatalogImagePlatform } from '@/lib/catalogPlatform';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const ALLOWED_PLATFORMS = new Set<CatalogImagePlatform>([
  'game-boy',
  'game-boy-color',
  'game-boy-advance',
  'super-nintendo',
  'gamecube',
]);
const SAFE_GAME_NAME_RE = /^[\p{L}\p{N}\s:'\-&.,!()]+$/u;

/**
 * API Route para buscar imágenes de juegos
 * 
 * GET /api/games/images?gameName=Pokemon Red&platform=game-boy-color
 * 
 * Retorna un array de imágenes encontradas desde múltiples fuentes
 */
export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const rl = checkRateLimit({
      key: `games-images:${ip}`,
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const gameName = searchParams.get('gameName');
    const platformParam = searchParams.get('platform');
    const preferSource = searchParams.get('preferSource') as
      | 'libretro'
      | 'igdb'
      | 'splash'
      | null;

    if (!gameName || !gameName.trim()) {
      return NextResponse.json(
        { error: 'gameName parameter is required' },
        { status: 400 }
      );
    }

    const cleanGameName = gameName.trim().slice(0, 120);
    if (!SAFE_GAME_NAME_RE.test(cleanGameName)) {
      return NextResponse.json(
        { error: 'gameName contains unsupported characters' },
        { status: 400 }
      );
    }

    const normalizedPlatform: CatalogImagePlatform = ALLOWED_PLATFORMS.has(
      platformParam as CatalogImagePlatform
    )
      ? (platformParam as CatalogImagePlatform)
      : 'game-boy';

    const results = await searchGameImages({
      gameName: cleanGameName,
      platform: normalizedPlatform,
      preferSource: preferSource || 'libretro',
    });

    return NextResponse.json({
      success: true,
      gameName: cleanGameName,
      platform: normalizedPlatform,
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
