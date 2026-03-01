'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

type Slide = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
};

const SLIDES: Slide[] = [
  {
    id: 'collection-gamecube',
    title: 'GameCube Essentials',
    description: 'Selección activa de títulos coleccionables y packs completos.',
    ctaLabel: 'Ver GameCube',
    href: '/tienda?category=platform:gamecube',
    image: '/images/collections/gamecube.svg',
  },
  {
    id: 'mystery',
    title: 'Mystery Box y Ruleta',
    description: 'Tickets, premios y tiradas con stock y control real desde tu perfil.',
    ctaLabel: 'Abrir ruleta',
    href: '/ruleta',
    image: '/images/mystery-box-5.png',
  },
  {
    id: 'community',
    title: 'Comunidad Marketplace',
    description: 'Compra y venta entre coleccionistas con revisión de la tienda.',
    ctaLabel: 'Entrar en comunidad',
    href: '/comunidad',
    image: '/images/collections/game-boy-color.svg',
  },
];

export default function RetroPromoSlider() {
  const [index, setIndex] = useState(0);
  const active = useMemo(() => SLIDES[index] || SLIDES[0], [index]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="section pt-0">
      <div className="container">
        <div className="glass overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Destacado</p>
              <h2 className="title-display text-3xl mt-2">{active.title}</h2>
              <p className="text-textMuted mt-3">{active.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={active.href} className="button-primary">
                  {active.ctaLabel}
                </Link>
                <Link href="/tienda" className="button-secondary">
                  Ver catálogo completo
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
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

            <div className="relative min-h-[220px] border-t lg:border-t-0 lg:border-l border-line bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.24),transparent_52%)]">
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(8,18,38,0.92),rgba(3,10,25,0.96))]" />
              <div className="relative z-10 h-full p-6 flex items-center justify-center">
                <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl border border-line bg-slate-950/35 overflow-hidden">
                  <SafeImage
                    src={active.image}
                    alt={active.title}
                    fill
                    className="object-contain p-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
