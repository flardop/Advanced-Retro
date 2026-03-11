export type SiteThemeId =
  | 'default-neon'
  | 'steam-market'
  | 'retro-pixel'
  | 'minimal-premium'
  | 'arcade-neon'
  | 'marketplace-clean'
  | 'vault-amber'
  | 'ocean-cyber'
  | 'forest-retro'
  | 'mono-pro';

export type SiteTheme = {
  id: SiteThemeId;
  label: string;
  description: string;
};

export const SITE_THEMES: SiteTheme[] = [
  {
    id: 'default-neon',
    label: 'Advanced Neon',
    description: 'El estilo actual de referencia.',
  },
  {
    id: 'steam-market',
    label: 'Steam Marketplace',
    description: 'Oscuro elegante con foco en catálogo.',
  },
  {
    id: 'retro-pixel',
    label: 'Retro Pixel',
    description: 'Arcade 8-bit con contraste fuerte.',
  },
  {
    id: 'minimal-premium',
    label: 'Minimal Premium',
    description: 'Limpio, aireado y orientado a producto.',
  },
  {
    id: 'arcade-neon',
    label: 'Arcade Neon',
    description: 'Neón gamer potente para impacto visual.',
  },
  {
    id: 'marketplace-clean',
    label: 'Marketplace Clean',
    description: 'Claro, comercial y rápido para comprar.',
  },
  {
    id: 'vault-amber',
    label: 'Vault Amber',
    description: 'Oscuro cálido con tono coleccionista.',
  },
  {
    id: 'ocean-cyber',
    label: 'Ocean Cyber',
    description: 'Cian profundo y estética tecnológica.',
  },
  {
    id: 'forest-retro',
    label: 'Forest Retro',
    description: 'Verde vintage y lectura cómoda.',
  },
  {
    id: 'mono-pro',
    label: 'Mono Pro',
    description: 'Monocromo profesional de alto contraste.',
  },
];

export const DEFAULT_SITE_THEME: SiteThemeId = 'default-neon';

export function isValidSiteTheme(value: string): value is SiteThemeId {
  return SITE_THEMES.some((theme) => theme.id === value);
}
