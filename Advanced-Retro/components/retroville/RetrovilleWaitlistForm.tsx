'use client';

import { useId, useState } from 'react';
import { RETROVILLE_NEWSLETTER_NAME } from '@/app/retroville/shared';
import { getTrackerClientContext } from '@/lib/admin/tracker';

type SignupIntent = 'newsletter' | 'event';

type Props = {
  source?: string;
  showRole?: boolean;
  showName?: boolean;
  buttonLabel?: string;
  successMessage?: string;
  darkMode?: boolean;
  intent?: SignupIntent;
  eventSlug?: string;
  eventTitle?: string;
};

export default function RetrovilleWaitlistForm({
  source = 'public',
  showRole = false,
  showName = false,
  buttonLabel = 'Quiero recibir la señal',
  successMessage = `Perfecto. Ya estás dentro de ${RETROVILLE_NEWSLETTER_NAME}.`,
  darkMode = true,
  intent = 'newsletter',
  eventSlug,
  eventTitle,
}: Props) {
  const formId = useId();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [roleLabel, setRoleLabel] = useState('Fan');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fieldClass = darkMode
    ? 'border-white/10 bg-[rgba(8,11,20,0.8)] text-white placeholder:text-white/45'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400';
  const browserEventName = intent === 'event' ? 'retroville_event_signup' : 'retroville_newsletter_signup';
  const plausibleEventName = intent === 'event' ? 'Retroville event signup' : 'Retroville newsletter signup';
  const customEventName = intent === 'event' ? 'retroville:event-signup' : 'retroville:newsletter-signup';
  const gridClassName =
    showName && showRole
      ? 'sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]'
      : showName
        ? 'sm:grid-cols-2'
        : showRole
          ? 'md:grid-cols-[minmax(0,1fr)_220px]'
          : '';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedName = displayName.trim();
      const trimmedEmail = email.trim();

      if (showName && trimmedName.length < 2) {
        throw new Error('Necesitamos al menos un nombre corto para guardar tu registro');
      }
      if (!trimmedEmail) {
        throw new Error('Necesitamos un email valido para guardar tu registro');
      }

      const trackingContext = getTrackerClientContext();
      const response = await fetch('/api/retroville/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: showName ? trimmedName : null,
          email: trimmedEmail,
          role_label: showRole ? roleLabel : null,
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
          },
        });
        window.dispatchEvent(
          new CustomEvent(customEventName, {
            detail: {
              source,
              page: trackingContext.path,
              deviceType: trackingContext.deviceType,
              intent,
            },
          })
        );
      }
      if (showName) setDisplayName('');
      setEmail('');
      if (showRole) setRoleLabel('Fan');
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
            <label htmlFor={`${formId}-display-name`} className="sr-only">
              Tu nombre
            </label>
            <input
              id={`${formId}-display-name`}
              name="display_name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={2}
              placeholder="Tu nombre"
              autoComplete="name"
              disabled={loading}
              aria-label="Tu nombre"
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
              disabled={loading}
              aria-label="Tu perfil"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
            >
              {['Desarrollador', 'Diseñador', 'Inversor', 'Fan'].map((item) => (
                <option key={item} value={item} className="text-slate-900">
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
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
