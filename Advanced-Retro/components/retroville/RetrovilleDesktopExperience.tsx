'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { Anton, Space_Mono } from 'next/font/google';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import { lunaProfile } from '@/lib/retroville-luna';
import styles from './retroville-desktop.module.css';

const displayFont = Anton({ subsets: ['latin'], weight: '400' });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

const titleLetters = ['R', 'E', 'T', 'R', 'O', 'V', 'I', 'L', 'L', 'E'] as const;
const manifestoLines = ['EVERY', 'FORGOTTEN', 'GAME', 'ENDS UP', 'SOMEWHERE.'] as const;
const marqueeItems = [
  'NOX',
  'BUTTON CREW',
  'LUNA',
  'PIXEL GRAVEYARD',
  'RAM DISTRICT',
  'CORRUPTED SAVE',
  'THE NEON BONEYARD',
  'CARTRIDGE QUARTER',
  'DEAD BATTERY',
  'GLITCH MARKET',
  'CONSOLE CORE',
  'LOST SAVE DISTRICT',
  'HARDWARE CEMETERY',
  'BIT ROT ALLEY',
  'THE LAST SAVE',
  'STATIC FIELDS',
  'OVERHEAT ZONE',
  'BUTTON SMASH SQUARE',
  'RETROVILLE',
  'LOAD SCREEN LIMBO',
  '8-BIT BOULEVARD',
  'MEMORY LEAK LANE',
] as const;

const relicGallery = [
  {
    title: 'Mona NOX',
    eyebrow: 'ARCHIVO 01',
    body: 'El cansancio como retrato oficial. La ciudad colecciona versiones imposibles de sus propias leyendas.',
    image: '/images/retroville/retroville-mona.png',
    alt: 'Retrato clásico de NOX en clave pictórica',
  },
  {
    title: 'The Creation of Input',
    eyebrow: 'ARCHIVO 02',
    body: 'Cuando Retroville se vuelve mito, incluso los botones reciben un origen casi sagrado y bastante sospechoso.',
    image: '/images/retroville/retroville-creation.png',
    alt: 'NOX y Button Crew recreando una escena clásica en las nubes',
  },
  {
    title: 'Marble Panic',
    eyebrow: 'ARCHIVO 03',
    body: 'La comedia oscura del universo también sabe convertirse en estatua, tragedia y caos absoluto al mismo tiempo.',
    image: '/images/retroville/retroville-marble.png',
    alt: 'Escultura de mármol con NOX y Button Crew atrapados por serpientes',
  },
  {
    title: 'The Last Save',
    eyebrow: 'ARCHIVO 04',
    body: 'Toda banda acaba reuniéndose alrededor de una mesa. Aquí esa cena siempre termina en discusión sobre memoria y control.',
    image: '/images/retroville/retroville-last-supper.png',
    alt: 'Escena inspirada en la última cena con NOX y Button Crew',
  },
] as const;

const signalCards = [
  {
    title: 'WORLD BUILDING',
    body: 'Una ciudad de hardware olvidado, memorias corruptas y humor raro que se toma muy en serio su propia atmósfera.',
  },
  {
    title: 'DROPS NARRATIVOS',
    body: 'Cada señal debe sentirse como un evento. Una imagen, una frase o un personaje que empuja el universo hacia delante.',
  },
  {
    title: 'RETRO SOCIAL CHAOS',
    body: 'Comunidad, torneos, personajes y piezas visuales que construyen cultura en vez de parecer simple relleno de marketing.',
  },
  {
    title: 'LUNA SIGNAL',
    body: 'Presencia magnética, glamour tóxico y sabotaje emocional. Luna convierte cualquier escena en conversación.',
  },
] as const;

const worldbuildingItems = [
  {
    title: 'RETROVILLE CITY',
    eyebrow: 'SECTOR 01',
    text: 'Un horizonte construido con cartuchos apilados, blisteres rotos y cajas de coleccionista que nadie reclamó. Aquí los vehículos tienen forma de cassette y los rascacielos están hechos de consolas apiladas.',
    reference: 'Concept art fundacional del universo',
    image: '/images/retroville/retroville-street.png',
    placeholder: null,
    align: 'left' as const,
    accent: 'rgba(123,47,255,0.28)',
  },
  {
    title: 'THE PIXEL GRAVEYARD',
    eyebrow: 'SECTOR 02',
    text: 'Un barrio en el límite de la ciudad donde van a parar los juegos que nadie completó. Lápidas de cartuchos. Procesiones de personajes sin final. El silencio aquí suena a pantalla de Game Over que nadie apagó.',
    reference: 'Concept art en desarrollo',
    image: null,
    placeholder: 'CONCEPT ART — THE PIXEL GRAVEYARD',
    align: 'right' as const,
    accent: 'rgba(0,212,255,0.18)',
  },
  {
    title: 'THE NEON BONEYARD',
    eyebrow: 'SECTOR 03',
    text: 'Donde el hardware va a morir lentamente. Consolas medio encendidas, cables que ya no conectan a nada y letreros de neón que parpadean mensajes de juegos que ya no existen. El lugar más honesto de Retroville.',
    reference: 'Concept art en desarrollo',
    image: null,
    placeholder: 'CONCEPT ART — THE NEON BONEYARD',
    align: 'left' as const,
    accent: 'rgba(255,201,64,0.16)',
  },
] as const;

type ImageSlide = {
  kind: 'image';
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  backgroundImage?: string | null;
  figureImage?: string;
  alt: string;
  accent: string;
  align?: 'left' | 'right';
  backgroundPosition?: string;
  figurePosition?: string;
  useCutoutFigure?: boolean;
  moodChips?: readonly string[];
};

type NarrativeSlide =
  | { kind: 'countdown'; title: string; eyebrow: string; description: string }
  | { kind: 'districts'; title: string; eyebrow: string; description: string }
  | { kind: 'manifesto'; title: string; eyebrow: string; description: string }
  | { kind: 'gallery'; title: string; eyebrow: string; description: string }
  | { kind: 'signals'; title: string; eyebrow: string; description: string }
  | { kind: 'waitlist'; title: string; eyebrow: string; description: string }
  | {
      kind: 'world';
      title: string;
      eyebrow: string;
      description: string;
      reference: string;
      image: string | null;
      placeholder: string | null;
      accent: string;
      align?: 'left' | 'right';
    }
  | ImageSlide;

const narrativeSlides: readonly NarrativeSlide[] = [
  {
    kind: 'countdown',
    title: 'VENTANA DE LANZAMIENTO',
    eyebrow: 'LAUNCH WINDOW TARGET',
    description:
      'La primera gran señal de Retroville ya tiene fecha. Este tramo tiene que sentirse como una antesala viva, no como una tarjeta aislada.',
  },
  {
    kind: 'manifesto',
    title: 'EVERY FORGOTTEN GAME ENDS UP SOMEWHERE.',
    eyebrow: 'MANIFIESTO',
    description:
      'Una ciudad oscura. Hardware olvidado. Memorias corruptas. Humor extraño con ambición real.',
  },
  {
    kind: 'districts',
    title: 'MAPA DEL UNIVERSO',
    eyebrow: 'DISTRICTS & SIGNALS',
    description:
      'Antes de que la ciudad se explique sola, hay nombres que ya suenan como lugares reales: barrios, anomalías, calles, mercados y ruinas donde Retroville se va inventando a sí misma.',
  },
  {
    kind: 'world',
    title: worldbuildingItems[0].title,
    eyebrow: worldbuildingItems[0].eyebrow,
    description: worldbuildingItems[0].text,
    reference: worldbuildingItems[0].reference,
    image: worldbuildingItems[0].image,
    placeholder: worldbuildingItems[0].placeholder,
    accent: worldbuildingItems[0].accent,
    align: worldbuildingItems[0].align,
  },
  {
    kind: 'world',
    title: worldbuildingItems[1].title,
    eyebrow: worldbuildingItems[1].eyebrow,
    description: worldbuildingItems[1].text,
    reference: worldbuildingItems[1].reference,
    image: worldbuildingItems[1].image,
    placeholder: worldbuildingItems[1].placeholder,
    accent: worldbuildingItems[1].accent,
    align: worldbuildingItems[1].align,
  },
  {
    kind: 'world',
    title: worldbuildingItems[2].title,
    eyebrow: worldbuildingItems[2].eyebrow,
    description: worldbuildingItems[2].text,
    reference: worldbuildingItems[2].reference,
    image: worldbuildingItems[2].image,
    placeholder: worldbuildingItems[2].placeholder,
    accent: worldbuildingItems[2].accent,
    align: worldbuildingItems[2].align,
  },
  {
    kind: 'image',
    title: 'NOX',
    eyebrow: 'EL SUPERVIVIENTE',
    description:
      'Sarcasmo, batería baja y una dignidad bastante discutible. NOX no dirige la ciudad por épica. Lo hace porque nadie más soporta el turno de noche.',
    image: '/images/retroville/nox-character-large.png',
    figureImage: '/images/retroville/nox-character-large.png',
    backgroundImage: null,
    alt: 'NOX dentro del universo Retroville',
    accent: 'rgba(74, 158, 255, 0.22)',
    align: 'right',
    figurePosition: 'center bottom',
    useCutoutFigure: true,
    moodChips: ['Sarcasmo', 'Turno de noche', 'Batería baja'],
  },
  {
    kind: 'image',
    title: 'BUTTON CREW',
    eyebrow: 'EL RUIDO SOCIAL',
    description:
      'A, B, Y y X son la conversación permanente de Retroville: impulsivos, cínicos, analíticos y caóticos. Siempre llegan juntos. Siempre complican algo.',
    image: '/images/retroville/button-crew-character-large.png',
    figureImage: '/images/retroville/button-crew-character-large.png',
    backgroundImage: null,
    alt: 'Button Crew posando como grupo dentro de Retroville',
    accent: 'rgba(255, 192, 83, 0.18)',
    align: 'left',
    figurePosition: 'center bottom',
    useCutoutFigure: true,
    moodChips: ['A / B / Y / X', 'Caos social', 'Ruido constante'],
  },
  {
    kind: 'image',
    title: lunaProfile.name,
    eyebrow: 'VARIABLE DE CAOS',
    description:
      'Luna entra en Retroville como una interferencia elegante: magnética, caprichosa y peligrosamente divertida. Manipula la atención, coquetea con el desastre y mantiene a NOX orbitando demasiado cerca. “No soy tóxica. Tú solo estás demasiado apegado.”',
    image: '/images/retroville/luna-character-large.png',
    figureImage: '/images/retroville/luna-character-large.png',
    backgroundImage: '/images/retroville/luna-nox-lounge.png',
    alt: 'Luna junto a NOX en un lounge arcade dentro de Retroville',
    accent: 'rgba(191, 92, 149, 0.20)',
    align: 'right',
    backgroundPosition: 'center center',
    figurePosition: 'center bottom',
    useCutoutFigure: true,
    moodChips: ['Magnetismo', 'Glamour tóxico', 'Interferencia'],
  },
  {
    kind: 'image',
    title: 'CAPITAL DEL CAOS',
    eyebrow: 'SEÑAL ECONÓMICA',
    description:
      'Si la ciudad empieza a imprimir dinero emocional, esta es la sala de juntas. Ambición absurda, euforia y demasiadas consolas en la misma mesa.',
    image: '/images/retroville/retroville-chaos-office.png',
    alt: 'NOX y Button Crew celebrando en una oficina caótica dentro del universo Retroville',
    accent: 'rgba(255,60,0,0.24)',
    align: 'right',
  },
  {
    kind: 'gallery',
    title: 'LOS APÓCRIFOS DE RETROVILLE',
    eyebrow: 'ARCHIVE VISIONS',
    description:
      'La parte divertida y rara del universo también vive aquí: reliquias visuales, mitología absurda y piezas que hacen que Retroville tenga memoria propia.',
  },
  {
    kind: 'signals',
    title: 'SEÑALES DE EXPANSIÓN',
    eyebrow: 'SYSTEM SIGNALS',
    description: 'World building, drops narrativos y caos social dentro de una misma frecuencia visual.',
  },
  {
    kind: 'waitlist',
    title: 'ENTRA ANTES DE QUE EL RESTO DE INTERNET LO RECUERDE',
    eyebrow: 'WAITLIST',
    description:
      'Primer drop. Primer reveal. Primera señal jugable. Retroville tiene que sentirse como un universo que se descubre, no como otra página de próximamente.',
  },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function slideAccentStyle(accent: string): CSSProperties {
  return { ['--retroville-slide-accent' as string]: accent } as CSSProperties;
}

function imageSurfaceStyle(backgroundImage: string | null | undefined, accent: string): CSSProperties {
  const baseLayers = [
    'linear-gradient(180deg, rgba(2,3,8,0.54), rgba(2,3,8,0.92))',
    `radial-gradient(circle at 50% 18%, ${accent}, transparent 42%)`,
    'radial-gradient(circle at 14% 78%, rgba(0, 212, 255, 0.10), transparent 26%)',
    'radial-gradient(circle at 86% 22%, rgba(155, 92, 255, 0.14), transparent 30%)',
  ];

  return {
    ['--retroville-slide-accent' as string]: accent,
    backgroundImage: backgroundImage ? `${baseLayers.join(', ')}, url(${backgroundImage})` : baseLayers.join(', '),
  } as CSSProperties;
}

function CountdownFallback({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-[1.7rem] border border-white/10 bg-[rgba(8,12,24,0.62)] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl ${className}`}
      aria-hidden
    >
      <div className="mb-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.26em] text-white/48 sm:text-[11px]">
        <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
        Secuencia de lanzamiento
      </div>
      <div className="grid grid-cols-4 gap-2">
        {['Días', 'Horas', 'Min', 'Seg'].map((label) => (
          <div
            key={label}
            className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-2 py-3 text-center"
          >
            <span className="block text-xl font-black tabular-nums text-white/60 sm:text-2xl">--</span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.22em] text-white/42 sm:text-[10px]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const RetrovilleCountdown = dynamic(
  () => import('@/components/retroville/RetrovilleCountdown'),
  {
    ssr: false,
    loading: () => <CountdownFallback />,
  }
);

export default function RetrovilleDesktopExperience({
  launchIso,
  launchLabel,
  waitlistCount,
}: {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
}) {
  const heroRef = useRef<HTMLElement | null>(null);
  const [desktopProgress, setDesktopProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasDesktopInteracted, setHasDesktopInteracted] = useState(false);

  const hypeGoal = 5000;
  const hypePct = waitlistCount > 0 ? clamp(waitlistCount / hypeGoal, 0, 1) : 0;
  const repeatedMarqueeItems = [...marqueeItems, ...marqueeItems];
  const desktopStep = 100 / narrativeSlides.length;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const isCinematicDesktop = !isMobile && !prefersReducedMotion;

  useEffect(() => {
    if (!isCinematicDesktop) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const advance = (delta: number) => {
      if (Math.abs(delta) < 0.0001) return;
      setHasDesktopInteracted(true);
      setDesktopProgress((previous) => clamp(previous + delta, 0, 1));
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      advance(event.deltaY * 0.00042);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        advance(0.05);
      }
      if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(event.key)) {
        event.preventDefault();
        advance(-0.05);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        setDesktopProgress(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        setDesktopProgress(1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isCinematicDesktop]);

  const heroProgress = isCinematicDesktop ? desktopProgress : 0;
  const desktopHeroProgress = clamp(heroProgress / 0.26);
  const desktopPortalReveal = clamp((heroProgress - 0.12) / 0.18);
  const desktopTrackReveal = clamp((heroProgress - 0.18) / 0.1);
  const desktopRailProgress = clamp((heroProgress - 0.26) / 0.74);
  const desktopSlideIndex = Math.round(desktopRailProgress * (narrativeSlides.length - 1));
  const activeSlide = desktopSlideIndex;
  const trackTranslate = isCinematicDesktop ? desktopRailProgress * (narrativeSlides.length - 1) * desktopStep : 0;
  const manifestoActive = !isCinematicDesktop || activeSlide >= 1;
  const heroStage = isCinematicDesktop ? desktopHeroProgress : 0;
  const portalReveal = isCinematicDesktop ? desktopPortalReveal : 0;
  const trackReveal = isCinematicDesktop ? desktopTrackReveal : 0;
  const heroCopyFade = isCinematicDesktop ? clamp(1 - clamp((heroProgress - 0.1) / 0.18), 0, 1) : 1;
  const heroMetaFade = isCinematicDesktop ? clamp(1 - clamp((heroProgress - 0.08) / 0.18), 0, 1) : 1;
  const desktopProgressWidth = ((activeSlide + 1) / narrativeSlides.length) * 100;
  const desktopPortalBlur = heroStage > 0.58 ? (heroStage - 0.58) * 34 : 0;
  const desktopPortalScale = 1 + heroStage * 26;
  const desktopPortalFogOpacity = clamp((heroProgress - 0.14) / 0.16, 0, 1);
  const desktopRailLift = (1 - trackReveal) * 32;

  const jumpIntoNarrative = () => {
    if (!isCinematicDesktop) return;
    setHasDesktopInteracted(true);
    setDesktopProgress((previous) => Math.max(previous, 0.26));
  };

  const renderMobileSlide = (slide: NarrativeSlide) => {
    if (slide.kind === 'countdown') {
      return (
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <h3 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white`}>{slide.title}</h3>
          <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
          <div className={`${styles.countGlow} mt-6 rounded-[1.7rem] border border-white/10 bg-black/28 p-3`}>
            <RetrovilleCountdown targetIso={launchIso} className="border-0 bg-transparent p-0 shadow-none" />
          </div>
        </div>
      );
    }

    if (slide.kind === 'districts') {
      return (
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <h3 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white`}>{slide.title}</h3>
          <p className="mt-4 max-w-[34rem] text-sm leading-7 text-white/64">{slide.description}</p>
          <div className="mt-6 space-y-3 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[rgba(10,12,18,0.84)] p-4">
            {[0, 1].map((row) => (
              <div key={row} className="flex flex-wrap gap-2">
                {marqueeItems.slice(row * 11, row * 11 + 11).map((item, index) => (
                  <span
                    key={`${row}-${item}`}
                    className="inline-flex min-h-10 items-center rounded-full border px-4 text-[11px] uppercase tracking-[0.24em]"
                    style={{
                      borderColor: index % 2 === 0 ? 'rgba(0,255,136,0.28)' : 'rgba(123,47,255,0.32)',
                      color: index % 2 === 0 ? 'var(--rv-accent)' : 'var(--rv-accent2)',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (slide.kind === 'manifesto') {
      return (
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <div className="mt-5 space-y-2">
            {manifestoLines.map((line) => (
              <p key={line} className={`${displayFont.className} text-[2.8rem] uppercase leading-[0.88] text-white sm:text-[3.2rem]`}>
                {line}
              </p>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-white/62">{slide.description}</p>
        </div>
      );
    }

    if (slide.kind === 'world') {
      const alignLeft = slide.align !== 'right';

      return (
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <h3 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white`}>{slide.title}</h3>
          <p className="mt-4 max-w-[34rem] text-sm leading-7 text-white/64">{slide.description}</p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/40">{slide.reference}</p>
          <div className={`mt-6 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(9,11,18,0.86)] ${alignLeft ? '' : ''}`}>
            {slide.image ? (
              <div className="relative aspect-[4/3]">
                <Image src={slide.image} alt={slide.title} fill sizes="90vw" className="object-cover object-center" />
              </div>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="text-4xl">🎮</span>
                <span className="text-sm uppercase tracking-[0.28em] text-white/60">Concept Art</span>
                <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--rv-accent)]">
                  {slide.placeholder || 'En desarrollo'}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (slide.kind === 'gallery') {
      return (
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <h3 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white`}>{slide.title}</h3>
          <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {relicGallery.map((item) => (
              <article key={item.title} className={`${styles.galleryCard} overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04]`}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={item.image} alt={item.alt} fill sizes="44vw" className="object-cover object-center" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-accent3)]">{item.eyebrow}</p>
                  <p className="mt-2 text-base font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (slide.kind === 'signals') {
      return (
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <h3 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white`}>{slide.title}</h3>
          <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
          <div className="mt-6 grid gap-4">
            {signalCards.map((card) => (
              <article key={card.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-accent)]">Signal</p>
                <p className="mt-2 text-base font-semibold text-white">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (slide.kind === 'waitlist') {
      return (
        <div id="waitlist" className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <h3 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white`}>{slide.title}</h3>
          <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
          {waitlistCount > 0 ? (
            <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4 text-sm text-white/62">
                <span>{waitlistCount.toLocaleString('es-ES')} registros</span>
                <span>Objetivo {hypeGoal.toLocaleString('es-ES')}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(135deg,var(--rv-accent2),var(--rv-accent3),var(--rv-accent))]"
                  style={{ width: `${Math.round(hypePct * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
          <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-[rgba(8,10,16,0.72)] p-4 backdrop-blur-xl">
            <RetrovilleWaitlistForm
              darkMode
              buttonLabel="QUIERO SER EL PRIMERO"
              successMessage="Perfecto. Ya formas parte de la primera señal de Retroville."
            />
          </div>
          <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/50">
            <p>© AdvancedRetro · Retroville está en desarrollo.</p>
            <Link href="/" className="mt-3 inline-flex text-white transition hover:text-[var(--rv-accent)]">
              ← Volver a AdvancedRetro
            </Link>
          </div>
        </div>
      );
    }

    const slideSurface = slideAccentStyle(slide.accent);

    return (
      <>
        <div
          className={`${styles.slideVisual} relative aspect-[4/3] overflow-hidden border-b border-white/10`}
          style={slideSurface}
        >
          <div className={styles.slideBackdrop}>
            <div
              className={`${styles.characterAtmosphere} ${slide.align === 'right' ? styles.characterAtmosphereRight : styles.characterAtmosphereLeft}`}
              style={slideSurface}
            />
            {slide.backgroundImage ? (
              <Image
                src={slide.backgroundImage}
                alt=""
                fill
                sizes="88vw"
                className={styles.characterAtmosphereImage}
                style={{ objectPosition: slide.backgroundPosition || 'center center' }}
                aria-hidden
              />
            ) : null}
          </div>
          <div className={styles.characterAtmosphereVeil} />
          <div className={styles.characterGroundGlow} style={slideSurface} />
          <div className={styles.slideForeground}>
            <div className={styles.characterFigureWrapMobile}>
              <Image
                src={slide.figureImage || slide.image}
                alt={slide.alt}
                fill
                sizes="88vw"
                className={styles.characterFigureLarge}
                style={{ objectPosition: slide.figurePosition || 'center bottom' }}
              />
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
          <h3 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white`}>{slide.title}</h3>
          {slide.moodChips?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {slide.moodChips.map((chip) => (
                <span key={chip} className={styles.characterChip} style={slideSurface}>
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
        </div>
      </>
    );
  };

  const renderDesktopSlide = (slide: NarrativeSlide) => {
    if (slide.kind === 'countdown') {
      return (
        <div className="relative flex h-full items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(123,47,255,0.22),transparent_32%),radial-gradient(circle_at_50%_78%,rgba(255,60,0,0.14),transparent_26%)]" />
          <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] items-center gap-10 px-10 py-14 xl:px-14">
            <div className="max-w-[30rem]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <h3 className={`${displayFont.className} mt-4 text-[5.2rem] uppercase leading-[0.88] text-white`}>
                {slide.title}
              </h3>
              <p className="mt-6 text-base leading-8 text-white/64">{slide.description}</p>
            </div>
            <div className={`${styles.countGlow} rounded-[2rem] border border-white/10 bg-[rgba(6,8,12,0.72)] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl`}>
              <div className="mb-5 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/42">
                <span>Countdown activo</span>
                <span>{launchLabel}</span>
              </div>
              <RetrovilleCountdown targetIso={launchIso} className="border-0 bg-transparent p-0 shadow-none" />
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'districts') {
      return (
        <div className="relative flex h-full items-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,14,0.98),rgba(6,8,18,0.96)),radial-gradient(circle_at_16%_26%,rgba(0,212,255,0.14),transparent_20%),radial-gradient(circle_at_86%_72%,rgba(123,47,255,0.18),transparent_22%)]" />
          <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] items-center gap-8 px-10 py-14 xl:px-14">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <h3 className={`${displayFont.className} mt-4 text-[4.8rem] uppercase leading-[0.88] text-white`}>{slide.title}</h3>
              <p className="mt-6 max-w-[30rem] text-base leading-8 text-white/64">{slide.description}</p>
            </div>
            <div className="space-y-5">
              {[0, 1].map((row) => (
                <div key={row} className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(9,12,20,0.76)] px-4 py-5 backdrop-blur-xl">
                  <div className={`${styles.districtMarqueeTrack} ${row === 1 ? styles.districtMarqueeTrackAlt : ''}`}>
                    {[...repeatedMarqueeItems, ...repeatedMarqueeItems].map((item, index) => (
                      <span
                        key={`${row}-${item}-${index}`}
                        className={styles.districtTag}
                        style={{
                          borderColor: index % 2 === 0 ? 'rgba(0,255,136,0.28)' : 'rgba(123,47,255,0.32)',
                          color: index % 2 === 0 ? 'var(--rv-accent)' : 'var(--rv-accent2)',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'manifesto') {
      return (
        <div className="relative flex h-full items-center overflow-hidden">
          <div className="absolute inset-y-0 left-[18%] w-px bg-white/10" />
          <div className="absolute inset-y-0 right-[18%] w-px bg-white/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,rgba(123,47,255,0.16),transparent_30%),radial-gradient(circle_at_58%_70%,rgba(0,255,136,0.08),transparent_24%)]" />
          <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)] items-end gap-8 px-10 py-14 xl:px-14">
            <div className="pb-10">
              {manifestoLines.map((line, index) => (
                <p
                  key={line}
                  className={`${displayFont.className} ${styles.manifestLine} ${manifestoActive ? styles.manifestLineVisible : ''} text-[6.4rem] uppercase leading-[0.84] text-white xl:text-[8rem]`}
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="pb-12">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <p className="mt-6 max-w-[22rem] text-sm uppercase tracking-[0.28em] leading-7 text-white/48">
                {slide.description}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'world') {
      const alignLeft = slide.align !== 'right';

      return (
        <div className="relative flex h-full items-center overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg,rgba(4,5,12,0.98),rgba(6,7,16,0.96)), radial-gradient(circle at 20% 20%, ${slide.accent}, transparent 22%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.04), transparent 18%)` }} />
          <div className={`relative mx-auto grid h-full w-full max-w-[1540px] ${alignLeft ? 'grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]' : 'grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)]'} items-center gap-10 px-10 py-14 xl:px-14`}>
            <div className={`${alignLeft ? 'order-1' : 'order-2'} flex flex-col justify-center`}>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <h3 className={`${displayFont.className} mt-4 text-[5rem] uppercase leading-[0.88] text-white`}>{slide.title}</h3>
              <p className="mt-6 max-w-[33rem] text-base leading-8 text-white/64">{slide.description}</p>
              <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/40">{slide.reference}</p>
            </div>
            <div className={`${alignLeft ? 'order-2' : 'order-1'} flex items-center ${alignLeft ? 'justify-end' : 'justify-start'}`}>
              <div className="relative h-[72vh] w-full max-w-[52rem] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[rgba(10,12,18,0.76)] shadow-[0_30px_120px_rgba(0,0,0,0.34)]">
                {slide.image ? (
                  <Image src={slide.image} alt={slide.title} fill sizes="44vw" className="object-cover object-center" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_44%)] px-8 text-center">
                    <span className="text-5xl">🎮</span>
                    <span className="text-base uppercase tracking-[0.3em] text-white/60">Concept Art</span>
                    <span className="text-[12px] uppercase tracking-[0.24em] text-[var(--rv-accent)]">
                      {slide.placeholder || 'En desarrollo'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,3,0.14),transparent_18%,transparent_82%,rgba(3,3,3,0.62))]" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'gallery') {
      return (
        <div className="relative flex h-full items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(123,47,255,0.12),transparent_20%),radial-gradient(circle_at_12%_50%,rgba(0,212,255,0.08),transparent_22%),radial-gradient(circle_at_88%_54%,rgba(255,201,64,0.08),transparent_22%),linear-gradient(180deg,rgba(4,5,12,0.98),rgba(6,7,16,0.98))]" />
          <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] items-center gap-8 px-10 py-12 xl:px-14">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <h3 className={`${displayFont.className} mt-4 text-[4.8rem] uppercase leading-[0.88] text-white`}>{slide.title}</h3>
              <p className="mt-6 max-w-[24rem] text-base leading-8 text-white/64">{slide.description}</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {relicGallery.map((item) => (
                <article key={item.title} className={`${styles.galleryCard} overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(10,10,14,0.74)]`}>
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <Image src={item.image} alt={item.alt} fill sizes="28vw" className="object-cover object-center" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-accent3)]">{item.eyebrow}</p>
                    <h4 className={`${displayFont.className} mt-2 text-[2rem] uppercase leading-none text-white`}>{item.title}</h4>
                    <p className="mt-3 text-sm leading-6 text-white/60">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'signals') {
      return (
        <div className="relative flex h-full items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(0,255,136,0.10),transparent_24%),radial-gradient(circle_at_74%_16%,rgba(123,47,255,0.18),transparent_26%)]" />
          <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.28fr)_minmax(0,0.72fr)] items-center gap-8 px-10 py-14 xl:px-14">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <h3 className={`${displayFont.className} mt-4 text-[4.8rem] uppercase leading-[0.88] text-white`}>{slide.title}</h3>
              <p className="mt-6 max-w-[22rem] text-base leading-8 text-white/64">{slide.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {signalCards.map((card) => (
                <article key={card.title} className="rounded-[1.8rem] border border-white/10 bg-[rgba(10,10,14,0.72)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-accent)]">Signal</p>
                  <h4 className={`${displayFont.className} mt-3 text-[2.1rem] uppercase leading-none text-white`}>{card.title}</h4>
                  <p className="mt-4 text-sm leading-7 text-white/62">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'waitlist') {
      return (
        <div id="waitlist" className="relative flex h-full items-center overflow-hidden">
          <div className={`${styles.waitlistNoise} absolute inset-0`} />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(123,47,255,0.14),transparent_36%),linear-gradient(225deg,rgba(0,255,136,0.10),transparent_30%)]" />
          <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] items-center gap-10 px-10 py-14 xl:px-14">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <h3 className={`${displayFont.className} mt-4 text-[4.8rem] uppercase leading-[0.88] text-white`}>{slide.title}</h3>
              <p className="mt-6 max-w-[34rem] text-base leading-8 text-white/64">{slide.description}</p>
              {waitlistCount > 0 ? (
                <div className="mt-7 max-w-[34rem] rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-4 text-sm text-white/62">
                    <span>{waitlistCount.toLocaleString('es-ES')} registros</span>
                    <span>Objetivo {hypeGoal.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(135deg,var(--rv-accent2),var(--rv-accent3),var(--rv-accent))]"
                      style={{ width: `${Math.round(hypePct * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="mt-10 text-sm text-white/48">
                <p>© AdvancedRetro · Retroville está en desarrollo.</p>
                <Link href="/" className="mt-3 inline-flex text-white transition hover:text-[var(--rv-accent)]">
                  ← Volver a AdvancedRetro
                </Link>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-[rgba(8,10,16,0.72)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <RetrovilleWaitlistForm
                darkMode
                buttonLabel="QUIERO SER EL PRIMERO"
                successMessage="Perfecto. Ya formas parte de la primera señal de Retroville."
              />
            </div>
          </div>
        </div>
      );
    }

    const alignLeft = slide.align !== 'right';
    const backgroundImage = slide.backgroundImage === undefined ? slide.image : slide.backgroundImage;
    const figureImage = slide.figureImage || slide.image;

    if (slide.useCutoutFigure) {
      return (
        <div className="relative h-full overflow-hidden" style={imageSurfaceStyle(backgroundImage, slide.accent)}>
          <div className={styles.sceneNoise} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,3,8,0.92),rgba(3,4,10,0.76)_24%,rgba(4,5,12,0.76)_74%,rgba(2,3,8,0.96))]" />
          <div className="absolute inset-y-0 left-[-10%] w-[40%] bg-[radial-gradient(circle_at_left,rgba(0,212,255,0.12),transparent_72%)] blur-[80px]" />
          <div className="absolute inset-y-0 right-[-10%] w-[40%] bg-[radial-gradient(circle_at_right,rgba(155,92,255,0.18),transparent_76%)] blur-[86px]" />

          <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] items-center gap-10 px-10 py-12 xl:px-14">
            <div className={`${alignLeft ? 'order-1' : 'order-2'} flex h-full items-center justify-center`}>
              <div className={`${styles.characterStage} ${alignLeft ? styles.characterStageLeft : styles.characterStageRight}`}>
                <div className={styles.characterAtmosphere} style={slideAccentStyle(slide.accent)} />
                <div className={`${styles.characterAtmosphereOrb} ${styles.characterAtmosphereOrbPrimary}`} style={slideAccentStyle(slide.accent)} />
                <div className={`${styles.characterAtmosphereOrb} ${styles.characterAtmosphereOrbSecondary}`} style={slideAccentStyle(slide.accent)} />
                <div className={`${styles.characterAtmosphereBeam} ${alignLeft ? styles.characterAtmosphereBeamLeft : styles.characterAtmosphereBeamRight}`} style={slideAccentStyle(slide.accent)} />
                {backgroundImage ? (
                  <Image
                    src={backgroundImage}
                    alt=""
                    fill
                    sizes="42vw"
                    className={styles.characterAtmosphereImage}
                    style={{ objectPosition: slide.backgroundPosition || 'center center' }}
                    aria-hidden
                  />
                ) : null}
                <div className={styles.characterAtmosphereVeil} />
                <div className={styles.characterGroundGlow} style={slideAccentStyle(slide.accent)} />
                <div className={styles.characterFigureWrap}>
                  <Image
                    src={figureImage}
                    alt={slide.alt}
                    fill
                    sizes="40vw"
                    className={`${styles.characterFigureLarge} ${alignLeft ? styles.characterFigureLargeLeft : styles.characterFigureLargeRight}`}
                    style={{ objectPosition: slide.figurePosition || 'center bottom' }}
                  />
                </div>
              </div>
            </div>
            <div className={`${alignLeft ? 'order-2' : 'order-1'} flex flex-col justify-center ${alignLeft ? 'pl-2' : 'pr-2'}`}>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
              <div className="mt-5 max-w-[38rem]">
                <h3 className={`${displayFont.className} ${styles.characterCopyTitle}`}>{slide.title}</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {slide.moodChips?.map((chip) => (
                    <span key={chip} className={styles.characterChip} style={slideAccentStyle(slide.accent)}>
                      {chip}
                    </span>
                  ))}
                </div>
                <div className={styles.characterCopyRule} style={slideAccentStyle(slide.accent)} />
                <p className={styles.characterCopyText}>{slide.description}</p>
                <div
                  className="mt-6 h-px w-full max-w-[26rem]"
                  style={{ background: `linear-gradient(90deg, ${slide.accent}, transparent)` }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full overflow-hidden" style={imageSurfaceStyle(backgroundImage, slide.accent)}>
        <div className={styles.sceneNoise} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16),transparent_18%,transparent_80%,rgba(0,0,0,0.58))]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,3,0.92),rgba(3,3,3,0.42)_24%,rgba(3,3,3,0.42)_76%,rgba(3,3,3,0.92))]" />
        <div className="absolute inset-y-0 left-[-10%] w-[40%] bg-[radial-gradient(circle_at_left,rgba(0,212,255,0.16),transparent_72%)] blur-[80px]" />
        <div className="absolute inset-y-0 right-[-10%] w-[40%] bg-[radial-gradient(circle_at_right,rgba(155,92,255,0.18),transparent_76%)] blur-[86px]" />

        <div className="relative mx-auto grid h-full w-full max-w-[1540px] grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] items-center gap-10 px-10 py-12 xl:px-14">
          <div className={`${alignLeft ? 'order-1' : 'order-2'} relative flex h-full items-end`}>
            <div className="absolute inset-0 rounded-[2.4rem] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_62%)]" />
            <div className={`${styles.sceneFigureShell} ${alignLeft ? styles.sceneFigureShellLeft : styles.sceneFigureShellRight}`}>
              {backgroundImage ? (
                <div className={styles.slideBackdrop}>
                  <Image
                    src={backgroundImage}
                    alt=""
                    fill
                    sizes="48vw"
                    className={styles.slideBackdropImage}
                    style={{ objectPosition: slide.backgroundPosition || 'center center' }}
                    aria-hidden
                  />
                </div>
              ) : null}
              <div className={`${styles.slideVisualTint} ${slide.useCutoutFigure ? styles.slideVisualTintCutout : ''}`} />
              <div className={`${styles.slideForeground} ${alignLeft ? styles.sceneFigureMaskLeft : styles.sceneFigureMaskRight}`}>
                <Image
                  src={figureImage}
                  alt={slide.alt}
                  fill
                  sizes="48vw"
                  className={slide.useCutoutFigure ? styles.slideImageCutout : styles.slideImage}
                  style={{ objectPosition: slide.figurePosition || slide.backgroundPosition || 'center center' }}
                />
              </div>
              <div className={`${styles.sceneEdgeBlend} ${alignLeft ? styles.sceneEdgeBlendLeft : styles.sceneEdgeBlendRight}`} />
              <div className={styles.sceneVerticalBlend} />
            </div>
          </div>
          <div className={`${alignLeft ? 'order-2' : 'order-1'} flex flex-col justify-center ${alignLeft ? 'pl-2' : 'pr-2'}`}>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
            <div className="mt-5 max-w-[36rem] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,14,24,0.54),rgba(7,9,14,0.72))] p-8 shadow-[0_28px_100px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <h3 className={`${displayFont.className} text-[5.2rem] uppercase leading-[0.88] text-white`}>{slide.title}</h3>
              <p className="mt-6 text-lg leading-9 text-white/66">{slide.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className={`${monoFont.className} overflow-x-hidden bg-[var(--rv-bg)] text-[var(--rv-text)]`}>
      {isCinematicDesktop ? (
        <section ref={heroRef} className="relative h-[100svh] overflow-hidden bg-[var(--rv-bg)]">
          <div className="absolute inset-0">
            <Image
              src="/images/retroville/retroville-hero-portal-bg.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
              aria-hidden
            />
          </div>
          <div className={`absolute inset-0 ${styles.heroNoise}`} />
          <div className={styles.scanlines} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,2,4,0.62),rgba(2,2,4,0.84))]" />
          <div className="absolute inset-y-0 left-[-16%] w-[56%] bg-[radial-gradient(circle_at_20%_50%,rgba(138,215,255,0.24),transparent_58%)] blur-[120px]" />
          <div className="absolute inset-y-0 right-[-16%] w-[58%] bg-[radial-gradient(circle_at_80%_50%,rgba(255,58,136,0.22),transparent_60%)] blur-[130px]" />
          <div className="absolute inset-x-0 bottom-[-16%] h-[44rem] bg-[radial-gradient(circle_at_50%_100%,rgba(255,60,0,0.18),transparent_42%)] blur-[24px]" />
          <div className={styles.heroFloorBlend} />
          <div className={styles.heroSceneMistGlobal} />

          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">Universo original de AdvancedRetro</p>
            <Link
              href="/"
              className="rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/68 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              Volver a AdvancedRetro
            </Link>
          </div>

          <div className="absolute inset-0">
            <div className="absolute inset-y-0 left-[-18%] w-[52%] bg-[radial-gradient(circle_at_18%_52%,rgba(138,215,255,0.24),transparent_54%)] blur-[120px]" />
            <div className="absolute inset-y-0 right-[-18%] w-[54%] bg-[radial-gradient(circle_at_82%_48%,rgba(123,47,255,0.28),transparent_56%)] blur-[132px]" />

            <div className="absolute left-[-4%] top-[12%] hidden h-[72%] w-[38%] lg:block">
              <div
                className={`${styles.heroCharacterShell} ${styles.heroCharacterShellLeft} relative h-full w-full`}
                style={{ transform: `translate3d(${heroStage * 14}px, ${-heroStage * 34}px, 0)` }}
              >
                <div className={styles.heroSceneWashLeft}>
                  <Image
                    src="/images/retroville/nox-push.png"
                    alt=""
                    fill
                    sizes="30vw"
                    className={styles.heroSceneWashImageLeft}
                    aria-hidden
                  />
                </div>
                <Image
                  src="/images/retroville/nox-push.png"
                  alt=""
                  fill
                  sizes="30vw"
                  className={`${styles.heroCharacterBackdrop} object-cover object-left-center`}
                  aria-hidden
                />
                <div className={styles.heroCharacterAuraLeft} />
                <div className={styles.heroSceneMistLeft} />
                <Image
                  src="/images/retroville/nox-push.png"
                  alt="NOX empujando hacia el centro del universo Retroville"
                  fill
                  priority
                  sizes="30vw"
                  className={`${styles.heroCharacterArt} ${styles.heroCharacterArtLeft} object-cover object-left-center`}
                />
                <div className={styles.heroCharacterFadeLeft} />
              </div>
            </div>

            <div className="absolute right-[-6%] top-[16%] hidden h-[66%] w-[40%] lg:block">
              <div
                className={`${styles.heroCharacterShell} ${styles.heroCharacterShellRight} relative h-full w-full`}
                style={{ transform: `translate3d(${-heroStage * 14}px, ${-heroStage * 30}px, 0)` }}
              >
                <div className={styles.heroSceneWashRight}>
                  <Image
                    src="/images/retroville/button-crew-push.png"
                    alt=""
                    fill
                    sizes="32vw"
                    className={styles.heroSceneWashImageRight}
                    aria-hidden
                  />
                </div>
                <Image
                  src="/images/retroville/button-crew-push.png"
                  alt=""
                  fill
                  sizes="32vw"
                  className={`${styles.heroCharacterBackdrop} object-cover object-right-center`}
                  aria-hidden
                />
                <div className={styles.heroCharacterAuraRight} />
                <div className={styles.heroSceneMistRight} />
                <Image
                  src="/images/retroville/button-crew-push.png"
                  alt="Button Crew empujando hacia el centro del universo Retroville"
                  fill
                  priority
                  sizes="32vw"
                  className={`${styles.heroCharacterArt} ${styles.heroCharacterArtRight} object-cover object-right-center`}
                />
                <div className={styles.heroCharacterFadeRight} />
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-[6] bg-[radial-gradient(circle_at_50%_50%,rgba(123,47,255,0.18),transparent_26%),linear-gradient(180deg,rgba(3,3,3,0.08),rgba(3,3,3,0.46))]"
            style={{ opacity: clamp(0.16 + portalReveal * 0.84, 0.16, 1) }}
          />

          <div
            className="pointer-events-none absolute inset-[16%_34%_16%_34%] z-[7] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_68%)] blur-[110px]"
            style={{
              transform: `scale(${1 + heroStage * 2.8})`,
              opacity: clamp(0.48 + heroStage * 0.52, 0.48, 1),
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 z-[9] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.16),transparent_12%),radial-gradient(circle_at_50%_50%,rgba(123,47,255,0.3),transparent_24%),radial-gradient(circle_at_50%_50%,rgba(7,9,14,0.84),transparent_42%)]"
            style={{
              opacity: desktopPortalFogOpacity,
              filter: `blur(${18 + portalReveal * 28}px)`,
            }}
          />

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center sm:px-8 lg:px-10">
            <p
              className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/74"
              style={{ opacity: heroMetaFade }}
            >
              Reveal interactivo
            </p>

            <h1 className={`${displayFont.className} mt-6 text-[3.8rem] uppercase leading-[0.84] text-white sm:text-[5.8rem] lg:text-[8.2rem] xl:text-[9.4rem]`}>
              <span className={styles.titleWord}>
                {titleLetters.map((letter, index) => {
                  const isZoom = letter === 'O' && index === 4;
                  const spread = index < 4 ? -1 : 1;
                  const opacity = isZoom ? 1 : heroCopyFade;
                  const translateX = isZoom ? 0 : heroStage * spread * 44;
                  const translateY = heroStage * -14;

                  return (
                    <span
                      key={`${letter}-${index}`}
                      data-letter={letter}
                      className={`${styles.titleLetter} ${isZoom ? styles.titleLetterZoom : ''}`}
                      style={{
                        opacity: clamp(opacity, 0, 1),
                        transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${isZoom ? desktopPortalScale : 1})`,
                        filter: isZoom ? `blur(${desktopPortalBlur}px)` : undefined,
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
            </h1>

            <p
              className="mx-auto mt-5 max-w-[18ch] text-2xl font-semibold leading-tight text-white sm:text-[2rem] lg:text-[2.35rem]"
              style={{ opacity: heroCopyFade, transform: `translateY(${heroStage * -10}px)` }}
            >
              Every forgotten game ends up somewhere.
            </p>

            <p className="mx-auto mt-5 max-w-[40rem] text-sm leading-8 text-white/62 sm:text-base" style={{ opacity: heroCopyFade }}>
              Una ciudad oscura de hardware olvidado, memorias corruptas y personajes que siguen empujando el sistema incluso cuando todo lo demás ya se apagó.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3" style={{ opacity: heroCopyFade }}>
              <button
                type="button"
                onClick={jumpIntoNarrative}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--rv-accent2),var(--rv-accent))] px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_48px_rgba(138,215,255,0.16)] transition hover:brightness-110"
              >
                Enter Retroville
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {!hasDesktopInteracted ? (
              <p className="mt-10 text-[11px] uppercase tracking-[0.32em] text-white/44">
                Usa la rueda o las flechas para avanzar
              </p>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-white/10 px-5 py-4 text-[11px] uppercase tracking-[0.28em] text-white/48 sm:px-8 lg:px-10" style={{ opacity: heroMetaFade }}>
            <span>Portal estable</span>
            <span>Launch window target · {launchLabel}</span>
          </div>

          <div
            className={`absolute inset-0 z-[12] overflow-hidden ${trackReveal > 0.98 ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{
              opacity: trackReveal,
              transform: `translateY(${desktopRailLift}px) scale(${0.98 + trackReveal * 0.02})`,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,10,0.98),rgba(4,5,12,0.98)),radial-gradient(circle_at_50%_50%,rgba(11,14,24,0.18),transparent_22%),radial-gradient(circle_at_50%_0%,rgba(123,47,255,0.14),transparent_24%),radial-gradient(circle_at_20%_18%,rgba(123,47,255,0.06),transparent_20%),radial-gradient(circle_at_80%_18%,rgba(0,255,136,0.04),transparent_18%)]" />
            <div className={styles.viewportBlend} />
            <div className={styles.portalTrackBlend} style={{ opacity: clamp(1 - portalReveal, 0, 1) }} />

            <div className="absolute left-1/2 top-6 z-20 h-1.5 w-[260px] -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--rv-accent2),var(--rv-accent),var(--rv-accent3))]"
                style={{ width: `${desktopProgressWidth}%` }}
              />
            </div>

            <div className="absolute inset-0 overflow-hidden">
              <div
                className={`${styles.universeTrack} flex h-full`}
                style={{
                  width: `${narrativeSlides.length * 100}%`,
                  transform: `translate3d(-${trackTranslate}%,0,0)`,
                }}
              >
                {narrativeSlides.map((slide) => (
                  <article
                    key={`${slide.kind}-${slide.title}`}
                    className="relative h-full shrink-0"
                    style={{ width: `${100 / narrativeSlides.length}%` }}
                  >
                    {renderDesktopSlide(slide)}
                  </article>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[22vw] max-w-[360px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(5,5,8,0.02),rgba(5,5,8,0.26)_48%,transparent_74%)] blur-[50px]" />
          </div>
        </section>
      ) : (
        <section ref={heroRef} className="relative overflow-hidden bg-[var(--rv-bg)]">
          <div className={`absolute inset-0 ${styles.heroNoise}`} />
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-5 sm:px-8">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">Universo original de AdvancedRetro</p>
            <Link
              href="/"
              className="rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/68 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              Volver
            </Link>
          </div>

          <div className="relative px-4 pb-10 pt-24 sm:px-8">
            <div className="mx-auto max-w-[1540px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,0.92),rgba(5,5,8,0.98))] shadow-[0_34px_120px_rgba(0,0,0,0.42)]">
              <div className="relative overflow-hidden px-5 pb-8 pt-8 text-center sm:px-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_46%,rgba(138,215,255,0.24),transparent_26%),radial-gradient(circle_at_80%_38%,rgba(123,47,255,0.3),transparent_28%),linear-gradient(180deg,rgba(11,14,24,0.28),rgba(7,9,15,0.72))]" />
                <div className="relative mx-auto h-[280px] max-w-[920px] overflow-hidden">
                  <div className="absolute left-[-10%] top-[8%] h-[84%] w-[45%]">
                    <Image
                      src="/images/retroville/nox-push.png"
                      alt="NOX empujando"
                      fill
                      priority
                      sizes="42vw"
                      className="object-contain object-left-center"
                      style={{
                        maskImage:
                          'radial-gradient(circle at 72% 50%, black 56%, transparent 96%), linear-gradient(90deg, black 70%, transparent 100%), linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)',
                      }}
                    />
                  </div>
                  <div className="absolute right-[-14%] top-[14%] h-[78%] w-[54%]">
                    <Image
                      src="/images/retroville/button-crew-push.png"
                      alt="Button Crew empujando"
                      fill
                      priority
                      sizes="48vw"
                      className="object-contain object-right-center"
                      style={{
                        maskImage:
                          'radial-gradient(circle at 28% 50%, black 60%, transparent 98%), linear-gradient(90deg, transparent 0%, black 20%, black 84%, transparent 100%), linear-gradient(180deg, transparent 0%, black 20%, black 82%, transparent 100%)',
                      }}
                    />
                  </div>
                </div>

                <div className="relative z-[1] mx-auto max-w-[42rem]">
                  <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/74">
                    Universo en desarrollo
                  </p>
                  <h1 className={`${displayFont.className} mt-6 text-[3.8rem] uppercase leading-[0.84] text-white sm:text-[5.2rem]`}>
                    RETROVILLE
                  </h1>
                  <p className="mx-auto mt-5 max-w-[18ch] text-2xl font-semibold leading-tight text-white">Every forgotten game ends up somewhere.</p>
                  <p className="mx-auto mt-5 max-w-[34rem] text-sm leading-8 text-white/62 sm:text-base">
                    Una ciudad oscura de hardware olvidado, memorias corruptas y personajes que siguen empujando el sistema incluso cuando todo lo demás ya se apagó.
                  </p>
                </div>

                <div className={`${styles.countGlow} relative z-[1] mx-auto mt-8 max-w-[760px] rounded-[1.8rem] border border-white/10 bg-[rgba(8,12,24,0.7)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl`}>
                  <RetrovilleCountdown targetIso={launchIso} className="border-0 bg-transparent p-0 shadow-none" />
                </div>
              </div>

              <div className="border-t border-white/10 px-4 pb-8 pt-6 sm:px-8">
                <div className="mx-auto flex max-w-[1540px] flex-col gap-5">
                  {narrativeSlides
                    .filter((slide) => slide.kind !== 'countdown')
                    .map((slide) => (
                      <article
                        key={`${slide.kind}-${slide.title}`}
                        className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(11,11,13,0.76)]"
                      >
                        {renderMobileSlide(slide)}
                      </article>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
