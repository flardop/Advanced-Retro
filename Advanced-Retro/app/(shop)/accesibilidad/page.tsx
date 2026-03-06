import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Accesibilidad',
  description:
    'Declaración de accesibilidad de AdvancedRetro.es, nivel objetivo WCAG 2.1 AA, contacto e incidencias.',
  path: '/accesibilidad',
  keywords: ['accesibilidad web', 'wcag ecommerce', 'declaracion accesibilidad'],
});

export default function AccessibilityPage() {
  return (
    <section className="section">
      <div className="container glass p-10 max-w-4xl space-y-6">
        <h1 className="title-display text-3xl">Accesibilidad</h1>
        <p className="text-textMuted">
          AdvancedRetro.es trabaja para cumplir estándares de accesibilidad digital en ecommerce,
          con referencia técnica a WCAG 2.1 nivel AA.
        </p>

        <div>
          <h2 className="text-xl font-semibold">1. Estado de conformidad</h2>
          <p className="text-textMuted mt-2">
            Estado actual: en mejora continua. Objetivo operativo: conformidad WCAG 2.1 AA en navegación,
            formularios, contenido visual y procesos de compra.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Medidas técnicas aplicadas</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Contraste y foco visible en controles interactivos.</li>
            <li>Navegación por teclado en menús, filtros y acciones principales.</li>
            <li>Etiquetas y textos de ayuda en formularios críticos.</li>
            <li>Estructura semántica por secciones y jerarquía de encabezados.</li>
            <li>Fallbacks en imágenes y mensajes claros ante errores.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Limitaciones conocidas</h2>
          <p className="text-textMuted mt-2">
            Algunas áreas están en proceso de ajuste fino (componentes dinámicos, visualizaciones y feedback de estados).
            Se priorizan los flujos de tienda, carrito, checkout y perfil.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Canal de incidencias</h2>
          <p className="text-textMuted mt-2">
            Si encuentras barreras de accesibilidad, escribe a atencionalcliente@advancedretro.es
            indicando página, dispositivo/navegador y pasos para reproducir.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Fecha de revisión</h2>
          <p className="text-textMuted mt-2">
            Última actualización de esta declaración: 4 de marzo de 2026.
          </p>
        </div>
      </div>
    </section>
  );
}

