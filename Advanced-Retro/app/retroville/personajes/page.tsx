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
import styles from './personajes.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: 'Personajes de Retroville | Reparto completo y distritos de la serie',
  description:
    'Descubre el reparto completo de Retroville: NOX, Luna, Button Crew y mas personajes con renders, tono de serie y el distrito exacto que ocupan dentro de la ciudad.',
  path: '/retroville/personajes',
  category: 'entertainment',
  inheritBaseKeywords: false,
  keywords: [
    'personajes de retroville',
    'nox retroville',
    'luna retroville',
    'button crew',
    'distritos de retroville',
    'reparto retroville',
    'serie animada retroville',
    'advancedretro personajes',
  ],
  image: '/images/retroville/retroville-cast-presentation.png',
});

function toCharacterAnchor(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const renderedCharacters = [
  {
    name: 'NOX',
    role: 'Protagonista principal',
    district: 'Console Core',
    image: '/images/retroville/nox-character-large.webp',
    accent: '#67b8ff',
    status: 'Render final disponible',
    description:
      'NOX es el centro emocional de Retroville: cansado, sarcástico y más sensible de lo que quiere admitir. No es un héroe limpio; es el tipo de personaje que sobrevive porque no le queda otra.',
    facts: ['Batería baja', 'Humor seco', 'Lealtad escondida'],
  },
  {
    name: 'BUTTON CREW',
    role: 'Caos social permanente',
    district: 'Power Plaza',
    image: '/images/retroville/button-crew-character-large.webp',
    accent: '#ffc940',
    status: 'Render final disponible',
    description:
      'A, B, Y y X funcionan como una pequeña pandilla de impulsos: discuten, empujan la escena y convierten cualquier situación sencilla en un problema comunitario.',
    facts: ['A / B / Y / X', 'Ruido de grupo', 'Energía callejera'],
  },
  {
    name: 'LUNA',
    role: 'Controladora magnética',
    district: 'Top Slot',
    image: '/images/retroville/luna-character-large.webp',
    accent: '#ff78b7',
    status: 'Render final disponible',
    description:
      'Luna entra con glamour, manipulación y una sonrisa que nunca sabes si ayuda o complica. No busca amor: busca atención, control y quizá algo que ni ella entiende.',
    facts: ['Glamour tóxico', 'Control', 'Caos elegante'],
  },
  {
    name: 'NORA',
    role: 'Vecina del Riverside District',
    district: 'Riverside District',
    image: '/images/retroville/characters/nora.webp',
    accent: '#b99bd3',
    status: 'Render final disponible',
    description:
      'Nora lleva más tiempo en Retroville que casi cualquiera. Observa, juzga y sabe demasiado sobre todos. No crea caos: lo archiva mentalmente.',
    facts: ['Observadora', 'Tradicional', 'Secretos del barrio'],
  },
  {
    name: 'JOY & GRUMP',
    role: 'Vecinos controladores',
    district: 'Memory Leak Lane',
    image: '/images/retroville/characters/joy-grump.webp',
    accent: '#d4474b',
    status: 'Render final disponible',
    description:
      'Dos joy-cons retirados que viven puerta con puerta y no soportan absolutamente nada. Quejas, rutina y cero paciencia como motor cómico.',
    facts: ['0% paciencia', 'Quejas vecinales', 'Sitcom amarga'],
  },
  {
    name: 'TRIMP',
    role: 'Motion controller competitivo',
    district: 'Playfield Complex',
    image: '/images/retroville/characters/trimp.webp',
    accent: '#d46cff',
    status: 'Render final disponible',
    description:
      'TRIMP no sigue el juego: intenta poner las reglas. Competitivo, dominante y demasiado convencido de que la cámara siempre le pertenece.',
    facts: ['Ego alto', 'Competitivo', 'Showman'],
  },
  {
    name: 'PATROL CHIEF',
    role: 'Jefe de policía',
    district: 'Reset Avenue Precinct',
    image: '/images/retroville/characters/patrol-chief.webp',
    accent: '#4f85c7',
    status: 'Render final disponible',
    description:
      'El orden nocturno de Retroville con cara de haber visto demasiados turnos seguidos. Serio, cansado y con más café que esperanza.',
    facts: ['Turno eterno', 'Orden público', 'Café caliente'],
  },
  {
    name: 'PUBLIC CREW',
    role: 'Transporte público',
    district: 'Transit Loop',
    image: '/images/retroville/characters/public-crew.webp',
    accent: '#d75f5f',
    status: 'Render final disponible',
    description:
      'Mantiene la ciudad en movimiento con cambio exacto, rutas raras y una paciencia que se terminó hace años.',
    facts: ['Ruta fija', 'Cambio exacto', 'Última parada'],
  },
  {
    name: 'SHIFT STICK',
    role: 'Operador de tránsito',
    district: 'Central Station',
    image: '/images/retroville/characters/crux.webp',
    accent: '#d6c0a2',
    status: 'Render final disponible',
    description:
      'Funcionario veterano del sistema urbano. Todo pasa por formularios, llaves y una mirada que ya no espera nada de nadie.',
    facts: ['Administración', 'Llaves', 'Orden viejo'],
  },
  {
    name: 'MAYOR TUBE',
    role: 'Alcalde de Retroville',
    district: 'City Hall / Power Plaza',
    image: '/images/retroville/characters/mayor-tube.webp',
    accent: '#d6a85a',
    status: 'Render final disponible',
    description:
      'El poder con sonrisa de pantalla. Mayor Tube promete control, progreso y una ciudad perfectamente encendida aunque nadie haya preguntado.',
    facts: ['Diplomático', 'Smug', 'Bajo control'],
  },
  {
    name: 'TOMO',
    role: 'Kid de Retroville',
    district: 'Pixel Park',
    image: '/images/retroville/characters/tomo.webp',
    accent: '#d77870',
    status: 'Render final disponible',
    description:
      'Niño de barrio, chupa-chups, gorra ladeada y energía de travesura. Sabe demasiados atajos y cree que todo le queda bien.',
    facts: ['Travieso', 'Playground district', 'Main character energy'],
  },
  {
    name: 'PIPO',
    role: 'Kid de Retroville',
    district: 'Glitch Market',
    image: '/images/retroville/characters/pipo.webp',
    accent: '#db5b6e',
    status: 'Render final disponible',
    description:
      'Pipo es pequeño, molesto y convencido de que nada es culpa suya. Virtual pet con ego desproporcionado y sonrisa de problema.',
    facts: ['No es su culpa', 'Lollipop', 'Ego level 100'],
  },
  {
    name: 'NANO',
    role: 'Pocket MP3 kid',
    district: 'Sound Alley',
    image: '/images/retroville/characters/nano.webp',
    accent: '#8d78ff',
    status: 'Render final disponible',
    description:
      'Nano vive dentro de su playlist. Más callado, más sensible y más perdido en música que el resto de la ciudad.',
    facts: ['Música', 'Daydreaming', 'Batería baja'],
  },
  {
    name: 'MIA',
    role: 'Influencer de Retroville',
    district: 'Broadcast Row',
    image: '/images/retroville/characters/influencer.webp',
    accent: '#ff7fbf',
    status: 'Render final disponible',
    description:
      'Brillo, filtros, cámara frontal y una habilidad natural para convertir cualquier crisis en contenido. En Retroville, la atención también es moneda.',
    facts: ['Selfie mode', 'Glamour', 'Atención'],
  },
] as const;

const ensembleCharacters = [
  {
    name: 'REPARTO DE CALLE',
    role: 'Figurantes, currantes y ciudadanos',
    district: '8-Bit Boulevard',
    image: '/images/retroville/characters/ensemble-citizens.webp',
    accent: '#6fd2ff',
    description:
      'Grupo de apoyo para poblar estaciones, barrios, oficinas y rincones de paso. Aquí es donde Retroville empieza a sentirse como ciudad habitada y no solo como concepto bonito.',
    facts: ['Vida cotidiana', 'Background cast', 'Ciudad en marcha'],
  },
  {
    name: 'JOW & ANDREW',
    role: 'Duo emocional / escena íntima',
    district: 'Riverside District',
    image: '/images/retroville/characters/jow-andrew.webp',
    accent: '#f2a8c9',
    description:
      'Una pieza más cálida dentro del universo: nostalgia, afecto y diseño de personajes pensado para escenas que bajan el ruido y dejan espacio a vínculo real.',
    facts: ['Pareja', 'Cinta + música', 'Tono humano'],
  },
  {
    name: 'MAFIA DE RETROVILLE',
    role: 'Facción social de presión',
    district: 'Cartridge Quarter',
    image: '/images/retroville/characters/retroville-mafia.webp',
    accent: '#c98b34',
    description:
      'No todo el caos de la ciudad es espontáneo. Esta facción empuja jerarquías, barrio, amenaza y presencia visual más dura para equilibrar el tono cómico con tensión.',
    facts: ['Poder local', 'Presión grupal', 'Barrio caliente'],
  },
] as const;

const colorGuideSlides = [
  {
    title: 'NOX style guide',
    image: '/images/retroville/nox-styleguide.png',
    alt: 'Guía visual a color de NOX con actitud, silueta y acabado final para Retroville',
  },
  {
    title: 'Button Crew style guide',
    image: '/images/retroville/button-crew-styleguide.webp',
    alt: 'Guía visual a color del Button Crew con personalidad y acabado final del grupo en Retroville',
  },
  {
    title: 'Luna style guide',
    image: '/images/retroville/luna-styleguide.png',
    alt: 'Guía visual a color de Luna con pose, textura y acabado final del personaje en Retroville',
  },
] as const;

export default function RetrovilleCharactersPage() {
  const pageSchema = buildCollectionPageJsonLd({
    name: 'Personajes de Retroville',
    path: '/retroville/personajes',
    description:
      'Página de reparto de Retroville con personajes principales, elenco secundario y material visual del universo original de AdvancedRetro.',
    image: '/images/retroville/retroville-cast-presentation.png',
    about: ['NOX', 'Luna', 'Button Crew', 'Serie original Retroville', 'Animacion retro'],
  });
  const castSchema = buildItemListJsonLd(
    renderedCharacters.map((character) => ({
      name: character.name,
      path: `/retroville/personajes#${toCharacterAnchor(character.name)}`,
      image: character.image,
      description: character.description,
    })),
    'Reparto principal de Retroville'
  );
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Personajes', path: '/retroville/personajes' },
  ]);
  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/personajes',
    description:
      'Página oficial del reparto de Retroville con personajes, distritos, renders finales y material de desarrollo de la serie original.',
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
      <header className={styles.hero}>
        <nav className={styles.nav} aria-label="Navegación personajes Retroville">
          <Link href="/retroville" className={styles.backLink}>
            <ArrowLeft className="h-4 w-4" /> Volver a Retroville
          </Link>
          <Image src="/images/retroville/retroville-logo.webp" alt="Logo de Retroville" width={260} height={173} className={styles.logo} priority />
        </nav>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Cast development</p>
          <h1 className={`${displayFont.className} ${styles.heroTitle}`}>PERSONAJES DE RETROVILLE</h1>
          <div className="mt-4 inline-flex items-center rounded-full border border-[#8ad7ff]/20 bg-[#8ad7ff]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#8ad7ff]">
            14 personajes · 3 en desarrollo
          </div>
          <p>
            Página de reparto con renders transparentes listos para enseñar en formato más limpio. Las fichas largas y
            guías de estilo quedan para el entorno dev; aquí priorizamos presencia, tono y lectura rápida.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/retroville/sketches" className={styles.footerCta}>
              Ver sketchbook <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/retroville/presentaciones" className={styles.footerCta}>
              Ver presentación <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/retroville/press" className={styles.footerCta}>
              Press kit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.renderedSection} aria-label="Personajes con render final">
        {renderedCharacters.map((character, index) => (
          <article
            key={character.name}
            id={toCharacterAnchor(character.name)}
            className={`${styles.characterPanel} ${index % 2 === 1 ? styles.characterPanelReverse : ''}`}
          >
            <div className={styles.characterImageStage} style={{ ['--accent' as string]: character.accent }}>
              <div className={styles.characterAura} />
              <Image
                src={character.image}
                alt={`Render de ${character.name}, personaje de Retroville del distrito ${character.district}`}
                width={1100}
                height={1500}
                className={styles.characterImage}
                priority={index === 0}
                loading={index === 0 ? undefined : 'lazy'}
              />
            </div>
            <div className={styles.characterCopy}>
              <p className={styles.eyebrow}>{character.status}</p>
              <h2 className={`${displayFont.className} ${styles.characterName}`}>{character.name}</h2>
              <p className={styles.role}>{character.role}</p>
              <p className="mb-6 mt-[-12px] text-sm uppercase tracking-[0.18em] text-[rgba(138,215,255,0.84)] [font-family:var(--font-mono)]">
                Distrito · {character.district}
              </p>
              <p className={styles.description}>{character.description}</p>
              <div className={styles.factRow}>
                {character.facts.map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.secondarySection} aria-label="Nuevos grupos y facciones">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Nuevo reparto</p>
          <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>MAS PERSONAJES PARA POBLAR RETROVILLE</h2>
          <p>
            Aquí van los grupos y dúos que completan la ciudad: más calle, más escenas posibles y más variedad visual
            para que el mundo no dependa solo del reparto principal.
          </p>
        </div>

        <div className={styles.ensembleGrid}>
          {ensembleCharacters.map((character) => (
            <article key={character.name} className={styles.ensembleCard} style={{ ['--accent' as string]: character.accent }}>
              <div className={styles.ensembleImageWrap}>
                <div className={styles.ensembleGlow} />
                <Image
                  src={character.image}
                  alt={`Render del grupo ${character.name} en Retroville, vinculado al distrito ${character.district}`}
                  fill
                  sizes="(max-width: 980px) 100vw, 33vw"
                  className={styles.ensembleImage}
                  loading="lazy"
                />
              </div>
              <div className={styles.ensembleCopy}>
                <p className={styles.eyebrow}>{character.role}</p>
                <h3 className={`${displayFont.className} ${styles.placeholderName}`}>{character.name}</h3>
                <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[rgba(138,215,255,0.84)] [font-family:var(--font-mono)]">
                  Distrito · {character.district}
                </p>
                <p>{character.description}</p>
                <div className={styles.factRow}>
                  {character.facts.map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.visualGuidesSection} aria-label="Guías visuales a color de Retroville">
        <h2 className={styles.srOnly}>Guías visuales a color</h2>
        <div className={styles.visualGuidesRail}>
          {colorGuideSlides.map((guide) => (
            <article key={guide.title} className={styles.visualGuideCard} aria-label={guide.title}>
              <div className={styles.visualGuideImageWrap}>
                <Image
                  src={guide.image}
                  alt={guide.alt}
                  fill
                  sizes="(max-width: 640px) 72vw, (max-width: 980px) 42vw, 28vw"
                  className={styles.visualGuideImage}
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/retroville/presentaciones" className={styles.footerCta}>
            Ver presentación oficial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/retroville/sketches" className={styles.footerCta}>
            Ver sketches del mundo <ArrowRight className="h-4 w-4" />
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
