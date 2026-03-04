'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

type Slide = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  stats: string;
};

const SLIDES: Slide[] = [
  {
    id: 'hardware',
    kicker: 'Hardware',
    title: 'Consolas reales y piezas de colección',
    description: 'Game Boy, GBC, GBA, SNES y GameCube con fotos reales y estado visible.',
    ctaLabel: 'Ver consolas',
    href: '/tienda?category=platform:consolas',
    image: '/images/products/console-gb-dmg.jpg',
    stats: 'Nuevo en catálogo',
  },
  {
    id: 'gamecube',
    kicker: 'Catálogo',
    title: 'GameCube Essentials',
    description: 'Selección activa de títulos coleccionables y packs completos.',
    ctaLabel: 'Ver GameCube',
    href: '/tienda?category=platform:gamecube',
    image: '/images/products/console-gamecube.jpg',
    stats: 'Top visitas',
  },
  {
    id: 'mystery',
    kicker: 'Experiencia',
    title: 'Mystery Box y Ruleta',
    description: 'Tickets, premios y tiradas con stock y control real desde tu perfil.',
    ctaLabel: 'Abrir ruleta',
    href: '/ruleta',
    image: '/images/mystery-box-5.png',
    stats: 'Acceso rápido',
  },
  {
    id: 'community',
    kicker: 'Comunidad',
    title: 'Marketplace entre coleccionistas',
    description: 'Publica anuncios, vende tus piezas y participa con reputación real.',
    ctaLabel: 'Entrar en comunidad',
    href: '/comunidad',
    image: '/images/products/console-gbc.jpg',
    stats: 'Vendedor verificado',
  },
];

const TICKER_ITEMS = [
  'Game Boy',
  'Game Boy Color',
  'Game Boy Advance',
  'Super Nintendo',
  'GameCube',
  'Consolas',
  'Mystery Box',
  'Comunidad',
];

export default function RetroPromoSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = useMemo(() => SLIDES[index] || SLIDES[0], [index]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [paused]);

  const goPrev = () => setIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  const goNext = () => setIndex((prev) => (prev + 1) % SLIDES.length);

  return (
    <section className="section pt-0">
      <div className="container">
        <div
          className="glass overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative border-b border-line">
            <div className="marquee-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, itemIndex) => (
                <span key={`${item}-${itemIndex}`} className="chip text-[11px] tracking-[0.06em]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.12fr,0.88fr]">
            <div className="order-2 lg:order-1 p-5 sm:p-8 lg:p-10">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">{active.kicker}</p>
                <span className="chip text-[11px]">{active.stats}</span>
              </div>

              <h2 className="title-display text-2xl sm:text-3xl mt-3">{active.title}</h2>
              <p className="text-textMuted mt-3 text-sm sm:text-base">{active.description}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={active.href} className="button-primary">
                  {active.ctaLabel}
                </Link>
                <Link href="/tienda" className="button-secondary">
                  Ver catálogo completo
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  className="button-secondary px-3 py-2 text-xs"
                  onClick={goPrev}
                  aria-label="Slide anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="button-secondary px-3 py-2 text-xs"
                  onClick={goNext}
                  aria-label="Slide siguiente"
                >
                  →
                </button>
                <div className="ml-1 flex flex-wrap gap-2">
                  {SLIDES.map((slide, slideIndex) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={`h-2.5 w-10 rounded-full border transition ${
                        slideIndex === index
                          ? 'border-primary bg-primary/70'
                          : 'border-line bg-slate-800/70 hover:border-primary/40'
                      }`}
                      onClick={() => setIndex(slideIndex)}
                      aria-label={`Mostrar slide ${slideIndex + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 h-1.5 rounded-full border border-line overflow-hidden bg-[#0c1624]">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[#8af4ff] transition-all duration-500"
                  style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="order-1 lg:order-2 relative border-b lg:border-b-0 lg:border-t-0 lg:border-l border-line bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.24),transparent_52%)]">
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(8,18,38,0.92),rgba(3,10,25,0.96))]" />
              <div className="relative z-10 h-full p-5 sm:p-6">
                <div className="relative w-full h-44 sm:h-56 rounded-2xl border border-line bg-slate-950/35 overflow-hidden">
                  <SafeImage
                    src={active.image}
                    alt={active.title}
                    fill
                    className="object-cover transition-all duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07111b] to-transparent p-3">
                    <p className="text-xs text-text">{active.kicker}</p>
                  </div>
                </div>

                <div className="mt-4 mobile-scroll-row no-scrollbar sm:grid sm:grid-cols-4 sm:gap-2 sm:overflow-visible sm:pb-0">
                  {SLIDES.map((slide, slideIndex) => (
                    <button
                      key={`thumb-${slide.id}`}
                      type="button"
                      className={`relative h-14 w-14 shrink-0 sm:h-16 sm:w-auto rounded-lg overflow-hidden border transition ${
                        slideIndex === index ? 'border-primary shadow-glow' : 'border-line hover:border-primary/40'
                      }`}
                      onClick={() => setIndex(slideIndex)}
                      aria-label={`Abrir ${slide.title}`}
                    >
                      <SafeImage src={slide.image} alt={slide.title} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
