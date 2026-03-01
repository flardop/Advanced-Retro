'use client';

import { useMemo, useState } from 'react';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { useLocale } from '@/components/LocaleProvider';

export default function LanguageSwitcherPopup() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  const current = useMemo(
    () => SUPPORTED_LOCALES.find((item) => item.code === locale) || SUPPORTED_LOCALES[0],
    [locale]
  );

  return (
    <div className="fixed left-4 bottom-5 z-[70]">
      {open ? (
        <div className="glass mb-3 w-[260px] p-3 shadow-glow">
          <div className="mb-2">
            <p className="text-sm font-semibold">{t('lang.title', 'Idioma')}</p>
            <p className="text-xs text-textMuted">{t('lang.subtitle', 'Selecciona idioma')}</p>
          </div>

          <div className="grid gap-2">
            {SUPPORTED_LOCALES.map((item) => {
              const active = item.code === locale;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLocale(item.code);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                    active
                      ? 'border-primary bg-[rgba(75,228,214,0.14)] text-text'
                      : 'border-line bg-[rgba(14,26,42,0.55)] text-textMuted hover:border-primary/45 hover:text-text'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{item.flag}</span>
                    <span>{item.nativeLabel}</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.08em]">{item.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="glass flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm hover:border-primary/55"
        aria-expanded={open}
        aria-label={t('lang.title', 'Idioma')}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-semibold uppercase tracking-[0.08em]">{current.code}</span>
      </button>
    </div>
  );
}

