export type SiteThemeId =
  | 'steam-market'
  | 'retro-pixel'
  | 'minimal-premium'
  | 'arcade-neon'
  | 'marketplace-clean';

export type SiteTheme = {
  id: SiteThemeId;
  label: string;
  description: string;
};

export const SITE_THEMES: SiteTheme[] = [
  {
    id: 'steam-market',
    label: 'Steam Marketplace',
    description: 'Marketplace oscuro premium con estética de launcher.',
  },
  {
    id: 'retro-pixel',
    label: 'Retro Pixel',
    description: '8-bit real: bordes rectos, tipografía arcade y look CRT.',
  },
  {
    id: 'minimal-premium',
    label: 'Minimal Premium',
    description: 'Editorial limpio, blanco premium y foco total en producto.',
  },
  {
    id: 'arcade-neon',
    label: 'Arcade Neon',
    description: 'Neón agresivo con contraste alto y animaciones vivas.',
  },
  {
    id: 'marketplace-clean',
    label: 'Marketplace Clean',
    description: 'Comercial tipo clasificados: rápido, claro y directo.',
  },
];

export const DEFAULT_SITE_THEME: SiteThemeId = 'steam-market';
export const SITE_THEME_IDS: SiteThemeId[] = SITE_THEMES.map((theme) => theme.id);

export function isValidSiteTheme(value: string): value is SiteThemeId {
  return SITE_THEME_IDS.includes(value as SiteThemeId);
}
