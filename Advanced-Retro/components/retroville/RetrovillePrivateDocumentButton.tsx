'use client';

import { Mail } from 'lucide-react';
import {
  buildRetrovilleAccessRequestBody,
  buildRetrovillePitchMailto,
} from '@/app/retroville/shared';

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
    descriptionLead = 'La biblia de serie ya no se descarga de forma pública.',
  } = props;
  const mailtoHref = buildMailtoHref(documentTitle);
  const previewBody = buildRetrovilleAccessRequestBody(documentTitle).replace(/\s+/g, ' ').trim();

  return (
    <a
      href={mailtoHref}
      className={className}
      aria-label={`${buttonLabel}. ${descriptionLead} Se abrirá tu correo predeterminado con el asunto y el mensaje ya preparados.`}
      title={`${descriptionLead} Se abrirá preparado: ${previewBody}`}
      data-no-auto-translate
      onClick={() => {
        trackPrivateDocumentAction('mail_click', documentTitle);
      }}
    >
      <Mail className="h-4 w-4" />
      {buttonLabel}
    </a>
  );
}
