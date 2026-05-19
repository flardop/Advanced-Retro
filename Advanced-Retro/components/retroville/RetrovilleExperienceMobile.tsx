'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Bebas_Neue, DM_Sans, Space_Mono } from 'next/font/google';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import styles from './retroville-experience.module.css';

const displayFont = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

const monoFont = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

const titleLetters = ['R', 'E', 'T', 'R', 'O', 'V', 'I', 'L', 'L', 'E'] as const;
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

const manifestoLines = ['EVERY', 'FORGOTTEN', 'GAME', 'ENDS UP', 'SOMEWHERE.'] as const;

const characterCards = [
  {
    key: 'nox',
    name: 'NOX',
    subtitle: 'El Guardián del Núcleo',
    subtitleColor: 'var(--rv-purple)',
    type: 'Entidad Digital',
    origin: 'Memoria RAM fragmentada',
    role: 'Proteger el corazón pulsante de Retroville',
    description:
      'Construido de píxeles perdidos y capas de código que nadie quiso borrar. NOX no recuerda de qué juego vino, pero recuerda cada uno de los que llegaron después. Guarda el Núcleo de Retroville desde antes de que la ciudad tuviera nombre.',
    image: '/images/retroville/nox-push.png',
    objectPosition: 'left center',
    accent: 'rgba(155, 92, 255, 0.18)',
  },
  {
    key: 'crew',
    name: 'BUTTON CREW',
    subtitle: 'Los Que Mantienen las Luces Encendidas',
    subtitleColor: 'var(--rv-gold)',
    type: 'Colectivo',
    origin: 'Varios juegos, una sola ciudad',
    role: 'Mantener Retroville operativa cuando todo debería haber fallado',
    description:
      'Llevan demasiado tiempo en el juego. Literalmente. Nadie recuerda quién los creó ni para qué juego. Pero están aquí, y sin ellos, Retroville habría oscurecido hace mucho.',
    image: '/images/retroville/button-crew-push.png',
    objectPosition: 'right center',
    accent: 'rgba(255, 201, 64, 0.12)',
  },
  {
    key: 'luna',
    name: 'LUNA',
    subtitle: 'Encanto, ruido y sabotaje emocional',
    subtitleColor: '#d985ab',
    type: 'Controller',
    origin: 'Unknown',
    role: 'Desestabilizar a NOX y convertir la atención en moneda',
    description:
      'Manipulativa, juguetona, caótica e impredecible. Luna atraviesa Retroville dejando ruido, confusión y una clase muy concreta de magnetismo tóxico. No busca amor. Busca control.',
    image: '/images/retroville/luna-styleguide.png',
    objectPosition: '18% center',
    accent: 'rgba(217, 133, 171, 0.16)',
  },
] as const;

const worldbuildingItems = [
  {
    title: 'Retroville City',
    text: 'Un horizonte como el de cualquier gran ciudad, pero construido con cartuchos apilados, blisteres rotos y cajas de coleccionista que nadie reclamó. Aquí los vehículos tienen forma de cassette y los rascacielos están hechos de consolas apiladas.',
    reference: 'Concept art del skyline central de Retroville.',
    reverse: false,
    image: '/images/retroville/retroville-buildings-concept.png',
    imageAlt: 'Concept art del skyline de Retroville',
    imagePosition: 'center center',
  },
  {
    title: 'The Pixel Graveyard',
    text: 'Un barrio en el límite de la ciudad donde van a parar los juegos que nadie completó. Lápidas de cartuchos. Procesiones de personajes sin final. El silencio aquí es diferente: suena a pantalla de Game Over que nadie apagó.',
    reference: 'Concept art del vertedero de hardware y cartuchos olvidados.',
    reverse: true,
    image: '/images/retroville/retroville-bit-grave-concept.png',
    imageAlt: 'Concept art de The Pixel Graveyard',
    imagePosition: 'center center',
  },
  {
    title: 'The Neon Boneyard',
    text: 'Donde el hardware va a morir lentamente. Consolas medio encendidas, cables que ya no conectan a nada, letreros de neón que parpadean mensajes de juegos que ya no existen. El lugar más honesto de Retroville.',
    reference: 'Concept art de calles, señalética y restos urbanos del distrito.',
    reverse: false,
    image: '/images/retroville/retroville-urban-props-concept.png',
    imageAlt: 'Concept art de The Neon Boneyard',
    imagePosition: 'center center',
  },
] as const;

const drops = [
  {
    badge: 'SIGNAL 01',
    title: 'WORLD GENESIS',
    text: 'El primer mapa de Retroville toma forma. Una ciudad diseñada desde los restos de todo lo que fue jugado y olvidado. El trazado urbano como arqueología digital.',
  },
  {
    badge: 'SIGNAL 02',
    title: 'PRIMEROS PERSONAJES',
    text: 'NOX, Button Crew y Luna son las primeras presencias reconocibles del universo. Sus relaciones preceden a la ciudad misma.',
  },
  {
    badge: 'SIGNAL 03',
    title: 'RETROVILLE TOURNAMENT',
    text: 'El primer evento competitivo del universo. Torneos retro con lore integrado, mecánicas comunitarias y coleccionables de lanzamiento. Caos organizado.',
  },
] as const;

const retrovilleSocials = [
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@RetroVille-y9v',
    ariaLabel: 'Abrir YouTube de Retroville',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/retroville_show/',
    ariaLabel: 'Abrir Instagram de Retroville',
  },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.18 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
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
  const [heroProgress, setHeroProgress] = useState(0);
  const [activeCharacter, setActiveCharacter] = useState<(typeof characterCards)[number]['key']>('nox');
  const manifestoReveal = useInView<HTMLDivElement>();
  const charactersReveal = useInView<HTMLElement>();
  const worldReveal = useInView<HTMLElement>();
  const dropsReveal = useInView<HTMLElement>();
  const countdownReveal = useInView<HTMLElement>();
  const waitlistReveal = useInView<HTMLElement>();

  useEffect(() => {
    const update = () => {
      const hero = heroRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const distance = Math.max(window.innerHeight, hero.offsetHeight);
      const progress = clamp((0 - rect.top) / distance);
      setHeroProgress(progress);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const activeCharacterData = useMemo(
    () => characterCards.find((item) => item.key === activeCharacter) || characterCards[0],
    [activeCharacter]
  );

  const repeatedMarqueeItems = [...marqueeItems, ...marqueeItems];
  const waitlistGoal = 5000;
  const waitlistPct = waitlistCount > 0 ? clamp(waitlistCount / waitlistGoal, 0, 1) : 0;

  const scrollToWaitlist = () => {
    document.getElementById('retroville-waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main
      className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.variable} ${styles.page} bg-[var(--rv-bg-deep)] text-[var(--rv-text)] [font-family:var(--font-body)]`}
    >
      <section ref={heroRef} className={`${styles.hero} min-h-[100svh] px-5 pb-16 pt-24 sm:px-8 lg:px-10`}>
        <div className={styles.heroNoise} />
        <div className={styles.scanlines} />
        <div className="absolute inset-y-0 left-[-18%] w-[54%] bg-[radial-gradient(circle_at_20%_48%,rgba(0,212,255,0.22),transparent_58%)] blur-[120px]" />
        <div className="absolute inset-y-0 right-[-18%] w-[56%] bg-[radial-gradient(circle_at_80%_48%,rgba(155,92,255,0.28),transparent_60%)] blur-[130px]" />
        <div className={styles.heroPortal} style={{ opacity: 0.34 + heroProgress * 0.6 }} />

        <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/6 pb-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--rv-cyan)]">Universo original de AdvancedRetro</p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            Volver a AdvancedRetro
          </Link>
        </div>

        <div className="relative z-10 mx-auto mt-10 grid max-w-[1440px] items-center gap-10 lg:grid-cols-[minmax(0,0.28fr)_minmax(0,0.44fr)_minmax(0,0.28fr)] lg:gap-6 xl:gap-10">
          <div className={`${styles.heroCharacter} hidden lg:block`}>
            <Image
              src="/images/retroville/nox-push.png"
              alt=""
              fill
              sizes="28vw"
              className={`${styles.heroWash} ${styles.heroWashImage}`}
              style={{ objectPosition: 'left center' }}
              aria-hidden
            />
            <div className={`${styles.heroAura} ${styles.heroAuraLeft}`} />
            <Image
              src="/images/retroville/nox-push.png"
              alt="NOX empujando el núcleo de Retroville"
              fill
              priority
              sizes="28vw"
              className={`${styles.heroImage} ${styles.heroImageLeft}`}
              style={{ transform: `translate3d(${heroProgress * 12}px, ${heroProgress * -24}px, 0)` }}
            />
            <div className={styles.heroFadeLeft} />
          </div>

          <div className="relative text-center">
            <div className="mx-auto inline-flex items-center rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-[var(--rv-gold)]">
              Cinematic universe reveal
            </div>
            <div className="mx-auto mt-6 w-full max-w-[270px] sm:max-w-[320px]">
              <Image
                src="/images/retroville/retroville-logo.png"
                alt="Logo de Retroville"
                width={1536}
                height={1023}
                priority
                sizes="(max-width: 640px) 270px, 320px"
                className="h-auto w-full object-contain drop-shadow-[0_16px_38px_rgba(255,168,26,0.18)]"
              />
            </div>
            <h1 className={`${displayFont.className} mt-6 text-[clamp(4.6rem,14vw,11rem)] uppercase leading-[0.85] tracking-[0.03em] text-white`}>
              <span className={styles.titleWord}>
                {titleLetters.map((letter, index) => {
                  const isZoomLetter = letter === 'O' && index === 4;
                  const distance = index - 4;
                  const translate = distance * heroProgress * 42;
                  const opacity = isZoomLetter ? 1 : clamp(1 - heroProgress * 1.08, 0, 1);
                  const scale = isZoomLetter ? 1 + heroProgress * 8.2 : 1;
                  const blur = isZoomLetter ? heroProgress * 5.5 : 0;

                  return (
                    <span
                      key={`${letter}-${index}`}
                      data-letter={letter}
                      className={`${styles.titleLetter} ${isZoomLetter ? styles.titleLetterZoom : ''}`}
                      style={{
                        opacity,
                        transform: `translate3d(${translate}px, ${isZoomLetter ? 0 : heroProgress * -6}px, 0) scale(${scale})`,
                        filter: blur ? `blur(${blur}px)` : undefined,
                        animationDelay: `${index * 80}ms`,
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-[18ch] text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.02] text-white">
              Every forgotten game ends up somewhere.
            </p>
            <p className="mx-auto mt-6 max-w-[42rem] text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              Una ciudad de neón, hardware abandonado y personajes que se niegan a apagarse. Retroville no quiere parecer un teaser más. Quiere sentirse como un universo que ya existía antes de que entraras.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={scrollToWaitlist}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--rv-green)] px-6 py-3 text-base font-bold text-black transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(0,255,136,0.22)]"
              >
                Entrar en Retroville
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-text-dim)]">Lanzamiento previsto · {launchLabel}</p>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {retrovilleSocials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.ariaLabel}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-[11px] uppercase tracking-[0.2em] text-white/82 transition hover:border-[var(--rv-cyan)]/30 hover:bg-white/[0.08] hover:text-white"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className={`${styles.heroCharacter} hidden lg:block`}>
            <Image
              src="/images/retroville/button-crew-push.png"
              alt=""
              fill
              sizes="30vw"
              className={`${styles.heroWash} ${styles.heroWashImage}`}
              style={{ objectPosition: 'right center' }}
              aria-hidden
            />
            <div className={`${styles.heroAura} ${styles.heroAuraRight}`} />
            <Image
              src="/images/retroville/button-crew-push.png"
              alt="Button Crew empujando hacia el centro del universo Retroville"
              fill
              priority
              sizes="30vw"
              className={`${styles.heroImage} ${styles.heroImageRight}`}
              style={{ transform: `translate3d(${-heroProgress * 12}px, ${heroProgress * -22}px, 0)` }}
            />
            <div className={styles.heroFadeRight} />
          </div>
        </div>

        <div className="relative z-10 mt-12 grid gap-6 sm:grid-cols-2 lg:hidden">
          <div className="relative h-[280px] overflow-hidden rounded-[2rem] border border-white/8 bg-black/30">
            <Image
              src="/images/retroville/nox-push.png"
              alt="NOX empujando el núcleo de Retroville"
              fill
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'left center' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.2),transparent_20%,transparent_88%,rgba(4,4,10,0.92))]" />
          </div>
          <div className="relative h-[280px] overflow-hidden rounded-[2rem] border border-white/8 bg-black/30">
            <Image
              src="/images/retroville/button-crew-push.png"
              alt="Button Crew empujando hacia el centro del universo Retroville"
              fill
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'right center' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.2),transparent_20%,transparent_88%,rgba(4,4,10,0.92))]" />
          </div>
        </div>
      </section>

      <section className={styles.marqueeSection} aria-label="Marquee Retroville">
        <div className={styles.marqueeRow}>
          <div className={styles.marqueeTrack}>
            {repeatedMarqueeItems.map((item, index) => (
              <span key={`${item}-row-1-${index}`} className={`${styles.marqueeTag} ${index % 2 === 0 ? styles.marqueeTagAlt : ''}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.marqueeRow}>
          <div className={`${styles.marqueeTrack} ${styles.marqueeTrackSlow}`}>
            {repeatedMarqueeItems.map((item, index) => (
              <span key={`${item}-row-2-${index}`} className={`${styles.marqueeTag} ${index % 2 === 0 ? '' : styles.marqueeTagAlt}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="min-h-[88svh] bg-[var(--rv-bg-deep)] px-6 py-20 sm:px-10 lg:px-14">
        <div ref={manifestoReveal.ref} className="mx-auto flex min-h-[68svh] max-w-[1480px] items-center justify-between gap-12 lg:flex-row">
          <div className="space-y-2">
            {manifestoLines.map((line, index) => (
              <p
                key={line}
                className={`${displayFont.className} ${styles.manifestLine} ${manifestoReveal.visible ? styles.manifestLineVisible : ''} text-[clamp(4rem,11vw,8rem)] uppercase leading-[0.85] ${line === 'SOMEWHERE.' ? 'text-[var(--rv-gold)]' : 'text-white'}`}
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                {line}
              </p>
            ))}
          </div>
          <div className="max-w-[24rem]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Manifesto</p>
            <p className="mt-5 text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              Una ciudad de neón. Hardware olvidado. Memorias corruptas. Personajes que se niegan a apagarse.
            </p>
          </div>
        </div>
      </section>

      <section ref={charactersReveal.ref} className={styles.characterSection}>
        <div className="mx-auto max-w-[1200px] px-6 text-center sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Personajes</p>
          <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.5rem)] uppercase text-white`}>Los primeros en despertar</h2>
        </div>
        <div className={styles.characterTabs}>
          {characterCards.map((character) => (
            <button
              key={character.key}
              type="button"
              onClick={() => setActiveCharacter(character.key)}
              className={`${styles.characterTab} ${activeCharacter === character.key ? styles.characterTabActive : ''}`}
            >
              {character.name}
            </button>
          ))}
        </div>
        <div className={`${styles.characterCard} ${charactersReveal.visible ? styles.revealVisible : styles.reveal}`}>
          <div className={styles.characterImageWrap}>
            <div className={styles.characterCircle} style={{ ['--character-accent' as string]: activeCharacterData.accent }}>
              <Image
                src={activeCharacterData.image}
                alt=""
                fill
                sizes="40vw"
                className={styles.characterCircleBackdrop}
                style={{ objectPosition: activeCharacterData.objectPosition }}
                aria-hidden
              />
              <Image
                src={activeCharacterData.image}
                alt={activeCharacterData.name}
                fill
                sizes="40vw"
                className={styles.characterCircleArt}
                style={{ objectPosition: activeCharacterData.objectPosition }}
              />
              <div className={styles.characterCircleFade} />
            </div>
          </div>

          <div>
            <h3 className={`${displayFont.className} ${styles.characterInfoName}`}>{activeCharacterData.name}</h3>
            <p className={styles.characterInfoSubtitle} style={{ color: activeCharacterData.subtitleColor }}>
              {activeCharacterData.subtitle}
            </p>
            <div className={styles.characterStats}>
              <span className={styles.characterStatLabel}>tipo</span>
              <span className={styles.characterStatValue}>{activeCharacterData.type}</span>
              <span className={styles.characterStatLabel}>origen</span>
              <span className={styles.characterStatValue}>{activeCharacterData.origin}</span>
              <span className={styles.characterStatLabel}>función</span>
              <span className={styles.characterStatValue}>{activeCharacterData.role}</span>
            </div>
            <p className={styles.characterDescription}>{activeCharacterData.description}</p>
          </div>
        </div>
      </section>

      <section ref={worldReveal.ref} className="bg-[var(--rv-bg-section-alt)]">
        <div className="mx-auto max-w-[1200px] px-6 pt-20 text-center sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">World Building</p>
          <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.5rem)] uppercase text-white`}>Barrios que aún no quieren apagarse</h2>
        </div>
        <div className={styles.worldbuildingSection}>
          {worldbuildingItems.map((item) => (
            <article
              key={item.title}
              className={`${styles.worldbuildingItem} ${item.reverse ? styles.worldbuildingItemReverse : ''} ${worldReveal.visible ? styles.revealVisible : styles.reveal}`}
            >
              <div>
                <h3 className={`${displayFont.className} ${styles.worldbuildingTitle}`}>{item.title}</h3>
                <p className={styles.worldbuildingText}>{item.text}</p>
                <p className={styles.worldbuildingReferences}>{item.reference}</p>
              </div>
              <div className={styles.worldbuildingImage}>
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 48vw"
                  className={styles.worldbuildingConceptImage}
                  style={{ objectPosition: item.imagePosition }}
                />
                <div className="absolute inset-x-0 top-0 flex justify-end p-3">
                  <span className="rounded-full border border-white/10 bg-[rgba(4,4,10,0.72)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--rv-green)]">
                    Concept art
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section ref={dropsReveal.ref} className={styles.dropsSection}>
        <div className="mx-auto mb-14 max-w-[1200px] px-1">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--rv-green)]">SEÑALES</p>
          <h2 className={`${displayFont.className} text-[clamp(3rem,8vw,5.5rem)] uppercase text-white`}>Fragmentos del universo antes del lanzamiento</h2>
        </div>
        <div className={styles.dropsGrid}>
          {drops.map((drop, index) => (
            <article
              key={drop.title}
              className={`${styles.dropCard} ${dropsReveal.visible ? styles.revealVisible : styles.reveal}`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <span className={styles.dropBadge}>{drop.badge}</span>
              <h3 className={`${displayFont.className} ${styles.dropTitle}`}>{drop.title}</h3>
              <p className={styles.dropText}>{drop.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section ref={countdownReveal.ref} className="relative overflow-hidden px-6 py-24 text-center sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--rv-bg-deep),var(--rv-bg-surface))]" />
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden text-[clamp(5rem,16vw,13rem)] font-black uppercase tracking-[0.06em] text-white/[0.02] [font-family:var(--font-display)]">
          RETROVILLE
        </div>
        <div className={`relative mx-auto max-w-[1200px] ${countdownReveal.visible ? styles.revealVisible : styles.reveal}`}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--rv-green)]">Cuenta atrás</p>
          <p className={`${displayFont.className} mt-4 text-[clamp(3rem,7vw,5.2rem)] uppercase text-white`}>10 de noviembre de 2026</p>
          <p className="mt-4 text-lg text-[var(--rv-text-muted)]">Ventana objetivo del lanzamiento de Retroville.</p>
          <div className="mt-14">
            <RetrovilleCountdown targetIso={launchIso} />
          </div>
        </div>
      </section>

      <section id="retroville-waitlist" ref={waitlistReveal.ref} className="bg-[linear-gradient(180deg,var(--rv-bg-deep),var(--rv-bg-surface))] px-6 py-24 sm:px-8 lg:px-10">
        <div className={`${styles.waitlistPanel} ${waitlistReveal.visible ? styles.revealVisible : styles.reveal} mx-auto max-w-[980px] px-6 py-10 sm:px-10 sm:py-12`}>
          <div className="mx-auto max-w-[700px] text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--rv-green)]">Waitlist</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,7vw,5.2rem)] uppercase leading-[0.92] text-white`}>Entra antes que el resto.</h2>
            <p className="mt-5 text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              Primer drop. Primer personaje jugable. Primera señal de Retroville.
            </p>
            {waitlistCount > 0 ? (
              <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--rv-text-muted)]">
                  <span>{waitlistCount.toLocaleString('es-ES')} registros</span>
                  <span>Objetivo {waitlistGoal.toLocaleString('es-ES')}</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(135deg,var(--rv-green),var(--rv-cyan),var(--rv-purple))]"
                    style={{ width: `${Math.round(waitlistPct * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className="mt-10">
              <RetrovilleWaitlistForm
                darkMode
                buttonLabel="QUIERO SER EL PRIMERO"
                successMessage="Perfecto. Ya formas parte de la primera señal de Retroville."
              />
            </div>
            <div className="mt-12 border-t border-white/8 pt-6 text-sm text-[var(--rv-text-dim)]">
              <p>© AdvancedRetro · Retroville está en desarrollo.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {retrovilleSocials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.ariaLabel}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-[11px] uppercase tracking-[0.2em] text-white/82 transition hover:border-[var(--rv-green)]/30 hover:bg-white/[0.08] hover:text-white"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
              <Link href="/" className="mt-3 inline-flex text-white transition hover:text-[var(--rv-green)]">
                ← Volver a AdvancedRetro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
