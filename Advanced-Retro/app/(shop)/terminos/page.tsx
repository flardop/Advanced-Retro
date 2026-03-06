import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Términos y condiciones',
  description: 'Condiciones de compra, soporte, publicaciones y envíos de AdvancedRetro.es.',
  path: '/terminos',
  keywords: ['terminos tienda retro', 'condiciones advanced retro'],
});

export default function TermsPage() {
  return (
    <section className="section">
      <div className="container glass p-10 max-w-4xl space-y-6">
        <h1 className="title-display text-3xl">Términos y condiciones</h1>
        <p className="text-textMuted">
          Estos términos regulan la compra, venta y uso del servicio en ADVANCED RETRO.
          Antes de pagar, el cliente debe revisar ficha de producto, precio final y condiciones de envío/devolución.
        </p>

        <div>
          <h2 className="text-xl font-semibold">1. Identificación del prestador</h2>
          <p className="text-textMuted mt-2">
            Titular: ADVANCED RETRO. Contacto: admin@advancedretro.es.
            Canal de soporte: sistema de tickets y correo de atención.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Información precontractual</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Precio final en euros con impuestos aplicables.</li>
            <li>Costes de envío antes de confirmar el pedido.</li>
            <li>Métodos de pago disponibles y pasos de compra.</li>
            <li>Confirmación de pedido por pantalla y email.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Productos y estado</h2>
          <p className="text-textMuted mt-2">
            Cada ficha debe indicar el estado y tipo de artículo (original, repro 1:1 o mixto).
            El comprador debe revisar descripción, fotos y condiciones antes de pagar.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Pagos y pedidos</h2>
          <p className="text-textMuted mt-2">
            El pedido queda confirmado tras la validación del pago. Si hay incidencia de stock o pago,
            se contactará al cliente con alternativas o reembolso según proceda.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Envío y entrega</h2>
          <p className="text-textMuted mt-2">
            Se informan plazos estimados y seguimiento cuando esté disponible. Los plazos pueden variar por transportista,
            destino o incidencias logísticas.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">6. Derecho de desistimiento (14 días)</h2>
          <p className="text-textMuted mt-2">
            Con carácter general, compras a distancia cuentan con 14 días naturales para desistimiento desde la recepción.
            Para ejercerlo, abre ticket o escribe a soporte indicando número de pedido y motivo.
          </p>
          <p className="text-textMuted mt-2">
            El reembolso se tramita tras recepción y revisión del estado del artículo, usando el mismo medio de pago salvo acuerdo.
            Pueden aplicar excepciones legales en supuestos específicos.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">7. Devoluciones por incidencia</h2>
          <p className="text-textMuted mt-2">
            Si existe error de envío, daño o problema no descrito en la ficha, el cliente debe notificarlo por ticket para
            revisión y solución (cambio, abono o reembolso).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">8. Servicio de encargo</h2>
          <p className="text-textMuted mt-2">
            El servicio de compra segura por encargo incluye gestión y soporte por chat. La tarifa del servicio
            cubre la intermediación y no garantiza disponibilidad inmediata de un producto concreto.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">9. Publicaciones de usuarios</h2>
          <p className="text-textMuted mt-2">
            Solo usuarios verificados pueden publicar. Las publicaciones pasan por revisión y pueden ser
            rechazadas por información incompleta, sospecha de falsedad o incumplimiento de normas.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">10. Contacto y soporte</h2>
          <p className="text-textMuted mt-2">
            La vía oficial de soporte es el sistema de tickets dentro de la cuenta del usuario.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">11. Limitación de responsabilidad</h2>
          <p className="text-textMuted mt-2">
            ADVANCED RETRO no responde por usos inadecuados del producto ni por retrasos debidos a terceros fuera de su control.
          </p>
        </div>
      </div>
    </section>
  );
}
