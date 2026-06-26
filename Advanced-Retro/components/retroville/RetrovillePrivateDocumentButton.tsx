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

function trackPrivateDocumentAction(action: string, documentTitle: string) {
  if (typeof window === 'undefined') return;
  window.retrovilleTrack?.(`retroville_private_document_${action}`, {
    document_title: documentTitle,
  });
}

export default function RetrovillePrivateDocumentButton({
  documentTitle,
  buttonLabel,
  className,
  eyebrowLabel = 'Documento privado',
  dialogTitle = 'Solicitar la biblia por correo',
  descriptionLead = 'La biblia de serie ya no se descarga de forma pública.',
  mailButtonLabel = 'Pedir por email',
}: {
  documentTitle: string;
  buttonLabel: string;
  className: string;
  eyebrowLabel?: string;
  dialogTitle?: string;
  descriptionLead?: string;
  mailButtonLabel?: string;
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
      trackPrivateDocumentAction('email_copy', documentTitle);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          trackPrivateDocumentAction('open', documentTitle);
        }}
        className={className}
      >
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
                <p className="text-[11px] uppercase tracking-[0.24em] text-[rgba(212,154,67,0.9)]">{eyebrowLabel}</p>
                <h3
                  id={titleId}
                  className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] font-black uppercase leading-[0.94] text-white [font-family:var(--font-display)]"
                >
                  {dialogTitle}
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
              {descriptionLead} Si quieres recibir <strong className="text-white">{documentTitle}</strong>, escríbenos
              {' '}
              a este correo y te lo enviamos de forma directa.
            </p>

            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(212,154,67,0.9)]">Correo de solicitud</p>
              <p className="mt-3 break-all text-lg font-semibold text-white">{REQUEST_EMAIL}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={mailtoHref}
                onClick={() => trackPrivateDocumentAction('mail_click', documentTitle)}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[rgba(196,58,47,0.48)] bg-[rgba(196,58,47,0.16)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[rgba(196,58,47,0.24)]"
              >
                <Mail className="h-4 w-4" />
                {mailButtonLabel}
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
