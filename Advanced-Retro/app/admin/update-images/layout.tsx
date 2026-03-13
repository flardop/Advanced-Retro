import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Admin · Actualizar imágenes',
  description: 'Herramienta privada para actualización masiva de imágenes.',
  path: '/admin/update-images',
  noIndex: true,
});

export default function AdminUpdateImagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
