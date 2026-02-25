import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatbotLink = {
  label: string;
  href: string;
};

type ChatbotProductHint = {
  id: string;
  name: string;
  price_cents: number;
  category: string;
  stock: number;
};

type ChatbotContext = {
  links: ChatbotLink[];
  productHints: ChatbotProductHint[];
  latestUserText: string;
};

const CHATBOT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHATBOT_RATE_LIMIT_MAX_REQUESTS = 18;
const GLOBAL_RL_KEY = '__advancedRetroChatbotRateLimitStore';

function getRateLimitStore(): Map<string, number[]> {
  const scope = globalThis as any;
  if (!scope[GLOBAL_RL_KEY]) {
    scope[GLOBAL_RL_KEY] = new Map<string, number[]>();
  }
  return scope[GLOBAL_RL_KEY];
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

function enforceChatbotRateLimit() {
  const key = getClientFingerprint();
  const store = getRateLimitStore();
  const now = Date.now();
  const windowStart = now - CHATBOT_RATE_LIMIT_WINDOW_MS;
  const history = (store.get(key) || []).filter((ts) => ts >= windowStart);

  if (history.length >= CHATBOT_RATE_LIMIT_MAX_REQUESTS) {
    throw new Error('Demasiadas consultas seguidas. Espera 1 minuto y vuelve a intentarlo.');
  }

  history.push(now);
  store.set(key, history);

  // Limpieza básica de llaves antiguas para evitar crecimiento del mapa en procesos largos.
  if (store.size > 1000) {
    for (const [entryKey, timestamps] of store.entries()) {
      const next = timestamps.filter((ts) => ts >= windowStart);
      if (next.length === 0) store.delete(entryKey);
      else store.set(entryKey, next);
    }
  }
}

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is any => item && typeof item === 'object')
    .map((item): ChatMessage => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
    }))
    .filter((msg) => msg.content.length > 0)
    .slice(-12);
}

function buildRouteSuggestions(userText: string): ChatbotLink[] {
  const text = userText.toLowerCase();
  const links: ChatbotLink[] = [];
  const push = (label: string, href: string) => {
    if (!links.some((item) => item.href === href)) links.push({ label, href });
  };

  push('Ir a tienda', '/tienda');

  if (text.includes('envio') || text.includes('envío') || text.includes('tracking')) {
    push('Mi perfil / pedidos', '/perfil');
  }
  if (text.includes('mystery') || text.includes('ruleta') || text.includes('tirada')) {
    push('Ruleta', '/ruleta');
    push('Mystery Box', '/tienda?category=cajas-misteriosas');
  }
  if (text.includes('encargo') || text.includes('compra asistida')) {
    push('Encargos', '/servicio-compra');
  }
  if (text.includes('devol') || text.includes('garant') || text.includes('incidencia')) {
    push('Abrir ticket en perfil', '/perfil?tab=tickets');
  }
  if (text.includes('login') || text.includes('google') || text.includes('sesion') || text.includes('sesión')) {
    push('Login', '/login');
    push('Mi perfil', '/perfil');
  }

  return links.slice(0, 5);
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

async function findProductHints(userText: string): Promise<ChatbotProductHint[]> {
  const query = buildProductQuery(userText);
  if (!supabaseAdmin || query.length < 3) return [];

  const generic = new Set([
    'hola',
    'ayuda',
    'precio',
    'envio',
    'envío',
    'tracking',
    'pedido',
    'ticket',
    'ruleta',
    'mystery',
    'login',
    'google',
  ]);
  if (generic.has(query.toLowerCase())) return [];

  const keywords = query.split(' ').filter(Boolean).slice(0, 4);
  if (keywords.length === 0) return [];

  let builder = supabaseAdmin
    .from('products')
    .select('id,name,price,category,stock')
    .limit(4);

  // Búsqueda flexible usando el texto completo y palabras clave.
  const textQuery = query.toLowerCase();
  const ilikePatterns = [textQuery, ...keywords.map((k) => k.toLowerCase())]
    .map((term) => `%${term}%`)
    .slice(0, 4);

  if (ilikePatterns.length > 0) {
    const orExpr = ilikePatterns.map((pattern) => `name.ilike.${pattern}`).join(',');
    builder = builder.or(orExpr);
  }

  const { data, error } = await builder;
  if (error || !Array.isArray(data)) return [];

  const scored = data
    .map((row: any) => {
      const name = String(row?.name || '');
      const nameLower = name.toLowerCase();
      let score = 0;
      for (const keyword of keywords) {
        const k = keyword.toLowerCase();
        if (nameLower.includes(k)) score += 2;
      }
      if (nameLower.includes(textQuery)) score += 4;
      return {
        id: String(row?.id || ''),
        name,
        price_cents: Math.max(0, Math.round(Number(row?.price || 0))),
        category: String(row?.category || ''),
        stock: Math.max(0, Math.round(Number(row?.stock || 0))),
        score,
      };
    })
    .filter((row) => row.id && row.name)
    .sort((a, b) => b.score - a.score || a.price_cents - b.price_cents)
    .slice(0, 3)
    .map(({ score: _score, ...rest }) => rest);

  return scored;
}

function formatPrice(cents: number): string {
  return `${(Math.max(0, Number(cents || 0)) / 100).toFixed(2)} €`;
}

function buildContextPrompt(context: ChatbotContext): string {
  const parts: string[] = [];

  if (context.productHints.length > 0) {
    parts.push(
      'Productos relacionados encontrados en catálogo:',
      ...context.productHints.map(
        (item) =>
          `- ${item.name} | ${formatPrice(item.price_cents)} | stock ${item.stock} | enlace /producto/${item.id}`
      )
    );
  }

  if (context.links.length > 0) {
    parts.push(
      'Enlaces internos sugeridos (si ayudan a resolver la consulta):',
      ...context.links.map((link) => `- ${link.label}: ${link.href}`)
    );
  }

  return parts.join('\n');
}

function fallbackResponse(userText: string, context: ChatbotContext): string {
  const text = userText.toLowerCase();
  let baseMessage = '';

  if (text.includes('envio') || text.includes('envío') || text.includes('tracking')) {
    baseMessage =
      'Los envíos se preparan desde España. Si ya hiciste un pedido, entra en tu perfil para ver estado, tracking o abrir un ticket de soporte.';
  } else if (text.includes('mystery') || text.includes('ruleta') || text.includes('tirada')) {
    baseMessage =
      'Las Mystery Box y la ruleta funcionan con tickets. Necesitas tickets del mismo precio que la caja para poder girar.';
  } else if (text.includes('encargo') || text.includes('compra asistida')) {
    baseMessage =
      'El servicio de encargo permite abrir un ticket privado con la tienda para buscar/comprar un producto por encargo.';
  } else if (text.includes('devol') || text.includes('garant')) {
    baseMessage =
      'Para incidencias, cambios o dudas, lo correcto es abrir un ticket desde tu perfil para que quede trazado el soporte y el estado del pedido.';
  } else if (
    text.includes('login') ||
    text.includes('google') ||
    text.includes('sesion') ||
    text.includes('sesión')
  ) {
    baseMessage =
      'Si el login falla, prueba a cerrar sesión, recargar y entrar de nuevo. Si sigue fallando, abre un ticket indicando el error exacto y el dispositivo.';
  } else {
    baseMessage =
      'Puedo ayudarte con pedidos, envíos, mystery box, ruleta, encargos, comunidad y soporte. Si tu consulta necesita seguimiento real, abre un ticket desde tu perfil.';
  }

  if (context.productHints.length > 0) {
    const suggestions = context.productHints
      .map((item) => `${item.name} (${formatPrice(item.price_cents)})`)
      .join(', ');
    baseMessage += `\n\nHe encontrado productos relacionados: ${suggestions}.`;
  }

  return baseMessage;
}

function systemPrompt() {
  return [
    'Eres el asistente de Advanced Retro, una tienda de retro gaming y coleccionismo.',
    'Responde en español de España, tono claro y breve.',
    'Ayuda con navegación de la tienda, categorías, pedidos, envíos, mystery box, ruleta, encargos, comunidad y soporte.',
    'No inventes estados de pedidos ni datos privados.',
    'Si el usuario necesita algo específico de su cuenta/pedido, indícale abrir un ticket desde /perfil.',
    'Cuando menciones productos o secciones, prioriza enlaces internos de la tienda si están disponibles en el contexto.',
    'No des asesoramiento legal/financiero.',
  ].join(' ');
}

async function callOpenAI(messages: ChatMessage[], context: ChatbotContext) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: true,
      provider: 'fallback' as const,
      message: fallbackResponse(context.latestUserText, context),
      links: context.links,
      productMatches: context.productHints,
    };
  }

  const model = process.env.OPENAI_CHATBOT_MODEL?.trim() || 'gpt-4o-mini';
  const promptContext = buildContextPrompt(context);
  const body = {
    model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt() },
      ...(promptContext ? [{ role: 'system' as const, content: promptContext }] : []),
      ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        data?.error?.message || data?.message || `Error OpenAI (${res.status})`;
      throw new Error(message);
    }

    const content = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!content) {
      throw new Error('Respuesta vacía del asistente');
    }

    return {
      ok: true,
      provider: 'openai' as const,
      model,
      message: content,
      links: context.links,
      productMatches: context.productHints,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    enforceChatbotRateLimit();
    const body = await req.json().catch(() => null);
    const messages = normalizeMessages(body?.messages);
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== 'user') {
      return NextResponse.json({ error: 'Mensaje de usuario requerido' }, { status: 400 });
    }
    if (latest.content.length > 600) {
      return NextResponse.json(
        { error: 'La consulta es demasiado larga. Resume tu pregunta en un mensaje más corto.' },
        { status: 400 }
      );
    }

    const links = buildRouteSuggestions(latest.content);
    const productHints = await findProductHints(latest.content);
    const context: ChatbotContext = {
      links: [
        ...links,
        ...productHints
          .map((item) => ({
            label: `Producto: ${item.name}`,
            href: `/producto/${item.id}`,
          }))
          .filter((link, index, arr) => arr.findIndex((x) => x.href === link.href) === index),
      ].slice(0, 6),
      productHints,
      latestUserText: latest.content,
    };

    const result = await callOpenAI(messages, context);
    return NextResponse.json(result);
  } catch (error: any) {
    const links = buildRouteSuggestions('');
    return NextResponse.json(
      {
        ok: false,
        provider: 'fallback',
        message: fallbackResponse('', { links, productHints: [], latestUserText: '' }),
        error: error?.message || 'No se pudo responder',
        links,
        productMatches: [],
      },
      { status: 200 }
    );
  }
}
