import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';
import { buildRetrovilleSeriesJsonLd } from '@/app/retroville/shared';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './sketches.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sketchbook de Retroville | Proceso vivo, mapas y concept art',
  description:
    'Archivo visual vivo de Retroville con sketches a lapiz, tableros de traduccion, mapas de ciudad y hojas de proceso del universo original de AdvancedRetro.',
  path: '/retroville/sketches',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'sketchbook retroville',
    'proceso retroville',
    'retroville worldbuilding',
    'retroville referencias',
    'retroville mapas',
    'retroville concept art',
    'retroville arquitectura',
    'advancedretro sketches',
  ],
  image: '/images/retroville/process/hotel-translation-board.png',
});

function toSketchAnchor(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const curatedSections = [
  {
    title: 'De Referencia A Traduccion',
    phase: 'Fase activa · arquitectura y lenguaje',
    intro:
      'Esta parte enseña justo lo que faltaba: de dónde nace cada idea, qué objeto o lenguaje visual la dispara y cómo se convierte en arquitectura o espacio de Retroville.',
    items: [
      {
        title: 'Comisaria Retroville',
        tag: 'Seguridad',
        image: '/images/retroville/process/police-translation-board.webp',
        text: 'Un ejemplo perfecto de método: la caja táctica real se traduce a cierres, refuerzos, cámaras y lenguaje de edificio vigilado.',
      },
      {
        title: 'Hotel Retroville',
        tag: 'Hospitality',
        image: '/images/retroville/process/hotel-translation-board.webp',
        text: 'El hotel nace de enchufes, regletas, cableado y señal de encendido. Aquí la referencia no se copia: se convierte en reglas de forma.',
      },
      {
        title: 'Biblioteca Retroville',
        tag: 'Cultura',
        image: '/images/retroville/process/library-translation-board.webp',
        text: 'Juegos apilados, lomos, slots y orden físico se convierten en fachada, acceso y sistema de devolución.',
      },
      {
        title: 'Reset Medical Center',
        tag: 'Salud',
        image: '/images/retroville/process/hospital-translation-board.webp',
        text: 'Una pieza que mezcla iconografía hospitalaria y lógica de videojuego: triage, recovery y reboot dentro del mismo edificio.',
      },
      {
        title: 'Aquarium District',
        tag: 'Costa',
        image: '/images/retroville/process/aquarium-translation-board.webp',
        text: 'El acuario trabaja con transparencia, circulación interior y escala pública para abrir un distrito costero más limpio y luminoso.',
      },
      {
        title: 'Retroville Public School',
        tag: 'Educacion',
        image: '/images/retroville/process/school-translation-board.webp',
        text: 'La escuela no es un volumen cualquiera: se entiende enseguida que la inspiración sale de una consola de doble pantalla y su jerarquía frontal.',
      },
    ],
  },
  {
    title: 'Sistemas Jugables',
    phase: 'Fase activa · movilidad y ocio',
    intro:
      'Cuando la ciudad se mueve o se usa, los sketches empiezan a funcionar como diseño de sistema: transporte, ocio, flujo de gente y lectura rápida.',
    items: [
      {
        title: 'Metro-Pod',
        tag: 'Transit',
        image: '/images/retroville/process/metro-pod-translation-board.webp',
        text: 'Una hoja de diseño pensada para fijar accesibilidad, visibilidad y lenguaje de transporte urbano dentro de la ciudad.',
      },
      {
        title: 'Retroville Fleet',
        tag: 'Marina',
        image: '/images/retroville/process/boats-translation-board.webp',
        text: 'Ferrys, taxis de agua, patrullas y cruceros con ADN de consola. No son props sueltos: amplían el mapa y la vida pública.',
      },
      {
        title: 'Gym Gate',
        tag: 'Leisure',
        image: '/images/retroville/process/gym-translation-board.webp',
        text: 'El gimnasio lleva la idea de hardware al gesto arquitectónico: una entrada que ya comunica actividad, energía y juego físico.',
      },
    ],
  },
  {
    title: 'Mapas Y Distritos',
    phase: 'Fase activa · masterplan y expansion',
    intro:
      'Después de traducir objetos a edificios, toca colocarlos dentro del conjunto. Estas hojas enseñan cómo encaja cada barrio dentro del plan general.',
    items: [
      {
        title: 'Masterplan Overview',
        tag: 'Mapa',
        image: '/images/retroville/process/masterplan-overview-board.webp',
        text: 'La visión general de la ciudad: núcleo central, distritos, zonas residenciales y la conexión con Bit Grave.',
      },
      {
        title: 'CRT Central Plaza',
        tag: 'Centro',
        image: '/images/retroville/process/central-plaza-board.webp',
        text: 'La plaza central como corazón visible del sistema: señalización, televisión pública y lectura inmediata del tono de la ciudad.',
      },
      {
        title: 'Cinema & Mall District',
        tag: 'Ocio',
        image: '/images/retroville/process/cinema-mall-district-board.webp',
        text: 'Un distrito de consumo, juegos y escaparate construido para que se entienda como foco de vida urbana y reunión.',
      },
      {
        title: 'Bit Grave',
        tag: 'Ruina',
        image: '/images/retroville/process/bit-grave-district-board.webp',
        text: 'El reverso del brillo: hardware muerto, basura histórica y un barrio entero definido por lo desechado y lo recuperado.',
      },
    ],
  },
] as const;

const featuredSketches = [
  {
    title: 'Hotel Retroville',
    tag: 'Traducción visual',
    image: '/images/retroville/process/hotel-translation-board.webp',
  },
  {
    title: 'Masterplan Overview',
    tag: 'Mapa general',
    image: '/images/retroville/process/masterplan-overview-board.webp',
  },
  {
    title: 'Metro-Pod',
    tag: 'Sistema urbano',
    image: '/images/retroville/process/metro-pod-translation-board.webp',
  },
] as const;

export default function RetrovilleSketchesPage() {
  const pageSchema = buildCollectionPageJsonLd({
    name: 'Sketchbook de Retroville',
    path: '/retroville/sketches',
    description:
      'Archivo visual de Retroville dedicado a sketches a lápiz, tableros de traducción, mapas de distrito y hojas de proceso del universo.',
    image: '/images/retroville/process/masterplan-overview-board.png',
    about: ['Worldbuilding Retroville', 'Sketches a lápiz', 'Mapas de ciudad', 'Proceso visual'],
  });
  const sketchListSchema = buildItemListJsonLd(
    curatedSections.flatMap((group) =>
      group.items.map((item) => ({
        name: `${group.title}: ${item.title}`,
        path: `/retroville/sketches#${toSketchAnchor(item.title)}`,
        image: item.image,
        description: item.text,
      }))
    ),
    'Archivo visual de Retroville'
  );
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Sketches', path: '/retroville/sketches' },
  ]);
  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/sketches',
    description:
      'Archivo oficial del proceso de Retroville con sketches a lápiz, tableros de traducción visual y mapas del universo.',
    image: '/images/retroville/process/hotel-translation-board.png',
    name: 'Sketchbook de Retroville',
  });

  return (
    <>
      <StructuredData
        id="retroville-sketches-schema"
        data={[pageSchema, retrovilleSeriesSchema, sketchListSchema, breadcrumbs]}
      />
      <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}>
      <header className={styles.hero}>
        <nav className={styles.nav} aria-label="Navegación de sketches Retroville">
          <Link href="/retroville" className={styles.backLink}>
            <ArrowLeft className="h-4 w-4" /> Volver a Retroville
          </Link>
          <Image src="/images/retroville/retroville-logo.webp" alt="Logo de Retroville" width={260} height={173} className={styles.logo} priority />
        </nav>

        <section className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Retroville sketch archive</p>
            <h1 className={`${displayFont.className} ${styles.heroTitle}`}>
              SKETCHBOOK
              <br />
              VIVO
            </h1>
            <div className="mt-5 inline-flex items-center rounded-full border border-[#8ad7ff]/20 bg-[#8ad7ff]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#8ad7ff]">
              Solo proceso · sketches y mapas · Junio 2026
            </div>
            <p className={styles.heroText}>
              Este apartado queda dedicado solo a imágenes de proceso: boards de traducción, mapas, distritos y
              hojas con lenguaje de lápiz para que se vea cómo nace Retroville antes de su versión final.
            </p>
            <p className={styles.heroText}>
              Aquí ya no entran biblias visuales, styleguides finales ni material demasiado cerrado. La idea es que
              el sketchbook se sienta como un archivo de ideas vivas, no como un escaparate mezclado.
            </p>
            <p className={styles.heroText}>
              Cada bloque enseña una fase distinta del mundo: de la referencia real a la arquitectura, de la
              movilidad al mapa general de la ciudad.
            </p>
            <div className={styles.sectionPills}>
              {curatedSections.map((group) => (
                <Link key={group.title} href={`#${toSketchAnchor(group.title)}`} className={styles.sectionPill}>
                  <span>{group.title}</span>
                  <strong>{group.items.length}</strong>
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/retroville" className={styles.footerCta}>
                Volver al home <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/retroville/personajes" className={styles.footerCta}>
                Ver reparto <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className={styles.heroMosaic}>
            {featuredSketches.map((item, index) => (
              <article
                key={item.title}
                className={`${styles.heroMosaicCard} ${index === 0 ? styles.heroMosaicMain : ''}`}
              >
                <Image
                  src={item.image}
                  alt={`Sketch de proceso de ${item.title} en Retroville`}
                  fill
                  sizes={index === 0 ? '(max-width: 1500px) 100vw, 36vw' : '(max-width: 1500px) 100vw, 18vw'}
                  className={styles.heroMosaicImage}
                  priority={index === 0}
                />
                <div className={styles.heroMosaicMeta}>
                  <span>{item.tag}</span>
                  <strong>{item.title}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </header>

      {curatedSections.map((group) => (
        <section key={group.title} id={toSketchAnchor(group.title)} className={styles.groupSection}>
          <div className={styles.groupHeader}>
            <p className={styles.eyebrow}>Curated sketch selection</p>
            <h2 className={`${displayFont.className} ${styles.groupTitle}`}>{group.title}</h2>
            <div className="mt-4 inline-flex items-center rounded-full border border-[#ffbf52]/20 bg-[#ffbf52]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#ffbf52]">
              {group.phase}
            </div>
            <p>{group.intro}</p>
          </div>

          <div className={styles.grid}>
            {group.items.map((item) => (
              <article key={item.title} id={toSketchAnchor(item.title)} className={styles.card}>
                <div className={styles.imageWrap}>
                  <Image
                    src={item.image}
                    alt={`Sketch del proceso de diseño de ${item.title} en Retroville`}
                    fill
                    sizes="(max-width: 900px) 100vw, 33vw"
                    className={styles.cardImage}
                  loading="lazy"
                />
              </div>
              <div className={styles.cardCopy}>
                <span className={styles.cardTag}>{item.tag}</span>
                <h3 className={`${displayFont.className} ${styles.cardTitle}`}>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>
      ))}

      <footer className={styles.footer}>
        <p>El archivo seguirá creciendo con más sketches, mapas y tableros de traducción del universo Retroville.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/retroville/personajes" className={styles.footerCta}>
            Ver personajes <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/retroville/press" className={styles.footerCta}>
            Descargar press kit <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/retroville/faq" className={styles.footerCta}>
            Ver FAQ <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </footer>
      </main>
    </>
  );
}
