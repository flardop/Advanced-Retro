'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SITE_THEME, isValidSiteTheme, SITE_THEMES, type SiteThemeId } from '@/lib/siteThemes';
import {
  SITE_THEME_EVENT,
  applySiteTheme,
  readStoredSiteTheme,
  saveStoredSiteTheme,
  setSiteTheme,
} from '@/lib/clientSiteTheme';

export default function ThemeStyleMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<SiteThemeId>(DEFAULT_SITE_THEME);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrapTheme = async () => {
      const localTheme = readStoredSiteTheme();
      if (localTheme && mounted) {
        setTheme(localTheme);
        applySiteTheme(localTheme);
      } else {
        applySiteTheme(DEFAULT_SITE_THEME);
      }

      try {
        const response = await fetch('/api/auth/site-theme', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        const serverTheme = typeof data?.theme === 'string' ? data.theme : '';
        if (!mounted || !serverTheme || !isValidSiteTheme(serverTheme)) return;
        setTheme(serverTheme);
        applySiteTheme(serverTheme);
        saveStoredSiteTheme(serverTheme);
      } catch {
        // ignore
      }
    };

    const onThemeChanged = (event: Event) => {
      const custom = event as CustomEvent<{ theme?: string }>;
      const next = custom?.detail?.theme || '';
      if (!next || !isValidSiteTheme(next)) return;
      setTheme(next);
      applySiteTheme(next);
      saveStoredSiteTheme(next);
    };

    void bootstrapTheme();
    window.addEventListener(SITE_THEME_EVENT, onThemeChanged as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener(SITE_THEME_EVENT, onThemeChanged as EventListener);
    };
  }, []);

  const selectedTheme = useMemo(
    () => SITE_THEMES.find((entry) => entry.id === theme) || SITE_THEMES[0],
    [theme]
  );

  const onSelectTheme = (next: SiteThemeId) => {
    if (saving) return;
    setTheme(next);
    setSiteTheme(next);

    setSaving(true);
    void fetch('/api/auth/site-theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: next }),
    })
      .catch(() => null)
      .finally(() => setSaving(false));
  };

  return (
    <div className="fixed bottom-16 left-3 z-[80] sm:bottom-5 sm:left-5">
      {open ? (
        <div className="theme-menu-panel w-[300px] rounded-2xl border border-line bg-[rgba(8,14,24,0.96)] p-3 shadow-[0_18px_36px_rgba(0,0,0,0.4)] backdrop-blur-md">
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
          {saving ? <p className="mb-2 text-[11px] text-textMuted">Guardando preferencia de cuenta...</p> : null}
          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {SITE_THEMES.map((entry) => {
              const active = theme === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectTheme(entry.id)}
                  className={`theme-card-hover w-full rounded-xl border p-2 text-left transition ${
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
        className="theme-pulse mt-2 inline-flex items-center gap-2 rounded-full border border-primary/45 bg-[rgba(6,14,24,0.88)] px-3 py-2 text-xs font-semibold text-primary shadow-[0_10px_24px_rgba(46,214,200,0.2)]"
      >
        Estilo
      </button>
    </div>
  );
}
