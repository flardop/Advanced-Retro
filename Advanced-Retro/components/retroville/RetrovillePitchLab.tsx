import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clapperboard, Layers3, Map, Sparkles } from 'lucide-react';
import {
  Anton,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  DM_Sans,
  IBM_Plex_Mono,
  Space_Grotesk,
} from 'next/font/google';
import styles from './retroville-pitch-lab.module.css';

const neonFont = Anton({ subsets: ['latin'], weight: '400', variable: '--pitch-font-neon' });
const bibleFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--pitch-font-bible',
});
const gridFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--pitch-font-grid',
});
const riotFont = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--pitch-font-riot',
});
const bodyFont = DM_Sans({ subsets: ['latin'], variable: '--pitch-font-body' });
const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--pitch-font-mono',
});

const pitchStats = [
  { label: 'Formato', value: 'Serie animada adulta · 8 x 22 min' },
  { label: 'Tono', value: 'Comedia negra, sci-fi y melodrama glitch' },
  { label: 'Gancho', value: 'Una ciudad construida con hardware olvidado' },
  { label: 'Escala', value: 'Serie, fandom, drops y universo expandible' },
] as const;

const characters = [
  {
    name: 'NOX',
    role: 'Guardián del núcleo',
    mood: 'Cansancio noble, control roto y humor seco.',
    image: '/images/retroville/nox-styleguide.png',
    accent: '#73d9ff',
  },
  {
    name: 'LUNA',
    role: 'Interferencia emocional',
    mood: 'Magnetismo tóxico, ruido social y glamour peligroso.',
    image: '/images/retroville/luna-styleguide.png',
    accent: '#ff8dc6',
  },
  {
    name: 'BUTTON CREW',
    role: 'Caos colectivo',
    mood: 'La energía social que impide que Retroville se apague.',
    image: '/images/retroville/button-crew-styleguide.png',
    accent: '#ffd166',
  },
] as const;

const districts = [
  {
    name: 'POWER PLAZA',
    summary: 'El corazón cívico: pantallas, cruces, anuncios y política pixelada.',
    image: '/images/retroville/retroville-central-plaza-concept.png',
  },
  {
    name: 'BIT GRAVE',
    summary: 'El cementerio emocional del universo. Todo lo que nadie terminó acaba aquí.',
    image: '/images/retroville/retroville-bit-grave-concept.png',
  },
  {
    name: 'TOP SLOT',
    summary: 'Noche, club, membresía y decisiones que nunca salen baratas.',
    image: '/images/retroville/retroville-club-concept.png',
  },
] as const;

const proofLinks = [
  {
    label: 'Reparto completo',
    description: 'Fichas, ensemble y personajes secundarios ya ordenados.',
    href: '/retroville/personajes',
  },
  {
    label: 'Archivo de sketches',
    description: 'Boards, traducciones visuales e inspiración de mundo.',
    href: '/retroville/sketches',
  },
  {
    label: 'Experiencia live',
    description: 'La versión principal de Retroville, intacta y tal como ya te gusta.',
    href: '/retroville',
  },
] as const;

const archiveTriptych = [
  {
    title: 'Mona NOX',
    image: '/images/retroville/retroville-mona.png',
    note: 'La ciudad ya tiene iconografía propia.',
  },
  {
    title: 'Creation of Input',
    image: '/images/retroville/retroville-creation.png',
    note: 'El universo soporta lecturas míticas y absurdas a la vez.',
  },
  {
    title: 'The Last Save',
    image: '/images/retroville/retroville-last-supper.png',
    note: 'Hay suficiente imaginario para vivir fuera del teaser base.',
  },
] as const;

const signalModules = [
  {
    code: '01',
    title: 'SERIE',
    body: 'Un concepto que se entiende como ficción serial, no como simple marca gráfica.',
  },
  {
    code: '02',
    title: 'MUNDO',
    body: 'Barrios, vehículos, criaturas, comercio y protocolos urbanos reconocibles.',
  },
  {
    code: '03',
    title: 'FANDOM',
    body: 'Personajes diseñados para conversación, clips, memes y fijación visual.',
  },
  {
    code: '04',
    title: 'EXPANSIÓN',
    body: 'Drops, Kickstarter, comunidad y piezas culturales capaces de escalar.',
  },
] as const;

const rolloutTimeline = [
  'Moodboard y primer mapa de ciudad',
  'Reveal del reparto principal',
  'Social snippets + piezas de mito visual',
  'Lanzamiento de teaser / waitlist / Kickstarter',
] as const;

const atlasBoards = [
  {
    label: 'MASTERPLAN',
    image: '/images/retroville/process/masterplan-overview-board.png',
  },
  {
    label: 'METRO POD',
    image: '/images/retroville/process/metro-pod-translation-board.png',
  },
  {
    label: 'HOTEL',
    image: '/images/retroville/process/hotel-translation-board.png',
  },
  {
    label: 'POLICE',
    image: '/images/retroville/process/police-translation-board.png',
  },
] as const;

const ecologyCards = [
  {
    title: 'CRIATURAS',
    image: '/images/retroville/retroville-creatures-concept.png',
    text: 'Fauna con identidad: la ciudad ya tiene biología, no solo atrezzo.',
  },
  {
    title: 'MOVILIDAD',
    image: '/images/retroville/retroville-vehicle-lineup-concept.png',
    text: 'Transporte, escala urbana y lectura de ecosistema funcional.',
  },
  {
    title: 'ARQUITECTURA VIVA',
    image: '/images/retroville/retroville-stacked-housing-concept.png',
    text: 'Vivienda, rutina y vida diaria fuera del conflicto principal.',
  },
] as const;

const treatmentDecks = [
  {
    id: 'neon-trailer',
    name: 'Neon Trailer',
    eyebrow: 'Tratamiento 01',
    teaser: 'Cinemático, oscuro y diseñado para vender escala visual en segundos.',
    summary:
      'Una presentación pensada como si fuera el gran reveal visual de una plataforma premium: póster, tono, reparto y tres escenas clave del universo.',
    accent: '#73d9ff',
    accentSoft: 'rgba(115, 217, 255, 0.18)',
    glow: 'rgba(115, 217, 255, 0.32)',
  },
  {
    id: 'bible-prestige',
    name: 'Bible Prestige',
    eyebrow: 'Tratamiento 02',
    teaser: 'Editorial, elegante y centrado en mitología, personajes y continuidad.',
    summary:
      'Una biblia de serie con aire de dossier de estudio: logline, tono, arcos emocionales, arte apócrifo y una lectura de mundo más literaria.',
    accent: '#8d6748',
    accentSoft: 'rgba(141, 103, 72, 0.16)',
    glow: 'rgba(218, 184, 148, 0.22)',
  },
  {
    id: 'signal-deck',
    name: 'Signal Deck',
    eyebrow: 'Tratamiento 03',
    teaser: 'Ordenado, técnico y orientado a convencer a desarrollo y partnerships.',
    summary:
      'Una lectura estratégica del proyecto: formato, pilares, rollout, expansión y materiales listos para series, comunidad y marca.',
    accent: '#b084ff',
    accentSoft: 'rgba(176, 132, 255, 0.18)',
    glow: 'rgba(176, 132, 255, 0.28)',
  },
  {
    id: 'cast-riot',
    name: 'Cast Riot',
    eyebrow: 'Tratamiento 04',
    teaser: 'Carisma, ruido social y energía de conversación cultural inmediata.',
    summary:
      'Una presentación centrada en que el reparto venda el proyecto: actitud, química, tono social y piezas con potencial de fandom.',
    accent: '#ff5d91',
    accentSoft: 'rgba(255, 93, 145, 0.18)',
    glow: 'rgba(255, 93, 145, 0.28)',
  },
  {
    id: 'city-atlas',
    name: 'City Atlas',
    eyebrow: 'Tratamiento 05',
    teaser: 'La ciudad como gran protagonista: barrios, sistemas, criaturas y proceso.',
    summary:
      'Una visión expansiva de Retroville como franquicia de worldbuilding: mapas, boards, movilidad, arquitectura y lógica de ecosistema.',
    accent: '#7ce38b',
    accentSoft: 'rgba(124, 227, 139, 0.16)',
    glow: 'rgba(124, 227, 139, 0.28)',
  },
] as const;

type Treatment = (typeof treatmentDecks)[number];

function PitchCard({
  character,
}: {
  character: (typeof characters)[number];
}) {
  return (
    <article className={styles.characterCard}>
      <div className={styles.characterImageWrap}>
        <Image
          src={character.image}
          alt={`${character.name} style guide`}
          fill
          sizes="(max-width: 900px) 100vw, 30vw"
          className={styles.characterImage}
        />
      </div>
      <div className={styles.characterMeta}>
        <p style={{ color: character.accent }}>{character.role}</p>
        <h3>{character.name}</h3>
        <span>{character.mood}</span>
      </div>
    </article>
  );
}

function WorldCard({
  district,
}: {
  district: (typeof districts)[number];
}) {
  return (
    <article className={styles.worldCard}>
      <div className={styles.worldImageWrap}>
        <Image
          src={district.image}
          alt={district.name}
          fill
          sizes="(max-width: 900px) 100vw, 33vw"
          className={styles.worldImage}
        />
      </div>
      <div className={styles.worldMeta}>
        <h3>{district.name}</h3>
        <p>{district.summary}</p>
      </div>
    </article>
  );
}

function ProofLinks() {
  return (
    <div className={styles.proofLinks}>
      {proofLinks.map((link) => (
        <Link key={link.href} href={link.href} className={styles.proofLink}>
          <strong>{link.label}</strong>
          <span>{link.description}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ))}
    </div>
  );
}

function renderNeonTrailer() {
  return (
    <div className={styles.variantStack}>
      <section className={styles.neonHero}>
        <div className={styles.neonCopy}>
          <p className={styles.variantEyebrow}>Pitch cinematográfico</p>
          <h2 className={styles.neonTitle}>Retroville como gran lanzamiento de serie original.</h2>
          <p className={styles.variantBody}>
            Este tratamiento vende impacto inmediato: un universo que ya se siente emitido, un reparto
            reconocible y una ciudad con suficiente personalidad como para sostener campaña, teaser y
            conversación cultural.
          </p>
          <div className={styles.statGrid}>
            {pitchStats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.neonPosterWall}>
          <article className={styles.posterMain}>
            <Image
              src="/images/retroville/retroville-cast-presentation.png"
              alt="Presentación principal del reparto de Retroville"
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
              className={styles.posterImage}
            />
          </article>
          <article className={styles.posterSide}>
            <Image
              src="/images/retroville/retroville-central-plaza-concept.png"
              alt="Concept art central de Retroville"
              fill
              sizes="(max-width: 900px) 100vw, 22vw"
              className={styles.posterImage}
            />
          </article>
          <article className={styles.posterSide}>
            <Image
              src="/images/retroville/retroville-nightclub-concept.png"
              alt="Nightlife de Retroville"
              fill
              sizes="(max-width: 900px) 100vw, 22vw"
              className={styles.posterImage}
            />
          </article>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.blockHeader}>
          <p>Reparto principal</p>
          <h3>Personajes listos para marketing, pitch y memoria visual.</h3>
        </div>
        <div className={styles.characterGrid}>
          {characters.map((character) => (
            <PitchCard key={character.name} character={character} />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.blockHeader}>
          <p>Escenas clave</p>
          <h3>Tres lugares bastan para demostrar que la ciudad ya respira.</h3>
        </div>
        <div className={styles.worldGrid}>
          {districts.map((district) => (
            <WorldCard key={district.name} district={district} />
          ))}
        </div>
      </section>

      <ProofLinks />
    </div>
  );
}

function renderBiblePrestige() {
  return (
    <div className={styles.variantStack}>
      <section className={styles.bibleHero}>
        <div className={styles.bibleIntro}>
          <p className={styles.variantEyebrow}>Serie bible</p>
          <h2 className={styles.bibleTitle}>Una ciudad que parece recordar todo lo que tú olvidaste jugar.</h2>
          <blockquote className={styles.bibleQuote}>
            “Retroville no es un lugar nostálgico. Es el sitio al que va a parar lo que sigue vivo después de
            haber sido abandonado.”
          </blockquote>
        </div>
        <div className={styles.bibleColumns}>
          <article className={styles.paperCard}>
            <span>Logline</span>
            <strong>
              En una metrópolis nacida de hardware desechado, NOX intenta mantener la ciudad estable mientras
              Luna y Button Crew convierten cada grieta emocional en una crisis pública.
            </strong>
          </article>
          <article className={styles.paperCard}>
            <span>Promesa</span>
            <strong>
              Comedia adulta con worldbuilding de culto, personajes memorables y un imaginario visual capaz de
              sostener episodios, merchandising y comunidad.
            </strong>
          </article>
        </div>
      </section>

      <section className={styles.bibleSpread}>
        <div className={styles.bibleSynopsis}>
          <p className={styles.variantEyebrow}>Personaje + tono</p>
          <h3>La biblia pone foco en vínculos, fricción y mitología cotidiana.</h3>
          <p>
            Este enfoque trata Retroville como una propiedad que necesita continuidad emocional. La pregunta ya
            no es solo “qué aspecto tiene”, sino “por qué el público querría volver a vivir aquí episodio tras
            episodio”.
          </p>
          <div className={styles.bibleRoster}>
            {characters.map((character) => (
              <article key={character.name} className={styles.rosterRow}>
                <strong>{character.name}</strong>
                <span>{character.role}</span>
                <p>{character.mood}</p>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.bibleVisual}>
          <div className={styles.bibleVisualImage}>
            <Image
              src="/images/retroville/luna-nox-lounge.png"
              alt="Luna y NOX en una escena íntima de Retroville"
              fill
              sizes="(max-width: 900px) 100vw, 44vw"
              className={styles.coverImage}
            />
          </div>
          <div className={styles.bibleVisualCaption}>
            La biblia vende intimidad, tensión y un mundo donde cada escena ya tiene subtexto.
          </div>
        </div>
      </section>

      <section className={styles.archiveSpread}>
        <div className={styles.blockHeader}>
          <p>Apócrifos</p>
          <h3>Cuando un proyecto aguanta reinterpretaciones, aguanta universo.</h3>
        </div>
        <div className={styles.archiveTriptych}>
          {archiveTriptych.map((piece) => (
            <article key={piece.title} className={styles.archiveCard}>
              <div className={styles.archiveImageWrap}>
                <Image
                  src={piece.image}
                  alt={piece.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 30vw"
                  className={styles.coverImage}
                />
              </div>
              <div className={styles.archiveCardMeta}>
                <h4>{piece.title}</h4>
                <p>{piece.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ProofLinks />
    </div>
  );
}

function renderSignalDeck() {
  return (
    <div className={styles.variantStack}>
      <section className={styles.signalHero}>
        <div className={styles.signalHeader}>
          <p className={styles.variantEyebrow}>Development deck</p>
          <h2 className={styles.signalTitle}>Retroville ordenado como IP: claro, escalable y accionable.</h2>
        </div>

        <div className={styles.signalGrid}>
          {signalModules.map((module) => (
            <article key={module.code} className={styles.signalModule}>
              <span>{module.code}</span>
              <h3>{module.title}</h3>
              <p>{module.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.signalBreakdown}>
        <article className={styles.signalPanel}>
          <p className={styles.variantEyebrow}>Rollout</p>
          <h3>Una ruta de activación que ya sabe cómo crecer.</h3>
          <ol className={styles.timeline}>
            {rolloutTimeline.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
        <article className={styles.signalPanel}>
          <p className={styles.variantEyebrow}>Evidencia visual</p>
          <h3>Proceso real, no solo promesa de concepto.</h3>
          <div className={styles.boardMosaic}>
            {atlasBoards.map((board) => (
              <div key={board.label} className={styles.boardTile}>
                <Image
                  src={board.image}
                  alt={board.label}
                  fill
                  sizes="(max-width: 900px) 100vw, 20vw"
                  className={styles.coverImage}
                />
                <span>{board.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.signalFooter}>
        <div className={styles.blockHeader}>
          <p>Prueba de amplitud</p>
          <h3>Personaje, ciudad y sistema pueden convivir sin desordenarse.</h3>
        </div>
        <div className={styles.signalFooterGrid}>
          <article className={styles.footerInsight}>
            <Clapperboard className="h-5 w-5" />
            <strong>Serie</strong>
            <p>El tono ya funciona como ficción adulta con identidad propia.</p>
          </article>
          <article className={styles.footerInsight}>
            <Layers3 className="h-5 w-5" />
            <strong>Franquicia</strong>
            <p>El diseño soporta merchandising, social y expansión narrativa.</p>
          </article>
          <article className={styles.footerInsight}>
            <Sparkles className="h-5 w-5" />
            <strong>Evento cultural</strong>
            <p>Las imágenes y personajes tienen potencial de fijación inmediata.</p>
          </article>
        </div>
      </section>

      <ProofLinks />
    </div>
  );
}

function renderCastRiot() {
  return (
    <div className={styles.variantStack}>
      <section className={styles.riotHero}>
        <div className={styles.riotPoster}>
          <div className={styles.riotPosterImage}>
            <Image
              src="/images/retroville/retroville-cast-presentation.png"
              alt="Reparto central de Retroville"
              fill
              sizes="(max-width: 900px) 100vw, 46vw"
              className={styles.coverImage}
            />
          </div>
          <div className={styles.riotSticker}>Fandom first</div>
          <div className={styles.riotBadge}>Serie + caos social</div>
        </div>

        <div className={styles.riotCopy}>
          <p className={styles.variantEyebrow}>Character-first pitch</p>
          <h2 className={styles.riotTitle}>Si el reparto entra fuerte, Retroville se convierte en conversación.</h2>
          <p className={styles.variantBody}>
            Este tratamiento pone la energía en la química. El proyecto se vende como una serie que genera clips,
            frases, ships, memes, discusiones y piezas promocionales con vida propia desde el minuto uno.
          </p>
          <div className={styles.quoteCluster}>
            <article>
              <strong>NOX</strong>
              <p>“Demasiado cansado para salvar la ciudad, demasiado responsable para dejarla caer.”</p>
            </article>
            <article>
              <strong>LUNA</strong>
              <p>“No busca amor. Busca control.”</p>
            </article>
            <article>
              <strong>BUTTON CREW</strong>
              <p>“Si la ciudad sigue encendida, probablemente ha sido por accidente.”</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.riotSupport}>
        <div className={styles.blockHeader}>
          <p>Escena social</p>
          <h3>El ruido del universo también es personaje.</h3>
        </div>
        <div className={styles.riotSupportGrid}>
          <article className={styles.riotScene}>
            <div className={styles.riotSceneImage}>
              <Image
                src="/images/retroville/retroville-button-crew-studio.png"
                alt="Button Crew en un set de estudio dentro de Retroville"
                fill
                sizes="(max-width: 900px) 100vw, 32vw"
                className={styles.coverImage}
              />
            </div>
            <p>Set pieces para promo, entrevistas falsas, clips y presencia de marca con humor.</p>
          </article>
          <article className={styles.riotScene}>
            <div className={styles.riotSceneImage}>
              <Image
                src="/images/retroville/luna-nox-lounge.png"
                alt="Luna y NOX en una escena de tensión"
                fill
                sizes="(max-width: 900px) 100vw, 32vw"
                className={styles.coverImage}
              />
            </div>
            <p>La relación entre personajes ya tiene tensión suficiente para vender la serie sola.</p>
          </article>
          <article className={styles.riotScene}>
            <div className={styles.riotSceneImage}>
              <Image
                src="/images/retroville/retroville-chaos-office.png"
                alt="Oficina caótica de Retroville"
                fill
                sizes="(max-width: 900px) 100vw, 32vw"
                className={styles.coverImage}
              />
            </div>
            <p>La ciudad deja espacio para comedy beats, workplace chaos y sátira adulta.</p>
          </article>
        </div>
      </section>

      <section className={styles.riotTagWall}>
        {districts.map((district) => (
          <article key={district.name} className={styles.tagTile}>
            <strong>{district.name}</strong>
            <span>{district.summary}</span>
          </article>
        ))}
      </section>

      <ProofLinks />
    </div>
  );
}

function renderCityAtlas() {
  return (
    <div className={styles.variantStack}>
      <section className={styles.atlasHero}>
        <div className={styles.atlasCopy}>
          <p className={styles.variantEyebrow}>Worldbuilding atlas</p>
          <h2 className={styles.atlasTitle}>Retroville presentado como una ciudad que puede seguir creciendo años.</h2>
          <p className={styles.variantBody}>
            Este enfoque pone el foco en sistemas: cómo se mueve la gente, dónde vive, qué criaturas habitan la
            ciudad y cómo las referencias del mundo real se convierten en arquitectura, transporte y cultura.
          </p>
        </div>
        <div className={styles.atlasMap}>
          <Image
            src="/images/retroville/process/masterplan-overview-board.png"
            alt="Masterplan overview de Retroville"
            fill
            sizes="(max-width: 900px) 100vw, 48vw"
            className={styles.coverImage}
          />
        </div>
      </section>

      <section className={styles.atlasSystems}>
        <div className={styles.blockHeader}>
          <p>Ecología y ciudad</p>
          <h3>La propuesta gana valor cuando demuestra rutina, infraestructura y biodiversidad.</h3>
        </div>
        <div className={styles.ecologyGrid}>
          {ecologyCards.map((card) => (
            <article key={card.title} className={styles.ecologyCard}>
              <div className={styles.ecologyImageWrap}>
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className={styles.coverImage}
                />
              </div>
              <div className={styles.ecologyMeta}>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.atlasBoardsSection}>
        <div className={styles.blockHeader}>
          <p>Proceso</p>
          <h3>Los boards enseñan exactamente de dónde sale la inspiración y cómo se transforma.</h3>
        </div>
        <div className={styles.atlasBoardGrid}>
          {atlasBoards.map((board) => (
            <article key={board.label} className={styles.atlasBoardCard}>
              <div className={styles.atlasBoardImage}>
                <Image
                  src={board.image}
                  alt={board.label}
                  fill
                  sizes="(max-width: 900px) 100vw, 24vw"
                  className={styles.coverImage}
                />
              </div>
              <span>{board.label}</span>
            </article>
          ))}
        </div>
      </section>

      <ProofLinks />
    </div>
  );
}

export default function RetrovillePitchLab() {
  const stageClassMap: Record<Treatment['id'], string> = {
    'neon-trailer': styles.stageNeon,
    'bible-prestige': styles.stageBible,
    'signal-deck': styles.stageSignal,
    'cast-riot': styles.stageRiot,
    'city-atlas': styles.stageAtlas,
  };

  const renderStage = (treatmentId: Treatment['id']) => {
    switch (treatmentId) {
      case 'neon-trailer':
        return renderNeonTrailer();
      case 'bible-prestige':
        return renderBiblePrestige();
      case 'signal-deck':
        return renderSignalDeck();
      case 'cast-riot':
        return renderCastRiot();
      case 'city-atlas':
        return renderCityAtlas();
      default:
        return renderNeonTrailer();
    }
  };

  return (
    <main
      className={[
        styles.page,
        neonFont.variable,
        bibleFont.variable,
        gridFont.variable,
        riotFont.variable,
        bodyFont.variable,
        monoFont.variable,
      ].join(' ')}
    >
      <div className={styles.pageGlow} />
      <section className={styles.hero}>
        <div className={styles.heroTopline}>
          <Link href="/retroville" className={styles.backLink}>
            <ArrowLeft className="h-4 w-4" />
            Volver a la experiencia actual
          </Link>
          <span className={styles.heroTag}>Pitch Lab privado / público</span>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>Retroville Presentation Lab</p>
            <h1 className={styles.heroTitle}>Cinco tratamientos creativos para presentar el mismo universo.</h1>
            <p className={styles.heroBody}>
              La versión live de `Retroville` se mantiene intacta. Aquí tienes cinco enfoques nuevos con calidad
              de pitch de estudio: cambian la dirección visual, la narrativa de venta y el foco de la
              presentación, pero conservan el núcleo del proyecto.
            </p>

            <div className={styles.heroActions}>
              <Link href="/retroville" className={styles.primaryAction}>
                Ver versión live
              </Link>
              <Link href="/retroville/sketches" className={styles.secondaryAction}>
                Abrir archivo de proceso
              </Link>
            </div>
          </div>

          <div className={styles.heroPreview}>
            <div className={styles.heroPreviewImage}>
              <Image
                src="/images/retroville/retroville-street.png"
                alt="Retroville street"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 40vw"
                className={styles.coverImage}
              />
            </div>
            <div className={styles.heroPreviewCard}>
              <strong>5 tratamientos originales</strong>
              <span>
                Un mismo universo, cinco lenguajes de pitch: reveal cinematográfico, bible editorial,
                development deck, cast-first campaign y atlas de worldbuilding.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.selectorSection}>
        <div className={styles.selectorHeader}>
          <div>
            <p>Menú de tratamientos</p>
            <h2>Elige una lectura distinta del mismo proyecto.</h2>
          </div>
        </div>

        <div className={styles.selectorGrid}>
          {treatmentDecks.map((deck) => (
            <Link
              key={deck.id}
              href={`/retroville/presentaciones#${deck.id}`}
              className={styles.selectorCard}
              style={
                {
                  '--pitch-accent': deck.accent,
                  '--pitch-accent-soft': deck.accentSoft,
                } as CSSProperties
              }
            >
              <span>{deck.eyebrow}</span>
              <strong>{deck.name}</strong>
              <p>{deck.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.deckColumn}>
        {treatmentDecks.map((deck) => (
          <section
            key={deck.id}
            id={deck.id}
            className={styles.deckSection}
            style={
              {
                '--pitch-accent': deck.accent,
                '--pitch-accent-soft': deck.accentSoft,
                '--pitch-glow': deck.glow,
              } as CSSProperties
            }
          >
            <div className={styles.activeMeta}>
              <div>
                <p>{deck.eyebrow}</p>
                <h2>{deck.name}</h2>
              </div>
              <div className={styles.activeMetaInfo}>
                <Map className="h-4 w-4" />
                <span>{deck.teaser}</span>
              </div>
            </div>

            <div className={`${styles.stage} ${stageClassMap[deck.id]}`}>
              <div className={styles.stageInner}>
                {renderStage(deck.id)}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className={styles.footerBand}>
        <Map className="h-5 w-5" />
        <p>
          Las cinco propuestas reutilizan el material real de personajes, ciudad, process boards y concepto
          narrativo. Son cambios de lenguaje de presentación, no sustituciones de la versión actual.
        </p>
      </section>
    </main>
  );
}
