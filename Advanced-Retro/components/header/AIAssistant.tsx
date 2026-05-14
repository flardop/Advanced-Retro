'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Eraser,
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
type AssistantProvider = 'anthropic' | 'openai' | 'fallback' | '';

type AssistantLink = {
  label: string;
  href: string;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  links?: AssistantLink[];
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
  onTrigger?: () => void;
};

export default function AIAssistant({
  triggerClassName = '',
  onTrigger,
}: AIAssistantProps) {
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
    if (!open || typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
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
    if (provider === 'openai') return locale === 'en' ? 'AI online' : 'IA online';
    if (provider === 'anthropic') return locale === 'en' ? 'AI online' : 'IA online';
    if (provider === 'fallback') return locale === 'en' ? 'Local guidance' : 'Guía local';
    return locale === 'en' ? 'Ready' : 'Listo';
  }, [loading, locale, provider]);

  const inputPlaceholder =
    locale === 'en'
      ? 'Ask about orders, products, shipping, auctions or mystery boxes...'
      : 'Pregunta sobre pedidos, productos, envíos, subastas o mystery boxes...';

  const providerLabel = useMemo(() => {
    if (provider === 'openai') return locale === 'en' ? 'OpenAI active' : 'OpenAI activo';
    if (provider === 'anthropic') return locale === 'en' ? 'Anthropic active' : 'Anthropic activo';
    if (provider === 'fallback') return locale === 'en' ? 'Local mode' : 'Modo local';
    return locale === 'en' ? 'Ready to help' : 'Listo para ayudar';
  }, [locale, provider]);

  const resetConversation = () => {
    setProvider('');
    setText('');
    setMessages([buildWelcomeMessage(locale)]);
  };

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
      const answer = String(payload?.message || payload?.error || '').trim();
      const nextProvider =
        payload?.provider === 'anthropic'
          ? 'anthropic'
          : payload?.provider === 'openai'
            ? 'openai'
            : 'fallback';
      const links = Array.isArray(payload?.links)
        ? payload.links
            .filter((item: any) => item && typeof item === 'object')
            .map((item: any) => ({
              label: String(item?.label || '').trim(),
              href: String(item?.href || '').trim(),
            }))
            .filter((item: AssistantLink) => item.label && item.href.startsWith('/'))
            .slice(0, 6)
        : [];
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
          links: links.length ? links : undefined,
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
          links: [
            {
              label: locale === 'en' ? 'Profile and orders' : 'Perfil y pedidos',
              href: '/perfil',
            },
            {
              label: locale === 'en' ? 'Support contact' : 'Contacto de soporte',
              href: '/contacto',
            },
          ],
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
        onClick={() => {
          onTrigger?.();
          setOpen(true);
        }}
        className={`chip gap-2 hover:border-primary/50 hover:text-text ${triggerClassName}`.trim()}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{locale === 'en' ? 'Assistant' : 'Asistente'}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[95] bg-[rgba(2,8,16,0.72)] backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-0 flex items-end justify-stretch p-2 sm:items-stretch sm:justify-end sm:p-4 lg:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex h-[min(90dvh,52rem)] w-full min-w-0 flex-col overflow-hidden rounded-[1.7rem] border border-line bg-[linear-gradient(180deg,rgba(7,13,24,0.985),rgba(8,14,25,0.965))] shadow-[0_24px_80px_rgba(1,6,16,0.55)] sm:ml-auto sm:h-[calc(100dvh-2rem)] sm:max-h-[52rem] sm:max-w-[29rem] lg:max-w-[31rem]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(102,192,244,0.14),transparent_36%),radial-gradient(circle_at_right,rgba(137,167,255,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_24%)]" />

              <div className="relative border-b border-line/80 px-4 pb-4 pt-[max(0.9rem,env(safe-area-inset-top)+0.35rem)] sm:px-5 sm:pb-5 sm:pt-5">
                <div className="mb-3 flex justify-center sm:hidden">
                  <span className="h-1.5 w-14 rounded-full bg-white/12" />
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                      {locale === 'en' ? 'Guided support' : 'Soporte guiado'}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-text sm:text-[1.1rem]">
                      {locale === 'en' ? 'AdvancedRetro Assistant' : 'Asistente AdvancedRetro'}
                    </h2>
                    <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-textMuted">
                      {locale === 'en'
                        ? 'Quick help for products, orders, shipping, auctions and the separate mystery flow.'
                        : 'Ayuda rápida para productos, pedidos, envíos, subastas y el flujo mystery por separado.'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-primary">
                        {statusLabel}
                      </span>
                      <span className="rounded-full border border-line/80 bg-white/5 px-2.5 py-1 text-[11px] text-textMuted">
                        {providerLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="hidden h-10 items-center justify-center rounded-2xl border border-line bg-[rgba(255,255,255,0.04)] px-3 text-[11px] uppercase tracking-[0.12em] text-textMuted transition hover:border-primary/40 hover:text-text sm:inline-flex"
                      onClick={resetConversation}
                    >
                      <Eraser className="mr-1.5 h-3.5 w-3.5" />
                      {locale === 'en' ? 'Reset' : 'Limpiar'}
                    </button>
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

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/perfil" className="chip text-xs">
                    {locale === 'en' ? 'Profile and orders' : 'Perfil y pedidos'}
                  </Link>
                  <Link href="/contacto" className="chip text-xs">
                    {locale === 'en' ? 'Support contact' : 'Contacto de soporte'}
                  </Link>
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="chip text-xs sm:hidden"
                  >
                    {locale === 'en' ? 'Reset chat' : 'Limpiar chat'}
                  </button>
                </div>
              </div>

              <div className="relative border-b border-line/70 px-4 py-3 sm:px-5 sm:py-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                    {locale === 'en' ? 'Quick actions' : 'Accesos rápidos'}
                  </p>
                  <p className="hidden text-[11px] text-textMuted sm:block">
                    {locale === 'en' ? 'Tap to ask or open a section' : 'Toca para preguntar o abrir una sección'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.key}
                        className="group rounded-[1.1rem] border border-line/80 bg-[rgba(255,255,255,0.03)] p-3 transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => void sendPrompt(action.prompt)}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold leading-tight text-text">{action.title}</span>
                              <span className="mt-1 line-clamp-3 block text-xs leading-relaxed text-textMuted">
                                {action.description}
                              </span>
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
              </div>

              <div ref={messagesRef} className="relative min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {messages.length === 1 ? (
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                      {locale === 'en' ? 'Try one of these' : 'Prueba con esto'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={`${action.key}-starter`}
                          type="button"
                          onClick={() => void sendPrompt(action.prompt)}
                          className="rounded-full border border-line/80 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] text-textMuted transition hover:border-primary/40 hover:text-text"
                        >
                          {action.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[94%] rounded-[1.35rem] border px-4 py-3 text-sm leading-relaxed sm:max-w-[88%] ${
                      message.role === 'assistant'
                        ? 'mr-auto border-primary/25 bg-[linear-gradient(180deg,rgba(102,192,244,0.10),rgba(255,255,255,0.03))] text-text'
                        : 'ml-auto border-line bg-[rgba(10,18,30,0.82)] text-text'
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
                    {message.role === 'assistant' &&
                    Array.isArray(message.links) &&
                    message.links.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.links.map((link) => (
                          <Link
                            key={`${message.id}-${link.href}`}
                            href={link.href}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] text-primary transition hover:border-primary/45 hover:bg-primary/15"
                          >
                            <span>{link.label}</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                {loading ? (
                  <div className="mr-auto max-w-[92%] rounded-[1.35rem] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-textMuted sm:max-w-[88%]">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {locale === 'en' ? 'Assistant' : 'Asistente'}
                    </div>
                    {locale === 'en' ? 'Building the best answer for you…' : 'Preparando la mejor respuesta para ti…'}
                  </div>
                ) : null}
              </div>

              <div className="relative border-t border-line/80 bg-[rgba(6,12,22,0.72)] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-5 sm:pb-5">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {quickActions.map((action) => (
                    <button
                      key={`${action.key}-chip`}
                      type="button"
                      onClick={() => {
                        setText(action.prompt);
                        requestAnimationFrame(() => textareaRef.current?.focus());
                      }}
                      className="shrink-0 rounded-full border border-line/80 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] text-textMuted transition hover:border-primary/40 hover:text-text"
                    >
                      {action.title}
                    </button>
                  ))}
                </div>

                <div className="rounded-[1.35rem] border border-line bg-[rgba(10,18,30,0.84)] p-2.5">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={inputPlaceholder}
                    rows={2}
                    className="min-h-[76px] w-full resize-none bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-textMuted sm:min-h-[88px]"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendPrompt();
                      }
                    }}
                  />

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] leading-relaxed text-textMuted sm:max-w-[28ch]">
                      {locale === 'en'
                        ? 'For account-specific cases, use your profile support ticket so the team can review your order or account directly.'
                        : 'Para casos ligados a tu cuenta, usa el ticket de soporte desde tu perfil para que el equipo pueda revisar tu pedido o tu cuenta directamente.'}
                    </p>

                    <button
                      type="button"
                      onClick={() => void sendPrompt()}
                      disabled={loading || !text.trim()}
                      className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-[var(--theme-button-primary-text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[132px]"
                      aria-label={locale === 'en' ? 'Send message' : 'Enviar mensaje'}
                    >
                      <SendHorizonal className="h-4 w-4" />
                      <span>{locale === 'en' ? 'Send' : 'Enviar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
