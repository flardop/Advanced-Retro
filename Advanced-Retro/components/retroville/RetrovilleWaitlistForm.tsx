'use client';

import { useId, useRef, useState } from 'react';
import { RETROVILLE_NEWSLETTER_NAME } from '@/app/retroville/shared';
import { getTrackerClientContext } from '@/lib/admin/tracker';

type SignupIntent = 'newsletter' | 'event' | 'access';

type Props = {
  source?: string;
  showRole?: boolean;
  showName?: boolean;
  showLastName?: boolean;
  showPhone?: boolean;
  showQuestion?: boolean;
  buttonLabel?: string;
  successMessage?: string;
  darkMode?: boolean;
  intent?: SignupIntent;
  eventSlug?: string;
  eventTitle?: string;
  documentInterest?: string;
  phoneRequired?: boolean;
  questionRequired?: boolean;
  questionLabel?: string;
  questionPlaceholder?: string;
};

export default function RetrovilleWaitlistForm({
  source = 'public',
  showRole = false,
  showName = false,
  showLastName = false,
  showPhone = false,
  showQuestion = false,
  buttonLabel = 'Quiero recibir la señal',
  successMessage = `Perfecto. Ya estás dentro de ${RETROVILLE_NEWSLETTER_NAME}.`,
  darkMode = true,
  intent = 'newsletter',
  eventSlug,
  eventTitle,
  documentInterest,
  phoneRequired = false,
  questionRequired = false,
  questionLabel = 'Tu pregunta',
  questionPlaceholder = 'Cuéntanos qué quieres saber, si lo necesitas.',
}: Props) {
  const formId = useId();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [question, setQuestion] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const fieldClass = darkMode
    ? 'border-white/10 bg-[rgba(8,11,20,0.8)] text-white placeholder:text-white/45'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400';
  const browserEventName =
    intent === 'event'
      ? 'retroville_event_signup'
      : intent === 'access'
        ? 'retroville_access_request_signup'
        : 'retroville_newsletter_signup';
  const plausibleEventName =
    intent === 'event'
      ? 'Retroville event signup'
      : intent === 'access'
        ? 'Retroville access request'
        : 'Retroville newsletter signup';
  const customEventName =
    intent === 'event'
      ? 'retroville:event-signup'
      : intent === 'access'
        ? 'retroville:access-request'
        : 'retroville:newsletter-signup';
  const fieldsCount =
    (showName ? 1 : 0) +
    (showLastName ? 1 : 0) +
    1 +
    (showPhone ? 1 : 0) +
    (showRole ? 1 : 0);
  const gridClassName =
    fieldsCount >= 4
      ? 'sm:grid-cols-2 xl:grid-cols-4'
      : fieldsCount === 3
        ? 'sm:grid-cols-2 xl:grid-cols-3'
        : fieldsCount === 2
          ? 'sm:grid-cols-2'
          : '';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();
      const trimmedQuestion = question.trim();

      if (showName && trimmedFirstName.length < 2) {
        throw new Error('Escribe tu nombre para guardar el registro.');
      }
      if (showLastName && trimmedLastName.length < 2) {
        throw new Error('Escribe tus apellidos para dejar la solicitud completa.');
      }
      if (!trimmedEmail || (emailInputRef.current && !emailInputRef.current.validity.valid)) {
        throw new Error('Escribe un email válido para guardar tu registro.');
      }
      if (showPhone && phoneRequired && trimmedPhone.length < 6) {
        throw new Error('Añade un teléfono válido para que podamos contactarte.');
      }
      if (showQuestion && questionRequired && trimmedQuestion.length < 6) {
        throw new Error('Déjanos al menos una breve pregunta o contexto.');
      }
      if (showRole && !roleLabel) {
        throw new Error('Selecciona tu perfil antes de enviarnos el registro.');
      }

      const trackingContext = getTrackerClientContext();
      const response = await fetch('/api/retroville/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: showName ? trimmedFirstName : null,
          last_name: showLastName ? trimmedLastName : null,
          display_name: [showName ? trimmedFirstName : '', showLastName ? trimmedLastName : ''].filter(Boolean).join(' ') || null,
          email: trimmedEmail,
          phone: showPhone ? trimmedPhone : null,
          question: showQuestion ? trimmedQuestion : null,
          role_label: showRole ? roleLabel : null,
          document_interest: documentInterest || null,
          source,
          intent,
          event_slug: eventSlug,
          event_title: eventTitle,
          path: trackingContext.path,
          page_title: trackingContext.pageTitle,
          session_id: trackingContext.sessionId,
          device_type: trackingContext.deviceType,
          browser: trackingContext.browser,
          os: trackingContext.os,
          referrer: trackingContext.referrer,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo guardar tu registro');
      }

      setSuccess(successMessage);
      if (typeof window !== 'undefined') {
        window.gtag?.('event', browserEventName, {
          event_category: 'retroville',
          event_label: source,
          page_path: trackingContext.path,
          device_type: trackingContext.deviceType,
        });
        window.plausible?.(plausibleEventName, {
          props: {
            source,
            page: trackingContext.path,
            device: trackingContext.deviceType,
            intent,
            document: documentInterest || '',
          },
        });
        window.dispatchEvent(
          new CustomEvent(customEventName, {
            detail: {
              source,
              page: trackingContext.path,
              deviceType: trackingContext.deviceType,
              intent,
              documentInterest: documentInterest || '',
            },
          })
        );
      }
      if (showName) setFirstName('');
      if (showLastName) setLastName('');
      setEmail('');
      if (showPhone) setPhone('');
      if (showQuestion) setQuestion('');
      if (showRole) setRoleLabel('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar tu registro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`grid gap-3 ${gridClassName}`}>
        {showName ? (
          <div>
            <label htmlFor={`${formId}-first-name`} className="sr-only">
              Tu nombre
            </label>
            <input
              id={`${formId}-first-name`}
              name="first_name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              minLength={2}
              placeholder="Tu nombre"
              autoComplete="given-name"
              disabled={loading}
              aria-label="Tu nombre"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
            />
          </div>
        ) : null}
        {showLastName ? (
          <div>
            <label htmlFor={`${formId}-last-name`} className="sr-only">
              Tus apellidos
            </label>
            <input
              id={`${formId}-last-name`}
              name="last_name"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              minLength={2}
              placeholder="Tus apellidos"
              autoComplete="family-name"
              disabled={loading}
              aria-label="Tus apellidos"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
            />
          </div>
        ) : null}
        <div>
          <label htmlFor={`${formId}-email`} className="sr-only">
            Tu email
          </label>
          <input
            id={`${formId}-email`}
            ref={emailInputRef}
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="tu@email.com"
            autoComplete="email"
            disabled={loading}
            aria-label="Tu email"
            className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
          />
        </div>
        {showPhone ? (
          <div>
            <label htmlFor={`${formId}-phone`} className="sr-only">
              Tu teléfono
            </label>
            <input
              id={`${formId}-phone`}
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required={phoneRequired}
              placeholder="Tu teléfono"
              autoComplete="tel"
              disabled={loading}
              aria-label="Tu teléfono"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
            />
          </div>
        ) : null}
        {showRole ? (
          <div>
            <label htmlFor={`${formId}-role`} className="sr-only">
              Tu perfil
            </label>
            <select
              id={`${formId}-role`}
              name="role_label"
              value={roleLabel}
              onChange={(event) => setRoleLabel(event.target.value)}
              required
              disabled={loading}
              aria-label="Tu perfil"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
            >
              <option value="" className="text-slate-900">
                Selecciona tu perfil
              </option>
              {['Desarrollador', 'Diseñador', 'Inversor', 'Fan'].map((item) => (
                <option key={item} value={item} className="text-slate-900">
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      {showQuestion ? (
        <div>
          <label htmlFor={`${formId}-question`} className="sr-only">
            {questionLabel}
          </label>
          <textarea
            id={`${formId}-question`}
            name="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            required={questionRequired}
            placeholder={questionPlaceholder}
            disabled={loading}
            aria-label={questionLabel}
            rows={4}
            className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
          />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
          darkMode
            ? 'border border-[rgba(196,58,47,0.48)] bg-[rgba(196,58,47,0.16)] text-white hover:bg-[rgba(196,58,47,0.24)]'
            : 'bg-[linear-gradient(135deg,#7c3aed,#2563eb)] text-white hover:brightness-110'
        }`}
      >
        {loading ? 'Guardando...' : buttonLabel}
      </button>
      {intent === 'access' ? (
        <p className={`text-xs leading-6 ${darkMode ? 'text-white/52' : 'text-slate-500'}`}>
          Al enviarlo te añadimos a la base privada de Retroville para responderte, avisarte de nuevos materiales y mantenerte dentro de La Señal.
        </p>
      ) : null}
      {success ? (
        <p
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-[rgba(212,154,67,0.28)] bg-[rgba(212,154,67,0.12)] text-[rgba(245,239,230,0.9)]' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
        >
          {success}
        </p>
      ) : null}
      {error ? (
        <p
          aria-live="assertive"
          className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-red-400/25 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
