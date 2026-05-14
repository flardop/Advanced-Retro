'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Anton, Space_Mono } from 'next/font/google';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import styles from './retroville-experience.module.css';

const displayFont = Anton({ subsets: ['latin'], weight: '400' });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

const titleLetters = ['R', 'E', 'T', 'R', 'O', 'V', 'I', 'L', 'L', 'E'] as const;
const manifestoLines = ['EVERY', 'FORGOTTEN', 'GAME', 'ENDS UP', 'SOMEWHERE.'] as const;

type ImageSlide = {
  kind: 'image';
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  alt: string;
  accent: string;
};

type CountdownSlide = {
  kind: 'countdown';
  title: string;
  eyebrow: string;
  description: string;
};

type ManifestoSlide = {
  kind: 'manifesto';
  title: string;
  eyebrow: string;
  description: string;
};

type NarrativeSlide = ImageSlide | CountdownSlide | ManifestoSlide;

const narrativeSlides: readonly NarrativeSlide[] = [
  {
    kind: 'countdown',
    title: 'VENTANA DE LANZAMIENTO',
    eyebrow: 'LAUNCH WINDOW TARGET',
    description:
      'La primera gran señal de Retroville ya tiene fecha. Este tramo tiene que sentirse como antesala, no como una tarjeta metida en medio de la página.',
  },
  {
    kind: 'manifesto',
    title: 'EVERY FORGOTTEN GAME ENDS UP SOMEWHERE.',
    eyebrow: 'MANIFIESTO',
    description:
      'Una ciudad oscura. Hardware olvidado. Memorias corruptas. Humor extraño con ambición real.',
  },
  {
    kind: 'image',
    title: 'RETROVILLE',
    eyebrow: 'LA CIUDAD',
    description:
      'Una ciudad de neón, humedad y ruido de arcades rotos. Cada callejón es un cartucho. Cada edificio es una consola que nunca terminó de apagarse.',
    image: '/images/retroville/retroville-street.png',
    alt: 'Calles de Retroville con estética neón y personajes del universo',
    accent: 'rgba(123,47,255,0.34)',
  },
  {
    kind: 'image',
    title: 'NOX',
    eyebrow: 'EL SUPERVIVIENTE',
    description:
      'Sarcasmo, batería baja y una dignidad bastante discutible. NOX no dirige la ciudad por épica. Lo hace porque nadie más soporta el turno de noche.',
    image: '/images/retroville/retroville-wave.png',
    alt: 'NOX dentro del universo Retroville',
    accent: 'rgba(138,215,255,0.28)',
  },
  {
    kind: 'image',
    title: 'BUTTON CREW',
    eyebrow: 'EL RUIDO SOCIAL',
    description:
      'A, B, Y y X son la conversación permanente de Retroville: impulsivos, cínicos, analíticos y caóticos. Siempre llegan juntos. Siempre complican algo.',
    image: '/images/retroville/retroville-button-crew-studio.png',
    alt: 'Button Crew posando como grupo dentro de Retroville',
    accent: 'rgba(242,187,116,0.24)',
  },
  {
    kind: 'image',
    title: 'CAPITAL DEL CAOS',
    eyebrow: 'SEÑAL ECONÓMICA',
    description:
      'Retroville también sabe ser exagerada, absurda y peligrosa. Si alguna vez la ciudad empieza a imprimir dinero emocional, esta será la sala de juntas.',
    image: '/images/retroville/retroville-chaos-office.png',
    alt: 'NOX y Button Crew celebrando en una oficina caótica dentro del universo Retroville',
    accent: 'rgba(255,60,0,0.24)',
  },
] as const;

const relicGallery = [
  {
    title: 'Mona NOX',
    eyebrow: 'ARCHIVO 01',
    body: 'El cansancio como retrato oficial. La ciudad también colecciona versiones imposibles de sus propias leyendas.',
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
    body: 'Toda banda acaba reuniéndose alrededor de una mesa. En Retroville, esa cena siempre termina siendo una discusión sobre memoria y control.',
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
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function slideAccentStyle(accent: string): CSSProperties {
  return { ['--retroville-slide-accent' as string]: accent } as CSSProperties;
}

export default function RetrovilleExperience({
  launchIso,
  launchLabel,
  waitlistCount,
}: {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
}) {
  const heroRef = useRef<HTMLElement | null>(null);
  const narrativeRef = useRef<HTMLElement | null>(null);
  const [heroProgress, setHeroProgress] = useState(0);
  const [narrativeProgress, setNarrativeProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [manualSlide, setManualSlide] = useState(0);
  const [dropVisible, setDropVisible] = useState<number[]>([]);
  const hypeGoal = 5000;
  const hypePct = waitlistCount > 0 ? clamp(waitlistCount / hypeGoal, 0, 1) : 0;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const total = Math.max(heroRef.current.offsetHeight - window.innerHeight, 1);
        setHeroProgress(clamp(-rect.top / total));
      }

      if (narrativeRef.current && !isMobile) {
        const rect = narrativeRef.current.getBoundingClientRect();
        const total = Math.max(narrativeRef.current.offsetHeight - window.innerHeight, 1);
        setNarrativeProgress(clamp(-rect.top / total));
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const dropNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-drop-index]'));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealNodes.forEach((node) => {
        node.dataset.visible = 'true';
      });
      setDropVisible(signalCards.map((_, index) => index));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          if (entry.target instanceof HTMLElement && entry.target.dataset.reveal !== undefined) {
            entry.target.dataset.visible = 'true';
          }

          const dropIndex = entry.target.getAttribute('data-drop-index');
          if (dropIndex) {
            setDropVisible((current) =>
              current.includes(Number(dropIndex)) ? current : [...current, Number(dropIndex)]
            );
          }

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    );

    [...revealNodes, ...dropNodes].forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const desktopSlideIndex = Math.round(narrativeProgress * (narrativeSlides.length - 1));
  const activeSlide = isMobile ? manualSlide : desktopSlideIndex;
  const trackTranslate = isMobile ? 0 : narrativeProgress * (narrativeSlides.length - 1) * 100;
  const manifestoActive = isMobile || activeSlide >= 1;

  return (
    <main className={`${monoFont.className} overflow-x-hidden bg-[var(--rv-bg)] text-[var(--rv-text)]`}>
      <section ref={heroRef} className="relative min-h-[160svh] overflow-hidden px-4 pb-8 pt-5 sm:px-8 lg:px-10">
        <div className={`absolute inset-0 ${styles.heroNoise}`} />
        <div className={styles.scanlines} />
        <div className="absolute left-[-10%] top-[8%] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgba(123,47,255,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(0,255,136,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(circle_at_50%_100%,rgba(255,60,0,0.14),transparent_44%)]" />

        <div className="sticky top-0 mx-auto flex min-h-[100svh] max-w-[1540px] items-stretch py-4 sm:py-6">
          <div className="relative flex min-h-[92svh] w-full flex-col overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,8,12,0.86),rgba(5,5,8,0.97))] shadow-[0_38px_140px_rgba(0,0,0,0.46)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(123,47,255,0.22),transparent_22%),radial-gradient(circle_at_50%_84%,rgba(138,215,255,0.14),transparent_22%)]" />
            <div
              className="absolute inset-[18%_36%_18%_36%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_66%)] blur-[90px]"
              style={{
                transform: `scale(${1 + heroProgress * 1.8})`,
                opacity: clamp(0.5 + heroProgress * 0.45, 0.5, 1),
              }}
            />

            <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">
                Universo original de AdvancedRetro
              </p>
              <Link
                href="/"
                className="rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/68 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              >
                Volver a AdvancedRetro
              </Link>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 pb-10 pt-2 sm:px-8 lg:px-10">
              <div className="absolute left-[-1%] top-[18%] hidden h-[62%] w-[30%] lg:block">
                <div
                  className={`${styles.characterFloatAlt} ${styles.heroCharacterShell} relative h-full w-full`}
                  style={{ transform: `translate3d(${heroProgress * 16}px, ${-heroProgress * 42}px, 0)` }}
                >
                  <Image
                    src="/images/retroville/nox-push.png"
                    alt="NOX empujando hacia el centro del universo Retroville"
                    fill
                    sizes="28vw"
                    className={`${styles.heroCharacterBackdrop} object-contain object-left-center`}
                  />
                  <div className={styles.heroCharacterAuraLeft} />
                  <Image
                    src="/images/retroville/nox-push.png"
                    alt="NOX empujando hacia el centro del universo Retroville"
                    fill
                    priority
                    sizes="28vw"
                    className={`${styles.heroCharacterArt} ${styles.heroCharacterArtLeft} object-contain object-left-center`}
                  />
                </div>
              </div>

              <div className="absolute right-[-3%] top-[22%] hidden h-[58%] w-[33%] lg:block">
                <div
                  className={`${styles.characterFloat} ${styles.heroCharacterShell} relative h-full w-full`}
                  style={{ transform: `translate3d(${-heroProgress * 16}px, ${-heroProgress * 36}px, 0)` }}
                >
                  <Image
                    src="/images/retroville/button-crew-push.png"
                    alt="Button Crew empujando hacia el centro del universo Retroville"
                    fill
                    sizes="31vw"
                    className={`${styles.heroCharacterBackdrop} object-contain object-right-center`}
                  />
                  <div className={styles.heroCharacterAuraRight} />
                  <Image
                    src="/images/retroville/button-crew-push.png"
                    alt="Button Crew empujando hacia el centro del universo Retroville"
                    fill
                    priority
                    sizes="31vw"
                    className={`${styles.heroCharacterArt} ${styles.heroCharacterArtRight} object-contain object-right-center`}
                  />
                </div>
              </div>

              <div className="relative z-10 mx-auto max-w-[980px] text-center">
                <p
                  className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/74"
                  style={{ opacity: clamp(1 - heroProgress * 1.1, 0, 1) }}
                >
                  Cinematic universe reveal
                </p>

                <h1 className={`${displayFont.className} mt-6 text-[3.6rem] uppercase leading-[0.84] text-white sm:text-[5.4rem] lg:text-[8rem] xl:text-[9.1rem]`}>
                  <span className={styles.titleWord}>
                    {titleLetters.map((letter, index) => {
                      const isZoom = letter === 'O' && index === 4;
                      const spread = index < 4 ? -1 : 1;
                      const opacity = isZoom ? 1 : 1 - heroProgress * 1.12;
                      const translateX = isZoom ? 0 : heroProgress * spread * 42;
                      const translateY = heroProgress * -18;
                      const scale = isZoom ? 1 + heroProgress * 24 : 1;
                      return (
                        <span
                          key={`${letter}-${index}`}
                          data-letter={letter}
                          className={`${styles.titleLetter} ${isZoom ? styles.titleLetterZoom : ''}`}
                          style={{
                            opacity: clamp(opacity, 0, 1),
                            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                            filter: isZoom
                              ? `blur(${heroProgress > 0.76 ? (heroProgress - 0.76) * 12 : 0}px)`
                              : undefined,
                          }}
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </span>
                </h1>

                <p
                  className="mx-auto mt-5 max-w-[18ch] text-2xl font-semibold leading-tight text-white sm:text-[2rem] lg:text-[2.25rem]"
                  style={{
                    opacity: clamp(1 - heroProgress * 1.35, 0, 1),
                    transform: `translateY(${heroProgress * -12}px)`,
                  }}
                >
                  Every forgotten game ends up somewhere.
                </p>

                <p
                  className="mx-auto mt-5 max-w-[38rem] text-sm leading-8 text-white/62 sm:text-base"
                  style={{ opacity: clamp(1 - heroProgress * 1.42, 0, 1) }}
                >
                  Una ciudad oscura de hardware olvidado, memorias corruptas y personajes que siguen
                  empujando el sistema incluso cuando todo lo demás ya se apagó.
                </p>

                <div
                  className="mt-8 flex flex-wrap justify-center gap-3"
                  style={{ opacity: clamp(1 - heroProgress * 1.2, 0, 1) }}
                >
                  <Link
                    href="#waitlist"
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--rv-accent2),var(--rv-accent))] px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_48px_rgba(138,215,255,0.16)] transition hover:brightness-110"
                  >
                    Enter Retroville
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="relative mt-8 h-[250px] w-full max-w-[920px] overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,14,24,0.82),rgba(7,9,15,0.96))] lg:hidden">
                <div className="absolute inset-x-[20%] top-[14%] h-[56%] rounded-full bg-[radial-gradient(circle,rgba(123,47,255,0.28),transparent_68%)] blur-3xl" />
                <div className="absolute left-[-10%] top-[10%] h-[82%] w-[45%]">
                  <Image
                    src="/images/retroville/nox-push.png"
                    alt="NOX empujando"
                    fill
                    priority
                    sizes="42vw"
                    className="object-contain object-left-center"
                    style={{
                      maskImage:
                        'linear-gradient(90deg, black 70%, transparent 100%), linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)',
                    }}
                  />
                </div>
                <div className="absolute right-[-14%] top-[16%] h-[76%] w-[54%]">
                  <Image
                    src="/images/retroville/button-crew-push.png"
                    alt="Button Crew empujando"
                    fill
                    priority
                    sizes="48vw"
                    className="object-contain object-right-center"
                    style={{
                      maskImage:
                        'linear-gradient(90deg, transparent 0%, black 20%, black 84%, transparent 100%), linear-gradient(180deg, transparent 0%, black 20%, black 82%, transparent 100%)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4 text-[11px] uppercase tracking-[0.28em] text-white/48 sm:px-8 lg:px-10"
              style={{ opacity: clamp(1 - heroProgress * 1.3, 0, 1) }}
            >
              <span>Desliza hacia la O</span>
              <span>Launch window target · {launchLabel}</span>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={narrativeRef}
        className={`px-4 py-10 sm:px-8 lg:px-10 ${isMobile ? '' : 'min-h-[540vh]'}`}
      >
        <div className="mx-auto max-w-[1540px]">
          <div className={`${isMobile ? '' : 'sticky top-0 h-[100svh]'} overflow-hidden rounded-[2.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,8,10,0.94),rgba(5,5,8,0.98))] shadow-[0_34px_120px_rgba(0,0,0,0.42)]`}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">Narrative track</p>
                <h2 className={`${displayFont.className} mt-2 text-3xl uppercase text-white sm:text-4xl`}>
                  Slider narrativo
                </h2>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/58">
                <button
                  type="button"
                  onClick={() => setManualSlide((current) => Math.max(0, current - 1))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.08] lg:hidden"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {String(activeSlide + 1).padStart(2, '0')} / {String(narrativeSlides.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => setManualSlide((current) => Math.min(narrativeSlides.length - 1, current + 1))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.08] lg:hidden"
                  aria-label="Slide siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isMobile ? (
              <div className="overflow-x-auto px-4 pb-6 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-4 snap-x snap-mandatory">
                  {narrativeSlides.map((slide) => (
                    <article
                      key={`${slide.kind}-${slide.title}`}
                      className="min-w-[88%] snap-center overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(11,11,13,0.76)]"
                    >
                      {slide.kind === 'countdown' ? (
                        <div className="p-5">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
                          <h3 className={`${displayFont.className} mt-4 text-3xl uppercase leading-none text-white`}>
                            {launchLabel}
                          </h3>
                          <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
                          <div className={`${styles.countGlow} mt-6 rounded-[1.6rem] border border-white/10 bg-[rgba(10,10,10,0.72)] p-3`}>
                            <RetrovilleCountdown targetIso={launchIso} className="border-0 bg-transparent p-0 shadow-none" />
                          </div>
                        </div>
                      ) : slide.kind === 'manifesto' ? (
                        <div className="flex min-h-[28rem] flex-col justify-center p-5">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
                          <div className="mt-5 space-y-2">
                            {manifestoLines.map((line, index) => (
                              <p key={line} className={`${displayFont.className} text-[2.6rem] uppercase leading-[0.88] text-white sm:text-[3rem]`}>
                                {line}
                              </p>
                            ))}
                          </div>
                          <p className="mt-5 text-sm leading-7 text-white/62">{slide.description}</p>
                        </div>
                      ) : (
                        <>
                          <div className={`${styles.slideVisual} relative aspect-[4/3] overflow-hidden border-b border-white/10`} style={slideAccentStyle(slide.accent)}>
                            <div className={styles.slideBackdrop}>
                              <Image src={slide.image} alt="" fill sizes="88vw" className={styles.slideBackdropImage} aria-hidden />
                            </div>
                            <div className={styles.slideVisualTint} />
                            <div className={styles.slideForeground}>
                              <Image src={slide.image} alt={slide.alt} fill sizes="88vw" className={styles.slideImage} />
                            </div>
                          </div>
                          <div className="p-5">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
                            <h3 className={`${displayFont.className} mt-3 text-3xl uppercase leading-none text-white`}>
                              {slide.title}
                            </h3>
                            <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[calc(100svh-74px)] overflow-hidden">
                <div className={`${styles.universeTrack} flex h-full`} style={{ width: `${narrativeSlides.length * 100}%`, transform: `translateX(-${trackTranslate}%)` }}>
                  {narrativeSlides.map((slide) => (
                    <article
                      key={`${slide.kind}-${slide.title}`}
                      className="flex h-full shrink-0 basis-full items-center px-8 py-8 xl:px-10"
                    >
                      {slide.kind === 'countdown' ? (
                        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:items-center">
                          <div className="max-w-[30rem]">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
                            <h3 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white xl:text-6xl`}>
                              {launchLabel}
                            </h3>
                            <p className="mt-6 text-base leading-8 text-white/64">{slide.description}</p>
                          </div>
                          <div className={`${styles.countGlow} rounded-[1.9rem] border border-white/10 bg-[rgba(10,10,10,0.72)] p-5`}>
                            <RetrovilleCountdown targetIso={launchIso} className="border-0 bg-transparent p-0 shadow-none" />
                          </div>
                        </div>
                      ) : slide.kind === 'manifesto' ? (
                        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,0.32fr)] lg:items-end">
                          <div className="space-y-3">
                            {manifestoLines.map((line, index) => (
                              <p
                                key={line}
                                className={`${displayFont.className} ${styles.manifestLine} ${manifestoActive ? styles.manifestLineVisible : ''} text-[4.8rem] uppercase leading-[0.86] text-white xl:text-[6.6rem]`}
                                style={{ transitionDelay: `${index * 70}ms` }}
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                          <p className="max-w-[24rem] text-sm uppercase tracking-[0.28em] text-white/46 xl:text-base">
                            {slide.description}
                          </p>
                        </div>
                      ) : (
                        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:items-center">
                          <div className={`${styles.slideVisual} relative h-full min-h-[68vh] overflow-hidden rounded-[2rem] border border-white/10`} style={slideAccentStyle(slide.accent)}>
                            <div className={styles.slideBackdrop}>
                              <Image src={slide.image} alt="" fill sizes="42vw" className={styles.slideBackdropImage} aria-hidden />
                            </div>
                            <div className={styles.slideVisualTint} />
                            <div className={styles.slideForeground}>
                              <Image src={slide.image} alt={slide.alt} fill sizes="42vw" className={styles.slideImage} />
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
                            <h3 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white xl:text-6xl`}>
                              {slide.title}
                            </h3>
                            <p className="mt-6 max-w-[34rem] text-base leading-8 text-white/66 xl:text-lg">
                              {slide.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 border-t border-white/10 px-5 py-4">
              {narrativeSlides.map((slide, index) => (
                <button
                  key={`${slide.kind}-${slide.title}`}
                  type="button"
                  onClick={() => setManualSlide(index)}
                  className={`h-2.5 rounded-full transition ${activeSlide === index ? 'w-10 bg-[var(--rv-accent)]' : 'w-2.5 bg-white/24'}`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1540px]">
          <div className="mb-8 max-w-[48rem]" data-reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">Archive visions</p>
            <h2 className={`${displayFont.className} ${styles.reveal} mt-4 text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl`} data-reveal>
              LOS APÓCRIFOS DE RETROVILLE
            </h2>
            <p className="mt-4 text-sm leading-8 text-white/62 sm:text-base">
              Esta parte se queda: reliquias visuales, reinterpretaciones clásicas y mitología absurda alrededor de los personajes. Aquí es donde el universo se vuelve divertido de verdad.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {relicGallery.map((item) => (
              <article
                key={item.title}
                data-reveal
                className={`${styles.reveal} ${styles.galleryCard} group overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,18,0.92),rgba(7,8,12,0.98))] shadow-[0_26px_90px_rgba(0,0,0,0.26)]`}
              >
                <div className="relative aspect-[16/14] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6 sm:p-7">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent3)]">{item.eyebrow}</p>
                  <h3 className={`${displayFont.className} mt-4 text-3xl uppercase leading-none text-white`}>
                    {item.title}
                  </h3>
                  <p className="mt-5 text-sm leading-8 text-white/64 sm:text-base">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1540px] grid gap-5 lg:grid-cols-3">
          {signalCards.map((card, index) => (
            <article
              key={card.title}
              data-drop-index={index}
              className={`${styles.dropCard} ${dropVisible.includes(index) ? styles.dropCardVisible : ''} rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,18,0.94),rgba(6,7,10,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">Signal</p>
              <h3 className={`${displayFont.className} mt-4 text-3xl uppercase leading-none text-white`}>{card.title}</h3>
              <p className="mt-5 text-sm leading-8 text-white/62">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="waitlist" className="px-4 py-16 sm:px-8 lg:px-10">
        <div className={`${styles.waitlistNoise} mx-auto max-w-[1540px] overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,10,14,0.95),rgba(5,6,9,0.98))] shadow-[0_30px_100px_rgba(0,0,0,0.34)]`}>
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">Waitlist</p>
              <h2 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl`}>
                ENTRA ANTES DE QUE EL RESTO DE INTERNET LO RECUERDE
              </h2>
              <p className="mt-5 max-w-[34rem] text-sm leading-8 text-white/64 sm:text-base">
                Primer drop. Primer reveal. Primera señal jugable. Retroville tiene que sentirse como un universo que se descubre, no como otra página de próximamente.
              </p>

              {waitlistCount > 0 ? (
                <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
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
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[rgba(8,10,16,0.72)] p-5 backdrop-blur-xl sm:p-6">
              <RetrovilleWaitlistForm
                darkMode
                buttonLabel="QUIERO SER EL PRIMERO"
                successMessage="Perfecto. Ya formas parte de la primera señal de Retroville."
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/52">
        <p>© AdvancedRetro · Retroville está en desarrollo.</p>
        <Link href="/" className="mt-3 inline-flex text-white transition hover:text-[var(--rv-accent)]">
          ← Volver a AdvancedRetro
        </Link>
      </footer>
    </main>
  );
}
