/**
 * Utilidad para buscar imágenes de juegos retro desde múltiples fuentes
 * Soporta: LibRetro CDN, IGDB API, Splash! Games Directory
 */

export interface GameImageResult {
  url: string;
  source: 'libretro' | 'igdb' | 'splash' | 'rawg' | 'fallback';
  type: 'cover' | 'screenshot' | 'boxart';
}

export interface GameImageSearchOptions {
  gameName: string;
  platform?: 'game-boy' | 'game-boy-color' | 'game-boy-advance';
  preferSource?: 'libretro' | 'igdb' | 'splash' | 'rawg';
}

// Simple in-memory cache for runtime to avoid duplicate network requests
const imageCache = new Map<string, GameImageResult | null>();

// Helper: normalize game name (remove diacritics, trim, normalize spaces)
function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/[:\\/\\?"'<>|]/g, '')
    .trim();
}

// Helper: slugify for splash
function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper: HEAD request with retries and timeout
async function headExists(url: string, timeout = 3000, retries = 2): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return true;
      // If 404, no need to retry
      if (res.status === 404) return false;
      // Otherwise try again
    } catch (err: any) {
      if (attempt === retries) return false;
      // backoff
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      continue;
    }
  }
  return false;
}

/**
 * Busca imágenes de juegos desde LibRetro CDN (gratis, sin API key)
 * Formato: https://thumbnails.libretro.com/Nintendo%20-%20Game%20Boy%20Color/Named_Boxarts/[Game Title].png
 */
async function searchLibRetro(
  gameName: string,
  platform: string = 'game-boy-color'
): Promise<GameImageResult | null> {
  try {
    // Mapeo de plataformas a rutas LibRetro
    const platformMap: Record<string, string> = {
      'game-boy': 'Nintendo%20-%20Game%20Boy',
      'game-boy-color': 'Nintendo%20-%20Game%20Boy%20Color',
      'game-boy-advance': 'Nintendo%20-%20Game%20Boy%20Advance',
    };

    const platformPath = platformMap[platform] || platformMap['game-boy-color'];
    
    // Normalizar nombre del juego - mantener caracteres especiales comunes
    const cleanName = normalizeName(gameName);

    // Generar múltiples variantes del nombre
    const nameVariants = [
      cleanName,
      cleanName.replace(/[^a-zA-Z0-9\s]/g, ''),
      cleanName.replace(/Pokemon/g, 'Pokémon'),
      cleanName.replace(/Pokémon/g, 'Pokemon'),
      cleanName.toLowerCase(),
      cleanName.replace(/\s+/g, ' ').trim(),
    ];

    // Regiones comunes
    const regions = ['(USA)', '(Europe)', '(USA, Europe)', '(Japan)', '(World)', ''];
    
    const baseUrl = 'https://thumbnails.libretro.com';
    const boxartPath = `${platformPath}/Named_Boxarts`;

    // Intentar todas las combinaciones
    for (const nameVariant of nameVariants) {
      const encodedName = encodeURIComponent(nameVariant);

      for (const region of regions) {
        const fileName = region
          ? `${encodedName}%20${encodeURIComponent(region)}.png`
          : `${encodedName}.png`;

        const url = `${baseUrl}/${boxartPath}/${fileName}`;

        // Check cache first
        const cacheKey = `libretro:${platform}:${url}`;
        if (imageCache.has(cacheKey)) {
          const cached = imageCache.get(cacheKey);
          if (cached) return cached;
          continue;
        }

        const exists = await headExists(url, 3000, 2);
        if (exists) {
          const result = { url, source: 'libretro' as const, type: 'boxart' as const };
          imageCache.set(cacheKey, result);
          return result;
        }
        imageCache.set(cacheKey, null);
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching LibRetro:', error);
    return null;
  }
}

/**
 * Busca imágenes desde IGDB API (requiere API key)
 * Formato: https://images.igdb.com/igdb/image/upload/t_cover_big/[image_id].jpg
 */
async function searchIGDB(
  gameName: string,
  platform: string = 'game-boy-color'
): Promise<GameImageResult | null> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null; // No hay credenciales configuradas
  }
  // token cache
  let token: { access_token: string; expires_at: number } | null = (searchIGDB as any)._token || null;
  try {
    if (!token || Date.now() > token.expires_at) {
      const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!tokenResponse.ok) return null;
      const tokenJson = await tokenResponse.json();
      token = { access_token: tokenJson.access_token, expires_at: Date.now() + (tokenJson.expires_in || 3600) * 1000 - 5000 };
      (searchIGDB as any)._token = token;
    }

    const platformMap: Record<string, number> = {
      'game-boy': 33,
      'game-boy-color': 22,
      'game-boy-advance': 24,
    };

    const platformId = platformMap[platform] || platformMap['game-boy-color'];

    const cacheKey = `igdb:${platform}:${normalizeName(gameName)}`;
    if (imageCache.has(cacheKey)) return imageCache.get(cacheKey) || null;

    const searchResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: `search \"${gameName.replace(/\\\"/g, '\\\\"')}\"; fields name,cover; where platforms = ${platformId}; limit 1;`,
    });

    if (!searchResponse.ok) {
      return null;
    }

    const games = await searchResponse.json();
    if (!games || games.length === 0 || !games[0].cover) {
      imageCache.set(cacheKey, null);
      return null;
    }

    const coverId = games[0].cover;
    const coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${coverId}.jpg`;
    const result = { url: coverUrl, source: 'igdb' as const, type: 'cover' as const };
    imageCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error searching IGDB:', error);
    return null;
  }
}

/**
 * Busca imágenes desde Splash! Games Directory
 * Formato: https://splash.games.directory/covers/game-boy/[game-slug].png
 */
async function searchSplash(
  gameName: string,
  platform: string = 'game-boy'
): Promise<GameImageResult | null> {
  try {
    // Generar múltiples slugs posibles
    const base = normalizeName(gameName).toLowerCase();
    const slugVariants = [
      slugify(base),
      slugify(base.replace(/\b(the|a|an)\b/g, '')),
      slugify(base.replace(/[:;,.()\[\]]/g, '')),
    ];

    const platformMap: Record<string, string> = {
      'game-boy': 'game-boy',
      'game-boy-color': 'game-boy-color',
      'game-boy-advance': 'game-boy-advance',
    };

    const platformSlug = platformMap[platform] || 'game-boy';

    for (const slug of slugVariants) {
      if (!slug) continue;

      const url = `https://splash.games.directory/covers/${platformSlug}/${slug}.png`;
      const cacheKey = `splash:${platform}:${url}`;
      if (imageCache.has(cacheKey)) {
        const cached = imageCache.get(cacheKey);
        if (cached) return cached;
        continue;
      }

      const exists = await headExists(url, 2500, 1);
      if (exists) {
        const result = { url, source: 'splash' as const, type: 'cover' as const };
        imageCache.set(cacheKey, result);
        return result;
      }
      imageCache.set(cacheKey, null);
    }

    return null;
  } catch (error) {
    console.warn('Error searching Splash! (service may be down):', error);
    return null;
  }
}

/**
 * Busca imágenes desde RAWG API (gratuito, sin API key requerido)
 * Formato: https://rawg.io/api/games?search=[game]&page_size=1
 * Retorna cover_image si está disponible
 */
async function searchRAWG(
  gameName: string,
  platform: string = 'game-boy-color'
): Promise<GameImageResult | null> {
  try {
    const normalizedName = normalizeName(gameName);
    const cacheKey = `rawg:${platform}:${normalizedName}`;

    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey) || null;
    }

    // Hacer búsqueda en RAWG
    const searchResponse = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(normalizedName)}&page_size=1`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!searchResponse.ok) {
      imageCache.set(cacheKey, null);
      return null;
    }

    const data = (await searchResponse.json()) as any;
    const games = data.results || [];

    if (games.length === 0) {
      imageCache.set(cacheKey, null);
      return null;
    }

    const game = games[0];
    // RAWG retorna background_image (poster/cover)
    const imageUrl = game.background_image;

    if (!imageUrl) {
      imageCache.set(cacheKey, null);
      return null;
    }

    const result: GameImageResult = {
      url: imageUrl,
      source: 'rawg' as const,
      type: 'cover' as const,
    };

    imageCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error searching RAWG:', error);
    return null;
  }
}
export async function searchGameImages(
  options: GameImageSearchOptions
): Promise<GameImageResult[]> {
  // Cambiar preferencia por defecto a 'libretro' ya que Splash! está dando errores
  const { gameName, platform = 'game-boy-color', preferSource = 'libretro' } = options;

  if (!gameName || !gameName.trim()) {
    return [
      {
        url: '/placeholder.svg',
        source: 'fallback',
        type: 'cover',
      },
    ];
  }

  const results: GameImageResult[] = [];
  // Orden: LibRetro (más confiable), IGDB, Splash, RAWG como fallback
  const sources = ['libretro', 'igdb', 'splash', 'rawg'] as const;

  // Ordenar fuentes según preferencia, pero siempre intentar todas
  const orderedSources = [
    preferSource,
    ...sources.filter((s) => s !== preferSource),
  ];

  // Intentar todas las fuentes en paralelo para mayor velocidad
  const searchPromises = orderedSources.map(async (source) => {
    try {
      switch (source) {
        case 'libretro':
          return await searchLibRetro(gameName, platform);
        case 'igdb':
          return await searchIGDB(gameName, platform);
        case 'splash':
          return await searchSplash(gameName, platform);
        case 'rawg':
          return await searchRAWG(gameName, platform);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error searching ${source}:`, error);
      return null;
    }
  });

  const searchResults = await Promise.all(searchPromises);

  // Filtrar resultados nulos y agregar a la lista
  for (const result of searchResults) {
    if (result && result.url !== '/placeholder.svg') {
      results.push(result);
    }
  }

  // Si encontramos resultados, retornarlos (priorizar según orden)
  if (results.length > 0) {
    // Ordenar: preferSource primero, luego otros (fallback al final)
    return results.sort((a, b) => {
      const aIdx = a.source === 'fallback' ? 999 : orderedSources.indexOf(a.source);
      const bIdx = b.source === 'fallback' ? 999 : orderedSources.indexOf(b.source);
      return aIdx - bIdx;
    });
  }

  // Si no encontramos nada, retornar placeholder
  return [
    {
      url: '/placeholder.svg',
      source: 'fallback',
      type: 'cover',
    },
  ];
}

/**
 * Función helper para obtener la mejor imagen disponible
 */
export async function getBestGameImage(
  gameName: string,
  platform?: 'game-boy' | 'game-boy-color' | 'game-boy-advance'
): Promise<string> {
  const results = await searchGameImages({ gameName, platform });
  return results[0]?.url || '/placeholder.svg';
}
