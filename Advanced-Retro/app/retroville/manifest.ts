import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Retroville',
    short_name: 'Retroville',
    description:
      'Serie animada original ambientada en una ciudad construida con hardware abandonado, humor oscuro y worldbuilding propio.',
    start_url: '/retroville',
    display: 'standalone',
    background_color: '#06070d',
    theme_color: '#06070d',
    icons: [
      {
        src: '/icons/retroville/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/retroville/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/retroville/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
