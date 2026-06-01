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
    'Archivo visual curado de Retroville: referencias, tableros de traducción, mapas de ciudad y hojas de desarrollo del universo original de AdvancedRetro.',
  alternates: {
    canonical: 'https://advancedretro.es/retroville/sketches',
  },
  openGraph: {
    title: 'Sketchbook de Retroville',
    description: 'Referencias, traducción visual y desarrollo de mundo para Retroville.',
    url: 'https://advancedretro.es/retroville/sketches',
    siteName: 'AdvancedRetro.es',
    locale: 'es_ES',
    type: 'website',
  },
};

const curatedSections = [
  {
    title: 'De Referencia A Traduccion',
    intro:
      'Esta parte enseña justo lo que faltaba: de dónde nace cada idea, qué objeto o lenguaje visual la dispara y cómo se convierte en arquitectura o espacio de Retroville.',
    items: [
      {
        title: 'Comisaria Retroville',
        tag: 'Seguridad',
        image: '/images/retroville/process/police-translation-board.png',
        text: 'Un ejemplo perfecto de método: la caja táctica real se traduce a cierres, refuerzos, cámaras y lenguaje de edificio vigilado.',
      },
      {
        title: 'Hotel Retroville',
        tag: 'Hospitality',
        image: '/images/retroville/process/hotel-translation-board.png',
        text: 'El hotel nace de enchufes, regletas, cableado y señal de encendido. Aquí la referencia no se copia: se convierte en reglas de forma.',
      },
      {
        title: 'Biblioteca Retroville',
        tag: 'Cultura',
        image: '/images/retroville/process/library-translation-board.png',
        text: 'Juegos apilados, lomos, slots y orden físico se convierten en fachada, acceso y sistema de devolución.',
      },
      {
        title: 'Reset Medical Center',
        tag: 'Salud',
        image: '/images/retroville/process/hospital-translation-board.png',
        text: 'Una pieza que mezcla iconografía hospitalaria y lógica de videojuego: triage, recovery y reboot dentro del mismo edificio.',
      },
      {
        title: 'Aquarium District',
        tag: 'Costa',
        image: '/images/retroville/process/aquarium-translation-board.png',
        text: 'El acuario trabaja con transparencia, circulación interior y escala pública para abrir un distrito costero más limpio y luminoso.',
      },
      {
        title: 'Retroville Public School',
        tag: 'Educacion',
        image: '/images/retroville/process/school-translation-board.png',
        text: 'La escuela no es un volumen cualquiera: se entiende enseguida que la inspiración sale de una consola de doble pantalla y su jerarquía frontal.',
      },
    ],
  },
  {
    title: 'Sistemas Jugables',
    intro:
      'Cuando la ciudad se mueve o se usa, los sketches empiezan a funcionar como diseño de sistema: transporte, ocio, flujo de gente y lectura rápida.',
    items: [
      {
        title: 'Metro-Pod',
        tag: 'Transit',
        image: '/images/retroville/process/metro-pod-translation-board.png',
        text: 'Una hoja de diseño pensada para fijar accesibilidad, visibilidad y lenguaje de transporte urbano dentro de la ciudad.',
      },
      {
        title: 'Retroville Fleet',
        tag: 'Marina',
        image: '/images/retroville/process/boats-translation-board.png',
        text: 'Ferrys, taxis de agua, patrullas y cruceros con ADN de consola. No son props sueltos: amplían el mapa y la vida pública.',
      },
      {
        title: 'Gym Gate',
        tag: 'Leisure',
        image: '/images/retroville/process/gym-translation-board.png',
        text: 'El gimnasio lleva la idea de hardware al gesto arquitectónico: una entrada que ya comunica actividad, energía y juego físico.',
      },
    ],
  },
  {
    title: 'Mapas Y Distritos',
    intro:
      'Después de traducir objetos a edificios, toca colocarlos dentro del conjunto. Estas hojas enseñan cómo encaja cada barrio dentro del plan general.',
    items: [
      {
        title: 'Masterplan Overview',
        tag: 'Mapa',
        image: '/images/retroville/process/masterplan-overview-board.png',
        text: 'La visión general de la ciudad: núcleo central, distritos, zonas residenciales y la conexión con Bit Grave.',
      },
      {
        title: 'CRT Central Plaza',
        tag: 'Centro',
        image: '/images/retroville/process/central-plaza-board.png',
        text: 'La plaza central como corazón visible del sistema: señalización, televisión pública y lectura inmediata del tono de la ciudad.',
      },
      {
        title: 'Cinema & Mall District',
        tag: 'Ocio',
        image: '/images/retroville/process/cinema-mall-district-board.png',
        text: 'Un distrito de consumo, juegos y escaparate construido para que se entienda como foco de vida urbana y reunión.',
      },
      {
        title: 'Bit Grave',
        tag: 'Ruina',
        image: '/images/retroville/process/bit-grave-district-board.png',
        text: 'El reverso del brillo: hardware muerto, basura histórica y un barrio entero definido por lo desechado y lo recuperado.',
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
            <h1 className={`${displayFont.className} ${styles.heroTitle}`}>SKETCHBOOK CURADO</h1>
            <p className={styles.heroText}>
              Esta página ya no junta sketches al azar. Ahora el archivo enseña el proceso real: referencia,
              traducción visual, decisión de lenguaje y sitio que ocupa cada idea dentro del mundo.
            </p>
            <p className={styles.heroText}>
              La intención es que se vea de dónde sale cada edificio, cómo se interpreta la inspiración y qué parte
              del universo Retroville está construyendo cada hoja.
            </p>
          </div>

          <div className={styles.heroBoard}>
            <Image
              src="/images/retroville/process/hotel-translation-board.png"
              alt="Tablero de traducción visual del hotel de Retroville"
              fill
              sizes="(max-width: 1500px) 100vw, 54vw"
              className={styles.heroBoardImage}
              priority
            />
            <div className={styles.heroBoardNote}>Referencia real a traduccion a edificio con identidad.</div>
          </div>
        </section>
      </header>

      {curatedSections.map((group) => (
        <section key={group.title} className={styles.groupSection}>
          <div className={styles.groupHeader}>
            <p className={styles.eyebrow}>Curated selection</p>
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
        <p>El archivo seguirá creciendo con más tableros, props, transporte, fauna y revisiones de distrito.</p>
        <Link href="/retroville/personajes" className={styles.footerCta}>
          Ver personajes <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
    </main>
  );
}
