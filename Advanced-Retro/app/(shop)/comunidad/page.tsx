import type { Metadata } from 'next';
import CommunityFeed from '@/components/sections/CommunityFeed';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Comunidad retro | AdvancedRetro.es',
  description:
    'Comunidad de AdvancedRetro.es para seguir novedades, contenido retro, soporte y actualizaciones del ecosistema.',
  path: '/comunidad',
  keywords: [
    'comunidad retro',
    'advancedretro comunidad',
    'retro gaming españa',
    'coleccionismo retro',
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
      'Comunidad de AdvancedRetro.es para contenido, soporte, novedades y cultura retro.',
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
