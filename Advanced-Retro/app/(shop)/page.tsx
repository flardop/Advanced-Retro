import type { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import Collections from '@/components/sections/Collections';
import Benefits from '@/components/sections/Benefits';
import RetroStory from '@/components/sections/RetroStory';
import FinalCTA from '@/components/sections/FinalCTA';
import HypeLockboard from '@/components/sections/HypeLockboard';
import { redirect } from 'next/navigation';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'AdvancedRetro.es | Tienda retro profesional en España',
  description:
    'Compra juegos retro, consolas y componentes de coleccionismo con catálogo revisado, filtros por plataforma y soporte real desde España.',
  path: '/',
  keywords: [
    'comprar juegos retro españa',
    'tienda game boy españa',
    'cajas y manuales retro',
    'consolas retro coleccionismo',
  ],
});

type SearchParams = Record<string, string | string[] | undefined>;

type HomePageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const hasAdminFlag =
    typeof resolvedSearchParams === 'object' &&
    resolvedSearchParams !== null &&
    Object.prototype.hasOwnProperty.call(resolvedSearchParams, 'admin');

  if (hasAdminFlag) {
    redirect('/admin');
  }

  const faqSchema = buildFaqJsonLd([
    {
      question: '¿Qué puedo comprar en Advanced Retro?',
      answer:
        'Puedes comprar juegos retro, consolas, cajas, manuales, inserts y protectores para completar tu colección.',
    },
    {
      question: '¿Hacéis envíos desde España?',
      answer:
        'Sí, los pedidos se preparan desde España y se actualizan con seguimiento cuando está disponible.',
    },
    {
      question: '¿Tenéis servicio de búsqueda por encargo?',
      answer:
        'Sí, disponemos de servicio de compra por encargo para localizar productos concretos con acompañamiento por ticket privado.',
    },
  ]);

  const breadcrumbSchema = buildBreadcrumbJsonLd([{ name: 'Inicio', path: '/' }]);
  const homeLinksSchema = buildItemListJsonLd(
    [
      { name: 'Tienda retro', path: '/tienda', description: 'Catálogo completo de juegos, consolas y componentes retro.' },
      { name: 'Comunidad', path: '/comunidad', description: 'Anuncios de usuarios, perfiles de vendedor y actividad retro.' },
      { name: 'Ruleta y Mystery', path: '/ruleta', description: 'Experiencias gamificadas con cajas y premios.' },
      { name: 'Servicio de compra', path: '/servicio-compra', description: 'Búsqueda asistida de productos por encargo.' },
      { name: 'Contacto', path: '/contacto', description: 'Soporte, ayuda comercial y atención al cliente.' },
    ],
    'Secciones principales AdvancedRetro.es'
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeLinksSchema) }}
      />
      <Hero />
      <HypeLockboard />
      <FeaturedProducts />
      <Collections />
      <Benefits />
      <RetroStory />
      <section className="section pt-0">
        <div className="container glass p-6 sm:p-8 space-y-4">
          <h2 className="title-display text-2xl">Tienda retro para coleccionistas y jugadores</h2>
          <p className="text-textMuted leading-relaxed">
            En Advanced Retro encontrarás catálogo especializado de videojuegos retro con foco en Game Boy, Game Boy Color, Game Boy
            Advance, Super Nintendo y GameCube. Cada ficha de producto está pensada para compra clara: estado, fotos, componentes y
            precio.
          </p>
          <p className="text-textMuted leading-relaxed">
            Si buscas una pieza concreta, también puedes usar nuestro servicio de encargo con soporte por ticket para comparar
            opciones, validar estado y seguir el pedido hasta la entrega.
          </p>
          <p className="text-textMuted leading-relaxed">
            Advanced Retro está orientada a compra con contexto real: catálogo limpio, filtros por consola, fichas de producto con
            componentes y navegación diseñada para que encuentres más rápido tanto juegos completos como piezas sueltas para completar
            colección.
          </p>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
