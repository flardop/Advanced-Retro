import type { Metadata } from 'next';
import CommunityPublishView from '@/components/sections/CommunityPublishView';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Publicar anuncio retro | Comunidad AdvancedRetro.es',
  description:
    'Publica anuncios en la comunidad retro con mínimo de imágenes, descripción completa y opciones de destacado o vitrina.',
  path: '/comunidad/publicar',
  keywords: ['publicar anuncio retro', 'vender videojuego retro', 'crear anuncio comunidad retro'],
  noIndex: true,
});

export default function CommunityPublishPage() {
  return <CommunityPublishView />;
}
