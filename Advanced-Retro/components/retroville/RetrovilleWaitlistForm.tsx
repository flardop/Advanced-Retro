'use client';

import { useState } from 'react';
import { RETROVILLE_NEWSLETTER_NAME } from '@/app/retroville/shared';
import { getTrackerClientContext } from '@/lib/admin/tracker';

type Props = {
  source?: string;
  showRole?: boolean;
  buttonLabel?: string;
  successMessage?: string;
  darkMode?: boolean;
};

export default function RetrovilleWaitlistForm({
  source = 'public',
  showRole = false,
  buttonLabel = 'Quiero recibir la señal',
  successMessage = `Perfecto. Ya estás dentro de ${RETROVILLE_NEWSLETTER_NAME}.`,
  darkMode = true,
}: Props) {
  const [email, setEmail] = useState('');
  const [roleLabel, setRoleLabel] = useState('Fan');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fieldClass = darkMode
    ? 'border-white/10 bg-[rgba(8,11,20,0.8)] text-white placeholder:text-white/45'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const trackingContext = getTrackerClientContext();
      const response = await fetch('/api/retroville/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role_label: showRole ? roleLabel : null,
          source,
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
        window.gtag?.('event', 'retroville_newsletter_signup', {
          event_category: 'retroville',
          event_label: source,
          page_path: trackingContext.path,
          device_type: trackingContext.deviceType,
        });
        window.plausible?.('Retroville newsletter signup', {
          props: {
            source,
            page: trackingContext.path,
            device: trackingContext.deviceType,
          },
        });
        window.dispatchEvent(
          new CustomEvent('retroville:newsletter-signup', {
            detail: {
              source,
              page: trackingContext.path,
              deviceType: trackingContext.deviceType,
            },
          })
        );
      }
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
      <div className={`grid gap-3 ${showRole ? 'md:grid-cols-[minmax(0,1fr)_220px]' : ''}`}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="tu@email.com"
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
        />
        {showRole ? (
          <select
            value={roleLabel}
            onChange={(event) => setRoleLabel(event.target.value)}
            className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${fieldClass}`}
          >
            {['Desarrollador', 'Diseñador', 'Inversor', 'Fan'].map((item) => (
              <option key={item} value={item} className="text-slate-900">
                {item}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
          darkMode
            ? 'bg-[var(--rv-green)] text-black hover:brightness-110'
            : 'bg-[linear-gradient(135deg,#7c3aed,#2563eb)] text-white hover:brightness-110'
        }`}
      >
        {loading ? 'Guardando...' : buttonLabel}
      </button>
      {success ? (
        <p className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {success}
        </p>
      ) : null}
      {error ? (
        <p className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'border-red-400/25 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
