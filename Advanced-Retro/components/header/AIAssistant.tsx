'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Gavel,
  MessageCircle,
  PackageSearch,
  SendHorizonal,
  Sparkles,
  Ticket,
  Truck,
  X,
} from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

type ChatRole = 'user' | 'assistant';
type AssistantProvider = 'anthropic' | 'fallback' | '';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type QuickAction = {
  key: string;
  title: string;
  description: string;
  prompt: string;
  href?: string;
  icon: typeof Sparkles;
};

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildWelcomeMessage(locale: string): ChatMessage {
  return {
    id: makeId(),
    role: 'assistant',
    content:
      locale === 'en'
        ? "Welcome to AdvancedRetro support. I can guide you through products, orders, shipping, auctions and the mystery flow. Tell me what you need and I will keep it practical."
        : 'Bienvenido al soporte de AdvancedRetro. Puedo orientarte con productos, pedidos, envíos, subastas y el flujo mystery. Cuéntame qué necesitas y te guío de forma práctica.',
  };
}

type AIAssistantProps = {
  triggerClassName?: string;
};

export default function AIAssistant({ triggerClassName = '' }: AIAssistantProps) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<AssistantProvider>('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildWelcomeMessage(locale)]);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.role === 'assistant') {
        return [buildWelcomeMessage(locale)];
      }
      return current;
    });
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, loading]);

  const quickActions = useMemo<QuickAction[]>(
    () =>
      locale === 'en'
        ? [
            {
              key: 'orders',
              title: 'Order status',
              description: 'Tracking, delivery windows and order follow-up.',
              prompt: 'How can I check the status or tracking of my order?',
              href: '/perfil',
              icon: Truck,
            },
            {
              key: 'products',
              title: 'Product help',
              description: 'Guidance on components, condition and compatibility.',
              prompt: 'Help me understand components, condition and what comes with a product.',
              href: '/tienda',
              icon: PackageSearch,
            },
            {
              key: 'mystery',
              title: 'Mystery flow',
              description: 'Boxes, tickets and how the separate roulette section works.',
              prompt: 'Explain the difference between mystery boxes and roulette tickets.',
              href: '/mystery-boxes',
              icon: Ticket,
            },
            {
              key: 'auctions',
              title: 'Auctions',
              description: 'Bidding, reminders and live auction dynamics.',
              prompt: 'How do auctions work and what should I know before bidding?',
              href: '/subastas',
              icon: Gavel,
            },
          ]
        : [
            {
              key: 'orders',
              title: 'Estado del pedido',
              description: 'Tracking, tiempos de entrega y seguimiento del pedido.',
              prompt: '¿Cómo puedo comprobar el estado o tracking de mi pedido?',
              href: '/perfil',
              icon: Truck,
            },
            {
              key: 'products',
              title: 'Ayuda con productos',
              description: 'Componentes, estado, compatibilidad y contenido.',
              prompt: 'Ayúdame a entender componentes, estado y qué incluye un producto.',
              href: '/tienda',
              icon: PackageSearch,
            },
            {
              key: 'mystery',
              title: 'Flujo Mystery',
              description: 'Cajas, tickets y cómo funciona la ruleta por separado.',
              prompt: 'Explícame la diferencia entre mystery boxes y la ruleta de tickets.',
              href: '/mystery-boxes',
              icon: Ticket,
            },
            {
              key: 'auctions',
              title: 'Subastas',
              description: 'Pujas, recordatorios y dinámica en directo.',
              prompt: '¿Cómo funcionan las subastas y qué debo saber antes de pujar?',
              href: '/subastas',
              icon: Gavel,
            },
          ],
    [locale]
  );

  const statusLabel = useMemo(() => {
    if (loading) return locale === 'en' ? 'Thinking…' : 'Pensando…';
    if (provider === 'anthropic') return locale === 'en' ? 'AI online' : 'IA online';
    if (provider === 'fallback') return locale === 'en' ? 'Local guidance' : 'Guía local';
    return locale === 'en' ? 'Ready' : 'Listo';
  }, [loading, locale, provider]);

  const inputPlaceholder =
    locale === 'en'
      ? 'Ask about orders, products, shipping, auctions or mystery boxes...'
      : 'Pregunta sobre pedidos, productos, envíos, subastas o mystery boxes...';

  const sendPrompt = async (overridePrompt?: string) => {
    const content = String(overridePrompt ?? text).trim();
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
      const answer = String(payload?.message || '').trim();
      const nextProvider = payload?.provider === 'anthropic' ? 'anthropic' : 'fallback';
      setProvider(nextProvider);

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content:
            answer ||
            (locale === 'en'
              ? 'I could not give a precise answer just now. Try again in a moment.'
              : 'No he podido darte una respuesta precisa ahora mismo. Inténtalo de nuevo en un momento.'),
        },
      ]);
    } catch {
      setProvider('fallback');
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content:
            locale === 'en'
              ? 'The assistant is temporarily unavailable. For anything tied to your account or a specific order, go to your profile and open a support ticket.'
              : 'El asistente está temporalmente indisponible. Para cualquier cosa ligada a tu cuenta o a un pedido concreto, entra en tu perfil y abre un ticket de soporte.',
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
        className={`chip hover:border-primary/50 hover:text-text ${triggerClassName}`.trim()}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{locale === 'en' ? 'Assistant' : 'Asistente'}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[95] bg-[rgba(2,8,16,0.72)] backdrop-blur-md" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 top-auto flex max-h-[92svh] flex-col overflow-hidden rounded-t-[1.7rem] border border-line bg-[linear-gradient(180deg,rgba(7,13,24,0.98),rgba(8,14,25,0.96))] shadow-[0_24px_80px_rgba(1,6,16,0.55)] md:inset-y-4 md:right-4 md:left-auto md:w-[460px] md:max-h-none md:rounded-[1.7rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden border-b border-line/80 px-5 pb-5 pt-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(102,192,244,0.16),transparent_42%),radial-gradient(circle_at_right,rgba(137,167,255,0.14),transparent_34%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-line/80 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-textMuted">
                      {statusLabel}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-text">{locale === 'en' ? 'AdvancedRetro Assistant' : 'Asistente AdvancedRetro'}</h2>
                  <p className="mt-1 max-w-[32ch] text-sm leading-relaxed text-textMuted">
                    {locale === 'en'
                      ? 'Fast guidance for products, shipping, auctions and the separate mystery flow.'
                      : 'Orientación rápida para productos, envíos, subastas y el flujo mystery por separado.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-[rgba(255,255,255,0.04)] text-textMuted transition hover:border-primary/40 hover:text-text"
                  onClick={() => setOpen(false)}
                  aria-label={locale === 'en' ? 'Close assistant' : 'Cerrar asistente'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 border-b border-line/70 px-4 py-4 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.key}
                    className="group rounded-[1.2rem] border border-line/80 bg-[rgba(255,255,255,0.03)] p-3 transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => void sendPrompt(action.prompt)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-text">{action.title}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-textMuted">{action.description}</span>
                        </span>
                      </button>
                      {action.href ? (
                        <Link
                          href={action.href}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line/70 bg-[rgba(255,255,255,0.03)] text-textMuted transition hover:border-primary/40 hover:text-text"
                          aria-label={action.title}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-[1.35rem] border px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'assistant'
                      ? 'mr-auto border-primary/25 bg-[linear-gradient(180deg,rgba(102,192,244,0.10),rgba(255,255,255,0.03))] text-text'
                      : 'ml-auto border-line bg-[rgba(10,18,30,0.78)] text-text'
                  }`}
                >
                  <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-textMuted">
                    {message.role === 'assistant'
                      ? locale === 'en'
                        ? 'Assistant'
                        : 'Asistente'
                      : locale === 'en'
                        ? 'You'
                        : 'Tú'}
                  </p>
                  <p>{message.content}</p>
                </div>
              ))}

              {loading ? (
                <div className="mr-auto max-w-[92%] rounded-[1.35rem] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-textMuted">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {locale === 'en' ? 'Assistant' : 'Asistente'}
                  </div>
                  {locale === 'en' ? 'Building the best answer for you…' : 'Preparando la mejor respuesta para ti…'}
                </div>
              ) : null}
            </div>

            <div className="border-t border-line/80 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={`${action.key}-chip`}
                    type="button"
                    onClick={() => setText(action.prompt)}
                    className="rounded-full border border-line/80 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] text-textMuted transition hover:border-primary/40 hover:text-text"
                  >
                    {action.title}
                  </button>
                ))}
              </div>

              <div className="rounded-[1.35rem] border border-line bg-[rgba(10,18,30,0.82)] p-2">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={inputPlaceholder}
                    rows={2}
                    className="min-h-[72px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-textMuted"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendPrompt();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void sendPrompt()}
                    disabled={loading || !text.trim()}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-[var(--theme-button-primary-text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={locale === 'en' ? 'Send message' : 'Enviar mensaje'}
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-textMuted">
                {locale === 'en'
                  ? 'For account-specific cases, use your profile support ticket so the team can review your order or account directly.'
                  : 'Para casos ligados a tu cuenta, usa el ticket de soporte desde tu perfil para que el equipo pueda revisar tu pedido o tu cuenta directamente.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
