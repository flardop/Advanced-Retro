import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Anton, DM_Sans, Space_Mono } from 'next/font/google';
import styles from './personajes.module.css';

const displayFont = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const bodyFont = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Personajes de Retroville | AdvancedRetro.es',
  description:
    'Reparto de Retroville: NOX, Button Crew, Luna y personajes en desarrollo del universo original de AdvancedRetro.',
  alternates: {
    canonical: 'https://advancedretro.es/retroville/personajes',
  },
  openGraph: {
    title: 'Personajes de Retroville',
    description: 'Conoce el reparto principal y personajes en desarrollo del universo Retroville.',
    url: 'https://advancedretro.es/retroville/personajes',
    siteName: 'AdvancedRetro.es',
    locale: 'es_ES',
    type: 'website',
  },
};

const renderedCharacters = [
  {
    name: 'NOX',
    role: 'Protagonista principal',
    image: '/images/retroville/nox-character-large.png',
    accent: '#67b8ff',
    status: 'Render final disponible',
    description:
      'NOX es el centro emocional de Retroville: cansado, sarcástico y más sensible de lo que quiere admitir. No es un héroe limpio; es el tipo de personaje que sobrevive porque no le queda otra.',
    facts: ['Batería baja', 'Humor seco', 'Lealtad escondida'],
  },
  {
    name: 'BUTTON CREW',
    role: 'Caos social permanente',
    image: '/images/retroville/button-crew-character-large.png',
    accent: '#ffc940',
    status: 'Render final disponible',
    description:
      'A, B, Y y X funcionan como una pequeña pandilla de impulsos: discuten, empujan la escena y convierten cualquier situación sencilla en un problema comunitario.',
    facts: ['A / B / Y / X', 'Ruido de grupo', 'Energía callejera'],
  },
  {
    name: 'LUNA',
    role: 'Controladora magnética',
    image: '/images/retroville/luna-character-large.png',
    accent: '#ff78b7',
    status: 'Render final disponible',
    description:
      'Luna entra con glamour, manipulación y una sonrisa que nunca sabes si ayuda o complica. No busca amor: busca atención, control y quizá algo que ni ella entiende.',
    facts: ['Glamour tóxico', 'Control', 'Caos elegante'],
  },
  {
    name: 'NORA',
    role: 'Vecina del Riverside District',
    image: '/images/retroville/characters/nora.png',
    accent: '#b99bd3',
    status: 'Render final disponible',
    description:
      'Nora lleva más tiempo en Retroville que casi cualquiera. Observa, juzga y sabe demasiado sobre todos. No crea caos: lo archiva mentalmente.',
    facts: ['Observadora', 'Tradicional', 'Secretos del barrio'],
  },
  {
    name: 'JOY & GRUMP',
    role: 'Vecinos controladores',
    image: '/images/retroville/characters/joy-grump.png',
    accent: '#d4474b',
    status: 'Render final disponible',
    description:
      'Dos joy-cons retirados que viven puerta con puerta y no soportan absolutamente nada. Quejas, rutina y cero paciencia como motor cómico.',
    facts: ['0% paciencia', 'Quejas vecinales', 'Sitcom amarga'],
  },
  {
    name: 'TRIMP',
    role: 'Motion controller competitivo',
    image: '/images/retroville/characters/trimp.png',
    accent: '#d46cff',
    status: 'Render final disponible',
    description:
      'TRIMP no sigue el juego: intenta poner las reglas. Competitivo, dominante y demasiado convencido de que la cámara siempre le pertenece.',
    facts: ['Ego alto', 'Competitivo', 'Showman'],
  },
  {
    name: 'PATROL CHIEF',
    role: 'Jefe de policía',
    image: '/images/retroville/characters/patrol-chief.png',
    accent: '#4f85c7',
    status: 'Render final disponible',
    description:
      'El orden nocturno de Retroville con cara de haber visto demasiados turnos seguidos. Serio, cansado y con más café que esperanza.',
    facts: ['Turno eterno', 'Orden público', 'Café caliente'],
  },
  {
    name: 'PUBLIC CREW',
    role: 'Transporte público',
    image: '/images/retroville/characters/public-crew.png',
    accent: '#d75f5f',
    status: 'Render final disponible',
    description:
      'Mantiene la ciudad en movimiento con cambio exacto, rutas raras y una paciencia que se terminó hace años.',
    facts: ['Ruta fija', 'Cambio exacto', 'Última parada'],
  },
  {
    name: 'SHIFT STICK',
    role: 'Operador de tránsito',
    image: '/images/retroville/characters/crux.png',
    accent: '#d6c0a2',
    status: 'Render final disponible',
    description:
      'Funcionario veterano del sistema urbano. Todo pasa por formularios, llaves y una mirada que ya no espera nada de nadie.',
    facts: ['Administración', 'Llaves', 'Orden viejo'],
  },
  {
    name: 'MAYOR TUBE',
    role: 'Alcalde de Retroville',
    image: '/images/retroville/characters/mayor-tube.png',
    accent: '#d6a85a',
    status: 'Render final disponible',
    description:
      'El poder con sonrisa de pantalla. Mayor Tube promete control, progreso y una ciudad perfectamente encendida aunque nadie haya preguntado.',
    facts: ['Diplomático', 'Smug', 'Bajo control'],
  },
  {
    name: 'TOMO',
    role: 'Kid de Retroville',
    image: '/images/retroville/characters/tomo.png',
    accent: '#d77870',
    status: 'Render final disponible',
    description:
      'Niño de barrio, chupa-chups, gorra ladeada y energía de travesura. Sabe demasiados atajos y cree que todo le queda bien.',
    facts: ['Travieso', 'Playground district', 'Main character energy'],
  },
  {
    name: 'PIPO',
    role: 'Kid de Retroville',
    image: '/images/retroville/characters/pipo.png',
    accent: '#db5b6e',
    status: 'Render final disponible',
    description:
      'Pipo es pequeño, molesto y convencido de que nada es culpa suya. Virtual pet con ego desproporcionado y sonrisa de problema.',
    facts: ['No es su culpa', 'Lollipop', 'Ego level 100'],
  },
  {
    name: 'NANO',
    role: 'Pocket MP3 kid',
    image: '/images/retroville/characters/nano.png',
    accent: '#8d78ff',
    status: 'Render final disponible',
    description:
      'Nano vive dentro de su playlist. Más callado, más sensible y más perdido en música que el resto de la ciudad.',
    facts: ['Música', 'Daydreaming', 'Batería baja'],
  },
  {
    name: 'MIA',
    role: 'Influencer de Retroville',
    image: '/images/retroville/characters/influencer.png',
    accent: '#ff7fbf',
    status: 'Render final disponible',
    description:
      'Brillo, filtros, cámara frontal y una habilidad natural para convertir cualquier crisis en contenido. En Retroville, la atención también es moneda.',
    facts: ['Selfie mode', 'Glamour', 'Atención'],
  },
] as const;

export default function RetrovilleCharactersPage() {
  return (
    <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}>
      <header className={styles.hero}>
        <nav className={styles.nav} aria-label="Navegación personajes Retroville">
          <Link href="/retroville" className={styles.backLink}>
            <ArrowLeft className="h-4 w-4" /> Volver a Retroville
          </Link>
          <Image src="/images/retroville/retroville-logo.png" alt="Retroville" width={260} height={173} className={styles.logo} priority />
        </nav>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Cast development</p>
          <h1 className={`${displayFont.className} ${styles.heroTitle}`}>PERSONAJES DE RETROVILLE</h1>
          <p>
            Página de reparto con renders transparentes listos para enseñar en formato más limpio. Las fichas largas y
            guías de estilo quedan para el entorno dev; aquí priorizamos presencia, tono y lectura rápida.
          </p>
        </div>
      </header>

      <section className={styles.renderedSection} aria-label="Personajes con render final">
        {renderedCharacters.map((character, index) => (
          <article key={character.name} className={`${styles.characterPanel} ${index % 2 === 1 ? styles.characterPanelReverse : ''}`}>
            <div className={styles.characterImageStage} style={{ ['--accent' as string]: character.accent }}>
              <div className={styles.characterAura} />
              <Image src={character.image} alt={character.name} width={1100} height={1500} className={styles.characterImage} priority={index === 0} />
            </div>
            <div className={styles.characterCopy}>
              <p className={styles.eyebrow}>{character.status}</p>
              <h2 className={`${displayFont.className} ${styles.characterName}`}>{character.name}</h2>
              <p className={styles.role}>{character.role}</p>
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

      <footer className={styles.footer}>
        <Link href="/retroville/sketches" className={styles.footerCta}>
          Ver sketches del mundo <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
    </main>
  );
}
