'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
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
  retrovilleMobileDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './retroville-experience.module.css';

const titleLetters = ['R', 'E', 'T', 'R', 'O', 'V', 'I', 'L', 'L', 'E'] as const;
const marqueeItems = [
  'NOX',
  'BUTTON CREW',
  'LUNA',
  'NORA',
  'JOY & GRUMP',
  'TRIMP',
  'MAYOR TUBE',
  'PIPO',
  'NANO',
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

const featuredCharacters = [
  {
    name: 'NOX',
    subtitle: 'El Guardián del Núcleo',
    subtitleColor: 'var(--rv-purple)',
    type: 'Entidad Digital',
    origin: 'Memoria RAM fragmentada',
    role: 'Proteger el corazón pulsante de Retroville',
    description:
      'Construido de píxeles perdidos y capas de código que nadie quiso borrar. NOX no recuerda de qué juego vino, pero recuerda cada uno de los que llegaron después. Guarda el Núcleo de Retroville desde antes de que la ciudad tuviera nombre.',
    image: '/images/retroville/nox-character-large.png',
    accent: 'rgba(97, 174, 255, 0.22)',
    chips: ['Turno de noche', 'Sarcasmo', 'Batería baja'],
    imageClassName: 'object-contain object-center scale-[1.02]',
  },
  {
    name: 'BUTTON CREW',
    subtitle: 'Los Que Mantienen las Luces Encendidas',
    subtitleColor: 'var(--rv-gold)',
    type: 'Colectivo',
    origin: 'Varios juegos, una sola ciudad',
    role: 'Mantener Retroville operativa cuando todo debería haber fallado',
    description:
      'Llevan demasiado tiempo en el juego. Literalmente. Nadie recuerda quién los creó ni para qué juego. Pero están aquí, y sin ellos, Retroville habría oscurecido hace mucho.',
    image: '/images/retroville/button-crew-character-large.png',
    accent: 'rgba(255, 189, 82, 0.22)',
    chips: ['A / B / Y / X', 'Caos social', 'Ruido colectivo'],
    imageClassName: 'object-contain object-center scale-[1.05]',
  },
  {
    name: 'LUNA',
    subtitle: 'Encanto, ruido y sabotaje emocional',
    subtitleColor: '#d985ab',
    type: 'Controller',
    origin: 'Unknown',
    role: 'Desestabilizar a NOX y convertir la atención en moneda',
    description:
      'Manipulativa, juguetona, caótica e impredecible. Luna atraviesa Retroville dejando ruido, confusión y una clase muy concreta de magnetismo tóxico. No busca amor. Busca control.',
    image: '/images/retroville/luna-character-large.png',
    accent: 'rgba(217, 133, 171, 0.24)',
    chips: ['Magnetismo', 'Glamour tóxico', 'Interferencia'],
    imageClassName: 'object-contain object-center scale-[1.02]',
  },
] as const;

const supportingCast = [
  {
    name: 'NORA',
    role: 'Vecina del Riverside District',
    description: 'Observa, juzga y guarda más secretos de los que parece. La memoria social de la ciudad.',
    image: '/images/retroville/characters/nora.png',
  },
  {
    name: 'JOY & GRUMP',
    role: 'Neighbour controllers',
    description: 'Vecinos eternamente molestos, perfectos para el tono de sitcom adulta y caos cotidiano.',
    image: '/images/retroville/characters/joy-grump.png',
  },
  {
    name: 'TRIMP',
    role: 'Motion controller competitivo',
    description: 'Ego, foco y dominio. TRIMP no sigue el juego: intenta dictar las reglas.',
    image: '/images/retroville/characters/trimp.png',
  },
  {
    name: 'MAYOR TUBE',
    role: 'Alcalde de Retroville',
    description: 'Sonrisa de pantalla, promesas de progreso y una calma política demasiado perfecta.',
    image: '/images/retroville/characters/mayor-tube.png',
  },
  {
    name: 'PIPO',
    role: 'Virtual pet kid',
    description: 'Pequeño, molesto y convencido de que nada es culpa suya. Ego de bolsillo.',
    image: '/images/retroville/characters/pipo.png',
  },
  {
    name: 'NANO',
    role: 'Pocket MP3 kid',
    description: 'Vive en su playlist y baja el volumen del mundo cuando Retroville grita demasiado.',
    image: '/images/retroville/characters/nano.png',
  },
  {
    name: 'MIA',
    role: 'Influencer de Retroville',
    description: 'Convierte cualquier crisis en contenido. Brillo, cámara frontal y atención como combustible.',
    image: '/images/retroville/characters/influencer.png',
  },
  {
    name: 'PUBLIC CREW',
    role: 'Transporte público',
    description: 'Rutas, cambio exacto y cero ganas de explicar la misma parada dos veces.',
    image: '/images/retroville/characters/public-crew.png',
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
    image: '/images/retroville/retroville-urban-props-concept.webp',
    imageAlt: 'Concept art de The Neon Boneyard',
    imagePosition: 'center center',
  },
] as const;

const lifeSections = [
  {
    title: 'RETROVILLE CENTRAL SCHOOL',
    text: 'Aulas, patios y normas absurdas. Si Retroville va a ser una serie, necesita también vida cotidiana y generaciones nuevas dentro del mundo.',
    image: '/images/retroville/retroville-school-concept.png',
    alt: 'Concept art de la escuela central de Retroville',
  },
  {
    title: 'TOP SLOT NIGHTCLUB',
    text: 'La noche elegante y peligrosa del universo: música, membresía, ruido social y decisiones dudosas después de medianoche.',
    image: '/images/retroville/retroville-club-concept.png',
    alt: 'Concept art del club nocturno de Retroville',
  },
  {
    title: 'CASA DE NOX',
    text: 'La serie también necesita intimidad. Refugios, interiores y lugares donde el personaje deje de ser icono y se vuelva persona.',
    image: '/images/retroville/retroville-nox-house-concept.png',
    alt: 'Concept art de la casa de NOX en Retroville',
  },
] as const;

const transitSections = [
  {
    title: 'RETROVILLE METRO POD',
    text: 'Movilidad compacta para una ciudad rara: cápsulas, trenes y sistemas que parecen diseñados dentro de una consola.',
    image: '/images/retroville/retroville-metro-pod-concept.webp',
    alt: 'Concept art del metro pod de Retroville',
  },
  {
    title: 'TAXI POD',
    text: 'Pequeño, extraño y perfectamente reconocible. El transporte también suma identidad cuando el mundo quiere sentirse propio.',
    image: '/images/retroville/retroville-taxi-pod-concept.png',
    alt: 'Concept art del taxi pod de Retroville',
  },
  {
    title: 'ZAPPERBIKE',
    text: 'Velocidad urbana, energía arcade y el tipo de vehículo que hace que la ciudad tenga personalidad incluso cuando nadie está hablando.',
    image: '/images/retroville/retroville-zapperbike-concept.png',
    alt: 'Concept art de la Zapperbike de Retroville',
  },
] as const;

const ecosystemCards = [
  {
    title: 'CRIATURAS',
    text: 'Fauna hecha de discos, cables y cartuchos. El mundo ya no depende solo de humanos o mandos antropomorfos.',
    image: '/images/retroville/retroville-creatures-concept.png',
    alt: 'Concept art de criaturas de Retroville',
  },
  {
    title: 'COMERCIO Y CALLE',
    text: 'Kioscos, bares, props urbanos y objetos cotidianos que hacen que cada rincón parezca habitable.',
    image: '/images/retroville/retroville-urban-props-concept.webp',
    alt: 'Concept art de props y comercio urbano en Retroville',
  },
  {
    title: 'ARQUITECTURA DOMÉSTICA',
    text: 'Edificios apilados, casas modulares y bloques que refuerzan que Retroville es una ciudad con cultura propia.',
    image: '/images/retroville/retroville-stacked-housing-concept.png',
    alt: 'Concept art de viviendas apiladas de Retroville',
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

const productLine = 'Retroville es una serie animada original ambientada en una ciudad construida con hardware abandonado.';
const landingCharacterTeasers = [
  {
    name: 'NOX',
    district: 'Console Core',
    text: 'El protagonista cansado que mantiene el nucleo vivo mientras la ciudad le devuelve sarcasmo.',
  },
  {
    name: 'LUNA',
    district: 'Top Slot',
    text: 'Encanto toxico, control social y la clase de presencia que convierte cualquier escena en problema.',
  },
  {
    name: 'BUTTON CREW',
    district: 'Power Plaza',
    text: 'Pandilla de botones, ruido colectivo y caos vecinal listo para sitcom adulta.',
  },
] as const;

const landingDepthCards = [
  {
    label: '14+ personajes',
    text: 'Reparto principal, vecinos, facciones y figurantes con identidad propia.',
  },
  {
    label: 'Masterplan de ciudad',
    text: 'Distritos, movilidad, barrios y un mapa que ya se siente habitable.',
  },
  {
    label: 'Sketchbook vivo',
    text: 'Tableros de traduccion visual y archivo que sigue creciendo.',
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
  const manifestoReveal = useInView<HTMLDivElement>();
  const charactersReveal = useInView<HTMLElement>();
  const worldReveal = useInView<HTMLElement>();
  const dropsReveal = useInView<HTMLElement>();
  const countdownReveal = useInView<HTMLElement>();
  const waitlistReveal = useInView<HTMLElement>();
  const residentsReveal = useInView<HTMLElement>();
  const lifeReveal = useInView<HTMLElement>();
  const transitReveal = useInView<HTMLElement>();
  const ecosystemReveal = useInView<HTMLElement>();

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

  const repeatedMarqueeItems = [...marqueeItems, ...marqueeItems];
  const waitlistGoal = 5000;
  const showAudienceCount = shouldShowRetrovilleSignupCount(waitlistCount);
  const waitlistPct = waitlistCount > 0 ? clamp(waitlistCount / waitlistGoal, 0, 1) : 0;
  const launchEventCopy = buildRetrovilleLaunchCopy(launchLabel);
  const waitlistBenefits = buildRetrovilleWaitlistBenefits(launchLabel);

  const scrollToWaitlist = () => {
    document.getElementById('retroville-waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main
      className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.variable} ${styles.page} bg-[var(--rv-bg-deep)] text-[var(--rv-text)] [font-family:var(--font-body)]`}
    >
      <section
        ref={heroRef}
        className={`${styles.hero} min-h-[72svh] px-5 pb-10 pt-20 sm:min-h-[88svh] sm:px-8 sm:pb-14 sm:pt-24 lg:min-h-[100svh] lg:px-10 lg:pb-16`}
      >
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
            <div className={`${styles.heroWash} ${styles.heroWashBackdrop} ${styles.heroWashBackdropLeft}`} aria-hidden />
            <div className={`${styles.heroAura} ${styles.heroAuraLeft}`} />
            <Image
              src="/images/retroville/nox-push.webp"
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
                src="/images/retroville/retroville-logo.webp"
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
            <p className="mx-auto mt-5 max-w-[42rem] text-base font-semibold leading-8 text-white sm:text-lg">
              {productLine}
            </p>
            <p className="mx-auto mt-6 max-w-[42rem] text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              Una ciudad de neon, hardware abandonado y personajes que se niegan a apagarse. Retroville no quiere parecer un teaser mas. Quiere sentirse como un universo que ya existia antes de que entraras.
            </p>
            <p className="mx-auto mt-4 max-w-[42rem] text-sm leading-7 text-[var(--rv-gold)] sm:text-base">
              NOX lo resumiria peor, pero mas claro: &quot;Aqui hasta los cartuchos muertos siguen pagando alquiler.&quot;
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
              {RETROVILLE_SOCIAL_CHANNELS.map((social) => (
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
            <div className={`${styles.heroWash} ${styles.heroWashBackdrop} ${styles.heroWashBackdropRight}`} aria-hidden />
            <div className={`${styles.heroAura} ${styles.heroAuraRight}`} />
            <Image
              src="/images/retroville/button-crew-push.webp"
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

        <div className="relative z-10 mt-12 grid gap-4 lg:hidden">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[rgba(7,10,20,0.72)] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <Image
              src="/images/retroville/retroville-central-plaza-concept.webp"
              alt="Concept art de la plaza central de Retroville"
              width={1600}
              height={1200}
              sizes="100vw"
              className="h-auto w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.18),transparent_24%,transparent_78%,rgba(4,4,10,0.94))]" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-green)]">Serie original</p>
              <p className={`${displayFont.className} mt-2 text-2xl uppercase text-white`}>La ciudad ya existe</p>
            </div>
          </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-[1.7rem] border border-white/8 bg-[rgba(7,10,20,0.72)]">
                <Image
                src="/images/retroville/retroville-cast-presentation.webp"
                alt="NOX, Luna y Button Crew presentando el reparto central de Retroville"
                width={1400}
                height={900}
                sizes="(max-width: 640px) 100vw, 50vw"
                className="h-auto w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.08),transparent_30%,rgba(4,4,10,0.82))]" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-pink-200/84">Personajes</p>
                <p className={`${displayFont.className} mt-2 text-xl uppercase text-white`}>Reparto central</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[1.7rem] border border-white/8 bg-[rgba(7,10,20,0.72)]">
              <div className="relative min-h-[15rem] overflow-hidden bg-[linear-gradient(160deg,rgba(7,10,20,0.92),rgba(13,18,34,0.96)_54%,rgba(24,10,34,0.92))]">
                <div className="absolute inset-[-12%] bg-[radial-gradient(circle_at_18%_24%,rgba(0,212,255,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(155,92,255,0.18),transparent_30%),radial-gradient(circle_at_50%_78%,rgba(255,191,82,0.1),transparent_26%)] blur-[32px]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%,rgba(4,4,10,0.88))]" />
                <div className="relative flex h-full min-h-[15rem] flex-col justify-between p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex min-h-[30px] items-center rounded-full border border-white/10 bg-white/[0.05] px-3 text-[10px] uppercase tracking-[0.22em] text-[var(--rv-cyan)]">
                      Señal interna
                    </span>
                    <span className="inline-flex min-h-[30px] items-center rounded-full border border-white/10 bg-white/[0.05] px-3 text-[10px] uppercase tracking-[0.22em] text-white/64">
                      Sin sketch visible
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">Sistema</p>
                    <p className={`${displayFont.className} mt-2 text-xl uppercase text-white`}>Mapa sin lavado blanco</p>
                    <p className="mt-3 max-w-[20rem] text-sm leading-6 text-white/72">
                      Si aparece esta capa al bajar, ahora entra con atmósfera oscura y brillo de señal, no con sketch lavado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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

      <section className="bg-[var(--rv-bg-section-alt)] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Que hay ya dentro</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.2rem)] uppercase text-white`}>UN UNIVERSO YA PRESENTABLE</h2>
            <p className="mx-auto mt-5 max-w-[46rem] text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              Antes del manifiesto, esto es lo importante: Retroville ya tiene reparto, mapa de ciudad y un archivo de proceso vivo que demuestra que el proyecto esta en marcha.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {landingDepthCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[1.6rem] border border-white/8 bg-[rgba(11,14,24,0.94)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)]"
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-green)]">Estado actual</p>
                <h3 className={`${displayFont.className} mt-3 text-[2rem] uppercase leading-[0.95] text-white`}>{card.label}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">{card.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-cyan)]">Teaser de reparto</p>
                <h3 className={`${displayFont.className} mt-3 text-[2.6rem] uppercase leading-[0.95] text-white`}>TRES PERSONAJES PARA ENTRAR</h3>
              </div>
              <Link
                href="/retroville/personajes"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/86 transition hover:border-[var(--rv-green)]/30 hover:bg-white/[0.08] hover:text-white"
              >
                Ver reparto completo
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {landingCharacterTeasers.map((character) => (
                <article key={character.name} className="rounded-[1.6rem] border border-white/8 bg-[rgba(11,14,24,0.94)] p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">{character.district}</p>
                  <h4 className={`${displayFont.className} mt-3 text-[2.1rem] uppercase leading-[0.95] text-white`}>{character.name}</h4>
                  <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">{character.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/retroville/personajes"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--rv-green)] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
              >
                Abrir personajes
              </Link>
              <Link
                href="/retroville/sketches"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[var(--rv-cyan)]/30 hover:bg-white/[0.08]"
              >
                Abrir sketchbook
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--rv-bg-deep)] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-cyan)]">Production desk</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.2rem)] uppercase text-white`}>
              BIBLIA Y DOSSIERS
            </h2>
            <p className="mx-auto mt-5 max-w-[44rem] text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              El universo ya puede enseñar materiales tecnicos. Lo que esta listo ya puede solicitarse o consultarse, y lo que sigue en desarrollo aparece marcado como incoming.
            </p>
          </div>
          <div className="mt-12">
            <RetrovilleProductionDesk mode="mobile" />
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
          <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.5rem)] uppercase text-white`}>El reparto principal</h2>
          <p className="mx-auto mt-5 max-w-[44rem] text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
            En móvil funciona mejor presentar el universo como serie: personajes protagonistas en grande, con presencia real y sin adornos que los encierren.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-[1200px] gap-6 px-6 sm:px-8">
          {featuredCharacters.map((character, index) => (
            <article
              key={character.name}
              className={`${styles.reveal} ${charactersReveal.visible ? styles.revealVisible : ''} overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(10,14,24,0.96),rgba(7,9,18,0.96))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div
                className="relative overflow-hidden px-6 pt-7"
                style={{
                  background: `radial-gradient(circle at 50% 32%, ${character.accent}, transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))`,
                }}
              >
                <div className="absolute inset-x-8 top-6 h-24 rounded-full blur-3xl" style={{ background: character.accent }} />
                <div className="relative h-[340px] sm:h-[420px]">
                  <Image
                    src={character.image}
                    alt={`Render de ${character.name}, personaje principal de Retroville vinculado al distrito ${character.origin}`}
                    fill
                    sizes="100vw"
                    className={character.imageClassName}
                  />
                </div>
              </div>
              <div className="px-6 pb-6 pt-5">
                <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: character.subtitleColor }}>
                  {character.subtitle}
                </p>
                <h3 className={`${displayFont.className} mt-3 text-[clamp(2.6rem,8vw,4rem)] uppercase leading-[0.9] text-white`}>
                  {character.name}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {character.chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex min-h-[34px] items-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] uppercase tracking-[0.18em] text-white/78"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="font-semibold uppercase tracking-[0.16em] text-[var(--rv-gold)]">tipo</span>
                  <span className="text-white/86">{character.type}</span>
                  <span className="font-semibold uppercase tracking-[0.16em] text-[var(--rv-gold)]">origen</span>
                  <span className="text-white/86">{character.origin}</span>
                  <span className="font-semibold uppercase tracking-[0.16em] text-[var(--rv-gold)]">función</span>
                  <span className="text-white/86">{character.role}</span>
                </div>
                <p className="mt-5 text-base leading-8 text-[var(--rv-text-muted)]">{character.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section ref={residentsReveal.ref} className="bg-[var(--rv-bg-section-alt)] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Reparto civil</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.2rem)] uppercase text-white`}>La ciudad también necesita vecinos</h2>
            <p className="mx-auto mt-5 max-w-[42rem] text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              Una serie no vive solo de sus tres protagonistas. Aquí empieza a verse el humor social, la burocracia, la rutina y la gente rara que hace que el mundo respire.
            </p>
          </div>
          <div className="mt-12 grid gap-6">
            {supportingCast.map((resident, index) => (
              <article
                key={resident.name}
                className={`${styles.reveal} ${residentsReveal.visible ? styles.revealVisible : ''} overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(11,14,24,0.94)]`}
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <div className="relative h-[360px] overflow-hidden bg-[radial-gradient(circle_at_50%_36%,rgba(138,215,255,0.18),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0))] sm:h-[430px]">
                  <div className="absolute inset-x-[18%] bottom-4 h-16 rounded-full bg-black/45 blur-2xl" />
                  <Image
                    src={resident.image}
                    alt={`Render de ${resident.name}, personaje secundario de Retroville con rol ${resident.role}`}
                    fill
                    sizes="100vw"
                    className="object-contain object-bottom p-5"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.02),transparent_58%,rgba(4,4,10,0.82))]" />
                </div>
                <div className="px-5 pb-5 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rv-cyan)]">{resident.role}</p>
                  <h3 className={`${displayFont.className} mt-2 text-[2.2rem] uppercase text-white`}>{resident.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">{resident.description}</p>
                </div>
              </article>
            ))}
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

      <section ref={lifeReveal.ref} className="bg-[var(--rv-bg-deep)] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Vida civil</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.2rem)] uppercase text-white`}>Lugares de la serie</h2>
          </div>
          <div className="mt-12 grid gap-6">
            {lifeSections.map((section, index) => (
              <article
                key={section.title}
                className={`${styles.reveal} ${lifeReveal.visible ? styles.revealVisible : ''} overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(11,14,24,0.94)] shadow-[0_22px_64px_rgba(0,0,0,0.24)]`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="relative aspect-[16/11]">
                  <Image src={section.image} alt={section.alt} fill sizes="100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.08),transparent_34%,rgba(4,4,10,0.9))]" />
                </div>
                <div className="px-5 pb-5 pt-4">
                  <h3 className={`${displayFont.className} text-[2.2rem] uppercase text-[var(--rv-gold)]`}>{section.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">{section.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={transitReveal.ref} className="bg-[var(--rv-bg-section-alt)] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Movilidad</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.2rem)] uppercase text-white`}>Cómo se mueve la ciudad</h2>
          </div>
          <div className="mt-12 grid gap-6">
            {transitSections.map((section, index) => (
              <article
                key={section.title}
                className={`${styles.reveal} ${transitReveal.visible ? styles.revealVisible : ''} overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(11,14,24,0.94)]`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="relative aspect-[16/11] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]">
                  <Image src={section.image} alt={section.alt} fill sizes="100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.04),transparent_36%,rgba(4,4,10,0.88))]" />
                </div>
                <div className="px-5 pb-5 pt-4">
                  <h3 className={`${displayFont.className} text-[2.2rem] uppercase text-white`}>{section.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">{section.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={ecosystemReveal.ref} className="bg-[var(--rv-bg-deep)] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-green)]">Ecosistema</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.2rem)] uppercase text-white`}>Ciudad viva, no solo decorado</h2>
          </div>
          <div className="mt-12 grid gap-6">
            {ecosystemCards.map((card, index) => (
              <article
                key={card.title}
                className={`${styles.reveal} ${ecosystemReveal.visible ? styles.revealVisible : ''} overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(11,14,24,0.94)]`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="relative aspect-[16/11]">
                  <Image src={card.image} alt={card.alt} fill sizes="100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,10,0.04),transparent_36%,rgba(4,4,10,0.88))]" />
                </div>
                <div className="px-5 pb-5 pt-4">
                  <h3 className={`${displayFont.className} text-[2.2rem] uppercase text-white`}>{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">{card.text}</p>
                </div>
              </article>
            ))}
          </div>
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

      <section className="bg-[var(--rv-bg-section-alt)] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-cyan)]">Canales oficiales</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,8vw,5.2rem)] uppercase text-white`}>
              DONDE SE SIGUE RETROVILLE
            </h2>
            <p className="mx-auto mt-5 max-w-[44rem] text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              Ya no hace falta que todo viva amontonado en una sola landing. Cada red cumple una función distinta: unas sirven para drops visuales, otras para vídeo, otras para comunidad y otras para sostener el proyecto cuando toque escalarlo.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {RETROVILLE_SOCIAL_CHANNELS.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                aria-label={channel.ariaLabel}
                className="rounded-[1.5rem] border border-white/8 bg-[rgba(11,14,24,0.94)] p-5 text-left shadow-[0_18px_44px_rgba(0,0,0,0.2)] transition hover:border-[var(--rv-cyan)]/26 hover:bg-[rgba(11,14,24,1)]"
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-cyan)]">{channel.eyebrow}</p>
                <h3 className={`${displayFont.className} mt-3 text-[2rem] uppercase leading-[0.95] text-white`}>{channel.label}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)]">{channel.description}</p>
              </a>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {RETROVILLE_DISCOVERY_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-[var(--rv-green)]/28 hover:bg-white/[0.06]"
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--rv-gold)]">{link.eyebrow}</p>
                <h3 className="mt-2 text-base font-semibold uppercase tracking-[0.08em] text-white">{link.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--rv-text-muted)]">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section ref={countdownReveal.ref} className="relative overflow-hidden px-6 py-24 text-center sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--rv-bg-deep),var(--rv-bg-surface))]" />
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden text-[clamp(5rem,16vw,13rem)] font-black uppercase tracking-[0.06em] text-white/[0.02] [font-family:var(--font-display)]">
          RETROVILLE
        </div>
        <div className={`relative mx-auto max-w-[1200px] ${countdownReveal.visible ? styles.revealVisible : styles.reveal}`}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--rv-green)]">Cuenta atrás</p>
          <p className={`${displayFont.className} mt-4 text-[clamp(3rem,7vw,5.2rem)] uppercase text-white`}>{launchLabel}</p>
          <p className="mt-4 text-lg text-[var(--rv-text-muted)]">Ventana objetivo del lanzamiento de Retroville.</p>
          <p className="mx-auto mt-4 max-w-[42rem] text-sm leading-7 text-white/74 sm:text-base">{launchEventCopy}</p>
          <div className="mt-14">
            <RetrovilleCountdown targetIso={launchIso} />
          </div>
        </div>
      </section>

      <section id="retroville-waitlist" ref={waitlistReveal.ref} className="bg-[linear-gradient(180deg,var(--rv-bg-deep),var(--rv-bg-surface))] px-6 py-24 sm:px-8 lg:px-10">
        <div className={`${styles.waitlistPanel} ${waitlistReveal.visible ? styles.revealVisible : styles.reveal} mx-auto max-w-[980px] px-6 py-10 sm:px-10 sm:py-12`}>
          <div className="mx-auto max-w-[700px] text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--rv-green)]">Newsletter</p>
            <h2 className={`${displayFont.className} mt-4 text-[clamp(3rem,7vw,5.2rem)] uppercase leading-[0.92] text-white`}>La Señal de Retroville</h2>
            <p className="mt-5 text-base leading-8 text-[var(--rv-text-muted)] sm:text-lg">
              No es un formulario generico: es la newsletter oficial para recibir el primer reveal, los drops siguientes y un resumen quincenal del desarrollo del universo.
            </p>
            {showAudienceCount ? (
              <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--rv-text-muted)]">
                  <span>{waitlistCount.toLocaleString('es-ES')} personas ya reciben la senal</span>
                  <span>Objetivo {waitlistGoal.toLocaleString('es-ES')}</span>
                </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(135deg,var(--rv-green),var(--rv-cyan),var(--rv-purple))]"
                    style={{ width: `${Math.round(waitlistPct * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 text-left">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-text-dim)]">Señal actual</p>
                <p className={`${displayFont.className} mt-3 text-[2rem] uppercase leading-[0.92] text-white`}>Sé de los primeros</p>
                <p className="mt-2 text-sm leading-7 text-[var(--rv-text-muted)]">La newsletter acaba de abrirse y todavia puedes entrar en la primera tanda.</p>
              </div>
            )}
            <RetrovilleAudienceProof waitlistCount={waitlistCount} launchIso={launchIso} launchLabel={launchLabel} />
            <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 text-left">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">Si te apuntas, recibes</p>
              <div className="mt-3 grid gap-2">
                {waitlistBenefits.map((benefit) => (
                  <p key={benefit} className="text-sm leading-7 text-white/78">
                    {benefit}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-10">
              <RetrovilleWaitlistForm
                darkMode
                buttonLabel={`QUIERO RECIBIR ${RETROVILLE_NEWSLETTER_NAME.toUpperCase()}`}
                successMessage={`Perfecto. Ya formas parte de ${RETROVILLE_NEWSLETTER_NAME} y recibiras el primer aviso.`}
              />
            </div>
            <div className="mt-12 border-t border-white/8 pt-6 text-sm text-[var(--rv-text-dim)]">
              <p>© AdvancedRetro · Retroville está en desarrollo.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {RETROVILLE_SOCIAL_CHANNELS.map((social) => (
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
                {RETROVILLE_DISCOVERY_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-[11px] uppercase tracking-[0.2em] text-white/82 transition hover:border-[var(--rv-green)]/30 hover:bg-white/[0.08] hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/retroville/legal"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-[11px] uppercase tracking-[0.2em] text-white/82 transition hover:border-[var(--rv-green)]/30 hover:bg-white/[0.08] hover:text-white"
                >
                  Legal
                </Link>
                <Link
                  href="/retroville/faq"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-[11px] uppercase tracking-[0.2em] text-white/82 transition hover:border-[var(--rv-green)]/30 hover:bg-white/[0.08] hover:text-white"
                >
                  FAQ
                </Link>
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
