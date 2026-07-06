import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import {
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
  title: 'Personajes de Retroville | Reparto completo del universo',
  description:
    'Reparto oficial de Retroville presentado con el mismo peso visual para todo el cast: rol, base de inspiración y gancho narrativo de cada personaje.',
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
      'Página oficial del reparto de Retroville con todo el cast presentado como universo principal y con la misma jerarquía visual.',
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
      'Página oficial del reparto de Retroville con todo el cast presentado con tratamiento principal, usando material ya desarrollado del universo.',
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
                  PESO PRINCIPAL
                </h1>
              </div>

              <div className={styles.heroPanel}>
                <p className={styles.heroLead}>
                  En esta vista todo el reparto entra con jerarquía de presentación principal. Cada personaje tiene
                  nombre, rol, base de inspiración y un gancho corto que deja claro por qué existe dentro de la serie.
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
                <p className={styles.sectionEyebrow}>Reparto completo</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                  TODA LA CIUDAD
                  <br />
                  EN PRIMERA FILA
                </h2>
              </div>
              <p className={styles.sectionLead}>
                Aquí ya no hay personajes empequeñecidos por categoría. Todos se enseñan como piezas importantes del
                universo; si alguno sigue en desarrollo, se marca como incoming sin perder presencia.
              </p>
            </div>

            <div className={styles.mainStack}>
              {allCharacters.map((character, index) => (
                <article
                  key={character.name}
                  id={toRetrovilleAnchor(character.name)}
                  className={`${styles.mainCard} ${index % 2 === 1 ? styles.mainCardReverse : ''}`}
                >
                  <div className={styles.mainVisual}>
                    <CharacterVisual name={character.name} image={character.image} priority={index < 2} />
                  </div>
                  <div className={styles.mainCopy}>
                    <div className={styles.characterMetaRow}>
                      <p className={styles.characterMeta}>Base · {character.inspiration}</p>
                      <span
                        className={`${styles.characterStatusBadge} ${
                          character.status === 'incoming' ? styles.characterStatusIncoming : styles.characterStatusFinal
                        }`}
                      >
                        {character.status === 'incoming' ? 'Incoming' : 'Render final'}
                      </span>
                    </div>
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
                <p className={styles.sectionEyebrow}>Archivo separado</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                  EL MATERIAL DE PROCESO
                  <br />
                  VIVE EN SKETCHES
                </h2>
              </div>
              <p className={styles.sectionLead}>
                Las guías visuales, anatomy sheets y hojas de desarrollo ya no compiten dentro del cast. Se han movido al
                sketchbook para separar mejor venta del universo y archivo de proceso.
              </p>
            </div>

            <div className={styles.heroLinks}>
              <Link href="/retroville/sketches" className={styles.inlineLink}>
                Ver sketchbook completo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/retroville/press" className={styles.inlineLink}>
                Abrir press kit <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
