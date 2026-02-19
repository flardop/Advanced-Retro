import type { Metadata } from 'next';
import Catalog from '@/components/sections/Catalog';
import { absoluteUrl } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Tienda retro',
  description:
    'Catálogo de juegos retro, consolas, cajas y accesorios para Game Boy, GBC, GBA, SNES y GameCube.',
  alternates: {
    canonical: '/tienda',
  },
  openGraph: {
    title: 'Tienda retro | AdvancedRetro.es',
    description:
      'Explora el catálogo completo de AdvancedRetro.es por plataforma y filtra por precio, stock y favoritos.',
    url: '/tienda',
    images: [absoluteUrl('/logo.png')],
  },
};

export default function StorePage() {
  return <Catalog />;
}
