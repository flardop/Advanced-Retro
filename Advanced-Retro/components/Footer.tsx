'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/components/LocaleProvider';

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="mt-auto border-t border-line bg-[rgba(8,14,25,0.82)] backdrop-blur-sm">
      <div className="container py-10 grid gap-8 lg:grid-cols-[1.2fr,1fr,1fr,1fr] text-sm text-textMuted">
        <div className="space-y-4">
          <Link href="/" className="inline-block rounded-lg p-1 hover:bg-white/5">
            <Image
              src="/logo.png"
              alt="Advanced Retro"
              width={160}
              height={42}
              className="h-9 w-auto object-contain logo-breath"
            />
          </Link>
          <p>
            {t(
              'footer.about',
              'Tienda especializada en retro gaming, coleccionismo y restauración con enfoque profesional.'
            )}
          </p>
          <div className="rounded-xl border border-line bg-[rgba(11,20,34,0.6)] p-3 text-xs leading-relaxed">
            <p>
              <span className="text-primary font-semibold">{t('footer.operation', 'Operación:')}</span>{' '}
              {t('footer.operation_value', 'España')}
            </p>
            <p className="mt-1">
              <span className="text-primary font-semibold">{t('footer.attention', 'Atención:')}</span>{' '}
              {t('footer.attention_value', 'ticket privado comprador ↔ tienda')}
            </p>
            <p className="mt-1">
              {t('footer.contact_emails', 'Emails de contacto:')} <span className="text-text">admin@advancedretro.es</span>
            </p>
          </div>
        </div>

        <div>
          <p className="text-text font-semibold">{t('footer.store', 'Tienda')}</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/tienda" className="hover:text-text">{t('footer.catalog', 'Catálogo completo')}</Link></li>
            <li><Link href="/tienda?category=platform:game-boy" className="hover:text-text">Game Boy</Link></li>
            <li><Link href="/tienda?category=platform:game-boy-color" className="hover:text-text">Game Boy Color</Link></li>
            <li><Link href="/tienda?category=platform:game-boy-advance" className="hover:text-text">Game Boy Advance</Link></li>
            <li><Link href="/tienda?category=platform:super-nintendo" className="hover:text-text">Super Nintendo</Link></li>
            <li><Link href="/tienda?category=platform:gamecube" className="hover:text-text">GameCube</Link></li>
            <li><Link href="/tienda?category=platform:consolas" className="hover:text-text">Consolas</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-text font-semibold">{t('footer.services', 'Servicios')}</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/tienda?category=cajas-misteriosas" className="hover:text-text">Mystery Box</Link></li>
            <li><Link href="/ruleta" className="hover:text-text">Ruleta</Link></li>
            <li><Link href="/subastas" className="hover:text-text">Subastas</Link></li>
            <li><Link href="/kickstarter" className="hover:text-text">Kickstarter</Link></li>
            <li><Link href="/servicio-compra" className="hover:text-text">Encargos 5€</Link></li>
            <li><Link href="/comunidad" className="hover:text-text">Comunidad</Link></li>
            <li><Link href="/comunidad/publicar" className="hover:text-text">Publicar anuncio</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-text font-semibold">{t('footer.legal', 'Legal')}</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/terminos" className="hover:text-text">{t('footer.terms', 'Términos')}</Link></li>
            <li><Link href="/privacidad" className="hover:text-text">{t('footer.privacy', 'Privacidad')}</Link></li>
            <li><Link href="/cookies" className="hover:text-text">{t('footer.cookies', 'Cookies')}</Link></li>
            <li><Link href="/accesibilidad" className="hover:text-text">Accesibilidad</Link></li>
            <li><Link href="/contacto" className="hover:text-text">Contacto</Link></li>
          </ul>
          <div className="mt-4 rounded-xl border border-line bg-[rgba(11,20,34,0.6)] p-3 text-xs">
            <p className="text-text font-semibold">{t('footer.secure', 'Compra segura')}</p>
            <p className="mt-1">
              {t(
                'footer.secure_text',
                'Seguimiento de pedidos, soporte por ticket y estado de envío actualizado.'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-textMuted">
          <p>© {new Date().getFullYear()} ADVANCED RETRO. {t('footer.rights', 'Todos los derechos reservados.')}</p>
          <ul className="flex items-center gap-4">
            <li><Link href="/terminos" className="hover:text-text">{t('footer.conditions', 'Condiciones')}</Link></li>
            <li><Link href="/privacidad" className="hover:text-text">{t('footer.privacy', 'Privacidad')}</Link></li>
            <li><Link href="/cookies" className="hover:text-text">{t('footer.cookies', 'Cookies')}</Link></li>
            <li><Link href="/accesibilidad" className="hover:text-text">Accesibilidad</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
