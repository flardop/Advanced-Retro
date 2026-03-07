import type { Metadata } from 'next';
import CommunityMyListingsView from '@/components/sections/CommunityMyListingsView';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Mis anuncios de comunidad',
  description:
    'Gestiona tus anuncios de comunidad en AdvancedRetro.es: estados, revisión, métricas y publicación rápida.',
  path: '/comunidad/mis-anuncios',
  keywords: ['mis anuncios comunidad', 'gestionar anuncios retro', 'vender en comunidad advanced retro'],
});

export default function CommunityMyListingsPage() {
  return <CommunityMyListingsView />;
}
