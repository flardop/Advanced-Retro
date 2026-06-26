import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import {
  retrovilleGuideSlides,
  retrovilleIncomingCharacters,
  retrovilleMainCharacters,
  retrovilleSecondaryCharacters,
  toRetrovilleAnchor,
} from '@/app/retroville/content';
import { buildRetrovilleSeriesJsonLd } from '@/app/retroville/shared';
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
  buildPageMetadata,
} from '@/lib/seo';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './personajes.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: 'Personajes de Retroville | Reparto principal, secundarios e incoming',
  description:
    'Reparto oficial de Retroville con protagonistas, secundarios y personajes incoming, cada uno con rol, base de inspiración y gancho narrativo.',
  path: '/retroville/personajes',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'personajes de retroville',
    'reparto retroville',
    'nox retroville',
    'luna retroville',
    'button crew',
    'la mafia retroville',
    'jow andrew retroville',
    'nona retroville',
  ],
  image: '/images/retroville/retroville-cast-presentation.png',
});

function CharacterVisual({
  name,
  image,
  priority = false,
}: {
  name: string;
  image?: string;
  priority?: boolean;
}) {
  if (!image) {
    return (
      <div className={styles.placeholderVisual} aria-hidden="true">
        <span>{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <Image
      src={image}
      alt={`Render o referencia visual de ${name} en Retroville`}
      fill
      sizes="(max-width: 900px) 100vw, 36vw"
      className={styles.characterImage}
      priority={priority}
    />
  );
}

const supportingSheets = [
  {
    title: 'Patrol Chief v2',
    meta: 'Orden público',
    image: '/images/retroville/dev-characters/patrol-chief-v2-sheet.png',
    alt: 'Hoja de desarrollo de Patrol Chief en Retroville',
    body: 'Una figura de autoridad pensada para sostener la parte más vigilada y tensa de la ciudad sin romper el tono caricaturesco.',
  },
  {
    title: 'Public Crew v2',
    meta: 'Ruido civil',
    image: '/images/retroville/dev-characters/public-crew-v2-sheet.png',
    alt: 'Hoja de desarrollo del Public Crew en Retroville',
    body: 'Ciudadanos, extras y energía social para que las calles tengan conversación, masa y pequeños conflictos visibles.',
  },
  {
    title: 'City Hall worker',
    meta: 'Burocracia',
    image: '/images/retroville/dev-characters/city-hall-worker-sheet.png',
    alt: 'Hoja de desarrollo de un trabajador del ayuntamiento de Retroville',
    body: 'La capa administrativa también necesita cara propia: gestos, uniforme y actitud de sistema cansado.',
  },
  {
    title: 'Nona early sheet',
    meta: 'Colegio',
    image: '/images/retroville/dev-characters/nona-girl-sheet.png',
    alt: 'Hoja temprana de Nona para Retroville',
    body: 'Material de desarrollo que deja ver la evolución previa de una de las figuras más inquietantes del colegio.',
  },
  {
    title: 'Tomo v2',
    meta: 'Kids',
    image: '/images/retroville/dev-characters/tomo-v2-sheet.png',
    alt: 'Hoja de desarrollo revisada de Tomo en Retroville',
    body: 'Una revisión que refuerza la lectura traviesa del personaje y su papel como motor de energía callejera.',
  },
  {
    title: 'Pipo v2',
    meta: 'Caos pequeño',
    image: '/images/retroville/dev-characters/pipo-v2-sheet.png',
    alt: 'Hoja de desarrollo revisada de Pipo en Retroville',
    body: 'Más precisión para ese perfil de mascota insoportable con ego sobredimensionado y presencia cómica inmediata.',
  },
] as const;

export default function RetrovilleCharactersPage() {
  const allCharacters = [
    ...retrovilleMainCharacters,
    ...retrovilleSecondaryCharacters,
    ...retrovilleIncomingCharacters,
  ];

  const pageSchema = buildCollectionPageJsonLd({
    name: 'Personajes de Retroville',
    path: '/retroville/personajes',
    description:
      'Página oficial del reparto de Retroville con protagonistas, secundarios e incoming organizados con más aire y jerarquía.',
    image: '/images/retroville/retroville-cast-presentation.png',
    about: ['NOX', 'Luna', 'Button Crew', 'Retroville', 'Serie original'],
  });

  const castSchema = buildItemListJsonLd(
    allCharacters.map((character) => ({
      name: character.name,
      path: `/retroville/personajes#${toRetrovilleAnchor(character.name)}`,
      image: character.image || '/images/retroville/retroville-cast-presentation.png',
      description: character.description,
    })),
    'Reparto de Retroville'
  );

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Personajes', path: '/retroville/personajes' },
  ]);

  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/personajes',
    description:
      'Página oficial del reparto de Retroville con protagonistas, secundarios e incoming, usando material ya desarrollado del universo.',
    image: '/images/retroville/retroville-cast-presentation.png',
    name: 'Personajes de Retroville',
  });

  return (
    <>
      <StructuredData
        id="retroville-characters-schema"
        data={[pageSchema, retrovilleSeriesSchema, castSchema, breadcrumbs]}
      />

      <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <nav className={styles.nav} aria-label="Navegación personajes Retroville">
              <Link href="/retroville" className={styles.backLink}>
                <ArrowLeft className="h-4 w-4" />
                Volver a Retroville
              </Link>
              <div className={styles.heroLinks}>
                <Link href="/retroville/episodios">Episodios</Link>
                <Link href="/retroville/sketches">Sketchbook</Link>
                <Link href="/retroville/press">Press</Link>
              </div>
            </nav>

            <div className={styles.heroGrid}>
              <div>
                <p className={styles.eyebrow}>Cast structure</p>
                <h1 className={`${displayFont.className} ${styles.title}`}>
                  PERSONAJES CON
                  <br />
                  SU PROPIO AIRE
                </h1>
              </div>

              <div className={styles.heroPanel}>
                <p className={styles.heroLead}>
                  El núcleo, los secundarios y lo incoming ya no compiten en la misma fila. Cada personaje tiene nombre,
                  rol, base de inspiración y un gancho corto que deja claro por qué existe en la serie.
                </p>
                <div className={styles.heroActions}>
                  <Link href="/retroville/episodios" className={styles.inlineLink}>
                    Ver temporada 1
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Principales</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                  NOX, LUNA Y
                  <br />
                  BUTTON CREW
                </h2>
              </div>
            </div>

            <div className={styles.mainStack}>
              {retrovilleMainCharacters.map((character, index) => (
                <article
                  key={character.name}
                  id={toRetrovilleAnchor(character.name)}
                  className={`${styles.mainCard} ${index % 2 === 1 ? styles.mainCardReverse : ''}`}
                >
                  <div className={styles.mainVisual}>
                    <CharacterVisual name={character.name} image={character.image} priority={index === 0} />
                  </div>
                  <div className={styles.mainCopy}>
                    <p className={styles.characterMeta}>Base · {character.inspiration}</p>
                    <h3 className={`${displayFont.className} ${styles.characterName}`}>{character.name}</h3>
                    <p className={styles.characterRole}>{character.role}</p>
                    <p className={styles.characterDistrict}>Distrito · {character.district}</p>
                    <p className={styles.characterBody}>{character.description}</p>
                    <div className={styles.chipRow}>
                      {character.chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Secundarios</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                  LA CIUDAD YA
                  <br />
                  TIENE SOCIEDAD
                </h2>
              </div>
              <p className={styles.sectionLead}>
                Vecinos, funcionarios, kids y ruido social. Aquí es donde Retroville deja de ser solo concepto y empieza
                a parecer un reparto de serie.
              </p>
            </div>

            <div className={styles.secondaryGrid}>
              {retrovilleSecondaryCharacters.map((character) => (
                <article
                  key={character.name}
                  id={toRetrovilleAnchor(character.name)}
                  className={styles.secondaryCard}
                >
                  <div className={styles.secondaryVisual}>
                    <CharacterVisual name={character.name} image={character.image} />
                  </div>
                  <div className={styles.secondaryCopy}>
                    <p className={styles.characterMeta}>Base · {character.inspiration}</p>
                    <h3 className={`${displayFont.className} ${styles.secondaryName}`}>{character.name}</h3>
                    <p className={styles.characterRole}>{character.role}</p>
                    <p className={styles.characterDistrict}>Distrito · {character.district}</p>
                    <p className={styles.characterBody}>{character.description}</p>
                    <div className={styles.chipRow}>
                      {character.chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Incoming</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                  DESARROLLO ACTIVO,
                  <br />
                  NO HUECO VACÍO
                </h2>
              </div>
              <p className={styles.sectionLead}>
                Estos nombres entran marcados como incoming para que se vean como promesa real y no como ausencia. En el
                caso de La Profesora, el render fiable todavía no está listo y por eso aparece sin imagen definitiva.
              </p>
            </div>

            <div className={styles.incomingGrid}>
              {retrovilleIncomingCharacters.map((character) => (
                <article
                  key={character.name}
                  id={toRetrovilleAnchor(character.name)}
                  className={styles.incomingCard}
                >
                  <div className={styles.incomingVisual}>
                    <CharacterVisual name={character.name} image={character.image} />
                  </div>
                  <div className={styles.incomingCopy}>
                    <p className={styles.incomingMeta}>Incoming · {character.inspiration}</p>
                    <h3 className={`${displayFont.className} ${styles.secondaryName}`}>{character.name}</h3>
                    <p className={styles.characterRole}>{character.role}</p>
                    <p className={styles.characterDistrict}>Zona · {character.district}</p>
                    <p className={styles.characterBody}>{character.description}</p>
                    <div className={styles.chipRow}>
                      {character.chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Guías visuales</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                  MURO CURADO DE
                  <br />
                  STYLEGUIDES Y SHEETS
                </h2>
              </div>
              <p className={styles.sectionLead}>
                Aquí quedan visibles las guías finales y las hojas de desarrollo que ya existen, sin carruseles vacíos ni
                huecos raros. Todo el material entra limpio y con mejor lectura.
              </p>
            </div>

            <div className={styles.guideRail}>
              {retrovilleGuideSlides.map((slide) => (
                <article key={slide.title} className={styles.guideCard}>
                  <div className={styles.guideVisual}>
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      sizes="(max-width: 720px) 70vw, 24rem"
                      className={styles.guideImage}
                    />
                  </div>
                  <div className={styles.guideCopy}>
                    <p className={styles.characterMeta}>{slide.meta}</p>
                    <h3 className={styles.guideTitle}>{slide.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Apoyo visual</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                  MÁS ROSTROS,
                  <br />
                  MÁS CIUDAD
                </h2>
              </div>
              <p className={styles.sectionLead}>
                Además del cast principal, ya hay material suficiente para enseñar cómo se construye la población, la
                autoridad y la vida civil que hacen que Retroville respire como serie.
              </p>
            </div>

            <div className={styles.supportGrid}>
              {supportingSheets.map((sheet) => (
                <article key={sheet.title} className={styles.supportCard}>
                  <div className={styles.supportVisual}>
                    <Image
                      src={sheet.image}
                      alt={sheet.alt}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      className={styles.guideImage}
                    />
                  </div>
                  <div className={styles.supportCopy}>
                    <p className={styles.characterMeta}>{sheet.meta}</p>
                    <h3 className={styles.supportTitle}>{sheet.title}</h3>
                    <p className={styles.characterBody}>{sheet.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
