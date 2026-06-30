import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import RetrovilleFandomShowcase from '@/components/retroville/RetrovilleFandomShowcase';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildPageMetadata } from '@/lib/seo';
import { buildRetrovilleSeriesJsonLd } from '@/app/retroville/shared';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';

export const metadata: Metadata = buildPageMetadata({
  title: 'Comunidad de Retroville | Fandom, publicaciones y archivo social',
  description:
    'Archivo social oficial de Retroville con fandom, publicaciones y señales visuales separadas del pitch principal.',
  path: '/retroville/comunidad',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'retroville comunidad',
    'retroville fandom',
    'retroville redes sociales',
    'retroville publicaciones',
    'retroville archivo social',
  ],
  image: '/images/retroville/retroville-street.png',
});

export default function RetrovilleCommunityPage() {
  const pageSchema = buildCollectionPageJsonLd({
    name: 'Comunidad y fandom de Retroville',
    path: '/retroville/comunidad',
    description:
      'Archivo completo de publicaciones, fandom y señales sociales de Retroville.',
    image: '/images/retroville/retroville-street.png',
    about: ['Retroville', 'Fandom', 'Comunidad', 'Publicaciones oficiales'],
  });

  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/comunidad',
    description:
      'Archivo social oficial de Retroville con fandom, hashtags y piezas que expanden el universo fuera del pitch principal.',
    image: '/images/retroville/retroville-street.png',
    name: 'Comunidad y fandom de Retroville',
  });

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Comunidad', path: '/retroville/comunidad' },
  ]);

  return (
    <>
      <StructuredData
        id="retroville-community-schema"
        data={[pageSchema, retrovilleSeriesSchema, breadcrumbs]}
      />

      <main
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(138,215,255,0.12),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(155,92,255,0.1),transparent_26%),linear-gradient(180deg,#04050b_0%,#050712_44%,#03040a_100%)] text-[var(--rv-text,#f5f7ff)]`}
      >
        <section className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-[rgba(8,11,20,0.72)] p-4 shadow-[0_1.4rem_3.5rem_rgba(0,0,0,0.22)]">
            <Link
              href="/retroville"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82 transition hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Retroville
            </Link>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(255,191,82,0.88)]">Archivo social</p>
              <p className="mt-2 text-sm text-white/62">El pitch principal queda limpio; aquí vive el resto del fandom.</p>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.8rem] border border-white/10 bg-[rgba(8,11,20,0.62)] p-5 shadow-[0_1.8rem_4.8rem_rgba(0,0,0,0.26)] sm:p-6 lg:grid-cols-[minmax(0,1.05fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[rgba(255,191,82,0.88)]">Comunidad y publicaciones</p>
              <h1 className={`${displayFont.className} mt-4 text-[clamp(2.8rem,6vw,5.6rem)] uppercase leading-[0.9] tracking-[0.03em] text-white`}>
                EL FANDOM
                <br />
                EN SU SITIO
              </h1>
              <p className="mt-4 max-w-[44rem] text-sm leading-7 text-white/70 sm:text-base">
                Esta página reúne las piezas sociales, los posts de personaje, las escenas compartibles y los hashtags
                que ayudan a expandir Retroville fuera del buyer brief sin ensuciar la portada principal.
              </p>
            </div>

            <Link
              href="/retroville/press"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-[rgba(255,191,82,0.26)] bg-[linear-gradient(135deg,rgba(255,191,82,0.22),rgba(192,57,43,0.2))] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[rgba(255,191,82,0.5)] hover:brightness-110"
            >
              Abrir press kit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <RetrovilleFandomShowcase variant="full" />
        </section>
      </main>
    </>
  );
}
