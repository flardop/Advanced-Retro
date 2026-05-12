import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteConfig';

export default function manifest(): MetadataRoute.Manifest {
  const siteUrl = getSiteUrl();
  return {
    name: 'AdvancedRetro.es',
    short_name: 'AdvancedRetro',
    description:
      'Tienda retro en España con catálogo de juegos, consolas y coleccionismo para Game Boy, GBC, GBA, SNES y GameCube.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#071120',
    theme_color: '#67e8f9',
    categories: ['shopping', 'games', 'entertainment'],
    lang: 'es-ES',
    orientation: 'portrait',
    id: siteUrl,
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/app/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/app/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
