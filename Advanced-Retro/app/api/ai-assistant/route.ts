import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  buildLocalAssistantResponse,
  normalizeLocale,
  normalizeMessages,
} from '@/lib/assistant/localAssistant';
import { loadAssistantUserContext } from '@/lib/assistant/userContext';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const GLOBAL_RL_KEY = '__advancedRetroAiAssistantRateLimitStore';

function getRateLimitStore(): Map<string, number[]> {
  const scope = globalThis as Record<string, unknown>;
  if (!(scope[GLOBAL_RL_KEY] instanceof Map)) {
    scope[GLOBAL_RL_KEY] = new Map<string, number[]>();
  }
  return scope[GLOBAL_RL_KEY] as Map<string, number[]>;
}

function getClientFingerprint(): string {
  try {
    const h = headers();
    const forwardedFor = h.get('x-forwarded-for') || '';
    const ip = forwardedFor.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
    const ua = (h.get('user-agent') || 'unknown').slice(0, 120);
    return `${ip}::${ua}`;
  } catch {
    return 'unknown-client';
  }
}

function enforceRateLimit() {
  const key = getClientFingerprint();
  const store = getRateLimitStore();
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const history = (store.get(key) || []).filter((ts) => ts >= windowStart);

  if (history.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new Error('Demasiadas consultas seguidas. Espera un minuto y vuelve a intentarlo.');
  }

  history.push(now);
  store.set(key, history);
}

export async function POST(req: Request) {
  try {
    enforceRateLimit();

    const body = await req.json().catch(() => null);
    const locale = normalizeLocale((body as Record<string, unknown>)?.locale);
    const messages = normalizeMessages((body as Record<string, unknown>)?.messages);
    const userContext = await loadAssistantUserContext();
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user');

    if (!latestUserMessage) {
      const fallback = await buildLocalAssistantResponse(
        locale,
        [
          {
            role: 'user',
            content:
              locale === 'en'
                ? 'I need help with the store'
                : 'Necesito ayuda con la tienda',
          },
        ],
        userContext
      );

      return NextResponse.json(fallback, { status: 200 });
    }

    const response = await buildLocalAssistantResponse(locale, messages, userContext);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const locale = 'es';
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'No he podido responder ahora mismo. Inténtalo de nuevo dentro de un momento.';

    return NextResponse.json(
      {
        provider: 'local',
        message,
        content: message,
        links: [
          { label: 'Tienda', href: '/tienda' },
          { label: 'Mi perfil', href: '/perfil' },
          { label: 'Abrir ticket', href: '/perfil?tab=tickets' },
        ],
        productMatches: [],
        locale,
      },
      { status: 200 }
    );
  }
}
