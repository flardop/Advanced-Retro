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
      <section className="section pt-0">
        <div className="container glass p-6 sm:p-8 space-y-4">
          <h2 className="title-display text-2xl">Cómo funciona la comunidad retro</h2>
          <p className="text-textMuted leading-relaxed">
            Publica anuncios con fotos, estado y detalles del artículo. La comunidad está pensada para coleccionistas que quieren comprar
            y vender con más contexto y control sobre cada operación.
          </p>
          <p className="text-textMuted leading-relaxed">
            Los anuncios incluyen perfil de vendedor, interacción social y canal de ticket para soporte de compra cuando se necesita
            trazabilidad adicional.
          </p>
        </div>
      </section>
    </>
  );
}
