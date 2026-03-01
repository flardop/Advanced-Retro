'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, normalizeLocale, translate, type LocaleCode } from '@/lib/i18n';

const STORAGE_KEY = 'advanced-retro-locale';
const MANUAL_KEY = 'advanced-retro-locale-manual';

type LocaleContextValue = {
  locale: LocaleCode;
  setLocale: (next: LocaleCode) => void;
  t: (key: string, fallback?: string) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key, fallback) => fallback || key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  const detectNavigatorLocale = (): LocaleCode => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    const languageCandidates = [
      ...(Array.isArray(window.navigator.languages) ? window.navigator.languages : []),
      window.navigator.language,
    ].filter(Boolean);

    for (const candidate of languageCandidates) {
      const normalized = normalizeLocale(candidate);
      if (normalized) return normalized;
    }
    return DEFAULT_LOCALE;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const manual = window.localStorage.getItem(MANUAL_KEY) === '1';
    const detected = detectNavigatorLocale();

    if (stored && manual) {
      setLocaleState(normalizeLocale(stored));
      return;
    }

    setLocaleState(detected);
    window.localStorage.setItem(STORAGE_KEY, detected);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: LocaleCode) => {
    const normalized = normalizeLocale(next);
    setLocaleState(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, normalized);
      window.localStorage.setItem(MANUAL_KEY, '1');
    }
  };

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string, fallback?: string) => translate(locale, key, fallback),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
