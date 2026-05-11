'use client';

import { useMemo, useState } from 'react';
import { SUPPORTED_LOCALES, type LocaleCode } from '@/lib/i18n';
import { useLocale } from '@/components/LocaleProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type LanguageSelectorProps = {
  className?: string;
  placement?: 'top' | 'bottom';
};

export default function LanguageSelector({
  className = '',
  placement = 'top',
}: LanguageSelectorProps) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = useMemo(
    () => SUPPORTED_LOCALES.find((item) => item.code === locale) || SUPPORTED_LOCALES[0],
    [locale]
  );

  const persistLocale = async (nextLocale: LocaleCode) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = (await supabase?.auth.getUser()) || { data: { user: null } };

      if (!user) return;

      setSaving(true);
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: nextLocale }),
      });
    } catch {
      // locale persistence is best effort only
    } finally {
      setSaving(false);
    }
  };

  const applyLocale = async (nextLocale: LocaleCode) => {
    setLocale(nextLocale);
    setOpen(false);
    await persistLocale(nextLocale);
  };

  const panelPosition =
    placement === 'bottom'
      ? 'bottom-[calc(100%+0.75rem)] left-0'
      : 'left-0 top-[calc(100%+0.75rem)]';

  return (
    <div className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="chip min-w-[92px] justify-center gap-2 hover:border-primary/50 hover:text-text"
        aria-expanded={open}
        aria-label="Selector de idioma"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-semibold uppercase tracking-[0.08em]">{current.code}</span>
      </button>

      {open ? (
        <div
          className={`absolute z-[90] w-[250px] rounded-[1.25rem] border border-line/80 bg-[rgba(6,13,24,0.96)] p-3 shadow-[0_24px_60px_rgba(1,7,18,0.45)] backdrop-blur-xl ${panelPosition}`}
        >
          <div className="mb-2 px-2">
            <p className="text-sm font-semibold text-text">Idioma</p>
            <p className="text-xs text-textMuted">
              {saving ? 'Guardando preferencia...' : 'La interfaz cambia al instante.'}
            </p>
          </div>
          <div className="grid gap-2">
            {SUPPORTED_LOCALES.map((item) => {
              const active = item.code === locale;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => void applyLocale(item.code)}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm transition ${
                    active
                      ? 'border-primary/50 bg-primary/10 text-text'
                      : 'border-line bg-[rgba(12,20,33,0.66)] text-textMuted hover:border-primary/35 hover:text-text'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{item.flag}</span>
                    <span>{item.nativeLabel}</span>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                    {item.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
