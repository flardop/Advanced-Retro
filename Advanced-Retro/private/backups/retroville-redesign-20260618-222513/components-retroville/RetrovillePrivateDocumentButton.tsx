'use client';

import { Mail, Copy, Check, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

const REQUEST_EMAIL = 'flardop44@gmail.com';

function buildMailtoHref(documentTitle: string) {
  const params = new URLSearchParams({
    subject: `Solicitud de acceso · ${documentTitle}`,
    body: `Hola Joel,\n\nMe gustaría solicitar acceso a "${documentTitle}".\n\nGracias.`,
  });
  return `mailto:${REQUEST_EMAIL}?${params.toString()}`;
}

export default function RetrovillePrivateDocumentButton({
  documentTitle,
  buttonLabel,
  className,
}: {
  documentTitle: string;
  buttonLabel: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const mailtoHref = useMemo(() => buildMailtoHref(documentTitle), [documentTitle]);

  useEffect(() => {
    if (!open) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(REQUEST_EMAIL);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar solicitud"
            className="absolute inset-0 bg-[rgba(2,6,14,0.8)] backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative z-[1] w-full max-w-xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.98),rgba(7,9,18,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.4)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8ad7ff]">Documento privado</p>
                <h3
                  id={titleId}
                  className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] font-black uppercase leading-[0.94] text-white [font-family:var(--font-display)]"
                >
                  Solicitar la biblia por correo
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/72 transition hover:border-white/20 hover:text-white"
                aria-label="Cerrar popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p id={descriptionId} className="mt-4 text-sm leading-7 text-white/74 sm:text-base">
              La biblia de serie ya no se descarga de forma pública. Si quieres recibir <strong className="text-white">{documentTitle}</strong>, escríbenos a este correo y te la enviamos de forma directa.
            </p>

            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffc940]">Correo de solicitud</p>
              <p className="mt-3 break-all text-lg font-semibold text-white">{REQUEST_EMAIL}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={mailtoHref}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[var(--rv-green)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110"
              >
                <Mail className="h-4 w-4" />
                Pedir por email
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/82 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar correo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
