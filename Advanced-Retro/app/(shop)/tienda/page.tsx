import type { Metadata } from 'next';
import Catalog from '@/components/sections/Catalog';
import HypeLockboard from '@/components/sections/HypeLockboard';
import { buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';

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

export default function StorePage() {
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HypeLockboard compact />
      <Catalog />
      <section className="section pt-0">
        <div className="container glass p-6 sm:p-8 space-y-4">
          <h2 className="title-display text-2xl">Cómo comprar en la tienda retro</h2>
          <p className="text-textMuted leading-relaxed">
            Navega por plataforma, abre la ficha del producto y selecciona componentes compatibles si quieres completar una edición.
            El sistema está preparado para comparar opciones y comprar de forma directa desde carrito y checkout seguro.
          </p>
          <p className="text-textMuted leading-relaxed">
            En productos con datos de mercado, la gráfica superior ayuda a comparar precio del catálogo frente a referencia externa para
            tomar decisiones de compra con más contexto.
          </p>
        </div>
      </section>
    </>
  );
}
