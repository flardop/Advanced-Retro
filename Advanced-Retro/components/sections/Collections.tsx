'use client';

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
    href: '/tienda/game-boy',
    cover: '/images/products/console-gb-dmg.jpg',
  },
  {
    title: 'Game Boy Color',
    subtitle: 'Catálogo dedicado para GBC',
    href: '/tienda/game-boy-color',
    cover: '/images/products/console-gbc.jpg',
  },
  {
    title: 'Game Boy Advance',
    subtitle: 'Juegos y variantes de GBA',
    href: '/tienda/game-boy-advance',
    cover: '/images/products/console-gba.jpg',
  },
  {
    title: 'Super Nintendo',
    subtitle: 'Selección SNES para coleccionismo',
    href: '/tienda/super-nintendo',
    cover: '/images/products/console-snes-pal.jpg',
  },
  {
    title: 'GameCube',
    subtitle: 'Catálogo GameCube en expansión',
    href: '/tienda/gamecube',
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

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div className="section-copy">
            <p className="section-kicker">{t('home.collections.badge', 'Navegación por consola')}</p>
            <h2 className="title-display mt-3 text-3xl sm:text-4xl">{t('home.collections.title', 'Colecciones principales')}</h2>
            <p className="section-subtitle">{t('home.collections.subtitle', 'Atajos por plataforma con portada real y entrada directa.')}</p>
          </div>
          <Link href="/tienda" className="button-secondary">
            {t('home.collections.cta_all_store', 'Ver toda la tienda')}
          </Link>
        </div>

        <div className="content-rail grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COLLECTIONS.map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              className="collection-card group glass p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow"
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
    </section>
  );
}
