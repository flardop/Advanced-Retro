'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_COOKIE_KEY,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_SETTINGS_EVENT,
  createDefaultConsent,
  encodeConsentCookie,
  normalizeConsent,
  type CookieConsentState,
} from '@/lib/cookieConsent';

type ConsentPreset = 'all' | 'reject' | 'custom';

function persistConsent(nextConsent: CookieConsentState) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(nextConsent));
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${COOKIE_CONSENT_COOKIE_KEY}=${encodeConsentCookie(nextConsent)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, {
      detail: nextConsent,
    })
  );
}

function readStoredConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeConsent(JSON.parse(raw));
  } catch {
    return null;
  }
}

export default function CookieConsentBanner() {
  const [ready, setReady] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsentState>(createDefaultConsent());

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setConsent(stored);
      setShowBanner(false);
    } else {
      setConsent(createDefaultConsent());
      setShowBanner(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const openSettings = () => {
      setShowBanner(true);
      setShowSettings(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const applyPreset = useCallback((preset: ConsentPreset) => {
    const base = createDefaultConsent();
    const next: CookieConsentState =
      preset === 'all'
        ? { ...base, preferences: true, analytics: true, marketing: true, updatedAt: new Date().toISOString() }
        : preset === 'reject'
          ? { ...base, preferences: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }
          : { ...consent, necessary: true, updatedAt: new Date().toISOString(), version: base.version };

    setConsent(next);
    persistConsent(next);
    setShowBanner(false);
    setShowSettings(false);
  }, [consent]);

  const settingsSummary = useMemo(() => {
    const labels: string[] = ['Necesarias'];
    if (consent.preferences) labels.push('Preferencias');
    if (consent.analytics) labels.push('Analíticas');
    if (consent.marketing) labels.push('Marketing');
    return labels.join(' · ');
  }, [consent]);

  if (!ready || !showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-line bg-[rgba(5,10,18,0.95)] p-4 sm:p-5 shadow-[0_18px_50px_rgba(1,8,22,0.65)] backdrop-blur-lg">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div>
            <p className="text-sm font-semibold text-text">Privacidad y cookies</p>
            <p className="mt-1 text-xs sm:text-sm text-textMuted">
              Usamos cookies técnicas para operar la tienda. Las de analítica, preferencias y marketing solo se activan
              con tu consentimiento. Puedes cambiarlo en cualquier momento.
            </p>
            <p className="mt-2 text-[11px] text-textMuted">Consentimiento actual: {settingsSummary}</p>
          </div>

          {showSettings ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="rounded-xl border border-line bg-[rgba(10,18,31,0.8)] p-3 text-xs text-textMuted">
                <span className="block font-semibold text-text">Cookies necesarias</span>
                <span className="mt-1 block">Requeridas para login, carrito y checkout.</span>
                <span className="mt-2 inline-flex rounded-full border border-primary/45 px-2 py-1 text-[11px] text-primary">
                  Siempre activas
                </span>
              </label>

              <label className="rounded-xl border border-line bg-[rgba(10,18,31,0.8)] p-3 text-xs text-textMuted">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-text">Preferencias</span>
                  <input
                    type="checkbox"
                    checked={consent.preferences}
                    onChange={(e) =>
                      setConsent((prev) => ({
                        ...prev,
                        preferences: e.target.checked,
                      }))
                    }
                  />
                </span>
                <span className="mt-1 block">Idioma, preferencias visuales y personalización básica.</span>
              </label>

              <label className="rounded-xl border border-line bg-[rgba(10,18,31,0.8)] p-3 text-xs text-textMuted">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-text">Analíticas</span>
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) =>
                      setConsent((prev) => ({
                        ...prev,
                        analytics: e.target.checked,
                      }))
                    }
                  />
                </span>
                <span className="mt-1 block">Medición agregada para mejorar rendimiento y conversión.</span>
              </label>

              <label className="rounded-xl border border-line bg-[rgba(10,18,31,0.8)] p-3 text-xs text-textMuted">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-text">Marketing</span>
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(e) =>
                      setConsent((prev) => ({
                        ...prev,
                        marketing: e.target.checked,
                      }))
                    }
                  />
                </span>
                <span className="mt-1 block">Campañas y remarketing (si se habilitan herramientas externas).</span>
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="button-secondary"
              onClick={() => applyPreset('reject')}
            >
              Rechazar no necesarias
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={() => applyPreset('all')}
            >
              Aceptar todas
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setShowSettings((value) => !value)}
            >
              {showSettings ? 'Ocultar configuración' : 'Configurar'}
            </button>
            {showSettings ? (
              <button
                type="button"
                className="chip"
                onClick={() => applyPreset('custom')}
              >
                Guardar selección
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

