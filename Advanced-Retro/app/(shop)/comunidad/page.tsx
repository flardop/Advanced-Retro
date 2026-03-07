import type { Metadata } from 'next';
import CommunityFeed from '@/components/sections/CommunityFeed';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Comunidad retro | Compra y venta entre coleccionistas',
  description:
    'Marketplace de comunidad de AdvancedRetro.es para publicar anuncios, vender productos retro y comprar con seguimiento y revisión de tienda.',
  path: '/comunidad',
  keywords: [
    'comunidad retro',
    'marketplace retro',
    'vender juegos retro',
    'comprar juegos retro entre usuarios',
  ],
});

export default function CommunityPage() {
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Comunidad', path: '/comunidad' },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Comunidad AdvancedRetro.es',
    url: 'https://advancedretro.es/comunidad',
    description:
      'Marketplace de usuarios para compra y venta de productos retro con sistema de revisión y seguimiento.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CommunityFeed />
    </>
  );
}
