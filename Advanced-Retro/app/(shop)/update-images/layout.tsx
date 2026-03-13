import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Actualizar imágenes',
  description: 'Herramienta interna para actualización de imágenes de productos.',
  path: '/update-images',
  noIndex: true,
});

export default function UpdateImagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
