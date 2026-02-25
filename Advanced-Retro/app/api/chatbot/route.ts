import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is any => item && typeof item === 'object')
    .map((item): ChatMessage => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content || '').trim(),
    }))
    .filter((msg) => msg.content.length > 0)
    .slice(-12);
}

function fallbackResponse(userText: string): string {
  const text = userText.toLowerCase();

  if (text.includes('envio') || text.includes('envío') || text.includes('tracking')) {
    return 'Los envíos se preparan desde España. Si ya hiciste un pedido, entra en tu perfil para ver estado, tracking o abrir un ticket de soporte.';
  }
  if (text.includes('mystery') || text.includes('ruleta') || text.includes('tirada')) {
    return 'Las Mystery Box y la ruleta funcionan con tickets. Necesitas tickets del mismo precio que la caja para poder girar. Si no ves premios o tickets, revisa tu perfil y la sección de ruleta.';
  }
  if (text.includes('encargo') || text.includes('compra asistida')) {
    return 'El servicio de encargo permite abrir un ticket privado con la tienda para buscar/comprar un producto por encargo. Puedes iniciarlo desde la sección Encargos.';
  }
  if (text.includes('devol') || text.includes('garant')) {
    return 'Para incidencias, cambios o dudas, lo correcto es abrir un ticket desde tu perfil para que quede trazado el soporte y el estado del pedido.';
  }
  if (text.includes('login') || text.includes('google') || text.includes('sesion') || text.includes('sesión')) {
    return 'Si el login falla, prueba a cerrar sesión, recargar y entrar de nuevo. Si sigue fallando, abre un ticket indicando el error exacto y el dispositivo.';
  }

  return 'Puedo ayudarte con pedidos, envíos, mystery box, ruleta, encargos y soporte. Si tu consulta necesita seguimiento real, abre un ticket desde tu perfil.';
}

function systemPrompt() {
  return [
    'Eres el asistente de Advanced Retro, una tienda de retro gaming y coleccionismo.',
    'Responde en español de España, tono claro y breve.',
    'Ayuda con navegación de la tienda, categorías, pedidos, envíos, mystery box, ruleta, encargos y soporte.',
    'No inventes estados de pedidos ni datos privados.',
    'Si el usuario necesita algo específico de su cuenta/pedido, indícale abrir un ticket desde /perfil.',
    'No des asesoramiento legal/financiero.',
  ].join(' ');
}

async function callOpenAI(messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: true,
      provider: 'fallback' as const,
      message: fallbackResponse(messages[messages.length - 1]?.content || ''),
    };
  }

  const model = process.env.OPENAI_CHATBOT_MODEL?.trim() || 'gpt-4o-mini';
  const body = {
    model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt() },
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
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const messages = normalizeMessages(body?.messages);
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== 'user') {
      return NextResponse.json({ error: 'Mensaje de usuario requerido' }, { status: 400 });
    }

    const result = await callOpenAI(messages);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        provider: 'fallback',
        message: fallbackResponse(''),
        error: error?.message || 'No se pudo responder',
      },
      { status: 200 }
    );
  }
}
