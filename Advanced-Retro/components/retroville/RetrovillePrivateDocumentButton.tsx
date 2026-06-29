'use client';

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

  const mailtoHref = buildMailtoHref(documentTitle);
  const accessibleLabel = `${mailButtonLabel || buttonLabel}. ${descriptionLead} Se abrirá tu aplicación o plataforma de correo por defecto para solicitar ${documentTitle}.`;
  const hoverTitle = `${dialogTitle} · ${eyebrowLabel}`;

  return (
    <a
      href={mailtoHref}
      className={className}
      title={hoverTitle}
      aria-label={accessibleLabel}
      onClick={() => trackPrivateDocumentAction('mail_click', documentTitle)}
    >
      {buttonLabel}
    </a>
  );
}
