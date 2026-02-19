/**
 * Utilidad para buscar imágenes de juegos retro desde múltiples fuentes.
 * Soporta: LibRetro CDN, IGDB API, Splash! Games Directory
 */

import type { CatalogImagePlatform } from './catalogPlatform';

type SupportedPlatform = CatalogImagePlatform;
type ImageSource = 'libretro' | 'igdb' | 'splash' | 'fallback';
type LibretroAssetFolder = 'Named_Boxarts' | 'Named_Titles' | 'Named_Snaps';
type IGDBGame = { id: number; name: string; cover?: number };
type IGDBCover = { image_id?: string };

const LIBRETRO_BASE_URL = 'https://thumbnails.libretro.com';
const SPLASH_BASE_URL = 'https://splash.games.directory/covers';
const PLACEHOLDER_IMAGE = '/placeholder.svg';

const LIBRETRO_PLATFORM_PATH: Record<SupportedPlatform, string> = {
  'game-boy': 'Nintendo - Game Boy',
  'game-boy-color': 'Nintendo - Game Boy Color',
  'game-boy-advance': 'Nintendo - Game Boy Advance',
  'super-nintendo': 'Nintendo - Super Nintendo Entertainment System',
  gamecube: 'Nintendo - GameCube',
};

const PLATFORM_FALLBACK_ORDER: SupportedPlatform[] = [
  'game-boy',
  'game-boy-color',
  'game-boy-advance',
  'super-nintendo',
  'gamecube',
];

const NON_GAME_PREFIX_RE = new RegExp(
  [
    '^manual\\s+',
    '^caja(?:\\s+repro|\\s+original)?\\s+',
    '^insert(?:\\s+interior)?\\s+',
    '^pegatina\\s+',
    '^sticker\\s+',
    '^funda\\s+',
    '^protector(?:\\s+pantalla)?\\s+',
    '^estuche\\s+',
    '^cable\\s+link\\s+',
    '^lupa(?:\\s+light)?\\s+',
    '^bater(?:i|í)as?(?:\\s+recargables)?\\s+',
  ].join('|'),
  'i'
);

const NON_GAME_SUFFIX_RE = new RegExp(
  [
    '\\s+caja\\s+game\\s+boy$',
    '\\s+game\\s+boy\\s+caja$',
    '\\s+para\\s+game\\s+boy$',
    '\\s+for\\s+game\\s+boy$',
    '\\s+game\\s+boy$',
  ].join('|'),
  'i'
);

const GENERIC_NON_GAME_TOKENS = new Set([
  'game',
  'boy',
  'color',
  'advance',
  'universal',
  'original',
  'premium',
  'deluxe',
  'estandar',
  'retro',
]);

const LIBRETRO_REGION_BONUS: Array<{ regex: RegExp; score: number }> = [
  { regex: /\(usa,\s*europe\)/i, score: 12 },
  { regex: /\(world\)/i, score: 10 },
  { regex: /\(usa\)/i, score: 8 },
  { regex: /\(europe\)/i, score: 7 },
  { regex: /\(japan\)/i, score: 5 },
];

const libretroIndexCache = new Map<string, string[]>();
let igdbTokenCache: { token: string; expiresAtMs: number } | null = null;

export interface GameImageResult {
  url: string;
  source: ImageSource;
  type: 'cover' | 'screenshot' | 'boxart';
  platform?: SupportedPlatform;
  fileName?: string;
}

export interface GameImageSearchOptions {
  gameName: string;
  platform?: SupportedPlatform;
  preferSource?: Exclude<ImageSource, 'fallback'>;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s:'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForMatching(value: string): string {
  return normalizeText(value)
    .replace(/:\s*/g, ' - ')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, '');
}

function stripMetadataTags(value: string): string {
  return value
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function reorderTrailingThe(value: string): string {
  return value.replace(/,\s*the\b/i, '');
}

function removeCatalogWords(gameName: string): string {
  const cleaned = gameName
    .trim()
    .replace(NON_GAME_PREFIX_RE, '')
    .replace(NON_GAME_SUFFIX_RE, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const normalizedTokens = normalizeText(cleaned).split(/\s+/).filter(Boolean);
  if (
    normalizedTokens.length > 0 &&
    normalizedTokens.every((token) => GENERIC_NON_GAME_TOKENS.has(token))
  ) {
    return '';
  }

  return cleaned;
}

function withPokemonVariants(name: string): string[] {
  const normalized = normalizeText(name);
  const variants = new Set<string>();
  variants.add(name);

  const pokemonMap: Array<{ test: RegExp; value: string }> = [
    { test: /pokemon\s+rojo|pokemon\s+red/, value: 'Pokemon - Red Version' },
    { test: /pokemon\s+azul|pokemon\s+blue/, value: 'Pokemon - Blue Version' },
    {
      test: /pokemon\s+amarillo|pokemon\s+yellow/,
      value: 'Pokemon - Yellow Version - Special Pikachu Edition',
    },
    { test: /pokemon\s+verde|pokemon\s+green/, value: 'Pokemon - Green Version' },
  ];

  for (const entry of pokemonMap) {
    if (entry.test.test(normalized)) {
      variants.add(entry.value);
    }
  }

  return [...variants];
}

function withKnownAliases(name: string): string[] {
  const aliases = new Set<string>();
  aliases.add(name);

  const normalized = normalizeText(name);

  if (normalized.includes('legend of zelda') && normalized.includes('awakening')) {
    aliases.add("Legend of Zelda, The - Link's Awakening");
    aliases.add("The Legend of Zelda - Link's Awakening");
    aliases.add("The Legend of Zelda: Link's Awakening");
  }

  if (normalized.includes('legend of zelda') && normalized.includes('oracle') && normalized.includes('ages')) {
    aliases.add('Legend of Zelda, The - Oracle of Ages');
  }

  if (normalized.includes('legend of zelda') && normalized.includes('oracle') && normalized.includes('seasons')) {
    aliases.add('Legend of Zelda, The - Oracle of Seasons');
  }

  if (normalized.includes('legend of zelda') && normalized.includes('minish')) {
    aliases.add('Legend of Zelda, The - The Minish Cap');
  }

  if (normalized.includes('legend of zelda') && normalized.includes('wind') && normalized.includes('waker')) {
    aliases.add('Legend of Zelda, The - The Wind Waker');
  }

  if (normalized.includes('legend of zelda') && normalized.includes('link') && normalized.includes('past')) {
    aliases.add('Legend of Zelda, The - A Link to the Past');
  }

  if (normalized.includes('castlevania') && normalized.includes('adventure')) {
    aliases.add('Castlevania - The Adventure');
  }

  if (normalized === 'metroid ii' || normalized.includes('metroid ii')) {
    aliases.add('Metroid II - Return of Samus');
  }

  if (normalized.includes('super mario land 2')) {
    aliases.add('Super Mario Land 2 - 6 Golden Coins');
  }

  return [...aliases];
}

function buildNameVariants(gameName: string): string[] {
  const baseName = removeCatalogWords(gameName);
  if (!baseName) return [];

  const candidates = new Set<string>();
  const seeds = new Set<string>([baseName]);

  if (normalizeText(baseName) === normalizeText(gameName)) {
    seeds.add(gameName);
  }

  for (const raw of seeds) {
    if (!raw) continue;

    const pokemonVariants = withPokemonVariants(raw);
    for (const pokemonVariant of pokemonVariants) {
      for (const alias of withKnownAliases(pokemonVariant)) {
        const compact = alias.replace(/[^a-zA-Z0-9\s:'-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (compact) candidates.add(compact);
      }
    }
  }

  return [...candidates];
}

function buildPlatformTryOrder(platform: SupportedPlatform): SupportedPlatform[] {
  // Evita mezclas entre consolas distintas; preferimos "no imagen" antes que portada incorrecta.
  return [platform];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calcTokenOverlapScore(a: string, b: string): number {
  const aTokens = new Set(a.split(/\s+/).filter((token) => token.length >= 3));
  const bTokens = new Set(b.split(/\s+/).filter((token) => token.length >= 3));
  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap++;
  }

  if (overlap < 2) return 0;
  return overlap / Math.max(aTokens.size, bTokens.size);
}

function extractNumberTokens(value: string): string[] {
  const matches = value.match(/\b\d+\b/g);
  return matches ? [...new Set(matches)] : [];
}

function scoreLibRetroCandidate(fileName: string, queryVariants: string[]): number {
  const baseTitle = stripMetadataTags(stripFileExtension(fileName));
  const normalizedTitle = normalizeForMatching(reorderTrailingThe(baseTitle));
  if (!normalizedTitle) return 0;

  let best = 0;

  for (const query of queryVariants) {
    const normalizedQuery = normalizeForMatching(query);
    if (!normalizedQuery) continue;

    let score = 0;
    if (normalizedTitle === normalizedQuery) {
      score = 100;
    } else if (normalizedTitle.startsWith(`${normalizedQuery} -`) || normalizedTitle.startsWith(`${normalizedQuery} `)) {
      score = 92;
    } else if (
      normalizedQuery.length >= 5 &&
      new RegExp(`\\b${escapeRegex(normalizedQuery)}\\b`).test(normalizedTitle)
    ) {
      score = 84;
    } else if (
      normalizedQuery.length >= 5 &&
      normalizedTitle.length >= 5 &&
      normalizedTitle.includes(normalizedQuery)
    ) {
      score = 74;
    } else {
      const overlap = calcTokenOverlapScore(normalizedTitle, normalizedQuery);
      if (overlap >= 0.8) score = 70;
      else if (overlap >= 0.6) score = 62;
      else if (overlap >= 0.4) score = 54;
    }

    if (score > best) best = score;
  }

  if (best === 0) return 0;

  // Evita mismatches tipo "2" vs "3" en sagas.
  for (const query of queryVariants) {
    const normalizedQuery = normalizeForMatching(query);
    if (!normalizedQuery) continue;

    const queryNumbers = extractNumberTokens(normalizedQuery);
    if (queryNumbers.length === 0) continue;

    const candidateNumbers = extractNumberTokens(normalizedTitle);
    let penalty = 0;
    for (const num of queryNumbers) {
      if (!candidateNumbers.includes(num)) penalty += 24;
    }
    for (const num of candidateNumbers) {
      if (!queryNumbers.includes(num)) penalty += 10;
    }
    best -= penalty;
  }

  for (const region of LIBRETRO_REGION_BONUS) {
    if (region.regex.test(fileName)) {
      best += region.score;
      break;
    }
  }

  if (/\b(proto|prototype|demo|beta|sample)\b/i.test(fileName)) {
    best -= 25;
  }
  if (/\b(hack|romhack)\b/i.test(fileName)) {
    best -= 30;
  }
  if (/\bdx\b/i.test(fileName)) {
    best -= 18;
  }

  return best;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function loadLibRetroIndex(
  platform: SupportedPlatform,
  folder: LibretroAssetFolder = 'Named_Boxarts'
): Promise<string[]> {
  const cacheKey = `${platform}|${folder}`;
  const cached = libretroIndexCache.get(cacheKey);
  if (cached) return cached;

  const platformPath = LIBRETRO_PLATFORM_PATH[platform];
  const url = `${LIBRETRO_BASE_URL}/${encodeURIComponent(platformPath)}/${folder}/`;

  try {
    const response = await fetchWithTimeout(url, 12000);
    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const matches = [...html.matchAll(/href="([^"]+\.png)"/gi)];
    const fileNames: string[] = [];

    for (const match of matches) {
      const encoded = match[1];
      if (!encoded || encoded.startsWith('?')) continue;
      try {
        fileNames.push(decodeURIComponent(encoded));
      } catch {
        fileNames.push(encoded);
      }
    }

    libretroIndexCache.set(cacheKey, fileNames);
    return fileNames;
  } catch (error) {
    console.warn(`Error loading LibRetro index for ${platform}/${folder}:`, error);
    return [];
  }
}

function buildLibRetroFileUrl(
  platform: SupportedPlatform,
  fileName: string,
  folder: LibretroAssetFolder = 'Named_Boxarts'
): string {
  const platformPath = LIBRETRO_PLATFORM_PATH[platform];
  return `${LIBRETRO_BASE_URL}/${encodeURIComponent(platformPath)}/${folder}/${encodeURIComponent(fileName)}`;
}

/**
 * Busca imágenes desde LibRetro CDN (gratis, sin API key).
 * Usa matching por índice para soportar variaciones reales de nombres.
 */
async function searchLibRetro(
  gameName: string,
  platform: SupportedPlatform = 'game-boy'
): Promise<GameImageResult | null> {
  try {
    const queryVariants = buildNameVariants(gameName);
    if (queryVariants.length === 0) return null;

    let best: { score: number; platform: SupportedPlatform; fileName: string } | null = null;
    const platforms = buildPlatformTryOrder(platform);

    for (const candidatePlatform of platforms) {
      const fileNames = await loadLibRetroIndex(candidatePlatform);
      if (fileNames.length === 0) continue;

      for (const fileName of fileNames) {
        const score = scoreLibRetroCandidate(fileName, queryVariants);
        if (!best || score > best.score) {
          best = { score, platform: candidatePlatform, fileName };
        }
      }

      // 95+ suele ser match prácticamente exacto: no hace falta seguir buscando.
      if (best && best.score >= 95) {
        break;
      }
    }

    if (!best || best.score < 60) {
      return null;
    }

    return {
      url: buildLibRetroFileUrl(best.platform, best.fileName, 'Named_Boxarts'),
      source: 'libretro',
      type: 'boxart',
      platform: best.platform,
      fileName: best.fileName,
    };
  } catch (error) {
    console.error('Error searching LibRetro:', error);
    return null;
  }
}

async function getIGDBAccessToken(): Promise<string | null> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const now = Date.now();
  if (igdbTokenCache && igdbTokenCache.expiresAtMs > now + 30_000) {
    return igdbTokenCache.token;
  }

  try {
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

    const payload = (await tokenResponse.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!payload.access_token) {
      return null;
    }

    igdbTokenCache = {
      token: payload.access_token,
      expiresAtMs: now + (payload.expires_in || 3600) * 1000,
    };

    return payload.access_token;
  } catch (error) {
    console.warn('Error fetching IGDB token:', error);
    return null;
  }
}

async function fetchIGDBQuery<T>(
  endpoint: 'games' | 'covers',
  query: string
): Promise<T[] | null> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const token = await getIGDBAccessToken();

  if (!clientId || !token) return null;

  try {
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T[];
  } catch (error) {
    console.warn(`Error querying IGDB ${endpoint}:`, error);
    return null;
  }
}

/**
 * Busca imágenes desde IGDB API (requiere API key).
 * Formato: https://images.igdb.com/igdb/image/upload/t_cover_big/[image_id].jpg
 */
async function searchIGDB(
  gameName: string,
  platform: SupportedPlatform = 'game-boy'
): Promise<GameImageResult | null> {
  const platformMap: Record<SupportedPlatform, number> = {
    'game-boy': 33,
    'game-boy-color': 22,
    'game-boy-advance': 24,
    'super-nintendo': 19,
    gamecube: 21,
  };

  const platformId = platformMap[platform];
  const queryVariants = buildNameVariants(gameName).slice(0, 3);

  for (const candidate of queryVariants) {
    const escapedName = candidate.replace(/"/g, '\\"');
    const gamesQuery = [
      `search "${escapedName}";`,
      'fields name,cover;',
      `where platforms = (${platformId}) & cover != null;`,
      'limit 3;',
    ].join('\n');

    const games = await fetchIGDBQuery<IGDBGame>('games', gamesQuery);

    const game = games?.find((item) => typeof item.cover === 'number');
    if (!game?.cover) {
      continue;
    }

    const coversQuery = [`fields image_id;`, `where id = (${game.cover});`, 'limit 1;'].join('\n');
    const covers = await fetchIGDBQuery<IGDBCover>('covers', coversQuery);
    const imageId = covers?.[0]?.image_id;

    if (imageId) {
      return {
        url: `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`,
        source: 'igdb',
        type: 'cover',
      };
    }
  }

  return null;
}

/**
 * Busca imágenes desde Splash! Games Directory.
 * Formato: https://splash.games.directory/covers/game-boy/[game-slug].png
 */
async function searchSplash(
  gameName: string,
  platform: SupportedPlatform = 'game-boy'
): Promise<GameImageResult | null> {
  try {
    const variants = buildNameVariants(gameName);
    const platformSlug = platform;
    const slugs = new Set<string>();

    for (const value of variants) {
      const slug = normalizeText(value)
        .replace(/[:']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (slug) slugs.add(slug);
    }

    for (const slug of slugs) {
      const url = `${SPLASH_BASE_URL}/${platformSlug}/${slug}.png`;
      try {
        const response = await fetchWithTimeout(url, 3500);
        if (response.ok) {
          return {
            url,
            source: 'splash',
            type: 'cover',
          };
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch (error) {
    console.warn('Error searching Splash!:', error);
    return null;
  }
}

/**
 * Función principal para buscar imágenes de juegos.
 * Intenta múltiples fuentes según preferencia.
 */
export async function searchGameImages(
  options: GameImageSearchOptions
): Promise<GameImageResult[]> {
  const { gameName, platform = 'game-boy', preferSource = 'libretro' } = options;

  if (!gameName || !gameName.trim()) {
    return [{ url: PLACEHOLDER_IMAGE, source: 'fallback', type: 'cover' }];
  }

  const sources: Exclude<ImageSource, 'fallback'>[] = ['libretro', 'splash', 'igdb'];
  const orderedSources: Exclude<ImageSource, 'fallback'>[] = [
    preferSource,
    ...sources.filter((source) => source !== preferSource),
  ];

  const results: GameImageResult[] = [];
  const seen = new Set<string>();

  const pushUnique = (result: GameImageResult | null) => {
    if (!result || !result.url || result.url === PLACEHOLDER_IMAGE) return;
    if (seen.has(result.url)) return;
    seen.add(result.url);
    results.push(result);
  };

  const addLibRetroVariants = async (primary: GameImageResult) => {
    if (primary.source !== 'libretro' || !primary.platform || !primary.fileName) return;

    const titleIndex = await loadLibRetroIndex(primary.platform, 'Named_Titles');
    if (titleIndex.includes(primary.fileName)) {
      pushUnique({
        url: buildLibRetroFileUrl(primary.platform, primary.fileName, 'Named_Titles'),
        source: 'libretro',
        type: 'cover',
        platform: primary.platform,
        fileName: primary.fileName,
      });
    }

    const snapsIndex = await loadLibRetroIndex(primary.platform, 'Named_Snaps');
    if (snapsIndex.includes(primary.fileName)) {
      pushUnique({
        url: buildLibRetroFileUrl(primary.platform, primary.fileName, 'Named_Snaps'),
        source: 'libretro',
        type: 'screenshot',
        platform: primary.platform,
        fileName: primary.fileName,
      });
    }
  };

  for (const source of orderedSources) {
    try {
      let found: GameImageResult | null = null;
      switch (source) {
        case 'libretro':
          found = await searchLibRetro(gameName, platform);
          break;
        case 'splash':
          found = await searchSplash(gameName, platform);
          break;
        case 'igdb':
          found = await searchIGDB(gameName, platform);
          break;
        default:
          found = null;
      }

      pushUnique(found);
      if (found?.source === 'libretro') {
        await addLibRetroVariants(found);
      }
    } catch (error) {
      console.warn(`Error searching ${source}:`, error);
    }
  }

  if (results.length > 0) {
    return results;
  }

  return [{ url: PLACEHOLDER_IMAGE, source: 'fallback', type: 'cover' }];
}

/**
 * Helper para obtener la mejor imagen disponible.
 */
export async function getBestGameImage(gameName: string, platform?: SupportedPlatform): Promise<string> {
  const results = await searchGameImages({ gameName, platform });
  return results[0]?.url || PLACEHOLDER_IMAGE;
}
