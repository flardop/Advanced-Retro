'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SITE_THEME, isValidSiteTheme, SITE_THEMES, type SiteThemeId } from '@/lib/siteThemes';

const STORAGE_KEY = 'advancedretro:site-theme';

function applyTheme(themeId: SiteThemeId) {
  document.documentElement.setAttribute('data-site-theme', themeId);
}

export default function ThemeStyleMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<SiteThemeId>(DEFAULT_SITE_THEME);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) || '';
      if (saved && isValidSiteTheme(saved)) {
        setTheme(saved);
        applyTheme(saved);
        return;
      }
    } catch {
      // ignore
    }
    applyTheme(DEFAULT_SITE_THEME);
  }, []);

  const selectedTheme = useMemo(
    () => SITE_THEMES.find((entry) => entry.id === theme) || SITE_THEMES[0],
    [theme]
  );

  const onSelectTheme = (next: SiteThemeId) => {
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-16 left-3 z-[80] sm:bottom-5 sm:left-5">
      {open ? (
        <div className="w-[300px] rounded-2xl border border-line bg-[rgba(8,14,24,0.96)] p-3 shadow-[0_18px_36px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Mod Menu · Estilo</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-line px-2 py-1 text-xs text-textMuted hover:text-text"
            >
              Cerrar
            </button>
          </div>
          <p className="mb-2 text-xs text-textMuted">
            Activo: <span className="text-primary">{selectedTheme.label}</span>
          </p>
          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {SITE_THEMES.map((entry) => {
              const active = theme === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectTheme(entry.id)}
                  className={`w-full rounded-xl border p-2 text-left transition ${
                    active
                      ? 'border-primary bg-primary/10 text-text'
                      : 'border-line bg-[rgba(11,20,35,0.72)] text-textMuted hover:text-text'
                  }`}
                >
                  <p className="text-sm font-semibold">{entry.label}</p>
                  <p className="mt-0.5 text-xs">{entry.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/45 bg-[rgba(6,14,24,0.88)] px-3 py-2 text-xs font-semibold text-primary shadow-[0_10px_24px_rgba(46,214,200,0.2)]"
      >
        Estilo
      </button>
    </div>
  );
}
