'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  LockKeyhole,
  Mail,
  Volume2,
  VolumeX,
} from 'lucide-react';
import RetrovillePrivateDocumentButton from '@/components/retroville/RetrovillePrivateDocumentButton';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import {
  RETROVILLE_DISCOVERY_LINKS,
  RETROVILLE_NEWSLETTER_NAME,
  RETROVILLE_PITCH_EMAIL,
  RETROVILLE_SOCIAL_CHANNELS,
  buildRetrovilleLaunchCopy,
  shouldShowRetrovilleSignupCount,
} from '@/app/retroville/shared';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import RetrovilleImmersiveScene from '@/components/retroville/RetrovilleImmersiveScene';
import styles from './retroville-immersive.module.css';

type AudioEngine = {
  context: AudioContext;
  master: GainNode;
  stop: () => void;
};

type AudienceProfile = {
  name: string;
  role: string;
  photoOffset: number;
  useInitialOnly?: boolean;
};

const EVENT_TITLE = 'Primer reveal publico de Retroville';
const EVENT_LOCATION = 'Online · AdvancedRetro';
const FALLBACK_EVENT_URL = 'https://advancedretro.es/retroville';

const districtCards = [
  {
    title: 'Power Plaza',
    label: 'Centro civil',
    body: 'El corazon civil donde la ciudad se anuncia a si misma. Pantallas, trafico, ruido institucional y la promesa de un progreso que siempre llega roto.',
    image: '/images/retroville/process/central-plaza-board.webp',
  },
  {
    title: 'Bit Grave',
    label: 'Ruina activa',
    body: 'El cementerio del hardware olvidado. Donde van a parar los juegos sin final, las carcasas rajadas y la memoria que nadie quiso reparar.',
    image: '/images/retroville/process/bit-grave-district-board.webp',
  },
  {
    title: 'Top Slot',
    label: 'Vida nocturna',
    body: 'La parte elegante y toxica del mapa. Noche, glamour, membresia y la clase de conversaciones que empeoran despues de medianoche.',
    image: '/images/retroville/retroville-club-concept.png',
  },
  {
    title: 'City Hall',
    label: 'Poder oficial',
    body: 'La cara oficial del universo. Protocolos, ruedas de prensa, orden publico y decisiones absurdas con sonrisa de pantalla.',
    image: '/images/retroville/retroville-civic-hall-concept.png',
  },
  {
    title: 'Cinema & Mall District',
    label: 'Ocio y consumo',
    body: 'El distrito donde el brillo comercial vende normalidad mientras la ciudad sigue discutiendo consigo misma a dos calles de distancia.',
    image: '/images/retroville/process/cinema-mall-district-board.webp',
  },
  {
    title: 'Transit Loop',
    label: 'Movilidad',
    body: 'Cables, rutas, pods y trayectos que convierten el transporte en parte del lenguaje urbano de Retroville, no solo en utileria.',
    image: '/images/retroville/process/metro-pod-translation-board.webp',
  },
] as const;

const characterPanels = [
  {
    name: 'NOX',
    tag: 'Console Core',
    body: 'Cansado, sarcastico y todavia imprescindible. Si Retroville sigue encendida, es porque NOX aun no ha decidido dejarla arder.',
    image: '/images/retroville/nox-character-large.webp',
  },
  {
    name: 'LUNA',
    tag: 'Top Slot',
    body: 'Glamour, sabotaje emocional y control social. No entra en una sala: la reprograma.',
    image: '/images/retroville/luna-character-large.webp',
  },
  {
    name: 'BUTTON CREW',
    tag: 'Power Plaza',
    body: 'Caos vecinal y barrio convertido en pandilla. A, B, Y y X no resuelven escenas: las revientan.',
    image: '/images/retroville/button-crew-character-large.webp',
  },
] as const;

const residentCards = [
  {
    name: 'MAYOR TUBE',
    district: 'City Hall / Power Plaza',
    body: 'El poder con sonrisa de pantalla. Promete progreso, orden y una ciudad perfectamente encendida aunque nadie haya preguntado.',
    image: '/images/retroville/characters/mayor-tube.webp',
  },
  {
    name: 'NORA',
    district: 'Riverside District',
    body: 'Observa, juzga y sabe demasiado sobre todos. No provoca el caos: lo archiva y luego lo comenta mejor que nadie.',
    image: '/images/retroville/characters/nora.webp',
  },
  {
    name: 'JOY & GRUMP',
    district: 'Memory Leak Lane',
    body: 'Dos vecinos con rutina, cero paciencia y vocacion para convertir cualquier minimo ruido en una guerra comunitaria.',
    image: '/images/retroville/characters/joy-grump.webp',
  },
  {
    name: 'NANO',
    district: 'Sound Alley',
    body: 'Vive dentro de su playlist. Mas callado, mas sensible y mas perdido en musica que el resto de la ciudad.',
    image: '/images/retroville/characters/nano.webp',
  },
  {
    name: 'PIPO',
    district: 'Glitch Market',
    body: 'Pequeno, molesto y convencido de que nada es culpa suya. Energia de problema con sonrisa de mascota virtual.',
    image: '/images/retroville/characters/pipo.webp',
  },
  {
    name: 'CRUX',
    district: 'Central Station',
    body: 'Funcionario veterano del sistema urbano. Todo pasa por sus llaves, sus formularios y su paciencia agotada.',
    image: '/images/retroville/characters/crux.webp',
  },
] as const;

const conceptCards = [
  {
    title: 'Objetos olvidados',
    body: 'Retroville esta construida con cartuchos, consolas, perifericos y hardware abandonado. Nada es decorado generico: el mundo nace de referencias reales traducidas a arquitectura y vida urbana.',
  },
  {
    title: 'Segunda oportunidad',
    body: 'Aqui lo que fue descartado vuelve a vivir, trabajar, enamorarse, discutir y liarla. La ciudad funciona como refugio roto para todo lo que el mundo dejo atras.',
  },
  {
    title: 'Humor negro',
    body: 'El tono mezcla comedia adulta, sarcasmo, barrio, mala leche y escenas que saben ser divertidas sin ponerse infantiles ni corporativas.',
  },
  {
    title: 'Caos social',
    body: 'Distritos, facciones, transporte, propaganda, vecinos y problemas de convivencia convierten Retroville en una ciudad con sistema social propio.',
  },
] as const;

const visualDevelopmentCards = [
  {
    title: 'Cast presentation',
    meta: 'Pitch visual',
    body: 'La pieza que mejor resume reparto principal, tono de serie y escala de mundo en una sola imagen.',
    image: '/images/retroville/retroville-cast-presentation.webp',
  },
  {
    title: 'Retroville street',
    meta: 'Mood urbano',
    body: 'La calle como promesa de serie: neon, trafico, profundidad y una sensacion de ciudad que ya estaba viva antes de la visita.',
    image: '/images/retroville/retroville-street.png',
  },
  {
    title: 'Masterplan overview',
    meta: 'Worldbuilding',
    body: 'Mapa general para entender relaciones entre plazas, barrios, ruina, transporte y zonas con identidad propia.',
    image: '/images/retroville/process/masterplan-overview-board.webp',
  },
  {
    title: 'Luna x Nox',
    meta: 'Escena narrativa',
    body: 'Una imagen que baja al personaje y a la dinamica emocional. Glamour, tension y comedia social dentro de una sola toma.',
    image: '/images/retroville/luna-nox-lounge.png',
  },
  {
    title: 'Urban props',
    meta: 'Visual development',
    body: 'Senaletica, mobiliario y detalles de calle para que el universo funcione como ciudad habitada y no solo como concepto bonito.',
    image: '/images/retroville/retroville-urban-props-concept.webp',
  },
  {
    title: 'Archive myth',
    meta: 'Poster mood',
    body: 'Piezas como Mona NOX o The Last Save amplian el mito del proyecto y lo acercan a una propiedad con iconografia propia.',
    image: '/images/retroville/retroville-last-supper.png',
  },
] as const;

const founderProfile = {
  name: 'Joel Rivera Rodriguez',
  role: 'Founder of AdvancedRetro & Retroville',
  image: '/images/creator/joel-color.jpg',
  paragraphs: [
    'Hola. Soy Joel Rivera Rodriguez, apasionado del diseno web, del desarrollo de experiencias digitales y de construir universos con identidad propia.',
    'En AdvancedRetro y Retroville no me interesa ensenar piezas bonitas sin contexto, sino demostrar como combino creatividad, criterio visual y resolucion de problemas para levantar proyectos con voz propia.',
    'Retroville tambien funciona como parte de mi bio: resume lo que hago, como pienso y hacia donde quiero llevar mi trabajo cuando mezclo narrativa, diseno, producto y cultura visual.',
  ],
  highlights: ['UX/UI & Web Design', 'Developer', 'Creative Direction', 'Worldbuilding'],
} as const;

const signalHashtags = [
  '#Retroville',
  '#AdvancedRetro',
  '#RetroGaming',
  '#RetroStyle',
  '#3DAnimation',
  '#AnimatedSeries',
  '#Worldbuilding',
  '#IndieAnimation',
  '#AnimationArt',
  '#Stylized3D',
  '#CreativeProject',
  '#RetroVibes',
  '#DarkComedy',
  '#SocialChaos',
  '#GameInspired',
] as const;

const communityPhotoPool = [
  '/images/retroville/community-avatars/lucia-avatar.png',
  '/images/retroville/community-avatars/ruben-avatar.png',
  '/images/retroville/community-avatars/mara-avatar.png',
  '/images/retroville/community-avatars/dani-avatar.png',
] as const;

const audienceProfiles: readonly AudienceProfile[] = [
  {
    name: 'Lucia',
    role: 'Quiere worldbuilding y personajes con mala leche.',
    photoOffset: 0,
  },
  {
    name: 'Ruben',
    role: 'Busca barrios con identidad y cultura propia.',
    photoOffset: 3,
  },
  {
    name: 'Mara',
    role: 'Entra por el evento y se queda por el lore.',
    photoOffset: 5,
    useInitialOnly: true,
  },
  {
    name: 'Dani',
    role: 'Viene por la estetica y el humor social.',
    photoOffset: 7,
  },
  {
    name: 'Aina',
    role: 'Le interesan drops, proceso y guias visuales.',
    photoOffset: 2,
    useInitialOnly: true,
  },
  {
    name: 'Leo',
    role: 'Quiere entrar pronto en comunidad y reveal.',
    photoOffset: 6,
  },
] as const;

const episodePackets = Array.from({ length: 10 }, (_, index) => ({
  code: `EP ${String(index + 1).padStart(2, '0')}`,
  title: `Dossier episodio ${String(index + 1).padStart(2, '0')}`,
}));

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function fadeWindow(value: number, start: number, end: number, feather = 0.14) {
  const fadeIn = clamp01((value - (start - feather)) / feather);
  const fadeOut = clamp01((end + feather - value) / feather);
  return Math.min(fadeIn, fadeOut);
}

function getInitials(name: string) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'RV';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function resolvePhoto(waitlistCount: number, offset: number) {
  return communityPhotoPool[(Math.max(0, waitlistCount) + offset) % communityPhotoPool.length];
}

function createNoiseBuffer(context: AudioContext, duration = 2) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function rampMaster(master: GainNode, context: AudioContext, value: number) {
  master.gain.cancelScheduledValues(context.currentTime);
  master.gain.linearRampToValueAtTime(value, context.currentTime + 0.24);
}

function createRetrovilleAudioEngine(): AudioEngine {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const ambienceSource = context.createBufferSource();
  ambienceSource.buffer = createNoiseBuffer(context, 3);
  ambienceSource.loop = true;

  const ambienceHighPass = context.createBiquadFilter();
  ambienceHighPass.type = 'highpass';
  ambienceHighPass.frequency.value = 120;

  const ambienceLowPass = context.createBiquadFilter();
  ambienceLowPass.type = 'lowpass';
  ambienceLowPass.frequency.value = 1400;

  const ambienceGain = context.createGain();
  ambienceGain.gain.value = 0.042;

  ambienceSource.connect(ambienceHighPass);
  ambienceHighPass.connect(ambienceLowPass);
  ambienceLowPass.connect(ambienceGain);
  ambienceGain.connect(master);
  ambienceSource.start();

  const drone = context.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = 40;

  const droneFilter = context.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 88;

  const droneGain = context.createGain();
  droneGain.gain.value = 0.025;
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(master);
  drone.start();

  let crackleTimer: number | null = null;
  const burstBuffer = createNoiseBuffer(context, 0.18);

  const scheduleCrackle = () => {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = burstBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = 980 + Math.random() * 1800;
    filter.Q.value = 0.8 + Math.random() * 2.2;

    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.026 + Math.random() * 0.015, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + 0.18);

    crackleTimer = window.setTimeout(scheduleCrackle, 760 + Math.random() * 1640);
  };

  crackleTimer = window.setTimeout(scheduleCrackle, 1400);

  return {
    context,
    master,
    stop: () => {
      if (crackleTimer) window.clearTimeout(crackleTimer);
      ambienceSource.stop();
      drone.stop();
      master.disconnect();
      void context.close();
    },
  };
}

function parseEventDate(launchIso: string) {
  const parsed = new Date(launchIso);
  if (Number.isFinite(parsed.getTime())) return parsed;
  return new Date('2026-11-10T00:00:00.000Z');
}

function addUtcDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function toCalendarDateToken(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function buildEventDetails(eventUrl: string) {
  return `Guarda esta fecha para no perderte el primer reveal publico de Retroville y el siguiente drop oficial. Mas info: ${eventUrl}`;
}

function buildGoogleCalendarHref(launchIso: string) {
  const eventDate = parseEventDate(launchIso);
  const start = toCalendarDateToken(eventDate);
  const end = toCalendarDateToken(addUtcDays(eventDate, 1));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    details: buildEventDetails(FALLBACK_EVENT_URL),
    location: EVENT_LOCATION,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsFile(launchIso: string, eventUrl: string) {
  const eventDate = parseEventDate(launchIso);
  const start = toCalendarDateToken(eventDate);
  const end = toCalendarDateToken(addUtcDays(eventDate, 1));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AdvancedRetro//Retroville//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:retroville-first-reveal-${start}@advancedretro.es`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(EVENT_TITLE)}`,
    `DESCRIPTION:${escapeIcsText(buildEventDetails(eventUrl))}`,
    `LOCATION:${escapeIcsText(EVENT_LOCATION)}`,
    `URL:${escapeIcsText(eventUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

function trackCalendarAction(channel: 'google' | 'ics') {
  if (typeof window === 'undefined') return;
  const analyticsWindow = window as Window & {
    retrovilleTrack?: (eventName: string, props?: Record<string, unknown>) => void;
  };

  analyticsWindow.retrovilleTrack?.('retroville_event_calendar_save', {
    channel,
    location: 'immersive_experience',
  });
}

export default function RetrovilleImmersiveExperience({
  launchIso,
  launchLabel,
  waitlistCount,
  initialMobileExperience = false,
}: {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
  initialMobileExperience?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const motionRef = useRef({ flight: 0 });
  const progressRef = useRef(0);
  const audioRef = useRef<AudioEngine | null>(null);

  const [introLoad, setIntroLoad] = useState(0);
  const [introBlur, setIntroBlur] = useState(18);
  const [introComplete, setIntroComplete] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [audioStarted, setAudioStarted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  const isMobile = initialMobileExperience;
  const launchCopy = buildRetrovilleLaunchCopy(launchLabel);
  const showAudienceCount = shouldShowRetrovilleSignupCount(waitlistCount);
  const googleCalendarHref = useMemo(() => buildGoogleCalendarHref(launchIso), [launchIso]);
  const waitlistLabel = showAudienceCount
    ? `${waitlistCount.toLocaleString('es-ES')} personas ya reciben ${RETROVILLE_NEWSLETTER_NAME}.`
    : `La señal todavia acaba de arrancar, pero el reveal ya esta listo para reunir a la primera comunidad.`;

  const heroOpacity = fadeWindow(storyProgress, 0, 0.34, 0.28);
  const plazaOpacity = fadeWindow(storyProgress, 0.16, 0.52, 0.14);
  const castOpacity = fadeWindow(storyProgress, 0.46, 0.82, 0.14);
  const ctaOpacity = fadeWindow(storyProgress, 0.78, 1.02, 0.16);

  const audienceCards = useMemo(
    () =>
      audienceProfiles.map((profile) => ({
        ...profile,
        photo: profile.useInitialOnly ? null : resolvePhoto(waitlistCount, profile.photoOffset),
      })),
    [waitlistCount]
  );

  const ensureAudioStarted = useCallback(async () => {
    if (audioRef.current) {
      if (audioRef.current.context.state === 'suspended') {
        await audioRef.current.context.resume();
      }
      rampMaster(audioRef.current.master, audioRef.current.context, audioMuted ? 0 : 0.08);
      setAudioStarted(true);
      return;
    }

    const engine = createRetrovilleAudioEngine();
    audioRef.current = engine;
    if (engine.context.state === 'suspended') {
      await engine.context.resume();
    }
    rampMaster(engine.master, engine.context, audioMuted ? 0 : 0.08);
    setAudioStarted(true);
  }, [audioMuted]);

  function scrollIntoDossier() {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleDownloadIcs() {
    if (typeof window === 'undefined') return;

    const eventUrl = `${window.location.origin}/retroville`;
    const blob = new Blob([buildIcsFile(launchIso, eventUrl)], {
      type: 'text/calendar;charset=utf-8',
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'retroville-primer-reveal.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    trackCalendarAction('ics');
  }

  async function handleAudioToggle() {
    if (!audioStarted) {
      setAudioMuted(false);
      await ensureAudioStarted();
      return;
    }

    setAudioMuted((current) => !current);
  }

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const loadProxy = { value: 0 };
    const blurProxy = { value: 18 };
    const flightProxy = { value: 0 };

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => setIntroComplete(true),
    });

    timeline.to(loadProxy, {
      value: 1,
      duration: 3,
      onUpdate: () => setIntroLoad(loadProxy.value),
    });
    timeline.to(
      flightProxy,
      {
        value: 1,
        duration: 4,
        ease: 'power3.inOut',
        onUpdate: () => {
          motionRef.current.flight = flightProxy.value;
        },
      },
      '>-0.05'
    );
    timeline.to(
      blurProxy,
      {
        value: 0,
        duration: 4,
        ease: 'power2.out',
        onUpdate: () => setIntroBlur(blurProxy.value),
      },
      '<'
    );

    return () => {
      timeline.kill();
    };
  }, []);

  useEffect(() => {
    if (!stageRef.current) return;

    const scrollProxy = { value: 0 };
    const animation = gsap.to(scrollProxy, {
      value: 1,
      ease: 'none',
      onUpdate: () => {
        progressRef.current = scrollProxy.value;
        setStoryProgress(scrollProxy.value);
      },
      scrollTrigger: {
        trigger: stageRef.current,
        start: 'top top',
        end: isMobile ? '+=135%' : '+=360%',
        scrub: 1.1,
      },
    });

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [isMobile]);

  useEffect(() => {
    if (audioStarted) return;

    const unlock = () => {
      void ensureAudioStarted();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioStarted, ensureAudioStarted]);

  useEffect(() => {
    if (!audioRef.current || !audioStarted) return;
    rampMaster(audioRef.current.master, audioRef.current.context, audioMuted ? 0 : 0.08);
  }, [audioMuted, audioStarted]);

  useEffect(
    () => () => {
      audioRef.current?.stop();
      audioRef.current = null;
    },
    []
  );

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const snapToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    snapToTop();
    window.requestAnimationFrame(snapToTop);
    const timer = window.setTimeout(snapToTop, 80);
    setSceneReady(true);

    return () => {
      window.clearTimeout(timer);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  return (
    <main
      className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.variable} ${styles.page}`}
      data-no-auto-translate
    >
      <section ref={stageRef} className={styles.stage}>
        <div className={styles.stageSticky}>
          <div className={`${styles.introBar} ${introComplete ? styles.introBarHidden : ''}`} aria-hidden="true">
            <span className={styles.introBarFill} style={{ transform: `scaleX(${introLoad})` }} />
          </div>

          <div className={styles.canvasShell} style={{ filter: `blur(${introBlur}px)` }}>
            {sceneReady ? (
              <RetrovilleImmersiveScene isMobile={isMobile} motionRef={motionRef} progressRef={progressRef} />
            ) : null}
          </div>

          <div className={styles.noise} aria-hidden="true" />
          <div className={styles.vignette} aria-hidden="true" />

          <div className={styles.overlay}>
            <div className={styles.overlayTop}>
              <div>
                <p className={styles.eyebrow}>AdvancedRetro original series</p>
                <p className={styles.signalCopy}>Ciudad procedural · Scroll cinematografico · Audio reactivo</p>
              </div>
              <button
                type="button"
                onClick={() => void handleAudioToggle()}
                className={styles.audioButton}
                aria-pressed={!audioMuted}
                aria-label={audioMuted ? 'Activar audio ambiente' : 'Silenciar audio ambiente'}
              >
                {audioMuted || !audioStarted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span>{audioMuted || !audioStarted ? 'Audio off' : 'Audio on'}</span>
              </button>
            </div>

            <div className={styles.heroBlock} style={{ opacity: heroOpacity }}>
              <p className={styles.heroTag}>RETROVILLE // SIGNAL 00</p>
              <p className={styles.heroGreeting}>Bienvenidos a Retroville.</p>
              <h1 className={styles.heroTitle} data-text="RETROVILLE">
                RETROVILLE
              </h1>
              <p className={styles.heroSubtitle}>
                Una ciudad donde los objetos olvidados tienen una segunda oportunidad para vivir, trabajar, enamorarse, discutir y causar caos social.
              </p>
            </div>

            <div className={styles.plazaPanel} style={{ opacity: plazaOpacity }}>
              <p className={styles.panelEyebrow}>Power Plaza</p>
              <h2 className={styles.panelTitle}>La ciudad se presenta como si ya estuviera viva.</h2>
              <p className={styles.panelBody}>
                Publicidad publica, trafico rojo, ruido civil y una plaza central donde todo parece a punto de convertirse en propaganda.
              </p>
            </div>

            <div className={styles.castPanels} style={{ opacity: castOpacity }}>
              {characterPanels.map((panel) => (
                <article key={panel.name} className={styles.castPanel}>
                  <span className={styles.castMeta}>{panel.tag}</span>
                  <h3 className={styles.castName}>{panel.name}</h3>
                  <p className={styles.castBody}>{panel.body}</p>
                </article>
              ))}
            </div>

            <div className={styles.ctaPanel} style={{ opacity: ctaOpacity }}>
              <p className={styles.panelEyebrow}>Descent complete</p>
              <h2 className={styles.panelTitle}>Entrar en el dossier vivo de Retroville.</h2>
              <p className={styles.panelBody}>
                Desde aqui ya no es teaser. Entras al material tecnico, a las guias visuales, al reveal y a la comunidad que lo va a mover primero.
              </p>
              <button type="button" onClick={scrollIntoDossier} className={styles.enterButton}>
                ENTRAR A RETROVILLE
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <ol className={styles.timelineRail} aria-label="Trayectoria cinematografica">
              <li className={storyProgress < 0.25 ? styles.timelineActive : ''}>Street level</li>
              <li className={storyProgress >= 0.25 && storyProgress < 0.55 ? styles.timelineActive : ''}>Power Plaza</li>
              <li className={storyProgress >= 0.55 && storyProgress < 0.84 ? styles.timelineActive : ''}>Cast alley</li>
              <li className={storyProgress >= 0.84 ? styles.timelineActive : ''}>Ascent</li>
            </ol>
          </div>
        </div>
      </section>

      <section ref={contentRef} id="retroville-dossier" className={styles.dossier}>
        <div className={styles.sectionIntro}>
          <div>
            <p className={styles.eyebrow}>Dossier vivo</p>
            <h2 className={styles.sectionTitle}>Mas contenido, mejor ordenado y sin perder la ambicion del universo.</h2>
          </div>
          <p className={styles.sectionLead}>
            {launchCopy} Ahora la entrada funciona como experiencia, pero debajo sigues teniendo ciudad, personajes, guias visuales, comunidad y material privado listo para presentar.
          </p>
        </div>

        <section className={styles.conceptSection}>
          <div className={styles.conceptLayout}>
            <article className={styles.editorialCard}>
              <p className={styles.eyebrow}>Concepto</p>
              <h3 className={styles.editorialTitle}>Una landing de worldbuilding, no una tienda.</h3>
              <p className={styles.editorialLead}>
                Retroville es una serie animada original creada dentro del universo AdvancedRetro. La ciudad esta formada por cartuchos, consolas, perifericos y restos de hardware olvidado que vuelven a encenderse con humor oscuro, barrio y caos social.
              </p>
              <p className={styles.cardBody}>
                Lejos de parecer una web generica de gaming, la entrada tiene que sentirse como una presentacion visual para fans, colaboradores o estudios: ciudad viva, tono adulto y personajes que ya parecen existir fuera de pantalla.
              </p>
            </article>

            <article className={styles.quoteCard}>
              <p className={styles.cardMeta}>Lore base</p>
              <p className={styles.quoteLine}>
                Desde el Arcade District hasta el desguace, cada rincon guarda una historia rota... pero todavia encendida.
              </p>
              <p className={styles.cardBody}>
                Aqui conviven nostalgia retro, satira social, vida de barrio y una sensacion constante de que cualquier conversacion puede acabar en disturbio, propaganda o melodrama.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.districtSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Ciudad</p>
              <h3 className={styles.blockTitle}>Distritos con peso real, no solo decorado.</h3>
            </div>
            <Link href="/retroville/sketches" className={styles.inlineLink}>
              Ver sketchbook completo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className={styles.districtGrid}>
            {districtCards.map((card) => (
              <article key={card.title} className={styles.districtCard}>
                <div className={styles.cardImageWrap}>
                  <Image src={card.image} alt={card.title} fill sizes="(max-width: 900px) 100vw, 50vw" className={styles.cardImage} />
                </div>
                <div className={styles.cardCopy}>
                  <p className={styles.cardMeta}>{card.label}</p>
                  <h4 className={styles.cardTitle}>{card.title}</h4>
                  <p className={styles.cardBody}>{card.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.charactersSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Cast</p>
              <h3 className={styles.blockTitle}>Personajes principales y residentes que sostienen la ciudad.</h3>
            </div>
            <Link href="/retroville/personajes" className={styles.inlineLink}>
              Abrir reparto completo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className={styles.characterGrid}>
            {characterPanels.map((panel) => (
              <article key={panel.name} className={styles.characterCard}>
                <div className={styles.characterVisual}>
                  <Image src={panel.image} alt={panel.name} fill sizes="(max-width: 900px) 100vw, 33vw" className={styles.characterImage} />
                </div>
                <div className={styles.characterCopy}>
                  <p className={styles.cardMeta}>{panel.tag}</p>
                  <h4 className={styles.characterName}>{panel.name}</h4>
                  <p className={styles.cardBody}>{panel.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.sectionSubcopy}>
            <p className={styles.cardMeta}>Mas vecinos reales del proyecto</p>
            <p className={styles.microCopy}>
              El universo ya no se sostiene solo con NOX, Luna y Button Crew. Debajo entran los residentes, autoridades, vecinos y perfiles que le dan sociedad a la ciudad.
            </p>
          </div>

          <div className={styles.residentGrid}>
            {residentCards.map((resident) => (
              <article key={resident.name} className={styles.residentCard}>
                <div className={styles.residentVisual}>
                  <Image src={resident.image} alt={resident.name} fill sizes="(max-width: 900px) 100vw, 20vw" className={styles.residentImage} />
                </div>
                <div className={styles.residentCopy}>
                  <p className={styles.cardMeta}>{resident.district}</p>
                  <h4 className={styles.residentName}>{resident.name}</h4>
                  <p className={styles.cardBody}>{resident.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.toneSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Mundo y tono</p>
              <h3 className={styles.blockTitle}>Comedia negra, nostalgia retro y una ciudad rota que sigue encendida.</h3>
            </div>
          </div>

          <div className={styles.toneLayout}>
            <div className={styles.conceptGrid}>
              {conceptCards.map((card) => (
                <article key={card.title} className={styles.conceptCard}>
                  <p className={styles.cardMeta}>{card.title}</p>
                  <p className={styles.cardBody}>{card.body}</p>
                </article>
              ))}
            </div>

            <article className={styles.toneQuoteCard}>
              <p className={styles.cardMeta}>Frase de ciudad</p>
              <p className={styles.quoteLine}>&quot;Aqui hasta los cartuchos muertos siguen pagando alquiler.&quot;</p>
              <p className={styles.cardBody}>
                NOX lo resume mejor que cualquier manifiesto: Retroville no es una fantasia limpia, sino una sociedad de segunda oportunidad con neon, desgaste y muy poca paciencia.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.gallerySection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Visual development</p>
              <h3 className={styles.blockTitle}>Pitch visuals, escenas y archivo editorial del universo.</h3>
            </div>
            <Link href="/retroville/presentaciones" className={styles.inlineLink}>
              Ver presentacion
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className={styles.galleryGrid}>
            {visualDevelopmentCards.map((card) => (
              <article key={card.title} className={styles.galleryCard}>
                <div className={styles.galleryVisual}>
                  <Image src={card.image} alt={card.title} fill sizes="(max-width: 900px) 100vw, 33vw" className={styles.galleryImage} />
                </div>
                <div className={styles.galleryCopy}>
                  <p className={styles.cardMeta}>{card.meta}</p>
                  <h4 className={styles.cardTitle}>{card.title}</h4>
                  <p className={styles.cardBody}>{card.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.founderSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Founder</p>
              <h3 className={styles.blockTitle}>La bio detras del universo.</h3>
            </div>
            <Link href="/creator" className={styles.inlineLink}>
              Abrir perfil completo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className={styles.founderLayout}>
            <article className={styles.founderPhotoCard}>
              <div className={styles.founderPhotoWrap}>
                <Image
                  src={founderProfile.image}
                  alt={founderProfile.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 32vw"
                  className={styles.founderPhoto}
                />
              </div>
            </article>

            <article className={styles.founderCopyCard}>
              <p className={styles.cardMeta}>{founderProfile.role}</p>
              <h4 className={styles.founderName}>{founderProfile.name}</h4>
              <div className={styles.founderParagraphs}>
                {founderProfile.paragraphs.map((paragraph) => (
                  <p key={paragraph} className={styles.cardBody}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className={styles.founderHighlightRow}>
                {founderProfile.highlights.map((item) => (
                  <span key={item} className={styles.founderHighlight}>
                    {item}
                  </span>
                ))}
              </div>

              <Link href="/creator" className={styles.primaryButton}>
                Ver founder / CV
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>

        <section className={styles.communitySection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Pulso de comunidad</p>
              <h3 className={styles.blockTitle}>Registro real para el reveal y guardado directo del evento.</h3>
            </div>
            <p className={styles.microCopy}>{waitlistLabel}</p>
          </div>

          <div className={styles.communityLayout}>
            <div className={styles.communityAudience}>
              <div className={styles.avatarRow}>
                {audienceCards.map((profile) => (
                  <div key={profile.name} className={styles.avatar}>
                    {profile.photo ? (
                      <Image
                        src={profile.photo}
                        alt={`Avatar de ${profile.name}, ejemplo de audiencia de Retroville`}
                        fill
                        sizes="64px"
                        className={styles.avatarImage}
                      />
                    ) : (
                      <span>{getInitials(profile.name)}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.audienceGrid}>
                {audienceCards.map((profile) => (
                  <article key={profile.name} className={styles.audienceCard}>
                    <div className={styles.audienceBadge}>{profile.useInitialOnly ? getInitials(profile.name) : 'LIVE'}</div>
                    <h4 className={styles.audienceName}>{profile.name}</h4>
                    <p className={styles.cardBody}>{profile.role}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.eventCard}>
              <div className={styles.eventTags}>
                <span>Reveal</span>
                <span>{launchLabel}</span>
                <span>Online</span>
              </div>
              <h4 className={styles.eventTitle}>Apuntate y guardalo en tu calendario.</h4>
              <p className={styles.cardBody}>
                Dejas tu nombre y tu email, quedas dentro de la primera señal y en el mismo bloque puedes guardar el evento con un clic.
              </p>

              <div className={styles.eventActions}>
                <a
                  href={googleCalendarHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackCalendarAction('google')}
                  className={styles.secondaryButton}
                >
                  <CalendarDays className="h-4 w-4" />
                  Guardar en Google Calendar
                </a>
                <button type="button" onClick={handleDownloadIcs} className={styles.secondaryButton}>
                  <Download className="h-4 w-4" />
                  Descargar .ics
                </button>
              </div>

              <div className={styles.formShell}>
                <RetrovilleWaitlistForm
                  darkMode
                  showName
                  intent="event"
                  source="retroville-immersive-community"
                  eventSlug="retroville-first-public-reveal"
                  eventTitle={EVENT_TITLE}
                  buttonLabel="Apuntarme al reveal"
                  successMessage="Perfecto. Ya estas dentro del reveal de Retroville."
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.vaultSection} id="production-desk">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Production desk</p>
              <h3 className={styles.blockTitle}>Biblia privada y temporada 1 planteada como archivo en expansion.</h3>
            </div>
            <div className={styles.privateNotice}>
              <Mail className="h-4 w-4" />
              <span>Solicitud privada a {RETROVILLE_PITCH_EMAIL}</span>
            </div>
          </div>

          <div className={styles.vaultTop}>
            <article className={styles.privateCard}>
              <p className={styles.cardMeta}>Acceso privado</p>
              <h4 className={styles.cardTitle}>Biblia de serie · vision general</h4>
              <p className={styles.cardBody}>
                La biblia principal no se descarga libremente. Se solicita por correo y se canaliza al contacto
                indicado para mantener el documento en circulacion controlada.
              </p>
              <RetrovillePrivateDocumentButton
                documentTitle="Biblia de serie · Vision general"
                buttonLabel="Solicitar acceso"
                className={styles.primaryButton}
              />
            </article>

            <article className={styles.lockedCard}>
              <p className={styles.cardMeta}>Incoming</p>
              <h4 className={styles.cardTitle}>Season 1 playbook</h4>
              <p className={styles.cardBody}>
                Estructura prevista para diez episodios con sinopsis, beats y continuidad. Se mantiene bloqueado hasta que cada release tenga nivel de presentacion real.
              </p>
              <button type="button" disabled aria-disabled="true" className={styles.lockedButton}>
                <LockKeyhole className="h-4 w-4" />
                Archivo bloqueado
              </button>
            </article>
          </div>

          <div className={styles.episodeGrid}>
            {episodePackets.map((episode) => (
              <article key={episode.code} className={styles.episodeCard}>
                <span className={styles.episodeCode}>{episode.code}</span>
                <h4 className={styles.episodeTitle}>{episode.title}</h4>
                <p className={styles.episodeStatus}>Incoming hasta nuevo release</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.networkSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Signal network</p>
              <h3 className={styles.blockTitle}>Todas las redes, mas informacion y mas puntos de entrada al universo.</h3>
            </div>
          </div>

          <div className={styles.networkColumns}>
            <div className={styles.networkGrid}>
              {RETROVILLE_SOCIAL_CHANNELS.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.networkCard}
                  aria-label={channel.ariaLabel}
                >
                  <p className={styles.cardMeta}>{channel.eyebrow}</p>
                  <h4 className={styles.cardTitle}>
                    {channel.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </h4>
                  <p className={styles.cardBody}>{channel.description}</p>
                </a>
              ))}
            </div>

            <div className={styles.discoveryStack}>
              {RETROVILLE_DISCOVERY_LINKS.map((item) => (
                <Link key={item.label} href={item.href} className={styles.discoveryCard}>
                  <p className={styles.cardMeta}>{item.eyebrow}</p>
                  <h4 className={styles.cardTitle}>
                    {item.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </h4>
                  <p className={styles.cardBody}>{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <p className={styles.eyebrow}>Teaser final</p>
          <h3 className={styles.finalTitle}>
            Retroville no es solo una ciudad.
            <br />
            Es donde acaba todo lo que el mundo dejo atras.
          </h3>
          <p className={styles.sectionLead}>
            Una serie animada 3D con humor negro, satira social, personajes con mala leche y una ciudad construida para seguir creciendo con nuevos reveals, dossiers y piezas visuales.
          </p>

          <div className={styles.hashtagRail} aria-label="Hashtags oficiales de Retroville">
            {signalHashtags.map((tag) => (
              <span key={tag} className={styles.hashtag}>
                {tag}
              </span>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
