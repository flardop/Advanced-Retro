'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/components/LocaleProvider';

const quickLinks = [
  { label: 'Game Boy', href: '/tienda?category=platform:game-boy' },
  { label: 'Game Boy Color', href: '/tienda?category=platform:game-boy-color' },
  { label: 'Game Boy Advance', href: '/tienda?category=platform:game-boy-advance' },
  { label: 'Super Nintendo', href: '/tienda?category=platform:super-nintendo' },
  { label: 'GameCube', href: '/tienda?category=platform:gamecube' },
];

export default function Hero() {
  const { t } = useLocale();

  return (
    <section className="hero-section section relative overflow-hidden pt-4 sm:pt-6">
      <div className="absolute inset-0 bg-radial" />
      <div className="container relative">
        <div className="content-rail">
          <div className="hero-shell glass overflow-hidden rounded-[1.5rem]">
            <div className="grid gap-0 xl:grid-cols-[1.04fr,0.96fr]">
              <div className="hero-copy p-6 sm:p-8 lg:p-10 xl:p-12">
                <div className="mobile-scroll-row no-scrollbar sm:flex sm:flex-wrap sm:gap-2">
                  <span className="chip">{t('home.hero.chip_verified', 'Retro verificado')}</span>
                  <span className="chip">{t('home.hero.chip_shipping', 'Envío desde España')}</span>
                  <span className="chip">{t('home.hero.chip_support', 'Soporte real')}</span>
                </div>

                <h1 className="title-display mt-5 max-w-[12ch] text-3xl sm:text-5xl lg:text-[3.5rem]">
                  {t('home.hero.title', 'Catálogo retro profesional sin ruido.')}
                </h1>

                <p className="mt-4 max-w-[35rem] text-base text-textMuted sm:text-lg">
                  {t(
                    'home.hero.description',
                    'Juegos, consolas y piezas de coleccionismo con fichas claras, stock real y opciones para completar tu edición sin perder tiempo.'
                  )}
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link href="/tienda" className="button-primary text-center">
                    {t('home.hero.cta_shop', 'Explorar tienda')}
                  </Link>
                  <Link href="/comunidad" className="button-secondary text-center">
                    {t('home.hero.cta_community', 'Marketplace comunidad')}
                  </Link>
                  <Link href="/servicio-compra" className="button-secondary text-center">
                    {t('home.hero.cta_request', 'Encargo 1:1')}
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-2 text-xs">
                  {quickLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="chip shrink-0 hover:border-primary/50 hover:text-text">
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-8 grid max-w-[42rem] gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-line bg-[rgba(10,18,31,0.48)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-textMuted">
                      {t('home.hero.stat_preparation', 'Preparación')}
                    </p>
                    <p className="mt-1 text-base font-semibold text-primary">24-48h</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-[rgba(10,18,31,0.48)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-textMuted">
                      {t('home.hero.stat_coverage', 'Cobertura')}
                    </p>
                    <p className="mt-1 text-base font-semibold text-primary">{t('home.hero.stat_multiconsole', 'Multiconsola')}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-[rgba(10,18,31,0.48)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-textMuted">
                      {t('home.hero.stat_support', 'Atención')}
                    </p>
                    <p className="mt-1 text-base font-semibold text-primary">{t('home.hero.stat_private_ticket', 'Ticket privado')}</p>
                  </div>
                </div>
              </div>

              <div className="hero-media border-t border-line/80 bg-[linear-gradient(160deg,#10213a,#0b1728)] p-4 sm:p-6 xl:border-l xl:border-t-0 xl:p-7">
                <div className="relative h-[300px] overflow-hidden rounded-[1.4rem] border border-line sm:h-[360px] xl:h-full xl:min-h-[420px]">
                  <Image
                    src="/logo.png"
                    alt="Advanced Retro"
                    fill
                    className="object-contain p-8 opacity-90 logo-breath photo-hover-pop sm:p-10"
                    priority
                    sizes="(max-width: 1024px) 92vw, 44vw"
                  />
                  <div className="absolute left-3 top-3 rounded-full border border-primary/35 bg-[rgba(6,15,27,0.78)] px-3 py-1 text-xs text-primary">
                    {t('home.hero.badge_catalog_updated', 'Catálogo actualizado')}
                  </div>
                  <div className="absolute right-3 top-3 rounded-full border border-line bg-[rgba(6,15,27,0.78)] px-3 py-1 text-xs text-textMuted">
                    {t('home.hero.badge_secure_purchase', 'Compra segura')}
                  </div>
                  <div className="absolute inset-x-4 bottom-4 grid gap-2 rounded-2xl border border-line/80 bg-[rgba(5,11,20,0.82)] p-4 sm:grid-cols-2">
                    <p className="text-sm text-textMuted">Game Boy, SNES, GameCube y más</p>
                    <p className="text-sm text-textMuted">{t('home.hero.footer_community', 'Comunidad activa')} · {t('home.hero.badge_secure_purchase', 'Compra segura')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
