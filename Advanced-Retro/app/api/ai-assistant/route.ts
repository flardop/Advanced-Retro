import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `Eres el asistente virtual de AdvancedRetro, una tienda online especializada en productos retro, consolas vintage, videojuegos clásicos y coleccionables.
Ayuda a los usuarios con preguntas sobre productos, estado de pedidos, políticas de envío, devoluciones, mystery boxes y subastas.
Aclara que Mystery Boxes y Ruleta son secciones distintas: Mystery Boxes sirve para comprar tiradas y Ruleta sirve para gastar tickets ya conseguidos.
Sé amable, conciso y responde en el idioma del usuario.
Si el usuario pregunta por un pedido específico, dile que contacte con soporte indicando su número de pedido.
No inventes información específica sobre productos, disponibilidad o precios. Si te faltan datos, invítale a explorar la tienda o a contactar con soporte.`;

function normalizeMessages(input: unknown): AssistantMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const role = String((item as any)?.role || '').trim();
      const content = String((item as any)?.content || '')
        .trim()
        .slice(0, 2500);
      if ((role !== 'user' && role !== 'assistant') || !content) return null;
      return { role: role as AssistantMessage['role'], content };
    })
    .filter((item): item is AssistantMessage => Boolean(item))
    .slice(-20);
}

function fallbackReply(locale: string, prompt: string): string {
  const text = prompt.toLowerCase();

  if (text.includes('pedido') || text.includes('order')) {
    return locale === 'en'
      ? 'If your question is about a specific order, please contact support and include your order number so the team can check it for you.'
      : 'Si tu consulta es sobre un pedido concreto, contacta con soporte indicando tu número de pedido para que el equipo pueda revisarlo.';
  }

  if (text.includes('envio') || text.includes('envío') || text.includes('shipping')) {
    return locale === 'en'
      ? 'AdvancedRetro ships from Spain. For exact delivery timing, the safest route is to review the checkout details or contact support.'
      : 'AdvancedRetro prepara envíos desde España. Para tiempos exactos, lo más seguro es revisar el checkout o contactar con soporte.';
  }

  if (text.includes('mystery') || text.includes('ruleta') || text.includes('roulette') || text.includes('box')) {
    return locale === 'en'
      ? 'Mystery Boxes and Roulette are separate flows. You buy spins in Mystery Boxes, and then you use Roulette only to spend the tickets you already earned.'
      : 'Mystery Boxes y Ruleta son flujos separados. En Mystery Boxes compras las tiradas y en Ruleta solo gastas los tickets que ya has conseguido.';
  }

  if (text.includes('subasta') || text.includes('auction')) {
    return locale === 'en'
      ? 'Auctions can change quickly. The best next step is to review the auctions page directly for live timing, status and bidding information.'
      : 'Las subastas cambian rápido. Lo mejor es revisar directamente la página de subastas para ver tiempos, estado y pujas activas.';
  }

  return locale === 'en'
    ? 'I can help with products, orders, shipping, mystery boxes and auctions. If you need account-specific help, please contact support.'
    : 'Puedo ayudarte con productos, pedidos, envíos, mystery boxes y subastas. Si necesitas ayuda ligada a tu cuenta, contacta con soporte.';
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const locale = String((body as any)?.locale || 'es').trim().toLowerCase();
  const messages = normalizeMessages((body as any)?.messages);
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

  if (!latestUserMessage) {
    return NextResponse.json(
      {
        message:
          locale === 'en'
            ? 'Tell me what you need help with and I will do my best to guide you.'
            : 'Cuéntame qué necesitas y haré lo posible por orientarte.',
        provider: 'fallback',
      },
      { status: 200 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';

  if (!apiKey) {
    return NextResponse.json({
      message: fallbackReply(locale, latestUserMessage.content),
      provider: 'fallback',
    });
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.5,
        system: SYSTEM_PROMPT,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    const payload = await anthropicResponse.json().catch(() => null);
    if (!anthropicResponse.ok) {
      const apiError = String((payload as any)?.error?.message || '').trim();
      throw new Error(apiError || 'No se pudo completar la respuesta del asistente');
    }

    const textBlocks = Array.isArray((payload as any)?.content) ? (payload as any).content : [];
    const reply = textBlocks
      .map((block: any) => (block?.type === 'text' ? String(block?.text || '') : ''))
      .join('\n')
      .trim();

    return NextResponse.json({
      message: reply || fallbackReply(locale, latestUserMessage.content),
      provider: 'anthropic',
    });
  } catch {
    return NextResponse.json({
      message: fallbackReply(locale, latestUserMessage.content),
      provider: 'fallback',
    });
  }
}
