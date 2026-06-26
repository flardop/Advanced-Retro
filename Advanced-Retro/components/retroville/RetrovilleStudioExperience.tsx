'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  FileText,
  Film,
  Mail,
  MapPinned,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react';
import RetrovilleEventSignupCard from '@/components/retroville/RetrovilleEventSignupCard';
import RetrovillePrivateDocumentButton from '@/components/retroville/RetrovillePrivateDocumentButton';
import {
  RETROVILLE_DISCOVERY_LINKS,
  RETROVILLE_SOCIAL_CHANNELS,
  buildRetrovilleLaunchCopy,
  shouldShowRetrovilleSignupCount,
} from '@/app/retroville/shared';
import {
  retrovilleEpisodes,
  retrovilleGuideSlides,
  retrovilleMainCharacters,
  retrovilleSecondaryCharacters,
} from '@/app/retroville/content';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './retroville-studio.module.css';

const overviewSignals = [
  {
    icon: Sparkles,
    title: 'Tono reconocible',
    body: 'La serie ya tiene una frase, una atmósfera y un imaginario propios. No parece un moodboard bonito sin dirección.',
  },
  {
    icon: Clapperboard,
    title: 'IP empaquetable',
    body: 'El cast, la ciudad y la T1 ya pueden explicarse como paquete creativo: qué es, cómo se ve y qué puede crecer.',
  },
  {
    icon: Film,
    title: 'Temporada legible',
    body: 'La T1 se entiende rápido: diez episodios, protagonistas claros y una dirección de universo que no abruma.',
  },
  {
    icon: BadgeCheck,
    title: 'Ruta de conversión',
    body: 'Hay un siguiente paso real para buyers, partners o prensa: press kit, biblia privada y reveal guardable.',
  },
] as const;

const districtCards = [
  {
    title: 'RAM District',
    body: 'El barrio donde NOX entra a la ciudad y donde lo cotidiano ya viene con fricción, vecinos y burocracia absurda.',
    image: '/images/retroville/process/masterplan-overview-board.webp',
  },
  {
    title: 'Power Plaza',
    body: 'Pantallas, poder civil, anuncios y circulación social. La ciudad se comporta como personaje cuando pasa por aquí.',
    image: '/images/retroville/process/central-plaza-board.webp',
  },
  {
    title: 'Bit Grave',
    body: 'La amenaza real debajo de la comedia. Un espacio que mete mito, ruina y peligro sin romper el tono del universo.',
    image: '/images/retroville/process/bit-grave-district-board.webp',
  },
] as const;

const communityPhotoPool = [
  '/images/community/homemade/community-photo-001.jpeg',
  '/images/community/homemade/community-photo-006.jpeg',
  '/images/community/homemade/community-photo-011.jpeg',
  '/images/community/homemade/community-photo-015.jpeg',
  '/images/community/homemade/community-photo-020.jpeg',
  '/images/community/homemade/community-photo-024.jpeg',
  '/images/community/homemade/community-photo-029.jpeg',
  '/images/community/homemade/community-photo-033.jpeg',
] as const;

type CommunityProfile = {
  name: string;
  role: string;
  photoOffset: number;
  useInitialOnly?: boolean;
};

const communityProfiles: readonly CommunityProfile[] = [
  {
    name: 'Lucía',
    role: 'Personajes potentes y estética con firma propia',
    photoOffset: 0,
  },
  {
    name: 'Rubén',
    role: 'Lore, worldbuilding y barrios con identidad',
    photoOffset: 3,
  },
  {
    name: 'Mara',
    role: 'Eventos, drops y comunidad que quiere estar dentro pronto',
    photoOffset: 5,
    useInitialOnly: true,
  },
  {
    name: 'Dani',
    role: 'Coleccionismo, humor raro y cultura retro compartida',
    photoOffset: 7,
  },
] as const;

const buyerJourneyCards = [
  {
    step: '01',
    title: 'Solicita la biblia',
    body: 'La documentación sensible no se descarga en abierto. Se pide y se comparte de forma directa por correo.',
    type: 'private-document',
  },
  {
    step: '02',
    title: 'Revisa el press kit',
    body: 'Renders, logos, fact sheet y resumen del universo para que un tercero entienda rápido qué está viendo.',
    type: 'press-kit',
  },
  {
    step: '03',
    title: 'Guarda el reveal',
    body: 'Si alguien no entra hoy en materiales, al menos puede quedarse dentro del siguiente hito público.',
    type: 'event-signup',
  },
] as const;

function getCommunityInitials(name: string) {
  const safe = String(name || '').trim();
  if (!safe) return 'RV';
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function resolveCommunityPhoto(photoOffset: number, waitlistCount: number) {
  return communityPhotoPool[(Math.max(0, waitlistCount) + photoOffset) % communityPhotoPool.length];
}

const homeEpisodes = retrovilleEpisodes.slice(0, 4);
const homeGuides = retrovilleGuideSlides.slice(0, 6);
const retrovilleTheme = {
  '--rv-accent': '#8ad7ff',
  '--rv-accent-2': '#9b5cff',
  '--rv-green': '#00ff88',
  '--rv-gold': '#ffbf52',
  '--rv-text': '#f5f7ff',
  '--rv-text-muted': 'rgba(229, 234, 255, 0.72)',
  '--rv-text-dim': 'rgba(219, 229, 255, 0.5)',
} as CSSProperties;

type RetrovilleStudioExperienceProps = {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
  initialMobileExperience?: boolean;
};

export default function RetrovilleStudioExperience({
  launchIso,
  launchLabel,
  waitlistCount,
  initialMobileExperience = false,
}: RetrovilleStudioExperienceProps) {
  const descentRef = useRef<HTMLElement | null>(null);
  const descentVideoRef = useRef<HTMLVideoElement | null>(null);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [heroTransitioning, setHeroTransitioning] = useState(false);
  const showAudienceCount = shouldShowRetrovilleSignupCount(waitlistCount);
  const launchCopy = buildRetrovilleLaunchCopy(launchLabel);
  const introPrompt = initialMobileExperience
    ? 'Toca el logo para entrar en Retroville'
    : 'Pulsa el logo para entrar en Retroville';
  const contactMailto =
    'mailto:flardop44@gmail.com?subject=Retroville%20%C2%B7%20Pitch%20y%20materiales&body=Hola%20Joel%2C%0A%0AMe%20interesa%20conocer%20m%C3%A1s%20sobre%20Retroville%20y%20sus%20materiales%20de%20pitch.%0A%0AGracias.';
  const heroValueCards = [
    {
      eyebrow: 'Temporada',
      title: '10 EPISODIOS',
      body: 'La T1 ya se puede leer como propuesta real: arco, personajes y tono ordenados desde el primer vistazo.',
    },
    {
      eyebrow: 'Cast + mundo',
      title: '14+ PERSONAJES',
      body: 'Núcleo, secundarios e incoming ya están separados para presentar la IP como sistema y no como collage.',
    },
    {
      eyebrow: 'Material comercial',
      title: 'PRESS + BIBLIA',
      body: `Press kit público, biblia privada y reveal fijado para ${launchLabel}. Hay siguiente paso y contacto claros.`,
    },
  ] as const;
  const heroAudienceTags = ['Serie animada original', 'Pitch-ready universe', 'Biblia privada bajo solicitud'] as const;

  function handleIntroEnter() {
    if (introLeaving || introDismissed) return;
    setIntroLeaving(true);
    window.setTimeout(() => setIntroDismissed(true), 860);
  }

  function handleEnterRetroville() {
    if (heroTransitioning) return;
    if (typeof window !== 'undefined') {
      window.retrovilleTrack?.('retroville_buyer_cta_click', {
        action: 'enter_retroville',
        location: 'hero',
      });
    }
    setHeroTransitioning(true);
    window.setTimeout(() => {
      descentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 180);
    window.setTimeout(() => setHeroTransitioning(false), 1100);
  }

  function trackStudioAction(action: string, location: string, label?: string) {
    if (typeof window === 'undefined') return;
    window.retrovilleTrack?.('retroville_buyer_cta_click', {
      action,
      location,
      ...(label ? { label } : {}),
    });
  }

  useEffect(() => {
    const section = descentRef.current;
    if (!section) return;

    let frame = 0;

    const syncProgress = () => {
      frame = 0;
      const totalScroll = Math.max(1, section.offsetHeight - window.innerHeight);
      const sectionTop = section.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, -sectionTop / totalScroll));
      section.style.setProperty('--descent-progress', progress.toFixed(4));
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncProgress);
    };

    syncProgress();
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
    };
  }, []);

  useEffect(() => {
    const video = descentVideoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.playbackRate = 0.88;

    const syncPlayback = () => {
      video.playbackRate = 0.88;
      void video.play().catch(() => {
        // Silent fail: mobile or embedded browser policies may delay autoplay until visible.
      });
    };

    const resumePlayback = () => {
      syncPlayback();
    };

    const resumeWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        syncPlayback();
      }
    };

    if (video.readyState >= 2) {
      syncPlayback();
    } else {
      video.addEventListener('canplay', syncPlayback, { once: true });
    }

    window.addEventListener('pointerdown', resumePlayback, { passive: true });
    window.addEventListener('touchstart', resumePlayback, { passive: true });
    window.addEventListener('scroll', resumePlayback, { passive: true });
    document.addEventListener('visibilitychange', resumeWhenVisible);

    return () => {
      video.removeEventListener('canplay', syncPlayback);
      window.removeEventListener('pointerdown', resumePlayback);
      window.removeEventListener('touchstart', resumePlayback);
      window.removeEventListener('scroll', resumePlayback);
      document.removeEventListener('visibilitychange', resumeWhenVisible);
    };
  }, []);

  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}
      style={retrovilleTheme}
    >
      {!introDismissed ? (
        <div className={`${styles.introGate} ${introLeaving ? styles.introGateLeaving : ''}`}>
          <button
            type="button"
            className={styles.introButton}
            onClick={handleIntroEnter}
            aria-label={introPrompt}
          >
            <div className={styles.introBackdrop} aria-hidden="true">
              <Image
                src="/images/retroville/retroville-hero-portal-bg.webp"
                alt=""
                fill
                priority
                sizes="100vw"
                className={styles.introBackdropImage}
              />
              <div className={styles.introBackdropTint} />
            </div>
            <span className={styles.introCurtainLeft} />
            <span className={styles.introCurtainRight} />
            <div className={styles.introContent}>
              <p className={styles.introEyebrow}>AdvancedRetro original series</p>
              <div className={styles.introLogoFrame}>
                <Image
                  src="/images/retroville/retroville-logo.webp"
                  alt="Logo de Retroville"
                  width={1536}
                  height={1023}
                  sizes="(max-width: 768px) 300px, 420px"
                  className={styles.introLogo}
                  priority
                />
              </div>
              <p className={styles.introHint}>{introPrompt}</p>
              <p className={styles.introSubhint}>El resto del pitch aparece justo después de la entrada.</p>
            </div>
          </button>
        </div>
      ) : null}

      <div
        className={`${styles.shell} ${!introDismissed && !introLeaving ? styles.shellBooting : ''} ${
          introDismissed ? styles.shellRevealed : ''
        }`}
      >
        <header className={styles.topbar}>
          <div className={styles.topbarBrand}>
            <p className={styles.topbarEyebrow}>AdvancedRetro original series</p>
            <p className={styles.topbarMeta}>Retroville · buyer brief, cast y materiales</p>
          </div>

          <nav className={styles.topbarNav} aria-label="Secciones principales de Retroville">
            <a href="#buyer-brief">Buyer brief</a>
            <a href="#cast">Personajes</a>
            <a href="#episodes">Episodios</a>
            <a href="#world">Ciudad</a>
            <a href="#community">Comunidad</a>
          </nav>

          <div className={styles.topbarLinks}>
            <Link href="/retroville/personajes">Cast completo</Link>
            <Link href="/retroville/episodios">T1</Link>
            <Link href="/">AdvancedRetro</Link>
          </div>
        </header>

        <section className={`${styles.heroIntro} ${heroTransitioning ? styles.heroIntroTransitioning : ''}`}>
          <div className={styles.heroIntroBackground} aria-hidden="true">
            <Image
              src="/images/retroville/retroville-hero-portal-bg.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.heroIntroPortalImage}
            />
            <div className={styles.heroIntroPortalTint} />
            <div className={styles.heroIntroPortalGlow} />
          </div>

          <div className={`${styles.heroIntroSide} ${styles.heroIntroSideLeft}`} aria-hidden="true">
            <Image
              src="/images/retroville/nox-push.webp"
              alt=""
              fill
              sizes="34vw"
              className={styles.heroIntroSideImage}
              style={{ objectPosition: 'left center' }}
            />
          </div>

          <div className={`${styles.heroIntroSide} ${styles.heroIntroSideRight}`} aria-hidden="true">
            <Image
              src="/images/retroville/button-crew-push.webp"
              alt=""
              fill
              sizes="34vw"
              className={styles.heroIntroSideImage}
              style={{ objectPosition: 'right center' }}
            />
          </div>

          <div className={styles.heroIntroContent}>
            <div className={styles.heroAudienceStrip}>
              {heroAudienceTags.map((tag) => (
                <span key={tag} className={styles.heroAudienceTag}>
                  {tag}
                </span>
              ))}
            </div>
            <p className={styles.heroIntroEyebrow}>Serie original de AdvancedRetro</p>
            <Image
              src="/images/retroville/retroville-logo.webp"
              alt="Logo de Retroville"
              width={1536}
              height={1023}
              priority
              sizes="(max-width: 1024px) 280px, 360px"
              className={styles.heroIntroLogo}
            />
            <p className={styles.heroIntroQuote}>Every forgotten game ends up somewhere.</p>
            <p className={styles.heroIntroBody}>
              Retroville es una serie de animación original con humor negro, barrio, tecnología abandonada y una ciudad
              lista para venderse como IP. Aquí no solo se enseña arte: se explica por qué el mundo, los personajes y
              la T1 pueden compartirse con buyers, partners y prensa sin perder identidad.
            </p>

            <div className={styles.heroIntroActions}>
              <button type="button" className={styles.heroPrimaryButton} onClick={handleEnterRetroville}>
                Entrar en el pitch
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#buyer-brief"
                className={styles.heroSecondaryButton}
                onClick={() => trackStudioAction('open_buyer_brief', 'hero')}
              >
                Ver buyer brief
              </a>
              <RetrovillePrivateDocumentButton
                documentTitle="Biblia de serie · Vision general"
                buttonLabel="Solicitar biblia"
                className={styles.heroOutlineButton}
              />
            </div>

            <div className={styles.heroContactStrip}>
              <a
                href={contactMailto}
                className={styles.heroContactLink}
                onClick={() => trackStudioAction('email_pitch_contact', 'hero')}
              >
                <Mail className="h-4 w-4" />
                Contacto para pitch y materiales
              </a>
              <span className={styles.heroContactHint}>Press kit público + documento privado + reveal guardable.</span>
            </div>

            <div className={styles.heroBuyerNote}>
              <p className={styles.heroBuyerNoteEyebrow}>Lo que entiende un comprador en segundos</p>
              <p className={styles.heroBuyerNoteBody}>
                Qué es Retroville, cuál es su tono, qué material existe ya y cómo se pide acceso al dossier privado.
              </p>
            </div>
          </div>

          <div className={styles.heroValueGrid}>
            {heroValueCards.map((card) => (
              <article key={card.title} className={styles.heroValueCard}>
                <p className={styles.heroValueEyebrow}>{card.eyebrow}</p>
                <h2 className={`${displayFont.className} ${styles.heroValueTitle}`}>{card.title}</h2>
                <p className={styles.heroValueBody}>{card.body}</p>
              </article>
            ))}
          </div>

          <div className={styles.heroBuyerRow}>
            <article className={styles.heroBuyerCard}>
              <div className={styles.heroBuyerIcon}>
                <Clapperboard className="h-4 w-4" />
              </div>
              <div>
                <p className={styles.heroBuyerCardEyebrow}>Formato</p>
                <h3 className={styles.heroBuyerCardTitle}>Serie animada con mundo expandible</h3>
                <p className={styles.heroBuyerCardBody}>
                  El home ya prioriza la propuesta de serie por delante del ruido visual para que se entienda rápido.
                </p>
              </div>
            </article>
            <article className={styles.heroBuyerCard}>
              <div className={styles.heroBuyerIcon}>
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className={styles.heroBuyerCardEyebrow}>Materiales</p>
                <h3 className={styles.heroBuyerCardTitle}>Press kit público y biblia privada</h3>
                <p className={styles.heroBuyerCardBody}>
                  Se protege lo sensible y se deja visible lo suficiente para generar interés y respuesta comercial.
                </p>
              </div>
            </article>
            <article className={styles.heroBuyerCard}>
              <div className={styles.heroBuyerIcon}>
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className={styles.heroBuyerCardEyebrow}>Activación</p>
                <h3 className={styles.heroBuyerCardTitle}>Comunidad, reveal y próxima señal</h3>
                <p className={styles.heroBuyerCardBody}>
                  La página no termina en “mira qué bonito”; termina en registro, calendario y continuidad de contacto.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section ref={descentRef} className={styles.descentSection}>
          <div className={styles.descentSticky}>
            <div className={styles.descentBackdrop} aria-hidden="true" />

            <div className={styles.descentCopy}>
              <div className={styles.descentPills}>
                <span>
                  <Radio className="h-3.5 w-3.5" />
                  Entrada cinematográfica
                </span>
                <span>{launchLabel}</span>
              </div>

              <p className={styles.descentEyebrow}>Toda ciudad olvidada termina en algún lugar.</p>
              <h1 className={`${displayFont.className} ${styles.descentTitle}`}>
                RETROVILLE NO SE ABRE.
                <br />
                SE DESCIENDE.
              </h1>
              <p className={styles.descentBody}>
                Primero skyline. Después edificios. Al final, calle, barrio y cartel. La ciudad entra mejor cuando
                obligamos al scroll a vivir la bajada antes del resto del contenido.
              </p>

              <div className={styles.descentLegend}>
                <span>01 cielo</span>
                <span>02 estructuras</span>
                <span>03 street level</span>
              </div>
            </div>

            <div className={styles.descentScene} aria-hidden="true">
              <div className={styles.descentVideoShell}>
                <video
                  ref={descentVideoRef}
                  className={styles.descentVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/videos/retroville/retroville-city-approach-poster.jpg"
                >
                  <source src="/videos/retroville/retroville-city-approach.mp4" type="video/mp4" />
                </video>
                <div className={styles.descentVideoShade} />
                <div className={styles.descentVideoMist} />
                <div className={styles.descentVideoScanlines} />
              </div>

              <div className={styles.skyGlow} />
              <div className={styles.descentLensGlow} />
              <div className={styles.gridVeil} />

              <div className={styles.descentOverlayMap}>
                <Image
                  src="/images/retroville/retroville-hero-portal-bg.webp"
                  alt=""
                  fill
                  sizes="100vw"
                  className={styles.descentOverlayImage}
                />
              </div>

              <div className={styles.descentBottomPulse}>
                <Image
                  src="/images/retroville/retroville-central-plaza-concept.webp"
                  alt=""
                  fill
                  sizes="100vw"
                  className={styles.descentOverlayImage}
                />
              </div>

              <div className={styles.citySign}>
                <span className={displayFont.className}>RETROVILLE</span>
              </div>
            </div>

            <div className={styles.scrollCue}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </section>

        <section id="buyer-brief" className={styles.statementSection}>
          <div className={styles.statementHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Buyer brief</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                QUE UN BUYER ENTIENDA
                <br />
                QUÉ ESTÁ VIENDO
              </h2>
            </div>
            <div className={styles.statementAside}>
              <p className={styles.sectionLead}>
                {launchCopy} El objetivo ya no es solo impresionar: es explicar rápido qué se vende, qué existe hoy y
                cuál es el siguiente paso para seguir la conversación.
              </p>
              <div className={styles.statementActions}>
                <Link
                  href="/retroville/press"
                  className={styles.primaryButton}
                  onClick={() => trackStudioAction('open_press_kit', 'buyer_brief')}
                >
                  <FileText className="h-4 w-4" />
                  Abrir press kit
                </Link>
                <RetrovillePrivateDocumentButton
                  documentTitle="Biblia de serie · Vision general"
                  buttonLabel="Solicitar biblia"
                  className={styles.secondaryButton}
                />
                <a
                  href="#community"
                  className={styles.inlineLink}
                  onClick={() => trackStudioAction('save_reveal', 'buyer_brief')}
                >
                  <CalendarDays className="h-4 w-4" />
                  Guardar el reveal
                </a>
              </div>
            </div>
          </div>

          <div className={styles.signalGrid}>
            {overviewSignals.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className={styles.signalCard}>
                  <div className={styles.signalIcon}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className={`${displayFont.className} ${styles.signalTitle}`}>{item.title}</h3>
                  <p className={styles.signalBody}>{item.body}</p>
                </article>
              );
            })}
          </div>

          <div className={styles.buyerRouteGrid}>
            {buyerJourneyCards.map((card) => (
              <article key={card.step} className={styles.buyerRouteCard}>
                <p className={styles.buyerRouteStep}>{card.step}</p>
                <h3 className={`${displayFont.className} ${styles.buyerRouteTitle}`}>{card.title}</h3>
                <p className={styles.buyerRouteBody}>{card.body}</p>

                {card.type === 'private-document' ? (
                  <RetrovillePrivateDocumentButton
                    documentTitle="Biblia de serie · Vision general"
                    buttonLabel="Pedir acceso"
                    className={styles.buyerRouteButton}
                  />
                ) : null}

                {card.type === 'press-kit' ? (
                  <Link
                    href="/retroville/press"
                    className={styles.buyerRouteButton}
                    onClick={() => trackStudioAction('open_press_kit', 'buyer_route')}
                  >
                    Abrir press kit
                  </Link>
                ) : null}

                {card.type === 'event-signup' ? (
                  <a
                    href="#community"
                    className={styles.buyerRouteButton}
                    onClick={() => trackStudioAction('save_reveal', 'buyer_route')}
                  >
                    Ir al evento
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section id="cast" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Personajes principales</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                EL NÚCLEO YA TIENE
                <br />
                ORDEN DE PITCH
              </h2>
            </div>
            <div className={styles.sectionAside}>
              <p className={styles.sectionLead}>
                NOX, Luna y Button Crew quedan como primera línea clara, y el resto del universo sigue ordenado en la
                página completa de personajes.
              </p>
              <Link href="/retroville/personajes" className={styles.inlineLink}>
                Abrir fichas completas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className={styles.characterStack}>
            {retrovilleMainCharacters.map((character, index) => (
              <article
                key={character.name}
                className={`${styles.characterCard} ${index % 2 === 1 ? styles.characterCardReverse : ''}`}
              >
                <div className={styles.characterVisual}>
                  {character.image ? (
                    <Image
                      src={character.image}
                      alt={`Render principal de ${character.name}`}
                      fill
                      sizes="(max-width: 900px) 100vw, 42vw"
                      className={styles.characterImage}
                      priority={index === 0}
                    />
                  ) : null}
                </div>
                <div className={styles.characterCopy}>
                  <p className={styles.characterMeta}>Base · {character.inspiration}</p>
                  <h3 className={`${displayFont.className} ${styles.characterName}`}>{character.name}</h3>
                  <p className={styles.characterRole}>{character.role}</p>
                  <p className={styles.characterDescription}>{character.description}</p>
                  <div className={styles.characterChips}>
                    {character.chips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.supportLine}>
            {retrovilleSecondaryCharacters.slice(0, 6).map((character) => (
              <span key={character.name}>{character.name}</span>
            ))}
          </div>

          <div className={styles.guideShowcase}>
            {homeGuides.map((guide) => (
              <article key={guide.title} className={styles.guideShowcaseCard}>
                <div className={styles.guideShowcaseVisual}>
                  <Image
                    src={guide.image}
                    alt={guide.alt}
                    fill
                    sizes="(max-width: 720px) 80vw, 26rem"
                    className={styles.guideShowcaseImage}
                  />
                </div>
                <div className={styles.guideShowcaseCopy}>
                  <p className={styles.guideShowcaseMeta}>{guide.meta}</p>
                  <h3 className={styles.guideShowcaseTitle}>{guide.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="episodes" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Temporada 1</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                EPISODIOS CON GANCHO,
                <br />
                PERO SIN AMONTONARLO TODO
              </h2>
            </div>
            <div className={styles.sectionAside}>
              <p className={styles.sectionLead}>
                El home enseña la dirección. La página de episodios guarda la lectura completa de la T1 y deja la T2
                separada como incoming.
              </p>
              <Link href="/retroville/episodios" className={styles.inlineLink}>
                Ver los 10 episodios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className={styles.episodeGrid}>
            {homeEpisodes.map((episode) => (
              <article key={episode.number} className={styles.episodeCard}>
                <p className={styles.episodeNumber}>EP {String(episode.number).padStart(2, '0')}</p>
                <h3 className={`${displayFont.className} ${styles.episodeTitle}`}>{episode.title}</h3>
                <p className={styles.episodeBody}>{episode.description}</p>
                <div className={styles.episodeCast}>
                  {episode.characters.map((character) => (
                    <span key={character}>{character}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className={styles.episodeRail}>
            {retrovilleEpisodes.map((episode) => (
              <span key={episode.number}>
                {String(episode.number).padStart(2, '0')} · {episode.title}
              </span>
            ))}
          </div>
        </section>

        <section id="world" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Ciudad y worldbuilding</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                LA CIUDAD VUELVE A
                <br />
                EMPUJAR EL RELATO
              </h2>
            </div>
            <p className={styles.sectionLead}>
              El skyline y los barrios funcionan aquí como atmósfera y prueba de mundo, sin mezclar material más de
              proceso dentro del home.
            </p>
          </div>

          <div className={styles.worldGrid}>
            {districtCards.map((district) => (
              <article key={district.title} className={styles.worldCard}>
                <div className={styles.worldVisual}>
                  <Image
                    src={district.image}
                    alt={`Concept art de ${district.title} en Retroville`}
                    fill
                    sizes="(max-width: 900px) 100vw, 32vw"
                    className={styles.worldImage}
                  />
                </div>
                <div className={styles.worldCopy}>
                  <p className={styles.worldEyebrow}>Distrito clave</p>
                  <h3 className={`${displayFont.className} ${styles.worldTitle}`}>{district.title}</h3>
                  <p className={styles.worldBody}>{district.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="community" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Pulso de comunidad</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                GENTE, EVENTO Y
                <br />
                ACCIÓN CLARA
              </h2>
            </div>
            <p className={styles.sectionLead}>
              {showAudienceCount
                ? `${waitlistCount.toLocaleString('es-ES')} personas ya están dentro de la señal de Retroville.`
                : 'La comunidad todavía es temprana, pero el mensaje ya está claro: personajes fuertes, barrios, humor raro y reveal con identidad.'}
            </p>
          </div>

          <div className={styles.communityIntro}>
            <div className={styles.communityProfiles}>
              {communityProfiles.map((profile) => (
                <article key={profile.name} className={styles.communityCard}>
                  <div className={styles.communityAvatar}>
                    {profile.useInitialOnly ? (
                      <span className={styles.communityAvatarInitial}>{getCommunityInitials(profile.name)}</span>
                    ) : (
                      <Image
                        src={resolveCommunityPhoto(profile.photoOffset, waitlistCount)}
                        alt={`Avatar de perfil tipo comunidad para ${profile.name}`}
                        fill
                        sizes="72px"
                        className={styles.communityAvatarImage}
                      />
                    )}
                  </div>
                  <div>
                    <p className={styles.communityName}>{profile.name}</p>
                    <p className={styles.communityRole}>{profile.role}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.communityPanel}>
              <p className={styles.communityPanelEyebrow}>Evento guardable</p>
              <h3 className={`${displayFont.className} ${styles.communityPanelTitle}`}>APÚNTATE Y MÉTELO EN TU CALENDARIO</h3>
              <p className={styles.communityPanelBody}>
                La entrada ya no termina en un formulario suelto. Ahora la comunidad puede registrarse, guardar el
                reveal y quedarse dentro del siguiente drop desde el mismo bloque.
              </p>
            </div>
          </div>

          <RetrovilleEventSignupCard launchIso={launchIso} launchLabel={launchLabel} />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Materiales y navegación</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                MATERIAL PRIVADO,
                <br />
                CONTACTO CLARO Y RUTAS ORDENADAS
              </h2>
            </div>
            <p className={styles.sectionLead}>
              La biblia queda protegida, el press kit está a mano y el siguiente contacto comercial ya no depende de
              “buscar un correo” entre el ruido de la página.
            </p>
          </div>

          <div className={styles.materialsLayout}>
            <article className={styles.privateCard}>
              <p className={styles.privateEyebrow}>Documento privado</p>
              <h3 className={`${displayFont.className} ${styles.privateTitle}`}>BIBLIA BAJO SOLICITUD</h3>
              <p className={styles.privateBody}>
                La biblia de la serie ya no se descarga públicamente. Si alguien la quiere, se abre el popup y se pide
                directamente por correo.
              </p>
              <div className={styles.privateActions}>
                <RetrovillePrivateDocumentButton
                  documentTitle="Biblia de serie · Vision general"
                  buttonLabel="Solicitar biblia por email"
                  className={styles.primaryButton}
                />
                <a
                  href={contactMailto}
                  className={styles.secondaryButton}
                  onClick={() => trackStudioAction('email_pitch_contact', 'materials')}
                >
                  <Mail className="h-4 w-4" />
                  Hablar sobre pitch
                </a>
              </div>
              <p className={styles.privateNote}>Correo directo: flardop44@gmail.com para buyers, partners y prensa.</p>
            </article>

            <div className={styles.discoveryGrid}>
              {RETROVILLE_DISCOVERY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={styles.discoveryCard}
                  onClick={() => trackStudioAction('open_discovery_link', 'materials_grid', link.label)}
                >
                  <p className={styles.discoveryEyebrow}>{link.eyebrow}</p>
                  <h3 className={styles.discoveryTitle}>{link.label}</h3>
                  <p className={styles.discoveryBody}>{link.description}</p>
                </Link>
              ))}

              <Link
                href="/retroville/press"
                className={styles.discoveryCard}
                onClick={() => trackStudioAction('open_press_kit', 'materials_grid', 'Press kit')}
              >
                <p className={styles.discoveryEyebrow}>Material oficial</p>
                <h3 className={styles.discoveryTitle}>Press kit</h3>
                <p className={styles.discoveryBody}>Renders, logo, fact sheet y entrada oficial para enseñar la serie.</p>
              </Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerIntro}>
            <p className={styles.sectionEyebrow}>Canales oficiales</p>
            <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
              TODAS LAS REDES,
              <br />
              PERO BIEN COLOCADAS
            </h2>
          </div>

          <div className={styles.footerGrid}>
            {RETROVILLE_SOCIAL_CHANNELS.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                aria-label={channel.ariaLabel}
                className={styles.footerCard}
              >
                <p className={styles.footerEyebrow}>{channel.eyebrow}</p>
                <h3 className={styles.footerTitle}>{channel.label}</h3>
                <p className={styles.footerBody}>{channel.description}</p>
              </a>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
