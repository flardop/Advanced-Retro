'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

type Slide = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
  badge: string;
};

const SLIDES: Slide[] = [
  {
    id: 'catalog',
    title: 'Catálogo por consola',
    description: 'Navega por plataforma y encuentra más rápido lo que buscas.',
    href: '/tienda',
    cta: 'Abrir catálogo',
    image: '/images/products/console-gamecube.jpg',
    badge: 'Tienda',
  },
  {
    id: 'community',
    title: 'Comunidad con perfiles reales',
    description: 'Compra y vende en marketplace con soporte de tienda y métricas.',
    href: '/comunidad',
    cta: 'Entrar en comunidad',
    image: '/images/products/console-gbc.jpg',
    badge: 'Comunidad',
  },
  {
    id: 'mystery',
    title: 'Ruleta y mystery box',
    description: 'Experiencias gamificadas con tickets y control de premios.',
    href: '/ruleta',
    cta: 'Ir a ruleta',
    image: '/images/mystery-box-5.png',
    badge: 'Experiencia',
  },
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

  return (
    <section className="section pt-2 sm:pt-3">
      <div className="container">
        <div
          className="glass overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid gap-0 lg:grid-cols-[0.98fr,1.02fr]">
            <div className="order-2 p-5 sm:p-7 lg:order-1 lg:p-9">
              <p className="text-xs uppercase tracking-[0.22em] text-primary">Atajos inteligentes</p>
              <h2 className="title-display mt-2 text-2xl sm:text-3xl">Navega por bloques, no por ruido</h2>
              <p className="mt-3 max-w-xl text-textMuted">
                Accesos directos para tienda, comunidad y experiencia mystery sin perder contexto de compra.
              </p>

              <div className="mt-5 rounded-xl border border-line bg-[rgba(8,15,27,0.64)] p-4">
                <span className="chip border-primary/45 text-primary">{active.badge}</span>
                <h3 className="mt-3 text-xl font-semibold">{active.title}</h3>
                <p className="mt-2 text-sm text-textMuted">{active.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={active.href} className="button-primary">
                    {active.cta}
                  </Link>
                  <Link href="/tienda" className="button-secondary">
                    Ver tienda
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SLIDES.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      i === index ? 'border-primary bg-primary/10 text-primary' : 'border-line text-textMuted hover:text-text'
                    }`}
                    onClick={() => setIndex(i)}
                  >
                    {slide.badge}
                  </button>
                ))}
              </div>
            </div>

            <div className="order-1 border-b border-line bg-[linear-gradient(160deg,#101e35,#0b1629)] p-4 lg:order-2 lg:border-b-0 lg:border-l lg:p-6">
              <div className="relative h-56 overflow-hidden rounded-xl border border-line sm:h-72 lg:h-full lg:min-h-[320px]">
                <SafeImage src={active.image} alt={active.title} fill className="object-cover" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/10 bg-[rgba(4,11,20,0.72)] p-3 text-xs">
                  <span className="text-primary">{active.badge}</span>
                  <span className="text-textMuted">Advanced Retro</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#060d18] via-[#060d18c8] to-transparent p-4">
                  <p className="text-base font-semibold text-text">{active.title}</p>
                  <p className="mt-1 text-xs text-textMuted">{active.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
