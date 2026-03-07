import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Catalog from '@/components/sections/Catalog';
import HypeLockboard from '@/components/sections/HypeLockboard';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sampleProducts } from '@/lib/sampleData';
import { getProductHref } from '@/lib/productUrl';
import { getPlatformLandingConfig, PLATFORM_LANDING_SLUGS } from '@/lib/platformSeo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Tienda retro | Catálogo completo de juegos y consolas',
  description:
    'Explora el catálogo retro de AdvancedRetro.es con filtros por consola, precio, stock y favoritos. Juegos, consolas y accesorios para coleccionismo.',
  path: '/tienda',
  keywords: [
    'catalogo retro',
    'comprar consolas retro',
    'comprar juegos game boy',
    'comprar juegos super nintendo',
    'comprar juegos gamecube',
  ],
});

export default async function StorePage() {
  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/tienda' },
  ]);

  const faqSchema = buildFaqJsonLd([
    {
      question: '¿Cómo filtrar juegos retro en la tienda?',
      answer:
        'Puedes filtrar por consola, rango de precio, stock, favoritos y orden de catálogo para encontrar piezas concretas más rápido.',
    },
    {
      question: '¿Hay componentes para completar juego completo?',
      answer:
        'Sí, en productos compatibles verás opciones de caja, manual, insert y protectores para completar colección.',
    },
    {
      question: '¿Puedo guardar favoritos para revisarlos luego?',
      answer:
        'Sí. Si inicias sesión puedes marcar favoritos y reutilizarlos como filtro dentro del catálogo.',
    },
  ]);

  const featuredProducts = (() => {
    const mapItem = (product: any) => ({
      name: String(product?.name || 'Producto retro'),
      path: getProductHref(product),
      image: String(product?.image || '/logo.png'),
      description: String(product?.description || '').slice(0, 180),
    });

    if (!supabaseAdmin) {
      return sampleProducts.slice(0, 12).map(mapItem);
    }

    return null;
  })();

  let itemListItems = featuredProducts;
  if (!itemListItems && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id,name,slug,price,image,description,stock,status,category,platform,is_mystery_box')
      .gt('price', 0)
      .order('updated_at', { ascending: false })
      .limit(24);

    itemListItems = (data || []).map((product: any) => ({
      name: String(product?.name || 'Producto retro'),
      path: getProductHref(product),
      image: String(product?.image || '/logo.png'),
      description: String(product?.description || '').slice(0, 180),
    }));
  }

  const itemListSchema = buildItemListJsonLd(itemListItems || [], 'Catálogo de tienda retro');
  const platformLandingLinks = PLATFORM_LANDING_SLUGS.map((slug) => getPlatformLandingConfig(slug)).filter(
    (landing): landing is NonNullable<ReturnType<typeof getPlatformLandingConfig>> => Boolean(landing)
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <section className="section pb-0">
        <div className="container">
          <BreadcrumbsNav items={[{ name: 'Inicio', href: '/' }, { name: 'Tienda' }]} />
        </div>
      </section>
      <section className="section pt-0">
        <div className="container glass p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="title-display text-xl">Catálogo por plataforma</h2>
            <Link href="/blog" className="chip">
              Ver guías de compra
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {platformLandingLinks.map((landing) => (
              <Link
                key={`platform-link-${landing.slug}`}
                href={`/tienda/${landing.slug}`}
                className="chip border-primary/40 text-primary"
              >
                {landing.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Suspense
        fallback={
          <section className="section">
            <div className="container">
              <div className="glass p-6 text-textMuted min-h-[420px]">Cargando catálogo...</div>
            </div>
          </section>
        }
      >
        <Catalog />
      </Suspense>
      <HypeLockboard compact />
      <section className="section pt-0">
        <div className="container glass p-6 sm:p-8 space-y-5">
          <h2 className="title-display text-2xl">Guía de compra retro: catálogo, estado y componentes</h2>
          <p className="text-textMuted leading-relaxed">
            Nuestra tienda retro está diseñada para que puedas localizar rápido juegos, consolas y componentes por plataforma real:
            Game Boy, Game Boy Color, Game Boy Advance, Super Nintendo y GameCube. El objetivo no es solo mostrar stock, sino ayudarte
            a entender qué compras exactamente: si es cartucho suelto, juego completo, caja, manual, insert o protector.
          </p>
          <p className="text-textMuted leading-relaxed">
            Para mejorar la decisión de compra, cada ficha está orientada a contexto de coleccionismo: estado de la pieza, fotos del
            producto, disponibilidad, precio y opciones compatibles. Así puedes comparar una edición original frente a opciones de
            reposición y decidir con más seguridad según tu presupuesto y objetivo de colección.
          </p>
          <h3 className="title-display text-xl">Cómo filtrar bien el catálogo retro</h3>
          <p className="text-textMuted leading-relaxed">
            Usa primero el buscador por título y después activa filtros avanzados por tipo de artículo, edición, plataforma, estado y
            rango de precio. Si inicias sesión, también puedes marcar favoritos y recuperar luego una lista limpia de productos para no
            perder piezas interesantes entre muchas referencias.
          </p>
          <p className="text-textMuted leading-relaxed">
            En artículos con comparativa de mercado eBay, la gráfica te da una referencia externa de listados activos. No sustituye una
            tasación profesional, pero sí te sirve para identificar si el precio de tienda está en rango razonable frente a otras
            publicaciones del mercado en España y Europa.
          </p>
          <h3 className="title-display text-xl">Confianza de compra y políticas clave</h3>
          <p className="text-textMuted leading-relaxed">
            El flujo de compra está pensado para transparencia: stock visible, resumen de pedido en carrito, checkout seguro y estado del
            pedido en el perfil. Además, la web incluye páginas de términos, privacidad, cookies y accesibilidad para que el comprador
            tenga claras las condiciones antes de pagar.
          </p>
          <p className="text-textMuted leading-relaxed">
            Si buscas una pieza difícil o una edición concreta, puedes usar el servicio de encargo y abrir ticket privado para seguimiento
            con tienda. Esto te permite centralizar comunicación, requisitos y validación del producto sin depender de mensajes dispersos.
          </p>
          <h3 className="title-display text-xl">Qué mirar antes de comprar un juego retro</h3>
          <p className="text-textMuted leading-relaxed">
            Un comprador de coleccionismo suele revisar cuatro factores: estado real, completitud, coherencia de precio y fiabilidad del
            vendedor. En la práctica, estado real significa fijarse en etiquetas, carátula, desgaste, coloración del plástico y posibles
            marcas de uso. Completitud significa saber si solo se vende cartucho o si incluye caja, manual, insert y protector. La
            coherencia de precio se valida comparando con mercado y también con la rareza específica de la edición. Por último, la
            fiabilidad se traduce en datos de soporte, políticas visibles y trazabilidad de pedido.
          </p>
          <p className="text-textMuted leading-relaxed">
            Por eso en Advanced Retro priorizamos fichas legibles y filtros por componentes. No es lo mismo comprar un título para jugar
            que comprarlo para completar estantería. Quien colecciona necesita precisión, no solo un nombre y un precio. Si tu objetivo es
            completar una edición concreta, usa primero filtros de plataforma y tipo, después revisa la ficha y finalmente añade solo los
            elementos que te faltan. Ese flujo reduce devoluciones y mejora la satisfacción de compra.
          </p>
          <h3 className="title-display text-xl">Cómo aprovechar comunidad, ruleta y servicio de encargo</h3>
          <p className="text-textMuted leading-relaxed">
            La tienda y la comunidad están conectadas para cubrir dos perfiles: comprador directo y comprador explorador. Si vienes a
            compra directa, el catálogo principal y el checkout te dan velocidad. Si vienes a descubrir oportunidades, la comunidad te
            permite rastrear anuncios, hablar con tienda y seguir actividad de vendedores. Para productos difíciles o piezas muy concretas,
            el servicio de encargo añade una capa de asistencia 1 a 1 para búsqueda controlada.
          </p>
          <p className="text-textMuted leading-relaxed">
            En paralelo, el módulo de mystery y ruleta está orientado a entretenimiento con reglas visibles y stock gestionado. No
            sustituye al catálogo clásico, sino que lo complementa para usuarios que también buscan una parte de sorpresa dentro del
            ecosistema retro. Si prefieres compra totalmente predecible, céntrate en tienda y comunidad; si quieres experiencia gamificada,
            combina tienda con ruleta y tickets según disponibilidad.
          </p>
          <h3 className="title-display text-xl">SEO y calidad de ficha: por qué importa al comprador</h3>
          <p className="text-textMuted leading-relaxed">
            Una ficha bien estructurada no solo ayuda a posicionar en Google; también reduce dudas y fricción al comprar. Por eso
            trabajamos títulos claros, descripciones útiles, imágenes consistentes y datos de producto estructurados. Cuando una ficha se
            indexa bien, llegan visitas más cualificadas: usuarios que buscan exactamente ese juego, esa consola o ese componente. Eso
            mejora conversión y evita tráfico irrelevante.
          </p>
          <p className="text-textMuted leading-relaxed">
            Si vas a publicar en comunidad o gestionar catálogo, la recomendación es mantener texto concreto, fotos limpias y categorías
            coherentes. Un sistema ordenado beneficia al usuario final y también al SEO técnico de toda la web. Cuanto mejor sea la calidad
            de cada ficha, más fácil es escalar el catálogo sin perder posicionamiento ni claridad en la navegación.
          </p>

          <div className="rounded-xl border border-line p-4 bg-[rgba(10,20,34,0.64)]">
            <p className="text-sm font-semibold text-primary mb-2">Accesos directos útiles para coleccionistas</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/tienda" className="chip border-primary/40 text-primary">Ver catálogo completo</Link>
              <Link href="/servicio-compra" className="chip">Solicitar encargo</Link>
              <Link href="/ruleta" className="chip">Ruleta y mystery</Link>
              <Link href="/comunidad" className="chip">Comunidad de venta</Link>
              <Link href="/contacto" className="chip">Contacto y soporte</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
