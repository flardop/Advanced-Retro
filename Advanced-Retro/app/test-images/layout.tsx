import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Test de imágenes',
  description: 'Herramienta interna de test de imágenes.',
  path: '/test-images',
  noIndex: true,
});

export default function TestImagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
