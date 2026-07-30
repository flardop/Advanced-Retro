'use client';

import { ArrowUpRight, Check, Copy, Mail, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RETROVILLE_PITCH_EMAIL,
  buildRetrovilleAccessRequestBody,
  buildRetrovillePitchGmailCompose,
  buildRetrovillePitchMailto,
  buildRetrovillePitchOutlookCompose,
} from '@/app/retroville/shared';
import { trackGoogleAdsConversion } from '@/lib/marketing/googleAds';

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
    dialogTitle = 'Solicitar acceso por correo',
    descriptionLead = 'La biblia de serie ya no se descarga de forma pública.',
    mailButtonLabel = 'Abrir correo preparado',
  } = props;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const mailSubject = useMemo(() => `Solicitud de acceso · ${documentTitle}`, [documentTitle]);
  const mailtoHref = useMemo(() => buildMailtoHref(documentTitle), [documentTitle]);
  const previewBody = useMemo(() => buildRetrovilleAccessRequestBody(documentTitle), [documentTitle]);
  const gmailComposeHref = useMemo(
    () =>
      buildRetrovillePitchGmailCompose({
        subject: mailSubject,
        body: previewBody,
      }),
    [mailSubject, previewBody]
  );
  const outlookComposeHref = useMemo(
    () =>
      buildRetrovillePitchOutlookCompose({
        subject: mailSubject,
        body: previewBody,
      }),
    [mailSubject, previewBody]
  );

  function closeDialog() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    lastActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((node) => !node.hasAttribute('disabled') && node.tabIndex !== -1);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      lastActiveElementRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function handlePreparedMailClick() {
    trackPrivateDocumentAction('mail_click', documentTitle);
    trackGoogleAdsConversion(process.env.NEXT_PUBLIC_RETROVILLE_BIBLE_CONVERSION_LABEL, {
      value: 1,
      currency: 'EUR',
    });

    if (typeof window !== 'undefined') {
      window.location.href = mailtoHref;
      window.setTimeout(() => {
        closeDialog();
      }, 120);
      return;
    }

    closeDialog();
  }

  function handleWebMailClick(provider: 'gmail' | 'outlook') {
    trackPrivateDocumentAction(`${provider}_compose_click`, documentTitle);

    if (typeof window !== 'undefined') {
      const href = provider === 'gmail' ? gmailComposeHref : outlookComposeHref;
      window.open(href, '_blank', 'noopener,noreferrer');
    }

    closeDialog();
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(RETROVILLE_PITCH_EMAIL);
      trackPrivateDocumentAction('copy_email', documentTitle);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        data-no-retroville-shell="true"
        aria-label={`${buttonLabel}. ${descriptionLead} Se abrirá un popup con el correo ya preparado.`}
        title={`${descriptionLead} El correo se abrirá listo para enviar.`}
        data-no-auto-translate
        onClick={() => {
          trackPrivateDocumentAction('open', documentTitle);
          setOpen(true);
        }}
      >
        <Mail className="h-4 w-4" />
        {buttonLabel}
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[260] overflow-y-auto bg-[rgba(2,4,12,0.88)] p-4 backdrop-blur-lg sm:p-6">
              <div
                className="flex min-h-full items-center justify-center py-6"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) closeDialog();
                }}
              >
                <div
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                  className="relative max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-[2rem] border border-white/10 bg-[#090d18] shadow-[0_28px_90px_rgba(0,0,0,0.56)]"
                >
                  <button
                    type="button"
                    className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-[#121a2d] text-white/78 transition hover:border-white/25 hover:bg-[#182239] hover:text-white"
                    onClick={closeDialog}
                    ref={closeButtonRef}
                    aria-label="Cerrar popup"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                    <div className="border-b border-white/8 p-6 lg:border-b-0 lg:border-r lg:p-8">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[#ffc940]">{eyebrowLabel}</p>
                      <h3
                        id={titleId}
                        className="mt-4 max-w-[11ch] text-[clamp(2.2rem,5vw,4.1rem)] font-black leading-[0.92] text-white [font-family:var(--font-display)]"
                      >
                        {dialogTitle}
                      </h3>
                      <p id={descriptionId} className="mt-5 max-w-[34ch] text-base leading-8 text-white/74">
                        {descriptionLead} Desde aquí abrimos tu correo predeterminado con el asunto y el mensaje listos
                        para pedir <strong className="text-white">{documentTitle}</strong>.
                      </p>

                      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[#101726] p-5">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#8ad7ff]">Qué te pedimos</p>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-white/72">
                          <li>Nombre y una forma clara de identificar quién solicita el material.</li>
                          <li>Email o medio de contacto para responder por la vía más útil.</li>
                          <li>Una nota breve explicando para qué necesitas la biblia.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-6 lg:p-8">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[#8ad7ff]">Correo preparado</p>

                      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#101726] p-5">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/46">Destino</p>
                        <p className="mt-3 break-all text-[1.1rem] font-semibold text-white">{RETROVILLE_PITCH_EMAIL}</p>
                      </div>

                      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#101726] p-5">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/46">Asunto</p>
                        <p className="mt-3 break-words text-sm font-semibold text-white/86">{mailSubject}</p>
                      </div>

                      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#101726] p-5">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/46">
                          Texto que se abrirá preparado
                        </p>
                        <pre className="mt-4 max-h-56 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-white/78 [font-family:var(--font-body)]">
                          {previewBody}
                        </pre>
                      </div>

                      <div className="mt-4 rounded-[1.5rem] border border-[rgba(138,215,255,0.16)] bg-[rgba(138,215,255,0.06)] p-5">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#8ad7ff]">
                          Si tu navegador no abre la app
                        </p>
                        <p className="mt-3 text-sm leading-7 text-white/72">
                          Primero intentamos abrir la aplicación o plataforma de correo predeterminada del usuario con
                          el mensaje listo. Si no responde bien, puedes usar Gmail web u Outlook web como alternativa.
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handlePreparedMailClick}
                          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#7a332d,#4d1d1a)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
                        >
                          <Mail className="h-4 w-4" />
                          Abrir app de correo
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-[#101726] px-5 py-3 text-sm font-semibold text-white/84 transition hover:border-white/20 hover:bg-[#182239] hover:text-white sm:w-auto"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? 'Correo copiado' : 'Copiar correo'}
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleWebMailClick('gmail')}
                          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/84 transition hover:border-white/20 hover:bg-[#182239] hover:text-white"
                        >
                          Gmail web
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWebMailClick('outlook')}
                          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/84 transition hover:border-white/20 hover:bg-[#182239] hover:text-white"
                        >
                          Outlook web
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-4 text-xs leading-6 text-white/46">
                        {mailButtonLabel} seguirá abriendo el mismo mensaje preparado, con destino a{' '}
                        {RETROVILLE_PITCH_EMAIL}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
