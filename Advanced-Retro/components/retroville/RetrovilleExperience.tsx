'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Anton, Space_Mono } from 'next/font/google';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import styles from './retroville-experience.module.css';

const displayFont = Anton({ subsets: ['latin'], weight: '400' });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

const manifestoLines = ['EVERY', 'FORGOTTEN', 'GAME', 'ENDS UP', 'SOMEWHERE.'];

const universeSlides = [
  {
    title: 'RETROVILLE',
    eyebrow: 'LA CIUDAD',
    description:
      'Una ciudad de neón construida con hardware descartado. Cada callejón es un cartucho. Cada edificio es una consola que nunca se apagó del todo.',
    image: '/images/retroville/nox-styleguide.png',
  },
  {
    title: 'NOX',
    eyebrow: 'LOS PERSONAJES',
    description:
      'El guardián del núcleo. Una entidad construida de píxeles perdidos y memoria RAM fragmentada. Protege el corazón pulsante de Retroville.',
    image: '/images/retroville/nox-push.png',
  },
  {
    title: 'BUTTON CREW',
    eyebrow: 'BUTTON CREW',
    description:
      'Los que mantienen las luces encendidas. Personajes que llevan demasiado tiempo en el juego. Literalmente.',
    image: '/images/retroville/button-crew-push.png',
  },
  {
    title: 'UN UNIVERSO EN EXPANSIÓN',
    eyebrow: 'EL UNIVERSO',
    description:
      'Cortos. Drops interactivos. Torneos. Momentos de lanzamiento diseñados para sentirse como cultura, no como relleno.',
    image: '/images/retroville/button-crew-styleguide.png',
  },
] as const;

const signalCards = [
  {
    title: 'WORLD BUILDING',
    body: 'Una ciudad de hardware olvidado. Neón. Memorias corruptas. Dispositivos que nunca se apagaron del todo.',
  },
  {
    title: 'ARCADE SIGNAL',
    body: 'Drops cortos. Reveals interactivos. Momentos diseñados para sentirse como cultura.',
  },
  {
    title: 'RETRO TOURNAMENTS',
    body: 'Caos competitivo. Lore comunitario. La energía emocional de los juegos viejos, amplificada.',
  },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
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
  const universeRef = useRef<HTMLElement | null>(null);
  const [heroProgress, setHeroProgress] = useState(0);
  const [universeProgress, setUniverseProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [manifestVisible, setManifestVisible] = useState<number[]>([]);
  const [dropsVisible, setDropsVisible] = useState<number[]>([]);
  const [manualSlide, setManualSlide] = useState(0);
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
        const progress = clamp(-rect.top / (window.innerHeight * 0.8));
        setHeroProgress(progress);
      }

      if (!isMobile && universeRef.current) {
        const rect = universeRef.current.getBoundingClientRect();
        const total = universeRef.current.offsetHeight - window.innerHeight;
        const progress = total > 0 ? clamp(-rect.top / total) : 0;
        setUniverseProgress(progress);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  useEffect(() => {
    const manifestNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-manifest-index]'));
    const dropNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-drop-index]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const manifestIndex = entry.target.getAttribute('data-manifest-index');
          const dropIndex = entry.target.getAttribute('data-drop-index');
          if (entry.isIntersecting && manifestIndex) {
            setManifestVisible((current) =>
              current.includes(Number(manifestIndex)) ? current : [...current, Number(manifestIndex)]
            );
          }
          if (entry.isIntersecting && dropIndex) {
            setDropsVisible((current) =>
              current.includes(Number(dropIndex)) ? current : [...current, Number(dropIndex)]
            );
          }
        });
      },
      { threshold: 0.28 }
    );

    manifestNodes.forEach((node) => observer.observe(node));
    dropNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const desktopSlideIndex = Math.round(universeProgress * (universeSlides.length - 1));
  const activeSlide = isMobile ? manualSlide : desktopSlideIndex;
  const trackTranslate = isMobile ? 0 : universeProgress * (universeSlides.length - 1) * 100;

  const titleLetters = useMemo(() => ['R', 'E', 'T', 'R', 'O', 'V', 'I', 'L', 'L', 'E'], []);

  return (
    <main className={`${monoFont.className} bg-[var(--rv-bg)] text-[var(--rv-text)]`}>
      <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden px-5 pb-14 pt-8 sm:px-8 lg:px-10">
        <div className={`absolute inset-0 ${styles.heroNoise}`} />
        <div className={styles.scanlines} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(123,47,255,0.18),transparent_26%),radial-gradient(circle_at_50%_88%,rgba(255,60,0,0.12),transparent_22%)]" />
        <div className="absolute left-[-8%] top-[14%] hidden h-[52vh] w-[32vw] rounded-full bg-[radial-gradient(circle,rgba(0,255,136,0.18),transparent_72%)] blur-3xl lg:block" />
        <div className="absolute right-[-6%] top-[18%] hidden h-[54vh] w-[34vw] rounded-full bg-[radial-gradient(circle,rgba(123,47,255,0.22),transparent_72%)] blur-3xl lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-[radial-gradient(circle_at_50%_100%,rgba(123,47,255,0.22),transparent_42%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1540px] flex-col justify-between rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(8,8,12,0.82),rgba(6,6,8,0.94))] px-5 py-6 shadow-[0_34px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:px-8 sm:py-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">Universo original de AdvancedRetro</p>
            <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/70 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white">
              Volver a AdvancedRetro
            </Link>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
            <div className="absolute left-[-3%] top-[20%] hidden h-[62%] w-[26%] lg:block">
              <div className={`${styles.characterFloatAlt} relative h-full w-full`} style={{ transform: `translateY(${-heroProgress * 48}px)` }}>
                <Image
                  src="/images/retroville/nox-push.png"
                  alt="NOX empujando el núcleo de Retroville"
                  fill
                  priority
                  sizes="28vw"
                  className="object-contain object-left-center"
                  style={{
                    maskImage:
                      'radial-gradient(circle at 65% 50%, black 56%, transparent 98%), linear-gradient(90deg, black 76%, transparent 100%), linear-gradient(180deg, transparent 2%, black 20%, black 78%, transparent 100%)',
                  }}
                />
              </div>
            </div>
            <div className="absolute right-[-5%] top-[26%] hidden h-[56%] w-[30%] lg:block">
              <div className={`${styles.characterFloat} relative h-full w-full`} style={{ transform: `translateY(${-heroProgress * 42}px)` }}>
                <Image
                  src="/images/retroville/button-crew-push.png"
                  alt="Button Crew empujando el núcleo de Retroville"
                  fill
                  priority
                  sizes="30vw"
                  className="object-contain object-right-center"
                  style={{
                    maskImage:
                      'radial-gradient(circle at 34% 50%, black 62%, transparent 98%), linear-gradient(90deg, transparent 0%, black 20%, black 84%, transparent 100%), linear-gradient(180deg, transparent 0%, black 18%, black 80%, transparent 100%)',
                  }}
                />
              </div>
            </div>

            <div className="relative z-10 mx-auto max-w-[980px] text-center">
              <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/72">
                Cinematic universe reveal
              </p>
              <h1 className={`${displayFont.className} mt-7 text-[3.6rem] uppercase leading-[0.86] tracking-[0.02em] text-white sm:text-[5.4rem] lg:text-[8rem] xl:text-[9rem]`}>
                <span className={styles.titleWord}>
                  {titleLetters.map((letter, index) => {
                    const isZoom = letter === 'O' && index === 4;
                    const spread = index < 4 ? -1 : 1;
                    const opacity = isZoom ? 1 : 1 - heroProgress * 1.12;
                    const translateX = isZoom ? 0 : heroProgress * spread * 36;
                    const translateY = heroProgress * -18;
                    const scale = isZoom ? 1 + heroProgress * 18 : 1;
                    return (
                      <span
                        key={`${letter}-${index}`}
                        data-letter={letter}
                        className={`${styles.titleLetter} ${isZoom ? styles.titleLetterZoom : ''}`}
                        style={{
                          opacity: clamp(opacity, 0, 1),
                          transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                          filter: isZoom ? `blur(${heroProgress > 0.72 ? (heroProgress - 0.72) * 10 : 0}px)` : undefined,
                        }}
                      >
                        {letter}
                      </span>
                    );
                  })}
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-[22ch] text-2xl font-semibold leading-tight text-white transition lg:text-[2.2rem]" style={{ opacity: clamp(1 - heroProgress * 1.35, 0, 1), transform: `translateY(${heroProgress * -12}px)` }}>
                Every forgotten game ends up somewhere.
              </p>

              <p className="mx-auto mt-5 max-w-[36rem] text-sm leading-8 text-white/64 sm:text-base" style={{ opacity: clamp(1 - heroProgress * 1.4, 0, 1) }}>
                Una ciudad oscura. Hardware olvidado. Memorias corruptas. Personajes que siguen respirando dentro del ruido digital.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3" style={{ opacity: clamp(1 - heroProgress * 1.2, 0, 1) }}>
                <Link href="#waitlist" className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--rv-accent),var(--rv-accent2))] px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_46px_rgba(0,255,136,0.18)] transition hover:brightness-110">
                  Enter Retroville
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative mt-10 h-[230px] w-full max-w-[900px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,14,24,0.8),rgba(9,12,18,0.94))] lg:hidden">
              <div className="absolute inset-x-[22%] top-[18%] h-[55%] rounded-full bg-[radial-gradient(circle,rgba(123,47,255,0.22),transparent_68%)] blur-3xl" />
              <div className="absolute left-[-8%] top-[12%] h-[78%] w-[44%]">
                <Image
                  src="/images/retroville/nox-push.png"
                  alt="NOX"
                  fill
                  priority
                  sizes="40vw"
                  className="object-contain object-left-center"
                  style={{
                    maskImage:
                      'linear-gradient(90deg, black 72%, transparent 100%), linear-gradient(180deg, transparent 0%, black 18%, black 78%, transparent 100%)',
                  }}
                />
              </div>
              <div className="absolute right-[-12%] top-[18%] h-[72%] w-[52%]">
                <Image
                  src="/images/retroville/button-crew-push.png"
                  alt="Button Crew"
                  fill
                  priority
                  sizes="46vw"
                  className="object-contain object-right-center"
                  style={{
                    maskImage:
                      'linear-gradient(90deg, transparent 0%, black 20%, black 82%, transparent 100%), linear-gradient(180deg, transparent 0%, black 20%, black 82%, transparent 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-14 sm:px-8 lg:px-10">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_50%_0%,rgba(123,47,255,0.22),transparent_22%)]" />
        <div className="mx-auto max-w-[1180px] rounded-[2rem] border border-white/10 bg-[rgba(13,13,13,0.84)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] lg:items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">Launch window target</p>
              <h2 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white sm:text-5xl`}>10 de noviembre de 2026</h2>
              <p className="mt-4 text-sm leading-8 text-white/58">El residuo del zoom sigue presente: esta ventana marca la primera señal importante de Retroville.</p>
            </div>
            <div className={`${styles.countGlow} rounded-[1.8rem] border border-white/10 bg-[rgba(10,10,10,0.72)] p-3 sm:p-4`}>
              <RetrovilleCountdown targetIso={launchIso} className="border-0 bg-transparent p-0 shadow-none" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-18 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(9,9,11,0.92),rgba(6,6,8,0.98))] px-6 py-10 shadow-[0_28px_90px_rgba(0,0,0,0.3)] sm:px-10 sm:py-14">
            <div className="space-y-3">
              {manifestoLines.map((line, index) => (
                <p
                  key={line}
                  data-manifest-index={index}
                  className={`${displayFont.className} ${styles.manifestLine} ${manifestVisible.includes(index) ? styles.manifestLineVisible : ''} text-[3.2rem] uppercase leading-[0.86] text-white sm:text-[4.4rem] lg:text-[6rem] xl:text-[6.8rem]`}
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-6 max-w-[36rem] text-sm uppercase tracking-[0.28em] text-white/46 sm:text-base">
              Una ciudad oscura. Hardware olvidado. Memorias corruptas.
            </p>
          </div>
        </div>
      </section>

      <section ref={universeRef} className={`px-5 py-18 sm:px-8 lg:px-10 ${isMobile ? '' : 'min-h-[320vh]'}`}>
        <div className="mx-auto max-w-7xl">
          <div className={`${isMobile ? '' : 'sticky top-10 h-[82vh]'} overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.92),rgba(6,6,8,0.98))] shadow-[0_28px_90px_rgba(0,0,0,0.3)]`}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-accent)]">El universo</p>
                <h2 className={`${displayFont.className} mt-2 text-3xl uppercase text-white sm:text-4xl`}>Horizontal reveal</h2>
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
                <span>{String(activeSlide + 1).padStart(2, '0')} / {String(universeSlides.length).padStart(2, '0')}</span>
                <button
                  type="button"
                  onClick={() => setManualSlide((current) => Math.min(universeSlides.length - 1, current + 1))}
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
                  {universeSlides.map((slide) => (
                    <article key={slide.title} className="min-w-[88%] snap-center rounded-[1.8rem] border border-white/10 bg-[rgba(11,11,13,0.76)] p-5">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(123,47,255,0.16),transparent_28%),rgba(12,12,16,0.9)]">
                        <Image src={slide.image} alt={slide.title} fill sizes="88vw" className="object-cover" />
                      </div>
                      <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
                      <h3 className={`${displayFont.className} mt-3 text-3xl uppercase leading-none text-white`}>{slide.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-white/64">{slide.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[calc(82vh-74px)] overflow-hidden">
                <div className={`${styles.universeTrack} flex h-full w-[400%]`} style={{ transform: `translateX(-${trackTranslate}%)` }}>
                  {universeSlides.map((slide) => (
                    <article key={slide.title} className="grid h-full w-full shrink-0 grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] items-center gap-10 px-8 py-8 xl:px-10">
                      <div className="relative h-full overflow-hidden rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(123,47,255,0.16),transparent_28%),rgba(12,12,16,0.9)]">
                        <Image src={slide.image} alt={slide.title} fill sizes="40vw" className="object-cover" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">{slide.eyebrow}</p>
                        <h3 className={`${displayFont.className} mt-4 text-5xl uppercase leading-none text-white xl:text-6xl`}>{slide.title}</h3>
                        <p className="mt-6 max-w-[34rem] text-base leading-8 text-white/66 xl:text-lg">{slide.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 border-t border-white/10 px-5 py-4">
              {universeSlides.map((slide, index) => (
                <button
                  key={slide.title}
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

      <section className="px-5 py-18 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-3">
            {signalCards.map((card, index) => (
              <article
                key={card.title}
                data-drop-index={index}
                className={`${styles.dropCard} ${dropsVisible.includes(index) ? styles.dropCardVisible : ''} rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,12,0.92),rgba(7,7,9,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]`}
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">Signal {index + 1}</p>
                <h3 className={`${displayFont.className} mt-4 text-3xl uppercase leading-none text-white`}>{card.title}</h3>
                <p className="mt-5 text-sm leading-8 text-white/62">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="px-5 py-18 sm:px-8 lg:px-10">
        <div className={`${styles.waitlistNoise} mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,9,11,0.94),rgba(5,5,7,0.98))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-10`}>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">Waitlist</p>
            <h2 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white sm:text-5xl`}>ENTRA ANTES QUE EL RESTO DE INTERNET LO RECUERDE.</h2>
            <p className="mx-auto mt-5 max-w-[40rem] text-sm leading-8 text-white/62 sm:text-base">
              Primer drop. Primer reveal. Primera señal jugable de Retroville.
            </p>
          </div>

          {waitlistCount > 0 ? (
            <div className="mx-auto mt-8 max-w-2xl rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4 text-sm text-white/62">
                <span>{waitlistCount.toLocaleString('es-ES')} registros</span>
                <span>Objetivo {hypeGoal.toLocaleString('es-ES')}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[linear-gradient(135deg,var(--rv-accent),var(--rv-accent2))]" style={{ width: `${Math.round(hypePct * 100)}%` }} />
              </div>
            </div>
          ) : null}

          <div className="mx-auto mt-8 max-w-2xl">
            <RetrovilleWaitlistForm darkMode buttonLabel="QUIERO SER EL PRIMERO" successMessage="Perfecto. Ya formas parte de la primera señal de Retroville." />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/52">
        <p>© AdvancedRetro · Retroville está en desarrollo.</p>
        <Link href="/" className="mt-3 inline-flex text-white transition hover:text-[var(--rv-accent)]">← Volver a AdvancedRetro</Link>
      </footer>
    </main>
  );
}
