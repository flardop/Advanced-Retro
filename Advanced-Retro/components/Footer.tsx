'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/components/LocaleProvider';
import { PUBLIC_SUPPORT_EMAIL } from '@/lib/legal';

export default function Footer() {
  const { t } = useLocale();
  const footerGroups = [
    {
      title: t('footer.store', 'Tienda'),
      links: [
        { href: '/tienda', label: t('footer.catalog', 'Catálogo completo') },
        { href: '/tienda?category=platform:game-boy', label: 'Game Boy' },
        { href: '/tienda?category=platform:game-boy-color', label: 'Game Boy Color' },
        { href: '/tienda?category=platform:game-boy-advance', label: 'Game Boy Advance' },
        { href: '/tienda?category=platform:super-nintendo', label: 'Super Nintendo' },
        { href: '/tienda?category=platform:gamecube', label: 'GameCube' },
        { href: '/tienda?category=platform:consolas', label: 'Consolas' },
      ],
    },
    {
      title: t('footer.services', 'Servicios'),
      links: [
        { href: '/mystery-boxes', label: 'Mystery Box' },
        { href: '/ruleta', label: 'Ruleta' },
        { href: '/subastas', label: 'Subastas' },
        { href: '/servicio-compra', label: 'Encargos 5€' },
        { href: '/comunidad', label: 'Comunidad' },
      ],
    },
    {
      title: t('footer.legal', 'Legal'),
      links: [
        { href: '/terminos', label: t('footer.terms', 'Términos') },
        { href: '/privacidad', label: t('footer.privacy', 'Privacidad') },
        { href: '/cookies', label: t('footer.cookies', 'Cookies') },
        { href: '/accesibilidad', label: 'Accesibilidad' },
        { href: '/contacto', label: 'Contacto' },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-line bg-[rgba(8,14,25,0.82)] backdrop-blur-sm">
      <div className="container py-8 sm:py-10">
        <div className="content-rail grid gap-5 lg:grid-cols-[1.15fr,1.35fr] lg:gap-8 text-sm text-textMuted">
          <div className="space-y-4 text-center md:hidden">
            <Link href="/" className="inline-flex items-center justify-center rounded-lg p-1 hover:bg-white/5">
              <Image
                src="/logo.png"
                alt="Advanced Retro"
                width={148}
                height={38}
                className="h-8 w-auto object-contain logo-breath"
              />
            </Link>

            <p className="mx-auto max-w-[30ch] text-xs leading-6 text-textMuted">
              {t(
                'footer.about',
                'Tienda especializada en retro gaming, coleccionismo y restauración con enfoque profesional.'
              )}
            </p>

            <div className="grid grid-cols-2 gap-2 text-left text-[11px] leading-relaxed">
              <div className="rounded-xl border border-line bg-[rgba(11,20,34,0.52)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-primary/90">
                  {t('footer.operation', 'Operación')}
                </p>
                <p className="mt-1 text-text">{t('footer.operation_value', 'España')}</p>
              </div>
              <div className="rounded-xl border border-line bg-[rgba(11,20,34,0.52)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-primary/90">
                  {t('footer.attention', 'Atención')}
                </p>
                <p className="mt-1 text-text">{t('footer.attention_value', 'ticket privado comprador ↔ tienda')}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-line bg-[rgba(11,20,34,0.52)] px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.14em] text-primary/90">
                  {t('footer.contact_emails', 'Atención al cliente')}
                </p>
                <p className="mt-1 break-all text-text">{PUBLIC_SUPPORT_EMAIL}</p>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-[rgba(11,20,34,0.52)] px-3 py-3 text-center text-[11px]">
              <p className="text-text font-semibold">{t('footer.payment_methods', 'Pago seguro')}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <Image src="/icons/payments/visa.svg" alt="Visa" width={80} height={28} className="h-6 w-auto" />
                <Image src="/icons/payments/mastercard.svg" alt="Mastercard" width={80} height={28} className="h-6 w-auto" />
                <Image src="/icons/payments/sepa.svg" alt="SEPA" width={80} height={28} className="h-6 w-auto" />
                <Image src="/icons/payments/bizum.svg" alt="Bizum" width={80} height={28} className="h-6 w-auto" />
              </div>
            </div>
          </div>

          <div className="hidden space-y-4 text-left md:block">
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
            <div className="rounded-xl border border-line bg-[rgba(11,20,34,0.6)] p-3 text-xs leading-relaxed text-left">
              <p>
                <span className="text-primary font-semibold">{t('footer.operation', 'Operación:')}</span>{' '}
                {t('footer.operation_value', 'España')}
              </p>
              <p className="mt-1">
                <span className="text-primary font-semibold">{t('footer.attention', 'Atención:')}</span>{' '}
                {t('footer.attention_value', 'ticket privado comprador ↔ tienda')}
              </p>
              <p className="mt-1">
                {t('footer.contact_emails', 'Atención al cliente:')} <span className="text-text">{PUBLIC_SUPPORT_EMAIL}</span>
              </p>
            </div>
            <div className="rounded-xl border border-line bg-[rgba(11,20,34,0.6)] p-3 text-xs">
              <p className="text-text font-semibold">{t('footer.payment_methods', 'Pago seguro')}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <Image src="/icons/payments/visa.svg" alt="Visa" width={96} height={32} className="h-8 w-auto" />
                <Image src="/icons/payments/mastercard.svg" alt="Mastercard" width={96} height={32} className="h-8 w-auto" />
                <Image src="/icons/payments/sepa.svg" alt="SEPA" width={96} height={32} className="h-8 w-auto" />
                <Image src="/icons/payments/bizum.svg" alt="Bizum" width={96} height={32} className="h-8 w-auto" />
              </div>
            </div>
          </div>

          <div className="grid gap-2.5 md:hidden">
            {footerGroups.map((group) => (
              <details
                key={`footer-mobile-${group.title}`}
                className="rounded-2xl border border-line bg-[rgba(11,20,34,0.56)] px-4 py-3"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-text">
                  {group.title}
                </summary>
                <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs leading-relaxed text-textMuted">
                  {group.links.map((link) => (
                    <li key={`footer-mobile-link-${link.href}`}>
                      <Link href={link.href} className="hover:text-text">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}

            <div className="rounded-2xl border border-line bg-[rgba(11,20,34,0.56)] px-4 py-3 text-center text-[11px] leading-relaxed text-textMuted">
              <p className="text-text font-semibold">{t('footer.secure', 'Compra segura')}</p>
              <p className="mt-1">
                {t(
                  'footer.secure_text',
                  'Seguimiento de pedidos, soporte por ticket y estado de envío actualizado.'
                )}
              </p>
            </div>
          </div>

          <div className="hidden gap-8 md:grid md:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={`footer-desktop-${group.title}`}>
                <p className="text-text font-semibold">{group.title}</p>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={`footer-desktop-link-${link.href}`}>
                      <Link href={link.href} className="hover:text-text">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {group.title === t('footer.legal', 'Legal') ? (
                  <div className="mt-4 rounded-xl border border-line bg-[rgba(11,20,34,0.6)] p-3 text-xs">
                    <p className="text-text font-semibold">{t('footer.secure', 'Compra segura')}</p>
                    <p className="mt-1">
                      {t(
                        'footer.secure_text',
                        'Seguimiento de pedidos, soporte por ticket y estado de envío actualizado.'
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="container py-3.5 sm:py-4">
          <div className="content-rail flex flex-col items-center justify-between gap-2.5 text-center text-[11px] text-textMuted md:flex-row md:text-left md:text-xs">
            <p>© {new Date().getFullYear()} ADVANCED RETRO. {t('footer.rights', 'Todos los derechos reservados.')}</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 md:justify-end md:gap-4">
              <li><Link href="/terminos" className="hover:text-text">{t('footer.conditions', 'Condiciones')}</Link></li>
              <li><Link href="/privacidad" className="hover:text-text">{t('footer.privacy', 'Privacidad')}</Link></li>
              <li><Link href="/cookies" className="hover:text-text">{t('footer.cookies', 'Cookies')}</Link></li>
              <li><Link href="/accesibilidad" className="hover:text-text">Accesibilidad</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
