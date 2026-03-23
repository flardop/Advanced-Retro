'use client';

import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';

export default function FinalCTA() {
  const { t } = useLocale();

  return (
    <section className="section pt-2">
      <div className="container">
        <div className="glass flex flex-col gap-5 p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">{t('home.cta.badge', 'Siguiente paso')}</p>
            <h2 className="title-display mt-2 text-3xl sm:text-4xl">{t('home.cta.title', 'Empieza por una compra simple, escala tu colección después.')}</h2>
            <p className="mt-3 text-textMuted">
              {t('home.cta.description', 'Tienda + comunidad + encargo: elige el flujo que mejor encaja con tu forma de comprar retro.')}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link href="/tienda" className="button-primary">{t('home.cta.shop', 'Ir a tienda')}</Link>
            <Link href="/comunidad" className="button-secondary">{t('home.cta.community', 'Entrar en comunidad')}</Link>
            <Link href="/servicio-compra" className="button-secondary">{t('home.cta.request', 'Abrir encargo')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
