'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Anton, DM_Sans, Space_Mono } from 'next/font/google';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import { lunaProfile } from '@/lib/retroville-luna';
import styles from './retroville-desktop.module.css';

const displayFont = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const bodyFont = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

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
  'LOAD SCREEN LIMBO',
] as const;

const relicGallery = [
  {
    title: 'Mona NOX',
    eyebrow: 'ARCHIVO 01',
    body: 'El cansancio como retrato oficial. La ciudad colecciona versiones imposibles de sus propias leyendas.',
    image: '/images/retroville/retroville-mona.png',
    alt: 'Retrato clásico de NOX',
  },
  {
    title: 'The Creation of Input',
    eyebrow: 'ARCHIVO 02',
    body: 'Cuando Retroville se vuelve mito, incluso los botones reciben un origen casi sagrado.',
    image: '/images/retroville/retroville-creation.png',
    alt: 'NOX y Button Crew recreando una escena clásica',
  },
  {
    title: 'Marble Panic',
    eyebrow: 'ARCHIVO 03',
    body: 'La comedia oscura del universo también sabe convertirse en tragedia, estatua y caos absoluto.',
    image: '/images/retroville/retroville-marble.png',
    alt: 'Escultura de mármol del universo Retroville',
  },
  {
    title: 'The Last Save',
    eyebrow: 'ARCHIVO 04',
    body: 'Toda banda acaba reuniéndose alrededor de una mesa. Aquí esa cena siempre termina mal.',
    image: '/images/retroville/retroville-last-supper.png',
    alt: 'Última cena reinterpretada con personajes de Retroville',
  },
] as const;

const signalCards = [
  {
    title: 'SERIE ORIGINAL',
    body: 'Retroville no se plantea como una simple landing: tiene que sentirse como una serie con tono, personajes y mundo propio.',
  },
  {
    title: 'DROPS NARRATIVOS',
    body: 'Cada señal debe sentirse como un evento cultural: una imagen, una escena o una frase que empuja el universo.',
  },
  {
    title: 'WORLD BUILDING',
    body: 'Arquitectura, barrios, transporte, fauna y objetos cotidianos que hacen que la ciudad se note viva.',
  },
  {
    title: 'CAOS SOCIAL',
    body: 'Humor oscuro, comunidad, coleccionismo y personajes que convierten la ciudad en conversación.',
  },
] as const;

const districtCards = [
  {
    title: 'POWER PLAZA',
    text: 'El corazón civil de la ciudad: anuncios, pantallas, cruces de tráfico y todo el ruido de la vida pública.',
  },
  {
    title: 'BIT GRAVE',
    text: 'El cementerio de hardware olvidado. Donde van a parar los juegos que nadie terminó y las consolas que nadie reparó.',
  },
  {
    title: 'TOP SLOT',
    text: 'La noche elegante y peligrosa de Retroville: terrazas, clubes y esquinas donde siempre se está negociando algo.',
  },
] as const;

const worldSlides = [
  {
    eyebrow: 'SECTOR 01',
    title: 'RETROVILLE CITY',
    description:
      'Una ciudad vertical, compacta y rara. Cartuchos convertidos en arquitectura, plazas hechas de pantallas y una lógica urbana que parece diseñada por alguien que creció dentro de un catálogo de consolas.',
    image: '/images/retroville/retroville-central-plaza-concept.png',
    accent: 'rgba(123, 47, 255, 0.22)',
    note: 'Plaza central, skyline y núcleo cívico',
  },
  {
    eyebrow: 'SECTOR 02',
    title: 'STACKED HOUSING',
    description:
      'La vivienda en Retroville no es neutral. Todo parece modular, reensamblado y construido desde piezas que ya vivieron otra vida.',
    image: '/images/retroville/retroville-stacked-housing-concept.png',
    accent: 'rgba(102, 196, 255, 0.2)',
    note: 'Arquitectura doméstica y densidad urbana',
  },
  {
    eyebrow: 'SECTOR 03',
    title: 'CITY HALL',
    description:
      'La fachada institucional del mundo: orden, progreso y un sentido muy sospechoso de la autoridad. Todo parece limpio hasta que miras mejor.',
    image: '/images/retroville/retroville-civic-hall-concept.png',
    accent: 'rgba(255, 201, 64, 0.18)',
    note: 'Poder, administración y propaganda',
  },
  {
    eyebrow: 'SECTOR 04',
    title: 'THE PIXEL GRAVEYARD',
    description:
      'El borde emocional de la ciudad. Montañas de hardware roto, pantallas muertas y rutas de chatarra donde aún queda memoria atrapada.',
    image: '/images/retroville/retroville-bit-grave-concept.png',
    accent: 'rgba(255, 84, 84, 0.18)',
    note: 'Ruina, abandono y reliquias jugables',
  },
  {
    eyebrow: 'SECTOR 05',
    title: 'RETROVILLE TRANSIT',
    description:
      'Metro-pods, taxis cápsula, motos y vehículos improbables. El transporte de la ciudad se siente como una mecánica, no como infraestructura genérica.',
    image: '/images/retroville/retroville-metro-pod-concept.png',
    accent: 'rgba(0, 212, 255, 0.2)',
    note: 'Movimiento, ritmo y movilidad absurda',
  },
  {
    eyebrow: 'SECTOR 06',
    title: 'URBAN PROP SYSTEM',
    description:
      'Farolas, señales, marquesinas, kioscos, basura y pequeños objetos con identidad propia. Aquí los props hacen tanto mundo como los protagonistas.',
    image: '/images/retroville/retroville-urban-props-concept.png',
    accent: 'rgba(0, 255, 136, 0.18)',
    note: 'Mobiliario urbano y lenguaje visual de calle',
  },
] as const;

const characterSlides = [
  {
    eyebrow: 'PERSONAJE 01',
    title: 'NOX',
    description:
      'Sarcasmo, batería baja y una dignidad bastante discutible. NOX no dirige la ciudad por épica. Lo hace porque nadie más soporta el turno de noche.',
    image: '/images/retroville/nox-character-large.png',
    accent: 'rgba(97, 174, 255, 0.22)',
    chips: ['Superviviente', 'Turno de noche', 'Batería baja'],
    align: 'right' as const,
  },
  {
    eyebrow: 'PERSONAJE 02',
    title: 'BUTTON CREW',
    description:
      'A, B, Y y X son la conversación permanente de Retroville: impulsivos, cínicos, analíticos y caóticos. Siempre llegan juntos. Siempre complican algo.',
    image: '/images/retroville/button-crew-character-large.png',
    accent: 'rgba(255, 189, 82, 0.22)',
    chips: ['A / B / Y / X', 'Ruido social', 'Caos coordinado'],
    align: 'left' as const,
  },
  {
    eyebrow: 'PERSONAJE 03',
    title: lunaProfile.name,
    description:
      'Luna entra en Retroville como una interferencia elegante: magnética, caprichosa y peligrosamente divertida. Manipula la atención y convierte el caos en estilo.',
    image: '/images/retroville/luna-character-large.png',
    accent: 'rgba(217, 133, 171, 0.24)',
    chips: ['Magnetismo', 'Glamour tóxico', 'Interferencia'],
    align: 'right' as const,
  },
] as const;

type Slide =
  | { kind: 'countdown'; eyebrow: string; title: string; description: string }
  | { kind: 'manifesto'; eyebrow: string; title: string; description: string }
  | { kind: 'districts'; eyebrow: string; title: string; description: string }
  | {
      kind: 'world';
      eyebrow: string;
      title: string;
      description: string;
      image: string;
      accent: string;
      note: string;
    }
  | {
      kind: 'character';
      eyebrow: string;
      title: string;
      description: string;
      image: string;
      accent: string;
      chips: readonly string[];
      align: 'left' | 'right';
    }
  | { kind: 'gallery'; eyebrow: string; title: string; description: string }
  | { kind: 'signals'; eyebrow: string; title: string; description: string }
  | { kind: 'waitlist'; eyebrow: string; title: string; description: string };

const slides: readonly Slide[] = [
  {
    kind: 'countdown',
    eyebrow: 'LAUNCH WINDOW TARGET',
    title: 'VENTANA DE LANZAMIENTO',
    description:
      'La primera gran señal de Retroville ya tiene fecha. Este tramo funciona como antesala de una serie original que todavía se está formando.',
  },
  {
    kind: 'manifesto',
    eyebrow: 'MANIFIESTO',
    title: 'EVERY FORGOTTEN GAME ENDS UP SOMEWHERE.',
    description: 'Una ciudad oscura. Hardware olvidado. Memorias corruptas. Humor extraño con ambición real.',
  },
  {
    kind: 'districts',
    eyebrow: 'DISTRICTS & SIGNALS',
    title: 'MAPA DEL UNIVERSO',
    description:
      'Antes de que la ciudad se explique sola, hay nombres que ya suenan como lugares reales: barrios, plazas, residuos, clubs y sistemas enteros a punto de desbordarse.',
  },
  ...worldSlides.map((slide) => ({ kind: 'world' as const, ...slide })),
  ...characterSlides.map((slide) => ({ kind: 'character' as const, ...slide })),
  {
    kind: 'gallery',
    eyebrow: 'ARCHIVE VISIONS',
    title: 'LOS APÓCRIFOS DE RETROVILLE',
    description: 'Mitos, reliquias visuales y piezas que convierten el universo en algo más grande que una sinopsis.',
  },
  {
    kind: 'signals',
    eyebrow: 'SYSTEM SIGNALS',
    title: 'SEÑALES DE EXPANSIÓN',
    description: 'World building, drops narrativos y caos social dentro de una misma frecuencia visual.',
  },
  {
    kind: 'waitlist',
    eyebrow: 'WAITLIST',
    title: 'ENTRA ANTES DE QUE EL RESTO LO RECUERDE',
    description: 'Primer drop. Primer reveal. Primera señal jugable. Aquí termina la página y empieza la espera.',
  },
] as const;

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(index, max));
}

export default function RetrovilleDesktopExperience({
  launchIso,
  launchLabel,
  waitlistCount,
}: {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [portalTransition, setPortalTransition] = useState(false);
  const activeStepRef = useRef(0);
  const portalTransitionRef = useRef(false);
  const wheelAccumulatorRef = useRef(0);
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideCount = slides.length;
  const currentSlide = activeStep > 0 ? slides[activeStep - 1] : null;
  const trackVisible = activeStep > 0 || portalTransition;
  const trackIndex = Math.max(activeStep - 1, 0);
  const hypeGoal = 5000;
  const waitlistPct = Math.max(0, Math.min(1, waitlistCount / hypeGoal));
  const repeatedMarqueeItems = useMemo(() => [...marqueeItems, ...marqueeItems], []);

  const clearWheelReset = useCallback(() => {
    if (wheelResetTimerRef.current) {
      clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = null;
    }
  }, []);

  const lockNavigation = useCallback((duration = 560) => {
    if (navigationCooldownRef.current) clearTimeout(navigationCooldownRef.current);
    navigationCooldownRef.current = setTimeout(() => {
      navigationCooldownRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    portalTransitionRef.current = portalTransition;
  }, [portalTransition]);

  const navigationLocked = useCallback(() => navigationCooldownRef.current !== null || portalTransitionRef.current, []);

  const openPortal = useCallback(() => {
    if (portalTransitionRef.current) return;
    portalTransitionRef.current = true;
    setPortalTransition(true);
    lockNavigation(760);
    portalTimerRef.current = setTimeout(() => {
      activeStepRef.current = 1;
      setActiveStep(1);
      portalTransitionRef.current = false;
      setPortalTransition(false);
      portalTimerRef.current = null;
    }, 520);
  }, [lockNavigation]);

  const moveStep = useCallback((direction: 1 | -1) => {
    if (navigationLocked()) return;
    const currentStep = activeStepRef.current;

    if (currentStep === 0) {
      if (direction > 0) openPortal();
      return;
    }

    const next = clampIndex(currentStep + direction, slideCount);
    if (next === currentStep) return;
    activeStepRef.current = next;
    setActiveStep(next);
    lockNavigation(520);
  }, [navigationLocked, slideCount, lockNavigation, openPortal]);

  const jumpToStep = useCallback((step: number) => {
    const currentStep = activeStepRef.current;
    if (step === currentStep || navigationLocked()) return;
    if (step <= 0) {
      activeStepRef.current = 0;
      portalTransitionRef.current = false;
      setPortalTransition(false);
      setActiveStep(0);
      lockNavigation(420);
      return;
    }
    if (currentStep === 0) {
      openPortal();
      return;
    }
    activeStepRef.current = clampIndex(step, slideCount);
    setActiveStep(clampIndex(step, slideCount));
    lockNavigation(480);
  }, [navigationLocked, slideCount, lockNavigation, openPortal]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (navigationLocked()) return;

      wheelAccumulatorRef.current += event.deltaY;
      clearWheelReset();
      wheelResetTimerRef.current = setTimeout(() => {
        wheelAccumulatorRef.current = 0;
        wheelResetTimerRef.current = null;
      }, 140);

      if (Math.abs(wheelAccumulatorRef.current) >= 90) {
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
        wheelAccumulatorRef.current = 0;
        moveStep(direction as 1 | -1);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        moveStep(1);
      }
      if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        moveStep(-1);
      }
      if (event.key === 'Home') {
        event.preventDefault();
        jumpToStep(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        jumpToStep(slideCount);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      clearWheelReset();
      if (navigationCooldownRef.current) clearTimeout(navigationCooldownRef.current);
      if (portalTimerRef.current) clearTimeout(portalTimerRef.current);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [clearWheelReset, jumpToStep, moveStep, navigationLocked, slideCount]);

  const renderSlide = (slide: Slide, index: number) => {
    if (slide.kind === 'countdown') {
      return (
        <div className={styles.slideShell}>
          <div className={styles.slideCopy}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
            <p className={styles.slideMeta}>Objetivo actual: {launchLabel}</p>
          </div>
          <div className={styles.countdownShell}>
            <RetrovilleCountdown targetIso={launchIso} className="border-0 bg-transparent p-0 shadow-none" />
          </div>
        </div>
      );
    }

    if (slide.kind === 'manifesto') {
      return (
        <div className={styles.slideShellCenter}>
          <p className={styles.eyebrow}>{slide.eyebrow}</p>
          <div className={styles.manifestoStack}>
            {manifestoLines.map((line) => (
              <p key={line} className={`${displayFont.className} ${styles.manifestoLine}`}>
                {line}
              </p>
            ))}
          </div>
          <p className={styles.manifestoBody}>{slide.description}</p>
        </div>
      );
    }

    if (slide.kind === 'districts') {
      return (
        <div className={styles.slideShell}>
          <div className={styles.slideCopy}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
          </div>
          <div className={styles.districtSurface}>
            <div className={styles.marqueeRows}>
              <div className={styles.marqueeTrack}>
                {repeatedMarqueeItems.map((item, itemIndex) => (
                  <span key={`a-${item}-${itemIndex}`} className={styles.marqueeTag}>
                    {item}
                  </span>
                ))}
              </div>
              <div className={`${styles.marqueeTrack} ${styles.marqueeTrackReverse}`}>
                {repeatedMarqueeItems.map((item, itemIndex) => (
                  <span key={`b-${item}-${itemIndex}`} className={styles.marqueeTagAlt}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.districtGrid}>
              {districtCards.map((card) => (
                <article key={card.title} className={styles.districtCard}>
                  <h3 className={`${displayFont.className} ${styles.districtTitle}`}>{card.title}</h3>
                  <p className={styles.districtBody}>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'world') {
      return (
        <div className={styles.slideShell}>
          <div className={styles.slideCopy}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
            <p className={styles.slideMeta}>{slide.note}</p>
          </div>
          <div className={styles.worldVisual} style={{ ['--slide-accent' as string]: slide.accent }}>
            <Image src={slide.image} alt={slide.title} fill sizes="56vw" className={styles.worldImage} />
          </div>
        </div>
      );
    }

    if (slide.kind === 'character') {
      const figureOnRight = slide.align === 'right';
      return (
        <div className={`${styles.slideShell} ${figureOnRight ? styles.characterShellRight : styles.characterShellLeft}`}>
          <div className={styles.slideCopy}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
            <div className={styles.characterChips}>
              {slide.chips.map((chip) => (
                <span key={chip} className={styles.characterChip}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.characterFigureStage} style={{ ['--slide-accent' as string]: slide.accent }}>
            <div className={styles.characterGlow} />
            <div className={styles.characterLightSweep} />
            <Image
              src={slide.image}
              alt={slide.title}
              width={1200}
              height={1600}
              className={styles.characterFigure}
              priority={index < 4}
            />
          </div>
        </div>
      );
    }

    if (slide.kind === 'gallery') {
      return (
        <div className={styles.slideShellWide}>
          <div className={styles.slideCopyCompact}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
          </div>
          <div className={styles.galleryGrid}>
            {relicGallery.map((item) => (
              <article key={item.title} className={styles.galleryCard}>
                <div className={styles.galleryImageWrap}>
                  <Image src={item.image} alt={item.alt} fill sizes="22vw" className={styles.galleryImage} />
                </div>
                <div className={styles.galleryCopy}>
                  <p className={styles.galleryEyebrow}>{item.eyebrow}</p>
                  <h3 className={`${displayFont.className} ${styles.galleryTitle}`}>{item.title}</h3>
                  <p className={styles.galleryBody}>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (slide.kind === 'signals') {
      return (
        <div className={styles.slideShellWide}>
          <div className={styles.slideCopyCompact}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
          </div>
          <div className={styles.signalGrid}>
            {signalCards.map((card) => (
              <article key={card.title} className={styles.signalCard}>
                <p className={styles.signalBadge}>SIGNAL</p>
                <h3 className={`${displayFont.className} ${styles.signalTitle}`}>{card.title}</h3>
                <p className={styles.signalBody}>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.slideShellWaitlist}>
        <div className={styles.slideCopyCompact}>
          <p className={styles.eyebrow}>{slide.eyebrow}</p>
          <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
          <p className={styles.slideBody}>{slide.description}</p>
          <div className={styles.waitlistStatRow}>
            <div>
              <p className={styles.waitlistStatLabel}>Señal actual</p>
              <p className={styles.waitlistStatValue}>{waitlistCount.toLocaleString('es-ES')} dentro</p>
            </div>
            <div className={styles.waitlistMeter}>
              <span style={{ width: `${waitlistPct * 100}%` }} />
            </div>
          </div>
        </div>
        <div className={styles.waitlistCard}>
          <RetrovilleWaitlistForm />
          <div className={styles.waitlistFooter}>
            <p>© AdvancedRetro · Retroville está en desarrollo como serie original.</p>
            <Link href="/" className={styles.backHomeLink}>
              Volver a AdvancedRetro
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.desktopRoot}`}>
      <div className={styles.viewport}>
        <div className={styles.noiseLayer} />
        <div className={styles.scanlines} />

        <div className={styles.chromeBar}>
          <p className={styles.chromeLabel}>Universo original de AdvancedRetro</p>
          <div className={styles.chromeActions}>
            <span className={styles.stepCounter}>{String(Math.max(activeStep, 1)).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}</span>
            <Link href="/" className={styles.chromeLink}>Volver a AdvancedRetro</Link>
          </div>
        </div>

        <div className={styles.progressBar}>
          <span style={{ width: `${activeStep === 0 ? 0 : (activeStep / slideCount) * 100}%` }} />
        </div>

        <section className={`${styles.heroLayer} ${activeStep > 0 ? styles.heroLayerHidden : ''} ${portalTransition ? styles.heroLayerOpening : ''}`}>
          <div className={styles.heroBackground}>
            <Image
              src="/images/retroville/retroville-hero-portal-bg.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.heroBackdropImage}
              aria-hidden
            />
            <div className={styles.heroBackdropTint} />
            <div className={styles.heroPortalGlow} />
          </div>

          <div className={`${styles.heroSide} ${styles.heroSideLeft}`}>
            <div className={styles.heroSideWash} />
            <Image
              src="/images/retroville/nox-push.png"
              alt="NOX empujando el núcleo de Retroville"
              fill
              sizes="32vw"
              className={styles.heroSideImage}
              style={{ objectPosition: 'left center' }}
              priority
            />
            <div className={styles.heroSideFade} />
          </div>

          <div className={`${styles.heroSide} ${styles.heroSideRight}`}>
            <div className={styles.heroSideWash} />
            <Image
              src="/images/retroville/button-crew-push.png"
              alt="Button Crew empujando desde el otro lado"
              fill
              sizes="32vw"
              className={styles.heroSideImage}
              style={{ objectPosition: 'right center' }}
              priority
            />
            <div className={styles.heroSideFade} />
          </div>

          <div className={styles.heroCenter}>
            <p className={styles.heroEyebrow}>Serie original en desarrollo</p>
            <div className="mx-auto mt-5 w-full max-w-[360px]">
              <Image
                src="/images/retroville/retroville-logo.png"
                alt="Logo de Retroville"
                width={1536}
                height={1023}
                priority
                sizes="(max-width: 1280px) 320px, 360px"
                className="h-auto w-full object-contain drop-shadow-[0_18px_44px_rgba(255,168,26,0.18)]"
              />
            </div>
            <h1 className={`${displayFont.className} ${styles.heroTitleWord}`}>
              {titleLetters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  data-letter={letter}
                  className={`${styles.heroLetter} ${letter === 'O' ? styles.heroPortalLetter : ''}`}
                >
                  {letter}
                </span>
              ))}
            </h1>
            <p className={styles.heroTagline}>Every forgotten game ends up somewhere.</p>
            <p className={styles.heroBody}>
              Un universo narrativo donde el hardware olvidado sigue vivo. NOX, Button Crew y Luna habitan una ciudad que se siente más cerca de una serie que de una simple página promocional.
            </p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={() => moveStep(1)}>
                Enter Retroville <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => jumpToStep(slideCount)}>
                Ir a la waitlist
              </button>
            </div>
          </div>
        </section>

        <section className={`${styles.trackLayer} ${trackVisible ? styles.trackLayerVisible : ''}`}>
          <div className={styles.track} style={{ transform: `translateX(-${trackIndex * 100}vw)` }}>
            {slides.map((slide, index) => (
              <article key={`${slide.kind}-${index}`} className={styles.slide} aria-hidden={activeStep !== index + 1}>
                <div className={styles.slideInner}>{renderSlide(slide, index)}</div>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.navCluster}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => moveStep(-1)}
            disabled={activeStep === 0 || portalTransition}
            aria-label="Ir al paso anterior"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => moveStep(1)}
            disabled={activeStep === slideCount || portalTransition}
            aria-label="Ir al siguiente paso"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {currentSlide ? (
          <div className={styles.slideFooterLabel}>
            <span className={styles.slideFooterEyebrow}>{currentSlide.eyebrow}</span>
            <span className={styles.slideFooterTitle}>{currentSlide.title}</span>
          </div>
        ) : null}
      </div>
    </main>
  );
}
