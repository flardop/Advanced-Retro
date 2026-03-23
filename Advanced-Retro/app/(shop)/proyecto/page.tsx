import type { Metadata } from 'next';
import Link from 'next/link';
import ProjectStorySlider from '@/components/sections/ProjectStorySlider';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Proyecto AdvancedRetro.es | Visión, roadmap y ecosistema',
  description:
    'Página resumen del proyecto AdvancedRetro.es con su visión, bloques principales y próximos pasos de crecimiento.',
  path: '/proyecto',
  keywords: [
    'proyecto advanced retro',
    'roadmap tienda retro',
    'ecosistema retro españa',
    'advanced retro vision',
  ],
});

const PROJECT_BLOCKS = [
  {
    name: 'Tienda retro',
    path: '/tienda',
    description: 'Catálogo por plataformas con fichas claras y control de stock.',
  },
  {
    name: 'Comunidad',
    path: '/comunidad',
    description: 'Marketplace con perfiles de usuario y publicaciones de anuncios.',
  },
  {
    name: 'Experiencias',
    path: '/ruleta',
    description: 'Ruleta, mystery y subastas para mantener dinamismo dentro del proyecto.',
  },
  {
    name: 'Servicio de compra',
    path: '/servicio-compra',
    description: 'Búsqueda asistida por encargo para piezas específicas de colección.',
  },
  {
    name: 'Roadmap Kickstarter',
    path: '/kickstarter',
    description: 'Plan de crecimiento y financiación para escalar infraestructura y catálogo.',
  },
];

export default function ProyectoPage() {
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Proyecto', path: '/proyecto' },
  ]);

  const faqSchema = buildFaqJsonLd([
    {
      question: '¿Qué explica esta página del proyecto?',
      answer:
        'Resume la visión de Advanced Retro, sus módulos principales y el orden de crecimiento previsto para tienda, comunidad y experiencias.',
    },
    {
      question: '¿La información sustituye al catálogo o a la comunidad?',
      answer:
        'No. Esta página es una vista ejecutiva; el catálogo, la comunidad y las secciones operativas siguen funcionando por separado.',
    },
    {
      question: '¿Dónde puedo contactar para dudas del proyecto?',
      answer:
        'En la sección de contacto de AdvancedRetro.es, donde se canalizan consultas generales y soporte.',
    },
  ]);

  const blocksSchema = buildItemListJsonLd(PROJECT_BLOCKS, 'Bloques del proyecto AdvancedRetro.es');

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blocksSchema) }}
      />

      <section className="section pt-6 sm:pt-8">
        <div className="container space-y-6">
          <div className="glass p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">AdvancedRetro.es · Página de proyecto</p>
            <h1 className="title-display mt-2 text-3xl sm:text-4xl">Cómo está construido Advanced Retro</h1>
            <p className="mt-3 max-w-3xl text-textMuted leading-relaxed">
              Esta página resume el proyecto en formato slider para que puedas explicar de forma visual el propósito, las áreas clave
              y la dirección de crecimiento sin tener que recorrer todas las secciones.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/tienda" className="button-primary">
                Abrir tienda
              </Link>
              <Link href="/comunidad" className="button-secondary">
                Ver comunidad
              </Link>
              <Link href="/contacto" className="button-secondary">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProjectStorySlider />

      <section className="section pt-2 sm:pt-3">
        <div className="container">
          <div className="glass p-6 sm:p-8">
            <h2 className="title-display text-2xl">Bloques estratégicos del ecosistema</h2>
            <p className="mt-3 max-w-3xl text-sm text-textMuted">
              La arquitectura del proyecto combina operación comercial, comunidad y entretenimiento. Cada bloque aporta conversión,
              retención o soporte para sostener crecimiento con identidad retro.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PROJECT_BLOCKS.map((block) => (
                <article key={block.name} className="rounded-2xl border border-line bg-[rgba(8,16,28,0.45)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-primary">{block.name}</p>
                  <p className="mt-2 text-sm text-textMuted">{block.description}</p>
                  <Link href={block.path} className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
                    Ir a {block.name.toLowerCase()}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
