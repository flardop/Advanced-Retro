import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getProductHref } from '@/lib/productUrl';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type AssistantRole = 'user' | 'assistant';
type AssistantProvider = 'anthropic' | 'openai' | 'fallback';

type AssistantMessage = {
  role: AssistantRole;
  content: string;
};

type AssistantLink = {
  label: string;
  href: string;
};

type AssistantProductHint = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  href: string;
};

type AssistantContext = {
  locale: string;
  latestUserText: string;
  links: AssistantLink[];
  productHints: AssistantProductHint[];
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const OPENAI_MAX_TOKENS = 220;
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
    throw new Error(
      'Demasiadas consultas seguidas. Espera un minuto y vuelve a intentarlo.'
    );
  }

  history.push(now);
  store.set(key, history);
}

function normalizeLocale(input: unknown): string {
  const raw = String(input || 'es').trim().toLowerCase();
  return raw.startsWith('en') ? 'en' : 'es';
}

function normalizeMessages(input: unknown): AssistantMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const role = String((item as Record<string, unknown>)?.role || '').trim();
      const content = String((item as Record<string, unknown>)?.content || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1800);
      if ((role !== 'user' && role !== 'assistant') || !content) return null;
      return { role: role as AssistantRole, content };
    })
    .filter((item): item is AssistantMessage => Boolean(item))
    .slice(-12);
}

function buildRouteSuggestions(locale: string, userText: string): AssistantLink[] {
  const text = userText.toLowerCase();
  const links: AssistantLink[] = [];

  const push = (label: string, href: string) => {
    if (!links.some((item) => item.href === href)) links.push({ label, href });
  };

  push(locale === 'en' ? 'Open catalogue' : 'Abrir catálogo', '/tienda');

  if (
    text.includes('pedido') ||
    text.includes('order') ||
    text.includes('tracking') ||
    text.includes('envio') ||
    text.includes('envío') ||
    text.includes('shipping')
  ) {
    push(locale === 'en' ? 'Profile and orders' : 'Perfil y pedidos', '/perfil');
  }

  if (
    text.includes('mystery') ||
    text.includes('ruleta') ||
    text.includes('roulette') ||
    text.includes('tirada') ||
    text.includes('ticket')
  ) {
    push(locale === 'en' ? 'Mystery boxes' : 'Mystery boxes', '/mystery-boxes');
    push(locale === 'en' ? 'Roulette' : 'Ruleta', '/ruleta');
  }

  if (text.includes('subasta') || text.includes('auction') || text.includes('puja') || text.includes('bid')) {
    push(locale === 'en' ? 'Auctions' : 'Subastas', '/subastas');
  }

  if (
    text.includes('soporte') ||
    text.includes('ticket') ||
    text.includes('support') ||
    text.includes('contacto') ||
    text.includes('contact')
  ) {
    push(locale === 'en' ? 'Support contact' : 'Contacto de soporte', '/contacto');
    push(locale === 'en' ? 'Open support ticket' : 'Abrir ticket', '/perfil?tab=tickets');
  }

  return links.slice(0, 6);
}

function buildProductQuery(userText: string): string {
  return userText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

async function findProductHints(userText: string): Promise<AssistantProductHint[]> {
  const query = buildProductQuery(userText);
  if (!supabaseAdmin || query.length < 3) return [];

  const generic = new Set([
    'hola',
    'ayuda',
    'precio',
    'envio',
    'envío',
    'shipping',
    'tracking',
    'pedido',
    'ticket',
    'ruleta',
    'roulette',
    'mystery',
    'subasta',
    'auction',
  ]);
  if (generic.has(query.toLowerCase())) return [];

  const keywords = query.split(' ').filter(Boolean).slice(0, 4);
  if (keywords.length === 0) return [];

  let builder = supabaseAdmin
    .from('products')
    .select('id,name,price,stock')
    .limit(4);

  const textQuery = query.toLowerCase();
  const ilikePatterns = [textQuery, ...keywords.map((keyword) => keyword.toLowerCase())]
    .map((term) => `%${term}%`)
    .slice(0, 4);

  if (ilikePatterns.length > 0) {
    const orExpr = ilikePatterns.map((pattern) => `name.ilike.${pattern}`).join(',');
    builder = builder.or(orExpr);
  }

  const { data, error } = await builder;
  if (error || !Array.isArray(data)) return [];

  return data
    .map((row: Record<string, unknown>) => {
      const name = String(row?.name || '');
      const nameLower = name.toLowerCase();
      let score = 0;
      for (const keyword of keywords) {
        if (nameLower.includes(keyword.toLowerCase())) score += 2;
      }
      if (nameLower.includes(textQuery)) score += 4;
      return {
        id: String(row?.id || ''),
        name,
        priceCents: Math.max(0, Math.round(Number(row?.price || 0))),
        stock: Math.max(0, Math.round(Number(row?.stock || 0))),
        href: getProductHref(row),
        score,
      };
    })
    .filter((row) => row.id && row.name)
    .sort((a, b) => b.score - a.score || a.priceCents - b.priceCents)
    .slice(0, 3)
    .map(({ score: _score, ...rest }) => rest);
}

function formatPrice(cents: number): string {
  return `${(Math.max(0, Number(cents || 0)) / 100).toFixed(2)} €`;
}

function getSystemPrompt(locale: string): string {
  if (locale === 'en') {
    return [
      'You are the AdvancedRetro virtual assistant.',
      'Respond in practical, concise English.',
      'Help with products, orders, shipping, auctions, community, mystery boxes and roulette.',
      'Clarify that Mystery Boxes and Roulette are separate sections: Mystery Boxes is where users buy spins, Roulette is where they spend tickets already earned.',
      'Do not invent specific product availability, private account data or order status.',
      'If the user needs account-specific help, direct them to their profile support ticket.',
      'Prefer internal store links when they are available in context.',
    ].join(' ');
  }

  return [
    'Eres el asistente virtual de AdvancedRetro.',
    'Responde en español de España, de forma clara, breve y útil.',
    'Ayuda con productos, pedidos, envíos, subastas, comunidad, mystery boxes y ruleta.',
    'Aclara que Mystery Boxes y Ruleta son secciones distintas: en Mystery Boxes se compran tiradas y en Ruleta se gastan tickets ya conseguidos.',
    'No inventes disponibilidad concreta, datos privados de cuenta ni estados de pedido.',
    'Si el usuario necesita ayuda ligada a su cuenta, indícale que abra un ticket desde su perfil.',
    'Prioriza enlaces internos cuando ayuden a resolver la consulta.',
  ].join(' ');
}

function buildContextPrompt(locale: string, context: AssistantContext): string {
  const parts: string[] = [];

  if (context.productHints.length > 0) {
    parts.push(
      locale === 'en'
        ? 'Related products found in the catalogue:'
        : 'Productos relacionados encontrados en el catálogo:',
      ...context.productHints.map(
        (item) => `- ${item.name} | ${formatPrice(item.priceCents)} | stock ${item.stock} | enlace ${item.href}`
      )
    );
  }

  if (context.links.length > 0) {
    parts.push(
      locale === 'en'
        ? 'Useful internal links you can mention if relevant:'
        : 'Enlaces internos útiles que puedes mencionar si encajan:',
      ...context.links.map((link) => `- ${link.label}: ${link.href}`)
    );
  }

  return parts.join('\n');
}

function fallbackReply(locale: string, prompt: string, context: AssistantContext): string {
  const text = prompt.toLowerCase();
  let baseMessage = '';

  if (
    text.includes('mystery') ||
    text.includes('ruleta') ||
    text.includes('roulette') ||
    text.includes('box') ||
    text.includes('ticket')
  ) {
    baseMessage =
      locale === 'en'
        ? 'Mystery Boxes and Roulette are related, but they are not the same flow.\n\n1. In Mystery Boxes you buy the experience or the spin.\n2. In Roulette you spend tickets you already earned.\n\nIf you want, I can also tell you which option makes more sense depending on whether you want surprise, collectible prizes or a lower spend.'
        : 'Mystery Boxes y Ruleta están relacionadas, pero no son el mismo flujo.\n\n1. En Mystery Boxes compras la experiencia o la tirada.\n2. En Ruleta gastas tickets que ya has conseguido.\n\nSi quieres, también puedo decirte qué opción encaja mejor contigo según busques sorpresa, premios coleccionables o gastar menos.';
  } else if (text.includes('retroville') || text.includes('serie') || text.includes('show')) {
    baseMessage =
      locale === 'en'
        ? 'Retroville is the original narrative universe of AdvancedRetro. It is being developed as a series with its own characters, districts, transport, strange humour and forgotten hardware culture.'
        : 'Retroville es el universo narrativo original de AdvancedRetro. Se está desarrollando como una serie con personajes propios, distritos, transporte, humor extraño y cultura de hardware olvidado.';
  } else if (
    text.includes('regalo') ||
    text.includes('gift') ||
    text.includes('recomienda') ||
    text.includes('recommend')
  ) {
    baseMessage =
      locale === 'en'
        ? 'Yes, I can help you narrow it down properly. Tell me 3 things: budget, main console/platform, and whether you want something safe or something more special and collectible.'
        : 'Sí, puedo ayudarte a afinarlo bien. Dime 3 cosas: presupuesto, consola o plataforma principal y si buscas algo seguro o algo más especial y coleccionable.';
  } else if (text.includes('pedido') || text.includes('order') || text.includes('tracking')) {
    baseMessage =
      locale === 'en'
        ? 'If this is about a specific order, open your profile and contact support with the order number so the team can review it properly.'
        : 'Si esto va sobre un pedido concreto, entra en tu perfil y contacta con soporte indicando el número de pedido para que el equipo pueda revisarlo bien.';
  } else if (
    text.includes('envio') ||
    text.includes('envío') ||
    text.includes('shipping')
  ) {
    baseMessage =
      locale === 'en'
        ? 'AdvancedRetro ships from Spain. For exact delivery timing or shipping costs, review checkout details or contact support from your profile.'
        : 'AdvancedRetro prepara envíos desde España. Para plazos exactos o costes de envío, revisa el checkout o contacta con soporte desde tu perfil.';
  } else if (
    text.includes('subasta') ||
    text.includes('auction') ||
    text.includes('puja') ||
    text.includes('bid')
  ) {
    baseMessage =
      locale === 'en'
        ? 'The best next step is to review the auctions section directly so you can see live timing, status and current bidding conditions.'
        : 'Lo mejor es revisar directamente la sección de subastas para ver los tiempos en directo, el estado y las condiciones actuales de puja.';
  } else {
    baseMessage =
      locale === 'en'
        ? 'I can help with products, orders, shipping, mystery boxes, roulette and auctions. For account-specific issues, open a support ticket from your profile.'
        : 'Puedo ayudarte con productos, pedidos, envíos, mystery boxes, ruleta y subastas. Para algo ligado a tu cuenta, abre un ticket desde tu perfil.';
  }

  if (context.productHints.length > 0) {
    const suggestions = context.productHints
      .map((item) => `${item.name} (${formatPrice(item.priceCents)})`)
      .join(', ');
    baseMessage +=
      locale === 'en'
        ? `\n\nI also found related products: ${suggestions}.`
        : `\n\nAdemás he encontrado productos relacionados: ${suggestions}.`;
  }

  return baseMessage;
}

async function callAnthropic(
  locale: string,
  messages: AssistantMessage[],
  context: AssistantContext
) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-3-5-haiku-latest';
  const system = [getSystemPrompt(locale), buildContextPrompt(locale, context)]
    .filter(Boolean)
    .join('\n\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.45,
      system,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = String((payload as Record<string, any>)?.error?.message || '').trim();
    throw new Error(apiError || 'Anthropic no pudo responder');
  }

  const textBlocks = Array.isArray((payload as Record<string, any>)?.content)
    ? ((payload as Record<string, any>).content as Record<string, any>[])
    : [];
  const reply = textBlocks
    .map((block) => (block?.type === 'text' ? String(block?.text || '') : ''))
    .join('\n')
    .trim();

  return {
    provider: 'anthropic' as const,
    message: reply || fallbackReply(locale, context.latestUserText, context),
  };
}

async function callOpenAI(
  locale: string,
  messages: AssistantMessage[],
  context: AssistantContext
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model =
    process.env.OPENAI_ASSISTANT_MODEL?.trim() ||
    process.env.OPENAI_CHATBOT_MODEL?.trim() ||
    'gpt-4o-mini';
  const promptContext = buildContextPrompt(locale, context);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: OPENAI_MAX_TOKENS,
      temperature: 0.35,
      messages: [
        { role: 'system', content: getSystemPrompt(locale) },
        ...(promptContext ? [{ role: 'system' as const, content: promptContext }] : []),
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError =
      String((payload as Record<string, any>)?.error?.message || '').trim() ||
      `OpenAI (${response.status})`;
    throw new Error(apiError);
  }

  const reply = String(
    (payload as Record<string, any>)?.choices?.[0]?.message?.content || ''
  ).trim();

  return {
    provider: 'openai' as const,
    message: reply || fallbackReply(locale, context.latestUserText, context),
  };
}

export async function POST(req: Request) {
  try {
    enforceRateLimit();

    const body = await req.json().catch(() => null);
    const locale = normalizeLocale((body as Record<string, unknown>)?.locale);
    const messages = normalizeMessages((body as Record<string, unknown>)?.messages);
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user');

    if (!latestUserMessage) {
      return NextResponse.json(
        {
          message:
            locale === 'en'
              ? 'Tell me what you need and I will guide you as clearly as possible.'
              : 'Cuéntame qué necesitas y te orientaré de la forma más clara posible.',
          content:
            locale === 'en'
              ? 'Tell me what you need and I will guide you as clearly as possible.'
              : 'Cuéntame qué necesitas y te orientaré de la forma más clara posible.',
          provider: 'fallback',
          links: buildRouteSuggestions(locale, ''),
          productMatches: [],
        },
        { status: 200 }
      );
    }

    const links = buildRouteSuggestions(locale, latestUserMessage.content);
    const productHints = await findProductHints(latestUserMessage.content);
    const context: AssistantContext = {
      locale,
      latestUserText: latestUserMessage.content,
      links: [
        ...links,
        ...productHints
          .map((item) => ({
            label:
              locale === 'en' ? `Product: ${item.name}` : `Producto: ${item.name}`,
            href: item.href,
          }))
          .filter((link, index, array) => array.findIndex((item) => item.href === link.href) === index),
      ].slice(0, 6),
      productHints,
    };

    try {
      const anthropicResult = await callAnthropic(locale, messages, context);
      if (anthropicResult) {
        return NextResponse.json({
          message: anthropicResult.message,
          content: anthropicResult.message,
          provider: anthropicResult.provider,
          links: context.links,
          productMatches: context.productHints,
        });
      }
    } catch {
      // Intentionally continue to OpenAI or local fallback.
    }

    try {
      const openAiResult = await callOpenAI(locale, messages, context);
      if (openAiResult) {
        return NextResponse.json({
          message: openAiResult.message,
          content: openAiResult.message,
          provider: openAiResult.provider,
          links: context.links,
          productMatches: context.productHints,
        });
      }
    } catch {
      // Intentionally continue to local fallback.
    }

    const fallbackMessage = fallbackReply(locale, latestUserMessage.content, context);
    return NextResponse.json({
      message: fallbackMessage,
      content: fallbackMessage,
      provider: 'fallback' as AssistantProvider,
      links: context.links,
      productMatches: context.productHints,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'No se pudo completar la respuesta del asistente.';

    return NextResponse.json(
      {
        message,
        content: message,
        provider: 'fallback' as AssistantProvider,
        links: [],
        productMatches: [],
      },
      { status: 200 }
    );
  }
}
