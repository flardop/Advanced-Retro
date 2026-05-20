'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AIAssistant.module.css';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AIAssistantProps = {
  triggerClassName?: string;
  onTrigger?: () => void;
};

const starterMessage: Message = {
  id: '0',
  role: 'assistant',
  content:
    '¡Hola! Soy el asistente de AdvancedRetro. Puedo ayudarte a encontrar productos, resolver dudas sobre pedidos y contarte sobre Retroville.',
};

const quickPrompts = [
  'Quiero encontrar un regalo retro',
  'Explícame Mystery Boxes y Ruleta',
  'Necesito ayuda con un pedido',
  'Cuéntame qué es Retroville',
] as const;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AIAssistant({ onTrigger, triggerClassName = '' }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([starterMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [input]);

  const openAssistant = () => {
    onTrigger?.();
    setIsOpen(true);
  };

  const sendMessage = async (override?: string) => {
    const raw = typeof override === 'string' ? override : input;
    const content = raw.trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));
      const reply =
        typeof data.message === 'string' && data.message.trim()
          ? data.message.trim()
          : typeof data.content === 'string' && data.content.trim()
            ? data.content.trim()
            : '';

      setMessages((previous) => [
        ...previous,
        {
          id: makeId(),
          role: 'assistant',
          content: reply || 'Lo siento, no pude procesar tu mensaje. Inténtalo de nuevo.',
        },
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: makeId(),
          role: 'assistant',
          content: 'Hubo un error al conectar. Por favor, inténtalo de nuevo.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {isOpen ? (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} aria-hidden="true" />
      ) : null}

      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Asistente AdvancedRetro"
      >
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>AR</div>
            <div>
              <p className={styles.name}>Asistente AdvancedRetro</p>
              <p className={styles.status}>● Online</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
            aria-label="Cerrar chat"
          >
            ✕
          </button>
        </div>

        <div className={styles.messages}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${message.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
            >
              <p>{message.content}</p>
            </div>
          ))}

          {messages.length === 1 ? (
            <div className={styles.quickActions}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={styles.quickAction}
                  onClick={() => {
                    if (!isLoading) {
                      void sendMessage(prompt);
                    }
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <div className={`${styles.message} ${styles.messageAssistant}`}>
              <div className={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            className={styles.input}
            rows={1}
            aria-label="Mensaje al asistente"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isLoading}
            className={styles.sendButton}
            aria-label="Enviar mensaje"
          >
            →
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openAssistant();
          }
        }}
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''} ${triggerClassName}`.trim()}
        aria-label="Abrir asistente"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  );
}
