import type { Metadata } from 'next';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contacto | Soporte y atención al cliente retro',
  description:
    'Contacta con AdvancedRetro.es para soporte de pedidos, dudas de autenticidad, envíos y servicio de compra por encargo.',
  path: '/contacto',
  keywords: ['contacto tienda retro', 'soporte advanced retro', 'atencion cliente retro'],
});

export default function ContactPage() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contacto AdvancedRetro.es',
    url: 'https://advancedretro.es/contacto',
    description: 'Canal de soporte para pedidos, autenticidad y atención al cliente de Advanced Retro.',
  };

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Contacto', path: '/contacto' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section className="section">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="glass p-10">
              <h1 className="title-display text-3xl">Contacto</h1>
              <p className="text-textMuted mt-2">Escríbenos y respondemos en menos de 24h.</p>
              <div className="grid gap-4 mt-6">
                <input className="bg-transparent border border-line px-4 py-3" placeholder="Nombre" />
                <input className="bg-transparent border border-line px-4 py-3" placeholder="Email" />
                <textarea className="bg-transparent border border-line px-4 py-3" rows={5} placeholder="Mensaje" />
                <button className="button-primary">Enviar</button>
              </div>
            </div>
            <div className="glass p-10">
              <h2 className="title-display text-2xl">ADVANCED RETRO Studio</h2>
              <p className="text-textMuted mt-2">Atención especializada para coleccionistas.</p>
              <div className="mt-6 space-y-3 text-textMuted">
                <p>Email: admin@advancedretro.es</p>
                <p>Horario: Lun - Vie / 10:00 - 19:00</p>
                <p>Soporte: Envíos, autenticidad, garantías.</p>
              </div>
            </div>
          </div>
          <div className="glass p-6 mt-8">
            <h2 className="title-display text-2xl">Atención para compra retro segura</h2>
            <p className="text-textMuted mt-3 leading-relaxed">
              Si necesitas validar una pieza antes de comprar, revisar estado de un pedido o solicitar un encargo de búsqueda,
              este canal es el punto oficial de contacto. La respuesta se centraliza para mantener trazabilidad y soporte postventa.
            </p>
            <p className="text-textMuted mt-3 leading-relaxed">
              También puedes usar tickets privados desde tu perfil para seguimiento de incidencias y gestión de envíos.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
