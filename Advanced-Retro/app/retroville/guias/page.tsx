import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import { retrovilleGuideSlides } from '@/app/retroville/content';
import { buildRetrovilleSeriesJsonLd } from '@/app/retroville/shared';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './guias.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: 'Guias visuales de Retroville | Cast sheets, turnarounds y desarrollo',
  description:
    'Archivo separado de guias visuales de Retroville con turnarounds, dev sheets, anatomy boards y material tecnico del reparto.',
  path: '/retroville/guias',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'guias visuales retroville',
    'retroville styleguide',
    'retroville character sheets',
    'retroville turnaround',
    'retroville dev sheets',
    'retroville visual development',
  ],
  image: '/images/retroville/nox-styleguide.png',
});

function toGuideAnchor(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const orderedGroups = [
  'Core cast',
  'Vecindario',
  'Servicios y ciudad',
  'Escena competitiva',
  'Infancia y nueva generacion',
  'Incoming y expansión',
] as const;

type GuideSlide = (typeof retrovilleGuideSlides)[number];

const groupedSlides = retrovilleGuideSlides.reduce<Record<string, GuideSlide[]>>((acc, slide) => {
  const current = acc[slide.group] || [];
  acc[slide.group] = [...current, slide];
  return acc;
}, {});

export default function RetrovilleGuidesPage() {
  const pageSchema = buildCollectionPageJsonLd({
    name: 'Guias visuales de Retroville',
    path: '/retroville/guias',
    description:
      'Archivo visual separado del cast de Retroville con styleguides, anatomy boards, dev sheets y turnarounds del universo.',
    image: '/images/retroville/nox-styleguide.png',
    about: ['Retroville', 'Guias visuales', 'Character development', 'Turnarounds'],
  });

  const guideSchema = buildItemListJsonLd(
    retrovilleGuideSlides.map((slide) => ({
      name: `${slide.group}: ${slide.title}`,
      path: `/retroville/guias#${toGuideAnchor(slide.title)}`,
      image: slide.image,
      description: `${slide.meta} dentro del archivo visual de Retroville.`,
    })),
    'Guias visuales de Retroville'
  );

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Guias visuales', path: '/retroville/guias' },
  ]);

  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/guias',
    description:
      'Archivo oficial de guias visuales de Retroville con development sheets, styleguides y turnarounds del reparto.',
    image: '/images/retroville/nox-styleguide.png',
    name: 'Guias visuales de Retroville',
  });

  return (
    <>
      <StructuredData id="retroville-guides-schema" data={[pageSchema, retrovilleSeriesSchema, guideSchema, breadcrumbs]} />
      <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <nav className={styles.nav} aria-label="Navegación guias visuales Retroville">
              <Link href="/retroville" className={styles.backLink}>
                <ArrowLeft className="h-4 w-4" />
                Volver a Retroville
              </Link>
              <div className={styles.navLinks}>
                <Link href="/retroville/personajes">Personajes</Link>
                <Link href="/retroville/sketches">Sketchbook</Link>
                <Link href="/retroville/press">Press</Link>
              </div>
            </nav>

            <section className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Archivo visual separado</p>
                <h1 className={`${displayFont.className} ${styles.heroTitle}`}>
                  GUIAS DEL CAST
                  <br />
                  SIN MEZCLAS
                </h1>
                <p className={styles.heroText}>
                  Este apartado deja juntas las hojas tecnicas del universo: turnarounds, anatomy boards, dev sheets y
                  revisiones de personajes. Asi el cast se vende mejor como serie y las guias viven donde toca.
                </p>
                <p className={styles.heroText}>
                  Aqui ya no entra la biblia privada ni el PDF maestro. Solo material visual del reparto y de los
                  equipos que ayudan a leer como se ha construido Retroville por dentro.
                </p>
                <div className={styles.groupPills}>
                  {orderedGroups
                    .filter((group) => groupedSlides[group]?.length)
                    .map((group) => (
                      <a key={group} href={`#${toGuideAnchor(group)}`} className={styles.groupPill}>
                        <span>{group}</span>
                        <strong>{groupedSlides[group].length}</strong>
                      </a>
                    ))}
                </div>
              </div>

              <div className={styles.heroPreview}>
                {retrovilleGuideSlides.slice(0, 3).map((slide, index) => (
                  <article
                    key={slide.title}
                    className={`${styles.previewCard} ${index === 0 ? styles.previewCardMain : ''}`}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      priority={index === 0}
                      sizes={index === 0 ? '(max-width: 1180px) 100vw, 40vw' : '(max-width: 1180px) 50vw, 20vw'}
                      className={styles.previewImage}
                    />
                    <div className={styles.previewMeta}>
                      <span>{slide.meta}</span>
                      <strong>{slide.title}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </header>

          {orderedGroups
            .filter((group) => groupedSlides[group]?.length)
            .map((group) => (
              <section key={group} id={toGuideAnchor(group)} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionEyebrow}>Visual development</p>
                  <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>{group}</h2>
                  <p className={styles.sectionLead}>
                    {group === 'Core cast'
                      ? 'Las hojas base que fijan la lectura del universo: protagonistas, anatomía y lenguaje principal.'
                      : group === 'Vecindario'
                        ? 'Personajes que sostienen memoria de barrio, costumbre social y lectura cotidiana de la ciudad.'
                        : group === 'Servicios y ciudad'
                          ? 'Equipos e instituciones que dan vida a transporte, ayuntamiento, emergencias y orden público.'
                          : group === 'Escena competitiva'
                            ? 'Figuras con energía de ego, tensión escénica y conflicto performativo dentro del reparto.'
                            : group === 'Infancia y nueva generacion'
                              ? 'La capa más joven del universo, útil para ampliar emoción, caos y relevo de tono.'
                              : 'Material en desarrollo que ya tiene presencia visual aunque todavía siga creciendo.'}
                  </p>
                </div>

                <div className={styles.grid}>
                  {groupedSlides[group].map((slide) => (
                    <article key={slide.title} id={toGuideAnchor(slide.title)} className={styles.card}>
                      <div className={styles.cardImageWrap}>
                        <Image
                          src={slide.image}
                          alt={slide.alt}
                          fill
                          loading="lazy"
                          sizes="(max-width: 900px) 100vw, 32vw"
                          className={styles.cardImage}
                        />
                      </div>
                      <div className={styles.cardCopy}>
                        <span className={styles.cardMeta}>{slide.meta}</span>
                        <h3 className={`${displayFont.className} ${styles.cardTitle}`}>{slide.title}</h3>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

          <footer className={styles.footer}>
            <p>Las guias visuales ya viven separadas del cast y del archivo de sketches para que la lectura del proyecto sea mucho más limpia.</p>
            <div className={styles.footerActions}>
              <Link href="/retroville/personajes" className={styles.footerCta}>
                Ver personajes <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/retroville/sketches" className={styles.footerCta}>
                Ver sketchbook <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
