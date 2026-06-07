'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Anton, DM_Sans, Space_Mono } from 'next/font/google';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
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

const retrovilleSocials = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/retroville_show/',
    ariaLabel: 'Abrir Instagram de Retroville',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@RetroVille-y9v',
    ariaLabel: 'Abrir YouTube de Retroville',
  },
  {
    label: 'X',
    href: 'https://x.com/Retr0ViIIe',
    ariaLabel: 'Abrir X de Retroville',
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/EyRRQJWW5D',
    ariaLabel: 'Abrir Discord de Retroville',
  },
  {
    label: 'Reddit',
    href: 'https://www.reddit.com/user/Flardop/',
    ariaLabel: 'Abrir Reddit de Retroville',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61590571767017',
    ariaLabel: 'Abrir Facebook de Retroville',
  },
  {
    label: 'Threads',
    href: 'https://www.threads.com/@retroville_show?hl=es',
    ariaLabel: 'Abrir Threads de Retroville',
  },
  {
    label: 'Kickstarter',
    href: 'https://www.kickstarter.com/profile/1318310768',
    ariaLabel: 'Abrir Kickstarter de Retroville',
  },
] as const;

const sketchPreviewCards = [
  {
    label: 'CITY CORE',
    image: '/images/retroville/retroville-central-plaza-concept.png',
  },
  {
    label: 'TRANSIT',
    image: '/images/retroville/retroville-metro-pod-concept.png',
  },
  {
    label: 'URBAN PROPS',
    image: '/images/retroville/retroville-urban-props-concept.png',
  },
] as const;

type Slide =
  | { kind: 'countdown'; eyebrow: string; title: string; description: string }
  | { kind: 'manifesto'; eyebrow: string; title: string; description: string }
  | { kind: 'districts'; eyebrow: string; title: string; description: string }
  | { kind: 'sketchPreview'; eyebrow: string; title: string; description: string }
  | { kind: 'characterPreview'; eyebrow: string; title: string; description: string }
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
  {
    kind: 'sketchPreview',
    eyebrow: 'SKETCHBOOK',
    title: 'CÓMO SE CONSTRUYE RETROVILLE',
    description:
      'Arquitectura, vehículos, tiendas, criaturas, props y sistemas urbanos. Esta demo solo enseña una muestra; el archivo completo vive en una página aparte para verlo con calma.',
  },
  {
    kind: 'characterPreview',
    eyebrow: 'CAST',
    title: 'CONOCE A LOS PERSONAJES',
    description:
      'NOX, Button Crew y Luna ya tienen render final. El resto del reparto existe como ficha de desarrollo y quedará preparado para recibir sus imágenes renderizadas.',
  },
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
  const [activeRelic, setActiveRelic] = useState(0);
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
  const currentRelic = relicGallery[activeRelic] ?? relicGallery[0];

  const prevRelic = useCallback(() => {
    setActiveRelic((current) => (current - 1 + relicGallery.length) % relicGallery.length);
  }, []);

  const nextRelic = useCallback(() => {
    setActiveRelic((current) => (current + 1) % relicGallery.length);
  }, []);

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

    if (slide.kind === 'sketchPreview') {
      return (
        <div className={styles.slideShellWide}>
          <div className={styles.previewLayout}>
            <div className={styles.slideCopyCompact}>
              <p className={styles.eyebrow}>{slide.eyebrow}</p>
              <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
              <p className={styles.slideBody}>{slide.description}</p>
              <Link href="/retroville/sketches" className={styles.previewButton}>
                Ver archivo de sketches <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className={styles.sketchPreviewBoard}>
              <div className={styles.sampleFormula}>
                <div className={styles.sampleInputCard}>
                  <span>RETRO HARDWARE</span>
                  <strong>OBJETO</strong>
                </div>
                <div className={styles.samplePlus}>+</div>
                <div className={styles.sampleInputCard}>
                  <span>CIUDAD</span>
                  <strong>SISTEMA</strong>
                </div>
                <div className={styles.sampleEquals}>=</div>
              </div>
              <div className={styles.sketchCards}>
                {sketchPreviewCards.map((card) => (
                  <article key={card.label} className={styles.sketchCard}>
                    <Image src={card.image} alt={card.label} fill sizes="24vw" className={styles.sketchCardImage} />
                    <span>{card.label}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'characterPreview') {
      return (
        <div className={styles.slideShellWide}>
          <div className={styles.previewLayout}>
            <div className={styles.slideCopyCompact}>
              <p className={styles.eyebrow}>{slide.eyebrow}</p>
              <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
              <p className={styles.slideBody}>{slide.description}</p>
              <Link href="/retroville/personajes" className={styles.previewButton}>
                Abrir reparto <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className={styles.castPresentationStage}>
              <div className={styles.castPresentationGlow} />
              <Image
                src="/images/retroville/retroville-cast-presentation.png"
                alt="NOX, Luna y Button Crew presentando el reparto principal de Retroville"
                width={1092}
                height={768}
                className={styles.castPresentationImage}
                priority={index < 5}
              />
              <div className={styles.castPresentationMeta}>
                <span>REPARTO PRINCIPAL</span>
                <strong>NOX · LUNA · BUTTON CREW</strong>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'gallery') {
      return (
        <div className={styles.slideShellWide}>
          <div className={styles.galleryLayout}>
            <div className={styles.slideCopyCompact}>
              <p className={styles.eyebrow}>{slide.eyebrow}</p>
              <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
              <p className={styles.slideBody}>{slide.description}</p>
            </div>

            <div className={styles.archiveCarousel}>
              <div className={styles.archiveCarouselStage}>
                <button
                  type="button"
                  className={styles.archiveNav}
                  aria-label="Ver archivo anterior"
                  onClick={prevRelic}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <article className={styles.archiveHeroCard}>
                  <div className={styles.archiveHeroImageWrap}>
                    <Image src={currentRelic.image} alt={currentRelic.alt} fill sizes="48vw" className={styles.archiveHeroImage} />
                  </div>
                  <div className={styles.archiveHeroCopy}>
                    <p className={styles.galleryEyebrow}>{currentRelic.eyebrow}</p>
                    <h3 className={`${displayFont.className} ${styles.galleryTitle}`}>{currentRelic.title}</h3>
                    <p className={styles.galleryBody}>{currentRelic.body}</p>
                  </div>
                </article>

                <button
                  type="button"
                  className={styles.archiveNav}
                  aria-label="Ver siguiente archivo"
                  onClick={nextRelic}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
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
            <div className={styles.waitlistFooterMeta}>
              <p>© AdvancedRetro · Retroville está en desarrollo como serie original.</p>
              <div className={styles.socialLinks}>
                {retrovilleSocials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.ariaLabel}
                    className={styles.socialLink}
                  >
                    {social.label}
                  </a>
                ))}
                <Link href="/retroville/legal" className={styles.socialLink}>
                  Legal
                </Link>
              </div>
            </div>
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
              <Link href="/retroville/presentaciones" className={styles.secondaryButton}>
                Ver 5 tratamientos
              </Link>
            </div>
            <div className={styles.heroSocials}>
              {retrovilleSocials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.ariaLabel}
                  className={styles.socialLink}
                >
                  {social.label}
                </a>
              ))}
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
