'use client';

import { Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  RETROVILLE_PITCH_EMAIL,
} from '@/app/retroville/shared';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';

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
    eyebrowLabel = 'Acceso privado',
    dialogTitle = 'Solicitar acceso privado',
    descriptionLead = 'La biblia de serie ya no se descarga de forma pública.',
    mailButtonLabel = 'Enviar solicitud',
  } = props;
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    if (!dialogVisible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDialogVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialogVisible]);

  return (
    <>
      <a
        href="#retroville-private-access"
        data-no-retroville-shell="true"
        onClick={(event) => {
          event.preventDefault();
          window.retrovilleTrack?.('retroville_private_document_open', {
            document_title: documentTitle,
            source: 'private_document_modal',
          });
          setDialogVisible(true);
        }}
        className={className}
        aria-label={`${buttonLabel}. ${descriptionLead} Se mostrará una ventana con un formulario privado para solicitar acceso y seguir el proyecto.`}
      >
        <Mail className="h-4 w-4" />
        {buttonLabel}
      </a>

      {dialogVisible ? (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-[rgba(2,4,10,0.78)] px-4 py-6 backdrop-blur-sm"
          onClick={() => setDialogVisible(false)}
        >
          <div
            className="relative w-full max-w-[760px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,12,22,0.98),rgba(7,10,18,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.44)] sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDialogVisible(false)}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/82 transition hover:border-white/22 hover:bg-white/[0.08]"
              aria-label="Cerrar ventana de solicitud"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="pr-16 text-[11px] uppercase tracking-[0.24em] text-[#8ad7ff]">{eyebrowLabel}</p>
            <h3 className="mt-4 max-w-[14ch] text-[clamp(2.4rem,7vw,4.5rem)] font-black uppercase leading-[0.92] text-white">
              {dialogTitle}
            </h3>
            <p className="mt-4 max-w-[58ch] text-base leading-8 text-white/76">
              {descriptionLead} Si quieres saber más del proyecto, pedir la biblia o quedarte dentro del siguiente
              drop, deja aquí tus datos y tu pregunta. Entras en la base privada de Retroville y luego podrás recibir
              seguimiento real del universo.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#ffc940]">Solicitud privada</p>
                <p className="mt-3 text-[1.8rem] font-semibold leading-tight text-white">
                  Acceso y seguimiento real
                </p>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Este formulario sirve para filtrar interés serio, guardar los contactos dentro del panel de
                  administración y responder mejor a quien de verdad quiere seguir Retroville.
                </p>
                <div className="mt-4 rounded-[1.15rem] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#8ad7ff]">Qué te pedimos</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
                    <li>Nombre y apellidos para identificar bien cada contacto.</li>
                    <li>Email y teléfono para poder responder por la vía más útil.</li>
                    <li>Una pregunta o contexto para saber qué tipo de interés hay detrás.</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#8ad7ff]">Déjanos tus datos</p>
                <div className="mt-3">
                  <RetrovilleWaitlistForm
                    source="private_document_request"
                    showName
                    showLastName
                    showPhone
                    showQuestion
                    phoneRequired
                    intent="access"
                    documentInterest={documentTitle}
                    buttonLabel={mailButtonLabel}
                    successMessage={`Perfecto. Tu solicitud para "${documentTitle}" ya está dentro y te hemos añadido a la base privada de Retroville.`}
                    questionLabel="Tu pregunta o interés"
                    questionPlaceholder="Cuéntanos quién eres, qué buscas y por qué te interesa este material."
                  />
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-white/54">
              Si prefieres escribir manualmente, también puedes contactar a <span className="text-white/82">{RETROVILLE_PITCH_EMAIL}</span>, pero esta vía es mejor porque deja todo centralizado dentro del admin.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
