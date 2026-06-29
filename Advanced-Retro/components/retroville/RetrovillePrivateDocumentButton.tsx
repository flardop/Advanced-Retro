'use client';

import { Check, Copy, Mail, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { buildRetrovilleAccessRequestBody, buildRetrovillePitchMailto } from '@/app/retroville/shared';

function buildMailtoHref(documentTitle: string) {
  return buildRetrovillePitchMailto({
    subject: `Solicitud de acceso · ${documentTitle}`,
    body: buildRetrovilleAccessRequestBody(documentTitle),
  });
}

function trackPrivateDocumentAction(action: string, documentTitle: string) {
  if (typeof window === 'undefined') return;
  window.retrovilleTrack?.(`retroville_private_document_${action}`, {
    document_title: documentTitle,
  });
}

type RetrovillePrivateDocumentButtonProps = {
  documentTitle: string;
  buttonLabel: string;
  className: string;
  eyebrowLabel?: string;
  dialogTitle?: string;
  descriptionLead?: string;
  mailButtonLabel?: string;
};

export default function RetrovillePrivateDocumentButton(props: RetrovillePrivateDocumentButtonProps) {
  const {
    documentTitle,
    buttonLabel,
    className,
    eyebrowLabel = 'Documento privado',
    dialogTitle = 'Solicitar la biblia por correo',
    descriptionLead = 'La biblia de serie ya no se descarga de forma pública.',
    mailButtonLabel,
  } = props;

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const mailtoHref = buildMailtoHref(documentTitle);
  const requestBody = buildRetrovilleAccessRequestBody(documentTitle);

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
      await navigator.clipboard.writeText('flardop44@gmail.com');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function openMailApp() {
    trackPrivateDocumentAction('mail_click', documentTitle);
    window.location.assign(mailtoHref);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={`${buttonLabel}. ${descriptionLead}`}
        onClick={() => {
          trackPrivateDocumentAction('open_modal', documentTitle);
          setOpen(true);
        }}
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar solicitud privada"
            className="absolute inset-0 bg-[rgba(2,6,14,0.82)] backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            className="relative z-[1] w-full max-w-xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.98),rgba(7,9,18,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.4)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8ad7ff]">{eyebrowLabel}</p>
                <h3
                  id={dialogTitleId}
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

            <p id={dialogDescriptionId} className="mt-4 text-sm leading-7 text-white/74 sm:text-base">
              {descriptionLead} Desde aquí abrimos la app o plataforma de correo por defecto del usuario con el asunto y
              el mensaje ya preparados para solicitar <strong className="text-white">{documentTitle}</strong>.
            </p>

            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffc940]">Correo de solicitud</p>
              <p className="mt-3 break-all text-lg font-semibold text-white">flardop44@gmail.com</p>
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#8ad7ff]">Texto que se abrirá preparado</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/72">{requestBody}</pre>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openMailApp}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[var(--rv-green,#57f0ae)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110"
              >
                <Mail className="h-4 w-4" />
                {mailButtonLabel || 'Abrir correo predeterminado'}
              </button>

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
