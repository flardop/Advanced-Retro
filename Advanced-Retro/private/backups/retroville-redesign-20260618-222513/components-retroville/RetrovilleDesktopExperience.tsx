'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import RetrovilleAudienceProof from '@/components/retroville/RetrovilleAudienceProof';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleProductionDesk from '@/components/retroville/RetrovilleProductionDesk';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import {
  RETROVILLE_DISCOVERY_LINKS,
  RETROVILLE_NEWSLETTER_NAME,
  RETROVILLE_SOCIAL_CHANNELS,
  buildRetrovilleWaitlistBenefits,
  buildRetrovilleLaunchCopy,
  shouldShowRetrovilleSignupCount,
} from '@/app/retroville/shared';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './retroville-desktop.module.css';

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

const districtSpotlights = [
  {
    title: 'ESCUELA CENTRAL',
    eyebrow: 'Vida civil',
    text: 'Aulas, patio y burocracia cotidiana para que el universo respire como serie y no solo como moodboard.',
  },
  {
    title: 'TOP SLOT NIGHTCLUB',
    eyebrow: 'Noche y ruido',
    text: 'La parte elegante, tóxica y social del mapa: música, membresía y decisiones malas después de medianoche.',
  },
  {
    title: 'METRO POD',
    eyebrow: 'Movilidad',
    text: 'El transporte también construye identidad: cápsulas, trayectos y lógica urbana propia.',
  },
] as const;

const sketchPreviewCards = [
  {
    label: 'CITY CORE',
    image: '/images/retroville/retroville-central-plaza-concept.webp',
    alt: 'Concept art de la plaza central de Retroville y su núcleo urbano',
  },
  {
    label: 'TRANSIT',
    image: '/images/retroville/retroville-metro-pod-concept.webp',
    alt: 'Concept art del Metro-Pod de Retroville para el sistema de transporte',
  },
  {
    label: 'URBAN PROPS',
    image: '/images/retroville/retroville-urban-props-concept.webp',
    alt: 'Concept art de props urbanos y señalética de calle en Retroville',
  },
] as const;

const productLine = 'Retroville es una serie animada original ambientada en una ciudad construida con hardware abandonado.';
const landingDepthHighlights = [
  '14+ personajes con renders y roles claros.',
  'Masterplan de ciudad con distritos y sistema social.',
  'Sketchbook activo con proceso y traduccion visual.',
] as const;
const characterTeasers = [
  {
    name: 'NOX',
    district: 'Console Core',
    pitch: 'El protagonista cansado que mantiene el nucleo encendido aunque la ciudad ya le de asco.',
  },
  {
    name: 'LUNA',
    district: 'Top Slot',
    pitch: 'Encanto toxico, control social y el tipo de energia que arruina una noche perfecta.',
  },
  {
    name: 'BUTTON CREW',
    district: 'Power Plaza',
    pitch: 'Una pandilla de botones con vocacion de disturbio publico y cero interes por la calma.',
  },
] as const;

type Slide =
  | { kind: 'countdown'; eyebrow: string; title: string; description: string }
  | { kind: 'manifesto'; eyebrow: string; title: string; description: string }
  | { kind: 'districts'; eyebrow: string; title: string; description: string }
  | { kind: 'sketchPreview'; eyebrow: string; title: string; description: string }
  | { kind: 'productionDesk'; eyebrow: string; title: string; description: string }
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
      'La primera gran señal de Retroville ya tiene fecha. Esta cuenta atras apunta al primer reveal publico del proyecto.',
  },
  {
    kind: 'characterPreview',
    eyebrow: 'CAST',
    title: 'CONOCE A LOS PERSONAJES',
    description:
      'Retroville ya tiene 14+ personajes, facciones y vecinos listos para vender el mundo como serie. Aqui ves la punta del reparto y desde aqui entras al cast completo.',
  },
  {
    kind: 'districts',
    eyebrow: 'DISTRICTS & SIGNALS',
    title: 'MAPA DEL UNIVERSO',
    description:
      'Power Plaza, Bit Grave y Top Slot ya funcionan como lugares reales. La ciudad no es fondo: es parte del conflicto, del humor y del sistema social.',
  },
  {
    kind: 'sketchPreview',
    eyebrow: 'SKETCHBOOK',
    title: 'CÓMO SE CONSTRUYE RETROVILLE',
    description:
      'El proyecto ya tiene masterplan, traducciones visuales y archivo de proceso activo. El sketchbook enseña como cada referencia se convierte en edificio, barrio o sistema.',
  },
  {
    kind: 'productionDesk',
    eyebrow: 'PRODUCTION DESK',
    title: 'BIBLIA, DOSSIERS Y TEMPORADA 1',
    description:
      'Retroville ya puede empezar a enseñar sus materiales tecnicos. La biblia general se solicita por correo y los episodios 01-10 se iran desbloqueando como archivos incoming.',
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
    kind: 'manifesto',
    eyebrow: 'MANIFIESTO',
    title: 'EVERY FORGOTTEN GAME ENDS UP SOMEWHERE.',
    description: 'Una ciudad oscura. Hardware olvidado. Memorias corruptas. Humor raro con ambición real de serie adulta.',
  },
  {
    kind: 'waitlist',
    eyebrow: 'NEWSLETTER',
    title: 'LA SEÑAL DE RETROVILLE',
    description:
      'No es un formulario generico: es la newsletter oficial para recibir el primer reveal, los drops siguientes y un resumen quincenal del desarrollo del universo.',
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
  const showAudienceCount = shouldShowRetrovilleSignupCount(waitlistCount);
  const waitlistPct = Math.max(0, Math.min(1, waitlistCount / hypeGoal));
  const repeatedMarqueeItems = useMemo(() => [...marqueeItems, ...marqueeItems], []);
  const currentRelic = relicGallery[activeRelic] ?? relicGallery[0];
  const launchEventCopy = buildRetrovilleLaunchCopy(launchLabel);
  const waitlistBenefits = buildRetrovilleWaitlistBenefits(launchLabel);

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

  const renderSlide = (slide: Slide) => {
    if (slide.kind === 'countdown') {
      return (
        <div className={styles.slideShell}>
          <div className={styles.slideCopy}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
            <p className={styles.slideMeta}>Objetivo actual: {launchLabel}</p>
            <p className="mt-4 max-w-[44ch] text-sm leading-7 text-white/72">{launchEventCopy}</p>
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
            <div className={styles.districtSpotlightGrid}>
              {districtSpotlights.map((spotlight) => (
                <article key={spotlight.title} className={styles.districtSpotlightCard}>
                  <p className={styles.signalBadge}>{spotlight.eyebrow}</p>
                  <h3 className={`${displayFont.className} ${styles.districtSpotlightTitle}`}>{spotlight.title}</h3>
                  <p className={styles.districtSpotlightBody}>{spotlight.text}</p>
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
          <div className={styles.slideCopyCompact}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
            <Link href="/retroville/sketches" className={styles.previewButton}>
              Ver archivo de sketches <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className={styles.sketchShowcase}>
            <div className={styles.sketchEquationBar}>
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
              <div className={styles.sketchOutcomeCard}>
                <span>RESULTADO</span>
                <strong>UNIVERSO PRESENTABLE</strong>
              </div>
            </div>

            <div className={styles.sketchShowcaseGrid}>
              {sketchPreviewCards.map((card, index) => (
                <article
                  key={card.label}
                  className={`${styles.sketchFeatureCard} ${index === 0 ? styles.sketchFeaturePrimary : styles.sketchFeatureSecondary}`}
                >
                  <div className={styles.sketchFeatureImageWrap}>
                    <Image
                      src={card.image}
                      alt={card.alt}
                      fill
                      sizes={index === 0 ? '(max-width: 1600px) 40vw, 36vw' : '(max-width: 1600px) 26vw, 22vw'}
                      className={styles.sketchFeatureImage}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.sketchFeatureMeta}>
                    <span>{card.label}</span>
                  </div>
                </article>
              ))}

              <article className={styles.sketchProcessCard}>
                <p className={styles.signalBadge}>Traducción visual</p>
                <h3 className={`${displayFont.className} ${styles.sketchProcessTitle}`}>DEL OBJETO AL BARRIO</h3>
                <p className={styles.sketchProcessBody}>
                  El sketchbook no enseña solo renders bonitos. Enseña el método: referencia real, sistema urbano y
                  forma final dentro de Retroville.
                </p>
              </article>
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'characterPreview') {
      return (
        <div className={styles.slideShellWide}>
          <div className={styles.slideCopyCompact}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
          </div>

          <div className={styles.castShowcase}>
            <div className={styles.castPresentationStage}>
              <div className={styles.castPresentationGlow} />
              <Image
                src="/images/retroville/retroville-cast-presentation.webp"
                alt="NOX, Luna y Button Crew presentando el reparto principal de Retroville"
                width={1092}
                height={768}
                className={styles.castPresentationImage}
                loading="lazy"
              />
              <div className={styles.castPresentationMeta}>
                <span>REPARTO PRINCIPAL</span>
                <strong>NOX · LUNA · BUTTON CREW</strong>
              </div>
            </div>

            <div className={styles.castShowcaseRail}>
              <div className={styles.castShowcaseIntro}>
                <p className={styles.signalBadge}>Lectura rápida del cast</p>
                <p className={styles.castShowcaseIntroBody}>
                  El reparto ya puede vender tono, barrio y conflicto desde la primera mirada. Aquí está la entrada más
                  directa al universo humano de Retroville.
                </p>
              </div>

              <div className={styles.castTeaserGrid}>
                {characterTeasers.map((character) => (
                  <article key={character.name} className={styles.castTeaserCard}>
                    <p className={styles.castTeaserDistrict}>{character.district}</p>
                    <h3 className={`${displayFont.className} ${styles.castTeaserTitle}`}>{character.name}</h3>
                    <p className={styles.castTeaserBody}>{character.pitch}</p>
                  </article>
                ))}
              </div>

              <Link href="/retroville/personajes" className={styles.previewButton}>
                Ver reparto completo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (slide.kind === 'productionDesk') {
      return (
        <div className={styles.slideShellWide}>
          <div className={styles.slideCopyCompact}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={`${displayFont.className} ${styles.slideTitle}`}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.description}</p>
          </div>
          <RetrovilleProductionDesk mode="desktop" />
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
          <div className={styles.signalsLayout}>
            <div className={styles.signalGrid}>
              {signalCards.map((card) => (
                <article key={card.title} className={styles.signalCard}>
                  <p className={styles.signalBadge}>SIGNAL</p>
                  <h3 className={`${displayFont.className} ${styles.signalTitle}`}>{card.title}</h3>
                  <p className={styles.signalBody}>{card.body}</p>
                </article>
              ))}
            </div>

            <aside className={styles.communityDock}>
              <div className={styles.communityDockHeader}>
                <p className={styles.signalBadge}>CANALES OFICIALES</p>
                <h3 className={`${displayFont.className} ${styles.communityDockTitle}`}>TODAS LAS REDES, MEJOR ORDENADAS</h3>
                <p className={styles.communityDockBody}>
                  Cada canal empuja una parte distinta de Retroville: unas sirven para drops visuales, otras para vídeo, otras para comunidad y otras para sostener el proyecto cuando toque escalarlo.
                </p>
              </div>

              <div className={styles.communityChannelGrid}>
                {RETROVILLE_SOCIAL_CHANNELS.map((channel) => (
                  <a
                    key={channel.label}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={channel.ariaLabel}
                    className={styles.communityChannelCard}
                  >
                    <p className={styles.communityChannelMeta}>{channel.eyebrow}</p>
                    <h4 className={`${displayFont.className} ${styles.communityChannelTitle}`}>{channel.label}</h4>
                    <p className={styles.communityChannelBody}>{channel.description}</p>
                  </a>
                ))}
              </div>

              <div className={styles.resourceLinkGrid}>
                {RETROVILLE_DISCOVERY_LINKS.map((link) => (
                  <Link key={link.label} href={link.href} className={styles.resourceLinkCard}>
                    <p className={styles.resourceLinkEyebrow}>{link.eyebrow}</p>
                    <h4 className={styles.resourceLinkTitle}>{link.label}</h4>
                    <p className={styles.resourceLinkBody}>{link.description}</p>
                  </Link>
                ))}
              </div>
            </aside>
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
              <p className={styles.waitlistStatValue}>
                {showAudienceCount ? `${waitlistCount.toLocaleString('es-ES')} personas ya reciben la señal` : 'Sé de los primeros'}
              </p>
              {showAudienceCount ? null : <p className={styles.slideMeta}>La newsletter acaba de abrirse y todavia puedes entrar en la primera tanda.</p>}
            </div>
            {showAudienceCount ? (
              <div className={styles.waitlistMeter}>
                <span style={{ width: `${waitlistPct * 100}%` }} />
              </div>
            ) : null}
          </div>
          <RetrovilleAudienceProof waitlistCount={waitlistCount} launchIso={launchIso} launchLabel={launchLabel} />
        </div>
        <div className={styles.waitlistCard}>
          <div className="mb-6 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 text-left">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">Si te apuntas, recibes</p>
            <div className="mt-3 grid gap-2">
              {waitlistBenefits.map((benefit) => (
                <p key={benefit} className="text-sm leading-6 text-white/78">
                  {benefit}
                </p>
              ))}
            </div>
          </div>
          <RetrovilleWaitlistForm
            buttonLabel={`QUIERO RECIBIR ${RETROVILLE_NEWSLETTER_NAME.toUpperCase()}`}
            successMessage={`Perfecto. Ya estas dentro de ${RETROVILLE_NEWSLETTER_NAME} y recibiras el primer aviso.`}
          />
          <div className={styles.waitlistFooter}>
            <div className={styles.waitlistFooterMeta}>
              <p>© AdvancedRetro · Retroville está en desarrollo como serie original.</p>
              <div className={styles.socialLinks}>
                {RETROVILLE_SOCIAL_CHANNELS.map((social) => (
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
                {RETROVILLE_DISCOVERY_LINKS.map((link) => (
                  <Link key={link.label} href={link.href} className={styles.socialLink}>
                    {link.label}
                  </Link>
                ))}
                <Link href="/retroville/legal" className={styles.socialLink}>
                  Legal
                </Link>
                <Link href="/retroville/faq" className={styles.socialLink}>
                  FAQ
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
              src="/images/retroville/retroville-hero-portal-bg.webp"
              alt="Vista del portal central de Retroville con el universo emergiendo al fondo"
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
              src="/images/retroville/nox-push.webp"
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
              src="/images/retroville/button-crew-push.webp"
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
                src="/images/retroville/retroville-logo.webp"
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
            <p className={styles.heroBody}>{productLine}</p>
            <p className="mx-auto mt-4 max-w-[720px] text-sm leading-7 text-[var(--rv-gold)]">
              NOX lo resumiria peor, pero mas claro: &quot;Aqui hasta los cartuchos muertos siguen pagando alquiler.&quot;
            </p>
            <p className={styles.heroBody}>
              Un universo narrativo donde el hardware olvidado sigue vivo. NOX, Button Crew y Luna habitan una ciudad con barrios, facciones y humor negro propio, pensada para presentarse como serie y no como decorado.
            </p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={() => moveStep(1)}>
                Enter Retroville <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => jumpToStep(slideCount)}>
                Ir a la newsletter
              </button>
            </div>
            <div className="mx-auto mt-8 grid w-full max-w-[1040px] gap-4 text-left md:grid-cols-3">
              <article className="rounded-[1.55rem] border border-white/10 bg-[rgba(7,10,20,0.72)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-green)]">Que hay ya dentro</p>
                <h3 className={`${displayFont.className} mt-3 text-[2rem] uppercase leading-[0.92] text-white`}>
                  Universo ya presentable
                </h3>
                <div className="mt-4 grid gap-2">
                  {landingDepthHighlights.map((highlight) => (
                    <p key={highlight} className="text-sm leading-6 text-white/74">
                      {highlight}
                    </p>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.55rem] border border-white/10 bg-[rgba(7,10,20,0.72)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-cyan)]">{launchLabel}</p>
                <h3 className={`${displayFont.className} mt-3 text-[2rem] uppercase leading-[0.92] text-white`}>
                  Primer reveal publico
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/74">{launchEventCopy}</p>
              </article>

              <article className="rounded-[1.55rem] border border-white/10 bg-[rgba(7,10,20,0.72)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">Newsletter con utilidad real</p>
                <h3 className={`${displayFont.className} mt-3 text-[2rem] uppercase leading-[0.92] text-white`}>
                  {showAudienceCount ? `${waitlistCount.toLocaleString('es-ES')} personas ya reciben la señal` : 'Sé de los primeros'}
                </h3>
                <div className="mt-4 grid gap-2">
                  {waitlistBenefits.map((benefit) => (
                    <p key={benefit} className="text-sm leading-6 text-white/74">
                      {benefit}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(slideCount)}
                  className="mt-4 inline-flex min-h-[42px] items-center justify-center rounded-full border border-[var(--rv-green)]/24 bg-[rgba(0,255,136,0.08)] px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--rv-green)] transition hover:border-[var(--rv-green)]/40 hover:bg-[rgba(0,255,136,0.14)]"
                >
                  Abrir newsletter
                </button>
              </article>
            </div>
            <div className="mx-auto mt-5 grid w-full max-w-[1040px] gap-3 rounded-[1.55rem] border border-white/10 bg-[rgba(7,10,20,0.68)] p-5 text-left lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-cyan)]">Teaser de reparto</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {characterTeasers.map((character) => (
                    <article key={character.name} className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rv-gold)]">{character.district}</p>
                      <h3 className={`${displayFont.className} mt-2 text-[1.55rem] uppercase leading-[0.92] text-white`}>
                        {character.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/72">{character.pitch}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rv-green)]">Por que entrar ahora</p>
                  <p className="mt-3 text-sm leading-7 text-white/74">
                    Si alguien aterriza hoy, ya puede entender que Retroville tiene reparto, ciudad, tono y proceso real de serie, no solo un manifiesto bonito.
                  </p>
                </div>
                <Link href="/retroville/personajes" className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:brightness-110">
                  Ver reparto completo
                </Link>
              </div>
            </div>
            <div className={styles.heroSocials}>
              {RETROVILLE_SOCIAL_CHANNELS.map((social) => (
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
                <div className={styles.slideInner}>{renderSlide(slide)}</div>
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
