'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  links?: { label: string; href: string }[];
};

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SupportAssistantWidget() {
  const pathname = usePathname();
  const hidden = useMemo(() => {
    const path = String(pathname || '').toLowerCase();
    return path.startsWith('/admin');
  }, [pathname]);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'fallback' | ''>('');
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content:
        'Hola. Soy el asistente de Advanced Retro. Puedo ayudarte con envíos, pedidos, mystery box, ruleta, encargos y comunidad.',
      links: [
        { label: 'Tienda', href: '/tienda' },
        { label: 'Ruleta', href: '/ruleta' },
        { label: 'Mi perfil', href: '/perfil' },
      ],
    },
  ]);

  if (hidden) return null;

  const send = async () => {
    const value = text.trim();
    if (!value || loading) return;

    const nextUser: UiMessage = { id: makeId(), role: 'user', content: value };
    const nextHistory = [...messages, nextUser];
    setMessages(nextHistory);
    setText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((msg) => ({ role: msg.role, content: msg.content })),
        }),
      });
      const data = await res.json().catch(() => null);
      const answer =
        String(data?.message || '').trim() || 'No he podido responder ahora mismo. Prueba de nuevo.';
      const links = Array.isArray(data?.links)
        ? data.links
            .filter((item: any) => item && typeof item === 'object')
            .map((item: any) => ({
              label: String(item.label || '').trim(),
              href: String(item.href || '').trim(),
            }))
            .filter((item: { label: string; href: string }) => item.label && item.href.startsWith('/'))
            .slice(0, 6)
        : [];
      setProvider(data?.provider === 'openai' ? 'openai' : 'fallback');
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', content: answer, links: links.length ? links : undefined },
      ]);
    } catch {
      setProvider('fallback');
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content:
            'No he podido responder ahora mismo. Si es algo urgente, abre un ticket desde tu perfil.',
          links: [
            { label: 'Abrir ticket', href: '/perfil?tab=tickets' },
            { label: 'Mi perfil', href: '/perfil' },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    '¿Dónde veo el tracking de mi pedido?',
    '¿Cómo funciona la ruleta y los tickets?',
    'Quiero hacer un encargo de un juego',
    'Tengo un problema con el login de Google',
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      {open ? (
        <div className="w-[min(96vw,390px)] glass border border-line shadow-[0_12px_40px_rgba(2,6,23,.6)]">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Asistente Advanced Retro</p>
              <p className="text-[11px] text-textMuted">
                {provider === 'openai'
                  ? 'Modo ChatGPT'
                  : provider === 'fallback'
                    ? 'Modo ayuda local'
                    : 'Ayuda rápida'}
              </p>
            </div>
            <button className="chip" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>

          <div className="max-h-[360px] overflow-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'assistant'
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-line bg-slate-950/45'
                }`}
              >
                <p className="text-[11px] text-textMuted mb-1">
                  {msg.role === 'assistant' ? 'Asistente' : 'Tú'}
                </p>
                <p>{msg.content}</p>
                {msg.role === 'assistant' && Array.isArray(msg.links) && msg.links.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.links.map((link) => (
                      <Link
                        key={`${msg.id}-${link.href}`}
                        href={link.href}
                        className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/15"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div className="rounded-xl border border-line px-3 py-2 text-sm text-textMuted">
                Escribiendo respuesta...
              </div>
            ) : null}
          </div>

          <div className="border-t border-line p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-line px-2.5 py-1 text-[11px] text-textMuted hover:border-primary/40 hover:text-text"
                  onClick={() => setText(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-transparent border border-line px-3 py-2 text-sm"
                placeholder="Pregunta algo sobre tienda, envíos, ruleta..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <button className="button-primary px-4 py-2" onClick={() => void send()} disabled={loading}>
                Enviar
              </button>
            </div>
            <p className="text-[11px] text-textMuted mt-2">
              Para temas de pedido/cuenta, abre ticket desde <span className="text-primary">Mi perfil</span>. Las
              respuestas del asistente no sustituyen el soporte.
            </p>
          </div>
        </div>
      ) : null}

      <button
        className="button-primary mt-3 shadow-[0_0_30px_rgba(75,228,214,.28)]"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {open ? 'Ocultar asistente' : 'Asistente'}
      </button>
    </div>
  );
}
