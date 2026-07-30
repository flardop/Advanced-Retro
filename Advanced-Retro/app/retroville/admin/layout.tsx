import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Retroville Admin | Acceso privado',
  description: 'Panel privado de administracion para el seguimiento interno de Retroville.',
  path: '/retroville/admin',
  category: 'technology',
  inheritBaseKeywords: false,
  noIndex: true,
});

export default function RetrovilleAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
