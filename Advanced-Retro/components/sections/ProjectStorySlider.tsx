'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

type ProjectSlide = {
  id: string;
  phase: string;
  title: string;
  summary: string;
  highlights: string[];
  metricLabel: string;
  metricValue: string;
  href: string;
  cta: string;
  image: string;
};

const AUTOPLAY_MS = 6800;

export const PROJECT_STORY_SLIDES: ProjectSlide[] = [
  {
    id: 'vision',
    phase: 'Fase 1',
    title: 'Base del proyecto',
    summary:
      'Advanced Retro nace para centralizar compra retro seria: catálogo claro, fichas limpias y experiencia enfocada en coleccionismo real.',
    highlights: ['Marca especializada en retro', 'Enfoque en confianza y claridad', 'Diseño pensado para decidir rápido'],
    metricLabel: 'Objetivo principal',
    metricValue: 'Compra retro sin fricción',
    href: '/tienda',
    cta: 'Entrar a tienda',
    image: '/images/hero/intro-poster-v2.jpg',
  },
  {
    id: 'catalog',
    phase: 'Fase 2',
    title: 'Catálogo por plataforma',
    summary:
      'La tienda organiza juegos y componentes por consola para reducir búsquedas largas y ayudar a completar colecciones.',
    highlights: ['Filtros por plataforma', 'Fichas con fotos y estado', 'Stock visible en tiempo real'],
    metricLabel: 'Cobertura actual',
    metricValue: 'GB · GBC · GBA · SNES · GameCube',
    href: '/tienda',
    cta: 'Explorar catálogo',
    image: '/images/products/console-gba.jpg',
  },
  {
    id: 'community',
    phase: 'Fase 3',
    title: 'Comunidad y marketplace',
    summary:
      'La sección de comunidad abre compra/venta entre usuarios con perfiles, publicaciones y soporte integrado para operaciones más seguras.',
    highlights: ['Perfiles de vendedor', 'Publicación de anuncios', 'Interacción social y reputación'],
    metricLabel: 'Valor para usuarios',
    metricValue: 'Compra y venta en un mismo ecosistema',
    href: '/comunidad',
    cta: 'Ver comunidad',
    image: '/images/products/console-gbc.jpg',
  },
  {
    id: 'experience',
    phase: 'Fase 4',
    title: 'Experiencias gamificadas',
    summary:
      'Mystery, ruleta y subastas suman dinamismo al proyecto para mantener actividad, descubrimiento y engagement continuo.',
    highlights: ['Ruleta con premios', 'Cajas mystery', 'Subastas por temporada'],
    metricLabel: 'Bloque de retención',
    metricValue: 'Experiencias de alto interés',
    href: '/ruleta',
    cta: 'Ir a ruleta',
    image: '/images/hype/mystery-drop.svg',
  },
  {
    id: 'service',
    phase: 'Fase 5',
    title: 'Servicio de compra asistida',
    summary:
      'Cuando no hay stock inmediato, el servicio de encargo cubre la búsqueda con seguimiento para piezas concretas.',
    highlights: ['Solicitud guiada', 'Seguimiento por ticket', 'Atención personalizada'],
    metricLabel: 'Soporte operativo',
    metricValue: 'Encargo 1:1',
    href: '/servicio-compra',
    cta: 'Solicitar encargo',
    image: '/images/products/console-snes-pal.jpg',
  },
  {
    id: 'roadmap',
    phase: 'Fase 6',
    title: 'Escalado y próximos pasos',
    summary:
      'La hoja de ruta integra mejoras de catálogo, contenido y automatización para crecer sin perder la identidad retro del proyecto.',
    highlights: ['Más catálogo y datos', 'Más contenido orgánico', 'Más herramientas para comunidad'],
    metricLabel: 'Dirección estratégica',
    metricValue: 'Escalar con control',
    href: '/kickstarter',
    cta: 'Ver roadmap',
    image: '/images/hype/auction-season.svg',
  },
];

export default function ProjectStorySlider() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeSlide = useMemo(
    () => PROJECT_STORY_SLIDES[index] || PROJECT_STORY_SLIDES[0],
    [index]
  );

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % PROJECT_STORY_SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const jumpTo = (nextIndex: number) => {
    if (Number.isNaN(nextIndex)) return;
    const normalized = (nextIndex + PROJECT_STORY_SLIDES.length) % PROJECT_STORY_SLIDES.length;
    setIndex(normalized);
  };

  return (
    <section className="section pt-3 sm:pt-4">
      <div className="container space-y-4">
        <div
          className="glass overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="grid gap-0 lg:grid-cols-[1fr,1fr]">
            <div className="p-5 sm:p-7 lg:p-9">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip border-primary/45 text-primary">Slider del proyecto</span>
                <span className="chip">{activeSlide.phase}</span>
                <span className="chip">{index + 1}/{PROJECT_STORY_SLIDES.length}</span>
              </div>

              <h2 className="title-display mt-4 text-2xl sm:text-3xl lg:text-4xl">{activeSlide.title}</h2>
              <p className="mt-3 max-w-2xl text-textMuted leading-relaxed">{activeSlide.summary}</p>

              <ul className="mt-5 space-y-2">
                {activeSlide.highlights.map((highlight) => (
                  <li key={`${activeSlide.id}-${highlight}`} className="flex items-start gap-2 text-sm text-text">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl border border-line bg-[rgba(8,15,27,0.62)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-textMuted">{activeSlide.metricLabel}</p>
                <p className="mt-2 text-lg font-semibold text-primary">{activeSlide.metricValue}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link href={activeSlide.href} className="button-primary">
                  {activeSlide.cta}
                </Link>
                <Link href="/contacto" className="button-secondary">
                  Hablar con soporte
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="chip hover:border-primary/50 hover:text-text"
                  onClick={() => jumpTo(index - 1)}
                  aria-label="Slide anterior"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="chip hover:border-primary/50 hover:text-text"
                  onClick={() => jumpTo(index + 1)}
                  aria-label="Slide siguiente"
                >
                  Siguiente
                </button>
              </div>
            </div>

            <div className="border-t border-line bg-[linear-gradient(160deg,#101e35,#0b1629)] p-4 sm:p-6 lg:border-l lg:border-t-0">
              <div className="relative h-56 overflow-hidden rounded-xl border border-line sm:h-72 lg:h-full lg:min-h-[360px]">
                <SafeImage src={activeSlide.image} alt={activeSlide.title} fill className="object-cover" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/10 bg-[rgba(4,11,20,0.72)] p-3 text-xs">
                  <span className="text-primary">{activeSlide.phase}</span>
                  <span className="text-textMuted">AdvancedRetro.es</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#060d18] via-[#060d18c8] to-transparent p-4">
                  <p className="text-base font-semibold text-text">{activeSlide.title}</p>
                  <p className="mt-1 text-xs text-textMuted">{activeSlide.summary}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECT_STORY_SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              className={`rounded-xl border px-3 py-3 text-left transition ${
                slideIndex === index
                  ? 'border-primary/55 bg-primary/10'
                  : 'border-line bg-[rgba(8,15,27,0.45)] hover:border-primary/30'
              }`}
              onClick={() => jumpTo(slideIndex)}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-primary">{slide.phase}</p>
              <p className="mt-1 text-sm font-semibold text-text">{slide.title}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
