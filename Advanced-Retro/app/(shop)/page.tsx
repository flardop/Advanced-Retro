import type { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import Collections from '@/components/sections/Collections';
import Benefits from '@/components/sections/Benefits';
import RetroStory from '@/components/sections/RetroStory';
import FinalCTA from '@/components/sections/FinalCTA';
import HypeLockboard from '@/components/sections/HypeLockboard';
import HomeNarrative from '@/components/sections/HomeNarrative';
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
      <HomeNarrative />
      <FinalCTA />
    </>
  );
}
