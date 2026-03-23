'use client';

import { useRef } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { useLocale } from '@/components/LocaleProvider';

type CollectionCard = {
  title: string;
  subtitle: string;
  href: string;
  cover: string;
};

const COLLECTIONS: CollectionCard[] = [
  {
    title: 'Game Boy',
    subtitle: 'Clásicos originales y edición coleccionista',
    href: '/tienda?category=platform:game-boy',
    cover: '/images/products/console-gb-dmg.jpg',
  },
  {
    title: 'Game Boy Color',
    subtitle: 'Catálogo dedicado para GBC',
    href: '/tienda?category=platform:game-boy-color',
    cover: '/images/products/console-gbc.jpg',
  },
  {
    title: 'Game Boy Advance',
    subtitle: 'Juegos y variantes de GBA',
    href: '/tienda?category=platform:game-boy-advance',
    cover: '/images/products/console-gba.jpg',
  },
  {
    title: 'Super Nintendo',
    subtitle: 'Selección SNES para coleccionismo',
    href: '/tienda?category=platform:super-nintendo',
    cover: '/images/products/console-snes-pal.jpg',
  },
  {
    title: 'GameCube',
    subtitle: 'Catálogo GameCube en expansión',
    href: '/tienda?category=platform:gamecube',
    cover: '/images/products/console-gamecube.jpg',
  },
  {
    title: 'Consolas',
    subtitle: 'Consolas completas y hardware con imagen real',
    href: '/tienda?category=platform:consolas',
    cover: '/images/products/console-gb-dmg.jpg',
  },
];

export default function Collections() {
  const { t } = useLocale();
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.max(320, Math.round(rail.clientWidth * 0.72));
    rail.scrollBy({
      left: amount * direction,
      behavior: 'smooth',
    });
  };

  return (
    <section className="section">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">{t('home.collections.badge', 'Navegación por consola')}</p>
            <h2 className="title-display mt-2 text-3xl sm:text-4xl">{t('home.collections.title', 'Colecciones principales')}</h2>
            <p className="text-textMuted">{t('home.collections.subtitle', 'Atajos por plataforma con portada real y entrada directa.')}</p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              className="button-secondary px-3 py-2 text-xs"
              onClick={() => scrollRail(-1)}
              aria-label={t('home.collections.aria_left', 'Mover colecciones hacia la izquierda')}
            >
              ←
            </button>
            <button
              type="button"
              className="button-secondary px-3 py-2 text-xs"
              onClick={() => scrollRail(1)}
              aria-label={t('home.collections.aria_right', 'Mover colecciones hacia la derecha')}
            >
              →
            </button>
            <Link href="/tienda" className="button-secondary">
              {t('home.collections.cta_all_store', 'Ver toda la tienda')}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#07101a] to-transparent z-10 rounded-l-xl" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#07101a] to-transparent z-10 rounded-r-xl" />

          <div
            ref={railRef}
            className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
          >
            {COLLECTIONS.map((collection) => (
              <Link
                key={collection.title}
                href={collection.href}
                className="collection-card group glass min-w-[280px] snap-start p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow sm:min-w-[330px] lg:min-w-[360px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-mono uppercase tracking-[0.12em] text-textMuted">{t('home.collections.card_label', 'Colección')}</p>
                  <span className="text-primary text-sm transition-transform group-hover:translate-x-1">→</span>
                </div>

                <h3 className="title-display text-2xl mt-2">
                  {t(`home.collections.${collection.title.toLowerCase().replace(/\s+/g, '_')}.title`, collection.title)}
                </h3>
                <p className="text-textMuted mt-2 min-h-[48px]">
                  {t(`home.collections.${collection.title.toLowerCase().replace(/\s+/g, '_')}.subtitle`, collection.subtitle)}
                </p>

                <div className="photo-frame-glow relative mt-4 h-44 overflow-hidden rounded-xl border border-line bg-[radial-gradient(circle_at_15%_20%,rgba(75,228,214,.1),transparent_55%),rgba(9,18,31,.9)]">
                  <SafeImage
                    src={collection.cover}
                    fallbackSrc="/placeholder.svg"
                    alt={`${collection.title} ${t('home.collections.cover', 'portada')}`}
                    fill
                    className="object-contain p-2 photo-breath photo-hover-pop"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs text-textMuted">{t('home.collections.direct_filter', 'Filtrado directo por plataforma')}</span>
                  <span className="chip border-primary/40 text-xs text-primary">{t('home.collections.open_collection', 'Abrir colección')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="sm:hidden mt-4 flex gap-2">
          <button
            type="button"
            className="button-secondary px-3 py-2 text-xs"
            onClick={() => scrollRail(-1)}
            aria-label={t('home.collections.aria_left', 'Mover colecciones hacia la izquierda')}
          >
            ←
          </button>
          <button
            type="button"
            className="button-secondary px-3 py-2 text-xs"
            onClick={() => scrollRail(1)}
            aria-label={t('home.collections.aria_right', 'Mover colecciones hacia la derecha')}
          >
            →
          </button>
          <Link href="/tienda" className="button-secondary">
            {t('home.collections.cta_catalog', 'Ver catálogo')}
          </Link>
        </div>
      </div>
    </section>
  );
}
