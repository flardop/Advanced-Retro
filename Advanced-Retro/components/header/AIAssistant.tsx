'use client';

import { useMemo, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AIAssistant() {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: makeId(),
      role: 'assistant',
      content:
        locale === 'en'
          ? "Hi. I'm the AdvancedRetro assistant. I can help with products, orders, shipping, mystery boxes and auctions. What do you need?"
          : '¡Hola! Soy el asistente de AdvancedRetro. Puedo ayudarte con preguntas sobre productos, pedidos, envíos, mystery boxes y subastas. ¿En qué te ayudo?',
    },
  ]);

  const quickPrompts = useMemo(
    () =>
      locale === 'en'
        ? [
            'How do mystery boxes work?',
            'Where can I see my order status?',
            'Do you ship from Spain?',
            'How do auctions work?',
          ]
        : [
            '¿Cómo funcionan las mystery boxes?',
            '¿Dónde veo el estado de mi pedido?',
            '¿Hacéis envíos desde España?',
            '¿Cómo funcionan las subastas?',
          ],
    [locale]
  );

  const welcomeLabel = locale === 'en' ? 'Assistant' : 'Asistente';
  const inputPlaceholder =
    locale === 'en'
      ? 'Ask about products, orders, shipping or auctions...'
      : 'Pregunta sobre productos, pedidos, envíos o subastas...';

  const send = async () => {
    const content = text.trim();
    if (!content || loading) return;

    const nextUserMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content,
    };

    const nextMessages = [...messages, nextUserMessage].slice(-20);
    setMessages(nextMessages);
    setText('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo obtener respuesta del asistente');
      }

      const answer = String(payload?.message || '').trim();
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content:
            answer ||
            (locale === 'en'
              ? 'I could not answer properly right now. Please try again in a moment.'
              : 'No he podido responder bien ahora mismo. Inténtalo de nuevo en un momento.'),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content:
            error instanceof Error && error.message
              ? error.message
              : locale === 'en'
                ? 'Something went wrong while contacting the assistant.'
                : 'Ha ocurrido un error al contactar con el asistente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="chip hidden md:inline-flex hover:border-primary/50 hover:text-text"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{locale === 'en' ? 'Assistant' : 'Asistente'}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[95] bg-[rgba(2,8,16,0.72)] backdrop-blur-sm">
          <div
            className="absolute inset-y-0 right-0 w-full border-l border-line bg-[rgba(5,11,20,0.98)] shadow-[0_24px_80px_rgba(1,6,16,0.5)] md:w-[380px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <p className="font-semibold text-text">Asistente AdvancedRetro 🤖</p>
                  <p className="text-xs text-textMuted">
                    {locale === 'en'
                      ? 'Fast help for products, orders and shipping.'
                      : 'Ayuda rápida para productos, pedidos y envíos.'}
                  </p>
                </div>
                <button type="button" className="chip" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'assistant'
                        ? 'border-primary/30 bg-primary/10 text-text'
                        : 'ml-8 border-line bg-[rgba(10,18,30,0.74)] text-text'
                    }`}
                  >
                    <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-textMuted">
                      {message.role === 'assistant' ? welcomeLabel : locale === 'en' ? 'You' : 'Tú'}
                    </p>
                    <p>{message.content}</p>
                  </div>
                ))}

                {loading ? (
                  <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.74)] px-4 py-3 text-sm text-textMuted">
                    {locale === 'en' ? 'Thinking...' : 'Escribiendo...'}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-line px-4 py-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setText(prompt)}
                      className="rounded-full border border-line px-3 py-1.5 text-[11px] text-textMuted transition hover:border-primary/40 hover:text-text"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={inputPlaceholder}
                    rows={3}
                    className="min-h-[84px] flex-1 resize-none rounded-2xl border border-line bg-[rgba(10,18,30,0.82)] px-4 py-3 text-sm text-text outline-none placeholder:text-textMuted"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={loading || !text.trim()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={locale === 'en' ? 'Send message' : 'Enviar mensaje'}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-textMuted">
                  {locale === 'en'
                    ? 'For account-specific issues, contact support with your order number.'
                    : 'Si tu caso depende de una cuenta o pedido concreto, contacta con soporte indicando tu número de pedido.'}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="absolute inset-0 -z-10 h-full w-full cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Cerrar panel del asistente"
          />
        </div>
      ) : null}
    </>
  );
}
