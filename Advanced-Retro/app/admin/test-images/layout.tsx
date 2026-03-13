import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Admin · Test de imágenes',
  description: 'Herramienta privada de prueba de imágenes para administración.',
  path: '/admin/test-images',
  noIndex: true,
});

export default function AdminTestImagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
