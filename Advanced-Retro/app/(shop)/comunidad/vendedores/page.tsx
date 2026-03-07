import type { Metadata } from 'next';
import CommunitySellersDirectory from '@/components/sections/CommunitySellersDirectory';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Vendedores comunidad',
  description:
    'Directorio y ranking de vendedores en la comunidad retro de AdvancedRetro.es con actividad, likes y ventas.',
  path: '/comunidad/vendedores',
  keywords: ['vendedores comunidad retro', 'ranking vendedores retro', 'perfiles comunidad advanced retro'],
});

export default function CommunitySellersPage() {
  return <CommunitySellersDirectory />;
}
