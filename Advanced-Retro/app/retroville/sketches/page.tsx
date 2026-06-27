import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildItemListJsonLd, buildPageMetadata } from '@/lib/seo';
import { buildRetrovilleSeriesJsonLd } from '@/app/retroville/shared';
import { retrovilleGuideSlides } from '@/app/retroville/content';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './sketches.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sketchbook de Retroville | Proceso vivo, mapas y concept art',
  description:
    'Archivo visual vivo de Retroville con referencias, tableros de traduccion, mapas de ciudad, edificios y concept art del universo original de AdvancedRetro.',
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
  {
    title: 'Escenas Y Arquitectura',
    phase: 'Fase activa · espacios ya publicables',
    intro:
      'Aquí ya no hablamos solo de boards de proceso. Estas piezas enseñan cómo se ve Retroville cuando el mundo baja a calle, barrio, interiores y atmósfera reconocible.',
    items: [
      {
        title: 'Street frame',
        tag: 'Barrio',
        image: '/images/retroville/retroville-street.png',
        text: 'Una de las imágenes más directas para vender la serie: señal, fachada, profundidad y tono de barrio ya cerrados.',
      },
      {
        title: 'School district',
        tag: 'Vida civil',
        image: '/images/retroville/retroville-school-concept.png',
        text: 'El colegio como pieza de ciudad real, útil tanto para humor cotidiano como para la parte más inquietante de la historia.',
      },
      {
        title: 'Top Slot club',
        tag: 'Noche',
        image: '/images/retroville/retroville-club-concept.png',
        text: 'La lectura más elegante y social del universo: luces, fachada y promesa de caos bonito dentro de la noche.',
      },
      {
        title: 'Civic Hall',
        tag: 'Institución',
        image: '/images/retroville/retroville-civic-hall-concept.png',
        text: 'Una arquitectura institucional con suficiente personalidad para que la autoridad de Retroville se reconozca al instante.',
      },
      {
        title: 'Chaos office',
        tag: 'Interior',
        image: '/images/retroville/retroville-chaos-office.png',
        text: 'Los interiores también tienen identidad: mesas, pantallas, densidad y una comedia visual que sigue respirando mundo.',
      },
      {
        title: 'Bit Grave concept',
        tag: 'Amenaza',
        image: '/images/retroville/retroville-bit-grave-concept.png',
        text: 'Una pieza más suelta y atmosférica para vender el reverso oscuro de la ciudad sin perder la firma visual.',
      },
    ],
  },
  {
    title: 'Movilidad, Props Y Criaturas',
    phase: 'Fase activa · sistemas urbanos',
    intro:
      'Cuando los vehículos, los props y las criaturas ya tienen propuesta visual, el mundo deja de depender solo del cast. Aquí se ve sistema, circulación y vida alrededor.',
    items: [
      {
        title: 'Vehicle lineup',
        tag: 'Movilidad',
        image: '/images/retroville/retroville-vehicle-lineup-concept.png',
        text: 'Una familia de transporte completa para que la ciudad no parezca sostenida por una única silueta o prop repetido.',
      },
      {
        title: 'Metro-Pod concept',
        tag: 'Transit',
        image: '/images/retroville/retroville-metro-pod-concept.png',
        text: 'La cápsula de transporte como icono reconocible: simple, clara y muy útil para repetir en el lenguaje del universo.',
      },
      {
        title: 'Taxi pod',
        tag: 'Servicio',
        image: '/images/retroville/retroville-taxi-pod-concept.png',
        text: 'Un sistema de movilidad cotidiana que ayuda a vender clases sociales, trayectos y ritmo urbano dentro de la serie.',
      },
      {
        title: 'Zapperbike',
        tag: 'Velocidad',
        image: '/images/retroville/retroville-zapperbike-concept.png',
        text: 'Una pieza más agresiva y veloz para persecuciones, llegadas fuertes y lectura joven del espacio urbano.',
      },
      {
        title: 'Gripper car',
        tag: 'Utilidad',
        image: '/images/retroville/retroville-gripper-car-concept.png',
        text: 'Vehículo de trabajo y de barrio que amplía el tono industrial sin romper la coherencia formal de la ciudad.',
      },
      {
        title: 'Creatures study',
        tag: 'Fauna',
        image: '/images/retroville/retroville-creatures-concept.png',
        text: 'Incluso la fauna ayuda a vender el lugar: formas raras, comportamiento propio y más capas para el ecosistema de Retroville.',
      },
    ],
  },
] as const;

const characterGuideNotes: Record<string, string> = {
  'NOX styleguide': 'Hoja final para fijar silueta, actitud y materiales del protagonista sin ruido extra en el home.',
  'LUNA styleguide': 'La guía de Luna ya deja cerrada su presencia y el contraste visual que necesita frente a NOX.',
  'BUTTON CREW guide': 'El trío funciona como familia visual completa: color, pose y lectura grupal ya presentables.',
  'Cast anatomy': 'La anatomy sheet asegura consistencia de proporciones antes de entrar en escenas y producción real.',
  'Nora v2': 'Iteración de desarrollo que ayuda a consolidar el tono civil y observador de una de las vecinas clave.',
  'Joy & Grump': 'Sheet del dúo más ácido del barrio, útil para enseñar humor y construcción de pareja cómica.',
};

const supportingCharacterSheets = [
  {
    title: 'Patrol Chief v2',
    tag: 'Orden público',
    image: '/images/retroville/dev-characters/patrol-chief-v2-sheet.png',
    text: 'Figura de autoridad para sostener la parte más vigilada y tensa de la ciudad sin romper el tono caricaturesco.',
  },
  {
    title: 'Public Crew v2',
    tag: 'Ruido civil',
    image: '/images/retroville/dev-characters/public-crew-v2-sheet.png',
    text: 'Ciudadanos, extras y energía social para que las calles tengan conversación, masa y pequeños conflictos visibles.',
  },
  {
    title: 'City Hall worker',
    tag: 'Burocracia',
    image: '/images/retroville/dev-characters/city-hall-worker-sheet.png',
    text: 'La capa administrativa también necesita cara propia: gestos, uniforme y actitud de sistema cansado.',
  },
  {
    title: 'Nona early sheet',
    tag: 'Colegio',
    image: '/images/retroville/dev-characters/nona-girl-sheet.png',
    text: 'Material temprano que deja ver la evolución previa de una de las figuras más inquietantes del colegio.',
  },
  {
    title: 'Tomo v2',
    tag: 'Kids',
    image: '/images/retroville/dev-characters/tomo-v2-sheet.png',
    text: 'Revisión que refuerza la lectura traviesa del personaje y su papel como motor de energía callejera.',
  },
  {
    title: 'Pipo v2',
    tag: 'Caos pequeño',
    image: '/images/retroville/dev-characters/pipo-v2-sheet.png',
    text: 'Más precisión para ese perfil de mascota insoportable con ego sobredimensionado y presencia cómica inmediata.',
  },
] as const;

export default function RetrovilleSketchesPage() {
  const pageSchema = buildCollectionPageJsonLd({
    name: 'Sketchbook de Retroville',
    path: '/retroville/sketches',
    description:
      'Archivo visual de Retroville con referencias reales, traducción a arquitectura, sistemas jugables y mapas de distrito.',
    image: '/images/retroville/process/masterplan-overview-board.png',
    about: ['Worldbuilding Retroville', 'Concept art', 'Mapas de ciudad', 'Arquitectura retro'],
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
      'Archivo oficial del proceso de Retroville con tableros de traducción visual, mapas, arquitectura y sistemas del universo.',
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
            <p className={styles.eyebrow}>Retroville development archive</p>
            <h1 className={`${displayFont.className} ${styles.heroTitle}`}>SKETCHBOOK CURADO</h1>
            <div className="mt-5 inline-flex items-center rounded-full border border-[#8ad7ff]/20 bg-[#8ad7ff]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#8ad7ff]">
              Archivo en actualizacion · Junio 2026
            </div>
            <p className={styles.heroText}>
              Esta página ya no junta sketches al azar. Ahora el archivo enseña el proceso real: referencia,
              traducción visual, decisión de lenguaje y sitio que ocupa cada idea dentro del mundo.
            </p>
            <p className={styles.heroText}>
              La intención es que se vea de dónde sale cada edificio, cómo se interpreta la inspiración y qué parte
              del universo Retroville está construyendo cada hoja.
            </p>
            <p className={styles.heroText}>
              El archivo sigue vivo y se actualiza a medida que cerramos barrios, props, transporte y nuevas
              traducciones visuales del mundo.
            </p>
            <p className={styles.heroText}>
              Aquí también aterriza ahora el material de proceso de personajes que se ha quitado del pitch principal
              para que el home venda la serie y este archivo enseñe cómo se construye.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/retroville/personajes" className={styles.footerCta}>
                Ver reparto <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/retroville/presentaciones" className={styles.footerCta}>
                Ver presentación <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/retroville/press" className={styles.footerCta}>
                Press kit <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className={styles.heroBoard}>
            <Image
              src="/images/retroville/process/hotel-translation-board.webp"
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

      <section className={styles.groupSection}>
        <div className={styles.groupHeader}>
          <p className={styles.eyebrow}>Moved from pitch home</p>
          <h2 className={`${displayFont.className} ${styles.groupTitle}`}>GUIAS Y SHEETS DE PERSONAJE</h2>
          <div className="mt-4 inline-flex items-center rounded-full border border-[#ffbf52]/20 bg-[#ffbf52]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#ffbf52]">
            Archivo de proceso · cast y desarrollo
          </div>
          <p>
            Todo el material de proceso que ya no compite dentro del home vive ahora aquí: styleguides finales,
            anatomy sheets y hojas de desarrollo para enseñar método, no saturar la portada.
          </p>
        </div>

        <div className={styles.grid}>
          {retrovilleGuideSlides.slice(0, 6).map((item) => (
            <article key={item.title} id={toSketchAnchor(item.title)} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className={styles.cardImage}
                  loading="lazy"
                />
              </div>
              <div className={styles.cardCopy}>
                <span className={styles.cardTag}>{item.meta}</span>
                <h3 className={`${displayFont.className} ${styles.cardTitle}`}>{item.title}</h3>
                <p>{characterGuideNotes[item.title]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.groupSection}>
        <div className={styles.groupHeader}>
          <p className={styles.eyebrow}>Supporting cast process</p>
          <h2 className={`${displayFont.className} ${styles.groupTitle}`}>APOYO VISUAL DEL BARRIO</h2>
          <div className="mt-4 inline-flex items-center rounded-full border border-[#8ad7ff]/20 bg-[#8ad7ff]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#8ad7ff]">
            Desarrollo civil y secundario
          </div>
          <p>
            Secundarios, autoridad, kids y ruido civil. Este bloque conserva el material que ayuda a que Retroville
            parezca población real sin mezclarlo con la página de venta principal.
          </p>
        </div>

        <div className={styles.grid}>
          {supportingCharacterSheets.map((item) => (
            <article key={item.title} id={toSketchAnchor(item.title)} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={item.image}
                  alt={`Hoja de proceso de ${item.title} en Retroville`}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className={styles.cardImage}
                  loading="lazy"
                />
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

      {curatedSections.map((group) => (
        <section key={group.title} className={styles.groupSection}>
          <div className={styles.groupHeader}>
            <p className={styles.eyebrow}>Curated selection</p>
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
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <footer className={styles.footer}>
        <p>El archivo seguirá creciendo con más tableros, props, transporte, fauna y revisiones de distrito.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/retroville/presentaciones" className={styles.footerCta}>
            Ver presentación oficial <ArrowRight className="h-4 w-4" />
          </Link>
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
