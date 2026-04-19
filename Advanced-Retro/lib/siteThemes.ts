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
  palette: [string, string, string];
};

export const SITE_THEMES: SiteTheme[] = [
  {
    id: 'steam-market',
    label: 'Steam Marketplace',
    description: 'Marketplace oscuro premium con estética de launcher.',
    palette: ['#66c0f4', '#89a7ff', '#10131b'],
  },
  {
    id: 'retro-pixel',
    label: 'Retro Pixel',
    description: '8-bit real: bordes rectos, tipografía arcade y look CRT.',
    palette: ['#79ffbc', '#ffd65a', '#130d22'],
  },
  {
    id: 'minimal-premium',
    label: 'Minimal Premium',
    description: 'Editorial limpio, blanco premium y foco total en producto.',
    palette: ['#5d4530', '#ad8456', '#f7f4ef'],
  },
  {
    id: 'arcade-neon',
    label: 'Arcade Neon',
    description: 'Neón agresivo con contraste alto y animaciones vivas.',
    palette: ['#1ef2ff', '#ff4fd8', '#070812'],
  },
  {
    id: 'marketplace-clean',
    label: 'Marketplace Clean',
    description: 'Comercial tipo clasificados: rápido, claro y directo.',
    palette: ['#0f7aeb', '#23c2a2', '#f4f7fb'],
  },
];

export const DEFAULT_SITE_THEME: SiteThemeId = 'steam-market';
export const SITE_THEME_IDS: SiteThemeId[] = SITE_THEMES.map((theme) => theme.id);

export function isValidSiteTheme(value: string): value is SiteThemeId {
  return SITE_THEME_IDS.includes(value as SiteThemeId);
}
