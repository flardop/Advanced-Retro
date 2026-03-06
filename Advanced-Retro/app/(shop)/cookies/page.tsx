import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import OpenCookieSettingsButton from '@/components/OpenCookieSettingsButton';

export const metadata: Metadata = buildPageMetadata({
  title: 'Política de cookies',
  description: 'Información sobre cookies técnicas, analíticas y de preferencia usadas en AdvancedRetro.es.',
  path: '/cookies',
  keywords: ['cookies tienda online', 'cookies advanced retro'],
});

export default function CookiesPage() {
  return (
    <section className="section">
      <div className="container glass p-10 max-w-4xl space-y-6">
        <h1 className="title-display text-3xl">Política de cookies</h1>
        <p className="text-textMuted">
          Esta web utiliza cookies técnicas para operar la tienda y, con consentimiento previo, cookies de
          preferencias, analítica y marketing. El panel de configuración permite aceptar, rechazar o personalizar.
        </p>

        <div>
          <h2 className="text-xl font-semibold">1. Responsable</h2>
          <p className="text-textMuted mt-2">
            Responsable del sitio: ADVANCED RETRO. Contacto: admin@advancedretro.es.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Cómo gestionar el consentimiento</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <OpenCookieSettingsButton />
          </div>
          <p className="text-textMuted mt-2">
            Puedes modificar o revocar el consentimiento en cualquier momento. Rechazar cookies no técnicas no bloquea
            la compra, pero puede limitar personalización y analítica.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Tipos de cookies y base legal</h2>
          <div className="overflow-x-auto mt-3">
            <table className="w-full min-w-[680px] border border-line text-sm">
              <thead className="bg-[rgba(12,20,34,0.85)]">
                <tr>
                  <th className="text-left p-3 border-b border-line">Categoría</th>
                  <th className="text-left p-3 border-b border-line">Finalidad</th>
                  <th className="text-left p-3 border-b border-line">Base legal</th>
                  <th className="text-left p-3 border-b border-line">Duración aprox.</th>
                </tr>
              </thead>
              <tbody className="text-textMuted">
                <tr>
                  <td className="p-3 border-b border-line">Necesarias</td>
                  <td className="p-3 border-b border-line">Login, sesión, carrito, seguridad y checkout.</td>
                  <td className="p-3 border-b border-line">Interés legítimo / ejecución contractual.</td>
                  <td className="p-3 border-b border-line">Sesión y hasta 12 meses.</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-line">Preferencias</td>
                  <td className="p-3 border-b border-line">Idioma y ajustes de experiencia.</td>
                  <td className="p-3 border-b border-line">Consentimiento.</td>
                  <td className="p-3 border-b border-line">Hasta 6 meses.</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-line">Analíticas</td>
                  <td className="p-3 border-b border-line">Medición de uso y rendimiento (CWV, páginas, eventos).</td>
                  <td className="p-3 border-b border-line">Consentimiento.</td>
                  <td className="p-3 border-b border-line">Hasta 13 meses.</td>
                </tr>
                <tr>
                  <td className="p-3">Marketing</td>
                  <td className="p-3">Atribución y campañas (si se activan herramientas de terceros).</td>
                  <td className="p-3">Consentimiento.</td>
                  <td className="p-3">Hasta 13 meses.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Terceros y transferencias</h2>
          <p className="text-textMuted mt-2">
            La tienda puede utilizar proveedores de analítica, infraestructura y pagos. Si se activan cookies de terceros,
            se informará en este documento y en el panel de configuración.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Contacto</h2>
          <p className="text-textMuted mt-2">
            Para dudas sobre cookies y privacidad: admin@advancedretro.es y atencionalcliente@advancedretro.es.
          </p>
        </div>
      </div>
    </section>
  );
}
