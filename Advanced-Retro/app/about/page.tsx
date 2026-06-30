import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Quiénes somos | AdvancedRetro.es',
  description:
    'Conoce cómo trabaja AdvancedRetro.es: tienda retro con catálogo curado, fotos reales, soporte humano y preparación de pedidos desde España.',
  path: '/about',
  keywords: ['quienes somos advanced retro', 'tienda retro españa', 'about advancedretro'],
});

export default function AboutPage() {
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Quiénes somos', path: '/about' },
  ]);

  const faqSchema = buildFaqJsonLd([
    {
      question: '¿Qué es AdvancedRetro.es?',
      answer:
        'Es una tienda online de juegos retro, consolas y componentes de colección con foco en claridad de ficha, soporte y envío desde España.',
    },
    {
      question: '¿Retroville es la tienda?',
      answer:
        'No. Retroville es el universo creativo original de la marca. La tienda sigue siendo la capa de compra, catálogo y soporte.',
    },
    {
      question: '¿Cómo se publican los productos?',
      answer:
        'Se priorizan fotos reales, detalle de estado, stock disponible y una estructura clara para saber si compras cartucho, caja, manual o pack completo.',
    },
  ]);

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

      <section className="section pb-0">
        <div className="container">
          <BreadcrumbsNav items={[{ name: 'Inicio', href: '/' }, { name: 'Quiénes somos' }]} />
        </div>
      </section>

      <section className="section pt-6">
        <div className="container">
          <div className="content-rail glass p-6 sm:p-8 lg:p-10">
            <p className="section-kicker">Quiénes somos</p>
            <h1 className="title-display mt-3 max-w-[18ch] text-3xl sm:text-4xl">
              AdvancedRetro.es es una tienda retro con criterio de catálogo y soporte real.
            </h1>
            <p className="mt-4 max-w-[52rem] leading-relaxed text-textMuted">
              El objetivo no es llenar la web de ruido, sino hacer que comprar retro sea más claro:
              saber qué pieza estás viendo, en qué estado está, qué componentes incluye y cómo se
              gestiona el pedido desde España.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-line bg-[rgba(10,18,30,0.58)] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-primary">Catálogo</p>
                <h2 className="mt-3 text-xl font-semibold text-text">Fichas pensadas para decidir mejor</h2>
                <p className="mt-3 text-sm leading-relaxed text-textMuted">
                  La prioridad es enseñar nombre, estado, precio, stock y compatibilidad con el menor
                  número posible de ambigüedades.
                </p>
              </article>

              <article className="rounded-2xl border border-line bg-[rgba(10,18,30,0.58)] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-primary">Operación</p>
                <h2 className="mt-3 text-xl font-semibold text-text">Preparación desde España</h2>
                <p className="mt-3 text-sm leading-relaxed text-textMuted">
                  Los pedidos, el seguimiento y el soporte se coordinan desde España, con atención por
                  ticket cuando el comprador necesita validar algo antes de cerrar compra.
                </p>
              </article>

              <article className="rounded-2xl border border-line bg-[rgba(10,18,30,0.58)] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-primary">Marca</p>
                <h2 className="mt-3 text-xl font-semibold text-text">Retroville vive aparte</h2>
                <p className="mt-3 text-sm leading-relaxed text-textMuted">
                  Retroville es el universo narrativo original del proyecto. Sirve para construir marca
                  y comunidad, pero no sustituye la capa de tienda ni la experiencia de compra.
                </p>
              </article>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <h2 className="text-2xl font-semibold text-text">Cómo trabajamos el producto</h2>
                <div className="mt-4 space-y-4 text-textMuted">
                  <p>
                    Cuando una pieza entra en la web, el foco está en que el visitante pueda responder
                    rápido a tres preguntas: qué es, qué incluye y si encaja con su colección.
                  </p>
                  <p>
                    Por eso la tienda empuja las búsquedas por plataforma, la separación entre juego,
                    manual, caja e insert, y una lectura más honesta del estado de cada artículo.
                  </p>
                  <p>
                    Si el usuario no encuentra lo que necesita, existe un servicio de encargo y soporte
                    directo para piezas concretas.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.58)] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-primary">Accesos directos</p>
                <div className="mt-4 flex flex-col gap-2.5">
                  <Link href="/tienda" className="button-primary w-full text-center">
                    Ir al catálogo
                  </Link>
                  <Link href="/contacto" className="button-secondary w-full text-center">
                    Contacto y soporte
                  </Link>
                  <Link href="/retroville" className="button-secondary w-full text-center">
                    Ver Retroville
                  </Link>
                  <Link href="/creator" className="button-secondary w-full text-center">
                    Ver founder / CV
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr,1.05fr]">
              <div className="overflow-hidden rounded-2xl border border-line bg-[rgba(10,18,30,0.58)]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src="/images/creator/joel-color.jpg"
                    alt="Joel Rivera Rodriguez, founder de AdvancedRetro"
                    fill
                    sizes="(max-width: 1024px) 100vw, 32vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-[rgba(10,18,30,0.58)] p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.14em] text-primary">Founder</p>
                <h2 className="mt-3 text-2xl font-semibold text-text">Joel Rivera Rodriguez</h2>
                <p className="mt-4 text-sm leading-relaxed text-textMuted">
                  El apartado completo del founder y CV sigue existiendo dentro de AdvancedRetro. Ahí está reunida toda tu información personal y profesional: portfolio, recorrido, capacidades, historia y proyectos.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['UX/UI Design', 'Web Development', 'Next.js', 'Storytelling', 'Retroville', 'AdvancedRetro'].map((item) => (
                    <span key={item} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-textMuted">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/creator" className="button-primary">
                    Entrar al founder / CV
                  </Link>
                  <a href="mailto:pitch@advancedretro.es" className="button-secondary">
                    Contactar por correo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
