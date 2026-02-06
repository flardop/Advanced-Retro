/**
 * Utilidad para buscar imágenes de juegos retro desde múltiples fuentes
 * Soporta: LibRetro CDN, IGDB API, Splash! Games Directory
 */

export interface GameImageResult {
  url: string;
  source: 'libretro' | 'igdb' | 'splash' | 'fallback';
  type: 'cover' | 'screenshot' | 'boxart';
}

export interface GameImageSearchOptions {
  gameName: string;
  platform?: 'game-boy' | 'game-boy-color' | 'game-boy-advance';
  preferSource?: 'libretro' | 'igdb' | 'splash';
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
    const cleanName = gameName.trim();
    
    // Generar múltiples variantes del nombre
    const nameVariants = [
      cleanName, // Nombre original
      cleanName.replace(/[^a-zA-Z0-9\s]/g, ''), // Sin caracteres especiales
      cleanName.toLowerCase(), // Minúsculas
      cleanName.toUpperCase(), // Mayúsculas
      cleanName.replace(/\s+/g, ' ').trim(), // Espacios normalizados
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
        
        // Verificar si la imagen existe (HEAD request con timeout)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout
          
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok && response.status === 200) {
            return {
              url,
              source: 'libretro',
              type: 'boxart',
            };
          }
        } catch (err) {
          // Continuar con siguiente variante
          continue;
        }
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

  try {
    // Obtener token de acceso
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      return null;
    }

    const { access_token } = await tokenResponse.json();

    // Mapeo de plataformas a IDs de IGDB
    const platformMap: Record<string, number> = {
      'game-boy': 33, // Game Boy
      'game-boy-color': 22, // Game Boy Color
      'game-boy-advance': 24, // Game Boy Advance
    };

    const platformId = platformMap[platform] || platformMap['game-boy-color'];

    // Buscar juego
    const searchResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search: gameName,
        fields: 'name,cover',
        where: `platforms = ${platformId}`,
        limit: 1,
      }),
    });

    if (!searchResponse.ok) {
      return null;
    }

    const games = await searchResponse.json();
    if (!games || games.length === 0 || !games[0].cover) {
      return null;
    }

    const coverId = games[0].cover;
    const coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${coverId}.jpg`;

    return {
      url: coverUrl,
      source: 'igdb',
      type: 'cover',
    };
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
    const slugVariants = [
      // Slug simple
      gameName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      // Sin "the", "a", etc.
      gameName.toLowerCase().replace(/\b(the|a|an)\b/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      // Con guiones preservados
      gameName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
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

      // Verificar si existe con timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok && response.status === 200) {
          return {
            url,
            source: 'splash',
            type: 'cover',
          };
        }
      } catch {
        // Continuar con siguiente variante
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching Splash:', error);
    return null;
  }
}

/**
 * Función principal para buscar imágenes de juegos
 * Intenta múltiples fuentes según preferencia
 */
export async function searchGameImages(
  options: GameImageSearchOptions
): Promise<GameImageResult[]> {
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
  const sources = ['libretro', 'splash', 'igdb'] as const;

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
    // Ordenar: preferSource primero, luego otros
    return results.sort((a, b) => {
      const aIndex = orderedSources.indexOf(a.source);
      const bIndex = orderedSources.indexOf(b.source);
      return aIndex - bIndex;
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
