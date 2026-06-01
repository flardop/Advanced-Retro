import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPPORTED_LANGUAGES = new Set(['es', 'en', 'fr', 'it', 'de', 'pt']);
const MAX_ITEMS = 48;
const MAX_TEXT_LENGTH = 500;
const MAX_TOTAL_LENGTH = 8000;
const CACHE_LIMIT = 2500;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 90;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

type SupportedLanguage = 'es' | 'en' | 'fr' | 'it' | 'de' | 'pt';

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}

function getTranslationCache(): Map<string, string> {
  const holder = globalThis as typeof globalThis & {
    __advancedRetroGlobalTranslationCache?: Map<string, string>;
  };
  if (!holder.__advancedRetroGlobalTranslationCache) {
    holder.__advancedRetroGlobalTranslationCache = new Map();
  }
  return holder.__advancedRetroGlobalTranslationCache;
}

function trimCache(cache: Map<string, string>) {
  while (cache.size > CACHE_LIMIT) {
    const firstKey = cache.keys().next().value as string | undefined;
    if (!firstKey) break;
    cache.delete(firstKey);
  }
}

async function translateText(source: string, targetLanguage: SupportedLanguage): Promise<string> {
  if (targetLanguage === 'es') return source;
  const cache = getTranslationCache();
  const key = `${targetLanguage}:${source}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const endpoint =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}` +
      `&dt=t&q=${encodeURIComponent(source)}`;
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return source;
    const data = (await response.json()) as unknown[][][];
    const translated = Array.isArray(data?.[0])
      ? data[0].map((chunk) => String(chunk?.[0] || '')).join('')
      : source;
    const result = translated.trim() || source;
    cache.set(key, result);
    trimCache(cache);
    return result;
  } catch {
    return source;
  }
}

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many translation requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const targetLanguage = String(body?.targetLanguage || '').toLowerCase() as SupportedLanguage;
    if (!SUPPORTED_LANGUAGES.has(targetLanguage)) {
      return NextResponse.json({ error: 'Unsupported language.' }, { status: 400 });
    }

    const texts = Array.isArray(body?.texts)
      ? body.texts
          .map((value: unknown) => String(value || '').slice(0, MAX_TEXT_LENGTH))
          .filter(Boolean)
          .slice(0, MAX_ITEMS)
      : [];
    if (!texts.length) {
      return NextResponse.json({ targetLanguage, translations: [] });
    }
    if (texts.reduce((total: number, value: string) => total + value.length, 0) > MAX_TOTAL_LENGTH) {
      return NextResponse.json({ error: 'Translation payload is too large.' }, { status: 413 });
    }

    const translatedTexts: string[] = [];
    for (let index = 0; index < texts.length; index += 6) {
      translatedTexts.push(
        ...(await Promise.all(
          texts.slice(index, index + 6).map((text: string) => translateText(text, targetLanguage))
        ))
      );
    }

    return NextResponse.json({
      targetLanguage,
      translations: texts.map((source: string, index: number) => ({
        source,
        translated: translatedTexts[index] || source,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid translation request.' }, { status: 400 });
  }
}
