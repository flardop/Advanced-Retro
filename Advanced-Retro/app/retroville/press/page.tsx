import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download, ExternalLink, FileText, ImageIcon } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildPageMetadata } from '@/lib/seo';
import { buildRetrovilleSeriesJsonLd } from '@/app/retroville/shared';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';

export const metadata: Metadata = buildPageMetadata({
  title: 'Press kit de Retroville | Logos, renders y dossier oficial',
  description:
    'Descarga el press kit oficial de Retroville con logotipo, renders de personajes, biblia base y descripciones oficiales del proyecto para prensa, creadores y medios.',
  path: '/retroville/press',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'press kit retroville',
    'prensa retroville',
    'logo retroville',
    'renders retroville',
    'retroville media kit',
    'retroville press assets',
  ],
  image: '/images/retroville/retroville-cast-presentation.png',
});

const copyBlocks = [
  {
    title: 'Descripcion corta',
    body:
      'Retroville es una serie animada original ambientada en una ciudad construida con hardware abandonado. Mezcla humor oscuro, personajes memorables y worldbuilding retrofuturista. El proyecto se presenta como una comedia adulta con identidad visual propia.',
  },
  {
    title: 'Descripcion media',
    body:
      'Retroville es una serie animada original creada dentro del universo AdvancedRetro. La historia transcurre en una ciudad formada por cartuchos, consolas, periféricos y restos de hardware olvidado. Sus barrios, vehículos y edificios nacen de referencias reales del mundo gaming y se convierten en arquitectura, sistemas sociales y humor visual.\n\nEl reparto está liderado por NOX, Luna y Button Crew, y el tono combina comedia negra, vida de barrio, nostalgia tecnológica y caos social. Retroville está desarrollado como una propiedad con personajes, masterplan urbano, sketchbook activo y materiales de temporada en evolución.',
  },
  {
    title: 'Descripcion larga',
    body:
      'Retroville es una serie animada original en desarrollo que imagina una ciudad viva construida a partir de hardware abandonado. Todo en su universo responde a esa lógica: rascacielos levantados con cartuchos y consolas, distritos enteros marcados por la memoria digital, vehículos inspirados en mandos y periféricos, y personajes que existen como si hubieran sobrevivido al final de sus propios juegos.\n\nLejos de ser solo una estética, Retroville se plantea como una serie con ambición real de estudio: reparto definido, humor oscuro, identidad cinematográfica y un sistema de worldbuilding que conecta personajes, barrios, transporte, iconografía y vida cotidiana. El proyecto combina nostalgia, sátira social y una mirada adulta sobre la cultura del videojuego, con una presentación pensada tanto para audiencia como para partners, medios y plataformas.',
  },
] as const;

const assetCards = [
  {
    title: 'Logotipo PNG',
    href: '/images/retroville/retroville-logo.png',
    meta: 'PNG · fondo transparente',
    icon: ImageIcon,
  },
  {
    title: 'Logotipo SVG',
    href: '/downloads/retroville/retroville-logo.svg',
    meta: 'SVG · vector descargable',
    icon: ImageIcon,
  },
  {
    title: 'Biblia base',
    href: '/downloads/retroville/retroville-biblia-serie-v0.pdf',
    meta: 'PDF · documento de vision general',
    icon: FileText,
  },
] as const;

const renderCards = [
  {
    title: 'NOX',
    image: '/images/retroville/nox-character-large.png',
    href: '/images/retroville/nox-character-large.png',
    alt: 'Render de NOX, personaje principal de Retroville',
  },
  {
    title: 'BUTTON CREW',
    image: '/images/retroville/button-crew-character-large.png',
    href: '/images/retroville/button-crew-character-large.png',
    alt: 'Render del Button Crew, grupo de personajes de Retroville',
  },
  {
    title: 'LUNA',
    image: '/images/retroville/luna-character-large.png',
    href: '/images/retroville/luna-character-large.png',
    alt: 'Render de Luna, personaje de Retroville',
  },
] as const;

const factSheet = [
  ['Formato', 'Serie animada original'],
  ['Tono', 'Comedia negra · sci-fi retro · barrio'],
  ['Estado', 'En desarrollo y presentacion activa'],
  ['Ventana publica', '10 de noviembre de 2026'],
  ['Universo', '14 personajes principales + ciudad en expansion'],
  ['Creador', 'AdvancedRetro'],
] as const;

export default function RetrovillePressPage() {
  const pageSchema = buildCollectionPageJsonLd({
    name: 'Press kit de Retroville',
    path: '/retroville/press',
    description:
      'Centro oficial de prensa de Retroville con descargas de logo, renders, biblia base y copy reutilizable para medios.',
    image: '/images/retroville/retroville-cast-presentation.png',
    about: ['Press kit Retroville', 'Material oficial de prensa', 'Serie animada original'],
  });
  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/press',
    description:
      'Press kit oficial de Retroville con materiales descargables, renders, logo y dossier de la serie original.',
    image: '/images/retroville/retroville-cast-presentation.png',
    name: 'Press kit de Retroville',
  });
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Press', path: '/retroville/press' },
  ]);

  return (
    <>
      <StructuredData id="retroville-press-schema" data={[pageSchema, retrovilleSeriesSchema, breadcrumbs]} />
      <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} min-h-screen bg-[#06070d] text-[#f7f5ef]`}>
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
          <nav className="mb-12 flex flex-wrap items-center justify-between gap-4" aria-label="Navegación press kit Retroville">
            <Link
              href="/retroville"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/80 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Retroville
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link href="/retroville/personajes" className="inline-flex min-h-[44px] items-center rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 transition hover:border-white/20 hover:text-white">
                Personajes
              </Link>
              <Link href="/retroville/sketches" className="inline-flex min-h-[44px] items-center rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 transition hover:border-white/20 hover:text-white">
                Sketchbook
              </Link>
              <Link href="/retroville/faq" className="inline-flex min-h-[44px] items-center rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 transition hover:border-white/20 hover:text-white">
                FAQ
              </Link>
            </div>
          </nav>

          <header className="grid gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,24,0.98),rgba(7,9,18,0.98))] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.32)] lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div>
              <p className={`${monoFont.className} text-[11px] uppercase tracking-[0.28em] text-[#8ad7ff]`}>Media & press resources</p>
              <h1 className={`${displayFont.className} mt-4 text-[clamp(3.1rem,8vw,5.8rem)] uppercase leading-[0.9] text-white`}>
                PRESS KIT DE RETROVILLE
              </h1>
              <p className="mt-5 max-w-[58ch] text-base leading-8 text-white/74 sm:text-lg">
                Todo lo necesario para hablar bien del proyecto desde fuera: logotipo, renders principales, biblia base y texto oficial reutilizable para medios, creadores y plataformas.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {assetCards.map((asset) => {
                  const Icon = asset.icon;
                  return (
                    <a
                      key={asset.title}
                      href={asset.href}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#8ad7ff]/30 hover:bg-white/[0.08]"
                    >
                      <Icon className="h-5 w-5 text-[#8ad7ff]" />
                      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white">{asset.title}</p>
                      <p className="mt-2 text-xs text-white/56">{asset.meta}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8ad7ff]">
                        Descargar
                        <Download className="h-4 w-4" />
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/30 p-4">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[1.35rem]">
                <Image
                  src="/images/retroville/retroville-cast-presentation.png"
                  alt="Imagen principal del reparto de Retroville para el press kit"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-white/66">
                Imagen principal de apoyo para compartir la serie: reparto, tono y mundo en una sola pieza.
              </p>
            </div>
          </header>

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`${monoFont.className} text-[11px] uppercase tracking-[0.28em] text-[#ffc940]`}>Renders en alta</p>
                <h2 className={`${displayFont.className} mt-3 text-[clamp(2.6rem,6vw,4rem)] uppercase leading-[0.92] text-white`}>
                  ASSETS LISTOS PARA MEDIOS
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {renderCards.map((render) => (
                <article key={render.title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] bg-[rgba(10,13,24,0.9)]">
                    <Image
                      src={render.image}
                      alt={render.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 30vw"
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <h3 className={`${displayFont.className} text-[1.8rem] uppercase text-white`}>{render.title}</h3>
                    <a
                      href={render.href}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[11px] uppercase tracking-[0.18em] text-white/82 transition hover:border-[#8ad7ff]/30 hover:text-white"
                    >
                      Descargar
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6">
              <p className={`${monoFont.className} text-[11px] uppercase tracking-[0.28em] text-[#8ad7ff]`}>Copy oficial reutilizable</p>
              <h2 className={`${displayFont.className} mt-3 text-[clamp(2.6rem,6vw,4rem)] uppercase leading-[0.92] text-white`}>
                DESCRIPCIONES LISTAS PARA PEGAR
              </h2>
              <div className="mt-6 grid gap-4">
                {copyBlocks.map((block) => (
                  <article key={block.title} className="rounded-[1.3rem] border border-white/10 bg-[rgba(8,11,20,0.82)] p-5">
                    <h3 className={`${displayFont.className} text-[1.7rem] uppercase leading-[0.95] text-white`}>{block.title}</h3>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/74">{block.body}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6">
              <p className={`${monoFont.className} text-[11px] uppercase tracking-[0.28em] text-[#ffc940]`}>Ficha rapida</p>
              <h2 className={`${displayFont.className} mt-3 text-[clamp(2.3rem,5vw,3.4rem)] uppercase leading-[0.92] text-white`}>
                FACT SHEET
              </h2>
              <div className="mt-6 space-y-3">
                {factSheet.map(([label, value]) => (
                  <div key={label} className="rounded-[1.15rem] border border-white/10 bg-[rgba(8,11,20,0.82)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/48">{label}</p>
                    <p className="mt-2 text-sm leading-7 text-white/80">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/retroville" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#00ff88] px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition hover:brightness-110">
                  Volver a la landing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/retroville/faq" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82 transition hover:border-white/20 hover:text-white">
                  Ver FAQ
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}
