import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Anton, DM_Sans, Space_Mono } from 'next/font/google';
import styles from './sketches.module.css';

const displayFont = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const bodyFont = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Sketchbook de Retroville | AdvancedRetro.es',
  description:
    'Archivo de concept art y sketches de Retroville: ciudad, transporte, props, criaturas y lugares del universo original de AdvancedRetro.',
  alternates: {
    canonical: 'https://advancedretro.es/retroville/sketches',
  },
  openGraph: {
    title: 'Sketchbook de Retroville',
    description: 'Concept art, mapas visuales y desarrollo de mundo para Retroville.',
    url: 'https://advancedretro.es/retroville/sketches',
    siteName: 'AdvancedRetro.es',
    locale: 'es_ES',
    type: 'website',
  },
};

const sketchGroups = [
  {
    title: 'Ciudad & Arquitectura',
    intro:
      'La base visual de Retroville: edificios construidos como hardware, plazas que parecen menús interactivos y barrios con humor propio.',
    items: [
      {
        title: 'Retroville Central',
        tag: 'City core',
        image: '/images/retroville/retroville-central-plaza-concept.png',
        text: 'El centro público de la ciudad. Una plaza pensada para que se entienda que Retroville no es un fondo: es un sistema vivo.',
      },
      {
        title: 'Stacked Housing',
        tag: 'Housing',
        image: '/images/retroville/retroville-stacked-housing-concept.png',
        text: 'Viviendas modulares, apiladas y raras. Cada bloque parece haber sido ensamblado con piezas de otra consola.',
      },
      {
        title: 'City Hall',
        tag: 'Institución',
        image: '/images/retroville/retroville-civic-hall-concept.png',
        text: 'La cara administrativa de Retroville: orden, propaganda y una sensación de control demasiado limpio para ser verdad.',
      },
      {
        title: 'School District',
        tag: 'Educación',
        image: '/images/retroville/retroville-school-concept.png',
        text: 'Una escuela hecha para formar pequeños ciudadanos digitales. Bonita por fuera, sospechosa por dentro.',
      },
      {
        title: 'Nox House',
        tag: 'Interior',
        image: '/images/retroville/retroville-nox-house-concept.png',
        text: 'La vida privada de NOX: objetos gastados, pantallas, silencio y ese cansancio que también cuenta historia.',
      },
      {
        title: 'Bit Grave',
        tag: 'Ruina',
        image: '/images/retroville/retroville-bit-grave-concept.png',
        text: 'El cementerio de hardware. El sitio donde los juegos olvidados dejan de ser producto y empiezan a ser fantasma.',
      },
    ],
  },
  {
    title: 'Transporte & Movimiento',
    intro:
      'Retroville se mueve con vehículos que parecen mecánicas jugables: metro-pods, taxis cápsula, motos y barcos con memoria de consola.',
    items: [
      {
        title: 'Metro-Pod',
        tag: 'Transit',
        image: '/images/retroville/retroville-metro-pod-concept.png',
        text: 'Transporte público compacto y panorámico. No solo lleva personajes: enseña cómo respira la ciudad.',
      },
      {
        title: 'Taxi-Pod',
        tag: 'Taxi',
        image: '/images/retroville/retroville-taxi-pod-concept.png',
        text: 'Un taxi autónomo, amable y raro. Tiene el punto justo entre objeto útil y personaje secundario.',
      },
      {
        title: 'Vehicle Lineup',
        tag: 'Sistema',
        image: '/images/retroville/retroville-vehicle-lineup-concept.png',
        text: 'Una hoja de exploración para definir lenguaje: siluetas simples, hardware retro y funciones reconocibles.',
      },
      {
        title: 'Gripper',
        tag: 'City car',
        image: '/images/retroville/retroville-gripper-car-concept.png',
        text: 'Coche urbano para compartir ciudad. Compacto, claro y con personalidad suficiente para aparecer en escena.',
      },
      {
        title: 'Zapperbike',
        tag: 'Moto',
        image: '/images/retroville/retroville-zapperbike-concept.png',
        text: 'Ligera, rápida y dudosa. Perfecta para recados, decisiones cuestionables y persecuciones pequeñas.',
      },
      {
        title: 'Boat Concepts',
        tag: 'Agua',
        image: '/images/retroville/retroville-boats-concept.png',
        text: 'Exploración marítima para ampliar Retroville más allá de sus calles: ferrys, taxis de agua y barcos-cassette.',
      },
    ],
  },
  {
    title: 'Vida Urbana & Props',
    intro:
      'Los detalles pequeños sostienen el mundo: farolas, señales, tiendas, criaturas y clubs donde cada objeto tiene intención.',
    items: [
      {
        title: 'Urban Props',
        tag: 'Props',
        image: '/images/retroville/retroville-urban-props-concept.png',
        text: 'Señales, papeleras, marquesinas, carteles y basura con diseño propio. Aquí el mobiliario también cuenta chistes.',
      },
      {
        title: 'Shops & Storefronts',
        tag: 'Comercio',
        image: '/images/retroville/retroville-buildings-concept.png',
        text: 'Tiendas que convierten consumo, nostalgia y absurdo en fachadas reconocibles: cafés, moteles, reparaciones y snacks.',
      },
      {
        title: 'Creature Concepts',
        tag: 'Fauna',
        image: '/images/retroville/retroville-creatures-concept.png',
        text: 'Animales y criaturas nacidas de discos, cables, cartuchos y periféricos. Vida salvaje con puerto de conexión.',
      },
      {
        title: 'Top Slot Club',
        tag: 'Noche',
        image: '/images/retroville/retroville-club-concept.png',
        text: 'La parte nocturna de la ciudad: letreros, puerta grande, VIP dudoso y el tipo de sitio donde NOX no debería entrar.',
      },
      {
        title: 'Retroville Nightclub',
        tag: 'Nightlife',
        image: '/images/retroville/retroville-nightclub-concept.png',
        text: 'Otra lectura del ocio nocturno: más calle, más suciedad visual y más posibilidades para escenas de serie.',
      },
    ],
  },
] as const;

export default function RetrovilleSketchesPage() {
  return (
    <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}>
      <header className={styles.hero}>
        <nav className={styles.nav} aria-label="Navegación de sketches Retroville">
          <Link href="/retroville" className={styles.backLink}>
            <ArrowLeft className="h-4 w-4" /> Volver a Retroville
          </Link>
          <Image src="/images/retroville/retroville-logo.png" alt="Retroville" width={260} height={173} className={styles.logo} priority />
        </nav>

        <section className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Retroville development archive</p>
            <h1 className={`${displayFont.className} ${styles.heroTitle}`}>SKETCHBOOK DE LA CIUDAD</h1>
            <p className={styles.heroText}>
              Esta página separa el material de desarrollo para que se pueda mirar mejor: cómo nacen las calles,
              edificios, vehículos, criaturas y objetos que hacen que Retroville se sienta como una serie y no como una landing.
            </p>
          </div>

          <div className={styles.sampleBoard} aria-label="Proceso visual de Retroville">
            <div className={styles.referenceCard}>
              <span>INPUT</span>
              <strong>Hardware retro + vida urbana</strong>
            </div>
            <div className={styles.operator}>+</div>
            <div className={styles.referenceCard}>
              <span>RULE</span>
              <strong>Todo debe poder contar una escena</strong>
            </div>
            <div className={styles.operatorAlt}>=</div>
            <div className={styles.outputCard}>
              <Image src="/images/retroville/retroville-central-plaza-concept.png" alt="Sketch de plaza central de Retroville" fill sizes="34vw" className={styles.outputImage} priority />
              <div className={styles.speechBubble}>Aquí empieza el mundo.</div>
            </div>
          </div>
        </section>
      </header>

      {sketchGroups.map((group) => (
        <section key={group.title} className={styles.groupSection}>
          <div className={styles.groupHeader}>
            <p className={styles.eyebrow}>Concept area</p>
            <h2 className={`${displayFont.className} ${styles.groupTitle}`}>{group.title}</h2>
            <p>{group.intro}</p>
          </div>

          <div className={styles.grid}>
            {group.items.map((item) => (
              <article key={item.title} className={styles.card}>
                <div className={styles.imageWrap}>
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 900px) 100vw, 33vw" className={styles.cardImage} />
                </div>
                <div className={styles.cardCopy}>
                  <span className={styles.cardTag}>{item.tag}</span>
                  <h3 className={`${displayFont.className} ${styles.cardTitle}`}>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <footer className={styles.footer}>
        <p>Retroville está en fase demo. Esta página crecerá con renders finales, modelos y nuevas referencias.</p>
        <Link href="/retroville/personajes" className={styles.footerCta}>
          Ver personajes <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
    </main>
  );
}
