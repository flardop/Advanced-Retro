import { DEFAULT_SITE_THEME, isValidSiteTheme, type SiteThemeId } from '@/lib/siteThemes';

export const SITE_THEME_STORAGE_KEY = 'advancedretro:site-theme';
export const SITE_THEME_EVENT = 'advancedretro:site-theme-changed';

export function applySiteTheme(themeId: SiteThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-site-theme', themeId);
}

export function readStoredSiteTheme(): SiteThemeId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SITE_THEME_STORAGE_KEY) || '';
    return raw && isValidSiteTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveStoredSiteTheme(themeId: SiteThemeId) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, themeId);
  } catch {
    // ignore storage errors
  }
}

export function dispatchSiteThemeChange(themeId: SiteThemeId) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(SITE_THEME_EVENT, { detail: { theme: themeId } }));
  } catch {
    // ignore dispatch errors
  }
}

export function setSiteTheme(themeId: SiteThemeId) {
  applySiteTheme(themeId);
  saveStoredSiteTheme(themeId);
  dispatchSiteThemeChange(themeId);
}

export function resolveInitialSiteTheme(): SiteThemeId {
  return readStoredSiteTheme() || DEFAULT_SITE_THEME;
}
