import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Política de privacidad',
  description: 'Política de privacidad y tratamiento de datos personales en AdvancedRetro.es.',
  path: '/privacidad',
  keywords: ['privacidad tienda online', 'proteccion de datos advanced retro'],
});

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container glass p-10 max-w-4xl space-y-6">
        <h1 className="title-display text-3xl">Política de privacidad</h1>
        <p className="text-textMuted">
          En ADVANCED RETRO tratamos datos personales para prestar el servicio de tienda online, soporte y prevención
          de fraude. Esta política aplica a compra de productos, comunidad y formularios de contacto.
        </p>

        <div>
          <h2 className="text-xl font-semibold">1. Responsable del tratamiento</h2>
          <p className="text-textMuted mt-2">
            Responsable: ADVANCED RETRO. Contacto principal: admin@advancedretro.es.
            Soporte y derechos RGPD: atencionalcliente@advancedretro.es.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Datos que tratamos</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Datos de cuenta: email, nombre, avatar y bio si los completas.</li>
            <li>Datos de pedido: productos, importes, estado y fechas.</li>
            <li>Datos de envío y facturación cuando realizas compras.</li>
            <li>Datos de soporte: tickets, mensajes y publicaciones que envíes.</li>
            <li>Datos técnicos de seguridad: IP, logs y eventos antifraude.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Finalidades y bases jurídicas</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Ejecución del contrato: gestión de compras, cobros, envíos y postventa.</li>
            <li>Obligación legal: facturación, contabilidad y cumplimiento fiscal.</li>
            <li>Interés legítimo: seguridad, antifraude y defensa ante reclamaciones.</li>
            <li>Consentimiento: cookies no técnicas, comunicaciones y personalización opcional.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Conservación de datos</h2>
          <ul className="list-disc list-inside text-textMuted mt-2 space-y-1">
            <li>Cuenta y pedidos: durante la relación contractual y plazos legales aplicables.</li>
            <li>Facturación: conforme a la normativa fiscal y mercantil vigente.</li>
            <li>Soporte/tickets: tiempo necesario para resolver incidencias y trazabilidad.</li>
            <li>Logs de seguridad: periodos limitados para prevención y auditoría técnica.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Destinatarios y encargados</h2>
          <p className="text-textMuted mt-2">
            Podemos compartir datos necesarios con proveedores de infraestructura, base de datos, pagos, email y logística.
            Todos ellos actúan como encargados de tratamiento con obligaciones de confidencialidad y seguridad.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">6. Derechos RGPD</h2>
          <p className="text-textMuted mt-2">
            Puedes ejercer derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad.
            Solicitudes: atencionalcliente@advancedretro.es. Respuesta en plazo legal.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">7. Menores y seguridad</h2>
          <p className="text-textMuted mt-2">
            No se permite uso de la plataforma por menores sin autorización legal.
            Aplicamos medidas técnicas y organizativas para proteger los datos.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">8. Reclamaciones</h2>
          <p className="text-textMuted mt-2">
            Si consideras que tus derechos no han sido atendidos, puedes reclamar ante la autoridad de control competente.
          </p>
        </div>
      </div>
    </section>
  );
}
