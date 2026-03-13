import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

const SUPPORTED_LANGUAGES = new Set(['es', 'en', 'fr', 'de', 'it', 'pt']);

function normalizeLanguage(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'en' || raw.startsWith('en-')) return 'en';
  if (raw === 'fr' || raw.startsWith('fr-')) return 'fr';
  if (raw === 'de' || raw.startsWith('de-')) return 'de';
  if (raw === 'it' || raw.startsWith('it-')) return 'it';
  if (raw === 'pt' || raw.startsWith('pt-')) return 'pt';
  return 'es';
}

function extractTranslation(raw: any): string {
  if (!Array.isArray(raw) || !Array.isArray(raw[0])) return '';
  return raw[0]
    .map((item: any) => (Array.isArray(item) ? String(item[0] || '') : ''))
    .join('')
    .trim();
}

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'No se pudo traducir el mensaje' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUserContext();
    const body = await req.json().catch(() => null);
    const text = String(body?.text || '').trim().slice(0, 2800);

    if (text.length < 2) {
      return NextResponse.json({ error: 'Texto insuficiente para traducir' }, { status: 400 });
    }

    const requested = normalizeLanguage(body?.targetLanguage);
    const profilePreferred = normalizeLanguage(ctx.profile.preferred_language || 'es');
    const target = requested === 'es' && body?.targetLanguage === 'auto' ? profilePreferred : requested;
    if (!SUPPORTED_LANGUAGES.has(target)) {
      return NextResponse.json({ error: 'Idioma de destino no soportado' }, { status: 400 });
    }

    const translateUrl = new URL('https://translate.googleapis.com/translate_a/single');
    translateUrl.searchParams.set('client', 'gtx');
    translateUrl.searchParams.set('sl', 'auto');
    translateUrl.searchParams.set('tl', target);
    translateUrl.searchParams.set('dt', 't');
    translateUrl.searchParams.set('q', text);

    const upstream = await fetch(translateUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'AdvancedRetroChat/1.0',
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { translatedText: text, sourceLanguage: null, targetLanguage: target, provider: 'fallback', translated: false },
        { status: 200 }
      );
    }

    const raw = await upstream.json().catch(() => null);
    const translatedText = extractTranslation(raw);
    if (!translatedText) {
      return NextResponse.json(
        { translatedText: text, sourceLanguage: null, targetLanguage: target, provider: 'fallback', translated: false },
        { status: 200 }
      );
    }

    const sourceLanguage = typeof raw?.[2] === 'string' ? raw[2] : null;
    return NextResponse.json({
      translatedText,
      sourceLanguage,
      targetLanguage: target,
      provider: 'google-gtx',
      translated: translatedText !== text,
    });
  } catch (error: any) {
    return handleError(error);
  }
}

