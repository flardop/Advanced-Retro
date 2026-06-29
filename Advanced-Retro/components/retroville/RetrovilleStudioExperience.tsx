'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  FileText,
  Mail,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import RetrovilleAudienceProof from '@/components/retroville/RetrovilleAudienceProof';
import RetrovilleFandomShowcase from '@/components/retroville/RetrovilleFandomShowcase';
import RetrovillePrivateDocumentButton from '@/components/retroville/RetrovillePrivateDocumentButton';
import {
  RETROVILLE_PITCH_EMAIL,
  RETROVILLE_SOCIAL_CHANNELS,
  buildRetrovilleLaunchCopy,
  buildRetrovillePitchMailto,
} from '@/app/retroville/shared';
import { retrovilleEpisodes, retrovilleMainCharacters } from '@/app/retroville/content';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './retroville-studio.module.css';

const showcaseEpisodes = retrovilleEpisodes.slice(0, 3);

const districtCards = [
  {
    title: 'RAM District',
    body: 'Entrada al universo: vivienda, vecinos, fricción diaria y el tono de barrio donde NOX aterriza por primera vez.',
    image: '/images/retroville/retroville-stacked-housing-concept.png',
  },
  {
    title: 'Power Plaza',
    body: 'Centro social y visual de la ciudad. Pantallas, circulación y ruido público para vender escala y sistema urbano.',
    image: '/images/retroville/retroville-central-plaza-concept.webp',
  },
  {
    title: 'Bit Grave',
    body: 'La amenaza que endurece el universo. Hardware muerto, ruina y mitología debajo de la comedia.',
    image: '/images/retroville/retroville-bit-grave-concept.png',
  },
] as const;

const buyerBriefCards = [
  {
    icon: FileText,
    eyebrow: 'Público',
    title: 'Press kit listo',
    body: 'Home, cast principal, tres episodios de entrada y worldbuilding suficiente para entender la IP sin pedir más contexto.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Privado',
    title: 'Biblia bajo solicitud',
    body: 'La documentación sensible ya no queda expuesta en abierto: se pide por correo y se comparte de forma directa.',
  },
  {
    icon: Mail,
    eyebrow: 'Contacto',
    title: 'Siguiente paso claro',
    body: 'Buyers, partners y prensa encuentran un correo profesional y una ruta concreta para seguir la conversación.',
  },
] as const;

const footerLinks = [
  { label: 'Home', href: '/retroville' },
  { label: 'Personajes', href: '/retroville/personajes' },
  { label: 'Episodios', href: '/retroville/episodios' },
  { label: 'Presentación', href: '/retroville/presentaciones' },
  { label: 'Press', href: '/retroville/press' },
  { label: 'Legal', href: '/retroville/legal' },
] as const;

const topbarLinks = [
  { label: 'Visión', href: '#universe' },
  { label: 'Cast', href: '#cast' },
  { label: 'Temporada', href: '#episodes' },
  { label: 'Ciudad', href: '#world' },
  { label: 'Acceso', href: '#buyer-brief' },
  { label: 'Comunidad', href: '#community' },
] as const;

const retrovilleTheme = {
  '--rv-accent': '#8ad7ff',
  '--rv-accent-2': '#9b5cff',
  '--rv-red': '#c0392b',
  '--rv-gold': '#ffbf52',
  '--rv-green': '#57f0ae',
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

function createRevealDelay(index: number) {
  return { '--reveal-delay': `${index * 70}ms` } as CSSProperties;
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function RetrovilleStudioExperience(props: RetrovilleStudioExperienceProps) {
  const { launchIso, launchLabel, waitlistCount } = props;
  const cinematicRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const [cinematicProgress, setCinematicProgress] = useState(0);
  const launchCopy = buildRetrovilleLaunchCopy(launchLabel);
  const contactMailto = buildRetrovillePitchMailto({
    subject: 'Retroville · Pitch y materiales',
    body: [
      'Hola equipo de Retroville,',
      '',
      'Mi nombre es [escribe aquí tu nombre].',
      'Soy [cuéntanos quién eres, tu estudio, medio o proyecto].',
      'Me interesa conocer más sobre Retroville y recibir [pitch / press kit / biblia / materiales].',
      'Lo necesito porque [explica brevemente por qué].',
      '',
      'Gracias.',
    ].join('\n'),
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.innerWidth > 900) setMobileNavOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!introDismissed) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(styles.revealVisible);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [introDismissed]);

  useEffect(() => {
    if (!introDismissed) return;
    const section = cinematicRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVideoReady(true);
        setVideoActive(entry.isIntersecting);
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [introDismissed]);

  useEffect(() => {
    if (!introDismissed || typeof window === 'undefined') return;

    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      const section = cinematicRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const totalDistance = Math.max(rect.height + viewportHeight * 0.28, viewportHeight);
      const nextProgress = clampUnit((viewportHeight * 0.28 - rect.top) / totalDistance);

      setCinematicProgress((current) => (Math.abs(current - nextProgress) > 0.002 ? nextProgress : current));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [introDismissed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.playbackRate = 0.92;

    if (videoActive) {
      void video.play().catch(() => null);
      return;
    }

    video.pause();
  }, [videoActive, videoReady]);

  function trackStudioAction(action: string, location: string, label?: string) {
    if (typeof window === 'undefined') return;
    window.retrovilleTrack?.('retroville_buyer_cta_click', {
      action,
      location,
      ...(label ? { label } : {}),
    });
  }

  function handleIntroEnter() {
    if (introLeaving || introDismissed) return;
    if (typeof window !== 'undefined') {
      window.retrovilleTrack?.('retroville_intro_enter', {
        location: 'intro_gate',
      });
    }
    setIntroLeaving(true);
    window.setTimeout(() => setIntroDismissed(true), 420);
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  const videoScale = 1.14 - cinematicProgress * 0.14;
  const videoTranslateY = 34 - cinematicProgress * 72;
  const videoBlur = Math.max(0.4, 1.15 - cinematicProgress * 0.55);
  const videoSaturation = 0.95 + cinematicProgress * 0.06;
  const videoContrast = 1.01 + cinematicProgress * 0.04;
  const videoBrightness = 0.8 + cinematicProgress * 0.08;
  const copyTranslateY = 18 - cinematicProgress * 22;
  const copyOpacity = 0.88 + cinematicProgress * 0.12;
  const cinematicStep = cinematicProgress < 0.28 ? 0 : cinematicProgress < 0.62 ? 1 : 2;

  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}
      style={retrovilleTheme}
    >
      {!introDismissed ? (
        <div className={`${styles.introGate} ${introLeaving ? styles.introGateLeaving : ''}`}>
          <div className={styles.introAmbient} aria-hidden="true">
            <div className={styles.introGlowLeft} />
            <div className={styles.introGlowRight} />
            <div className={styles.introGrid} />
          </div>

          <div className={styles.introContent}>
            <Image
              src="/images/retroville/retroville-logo.webp"
              alt="Logo de Retroville"
              width={1536}
              height={1023}
              sizes="(max-width: 768px) 300px, 440px"
              className={styles.introLogo}
              priority
            />
            <p className={styles.introTagline}>Every forgotten game ends up somewhere.</p>
            <button type="button" className={styles.introCta} onClick={handleIntroEnter}>
              Entrar en Retroville
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.shell}>
        <section ref={cinematicRef} className={styles.cinematicSection} aria-label="Entrada cinematográfica de Retroville">
          <header className={styles.topbar}>
            <div className={styles.topbarPrimary}>
              <div className={styles.topbarBrand}>
                <Image
                  src="/images/retroville/retroville-logo.webp"
                  alt="Logo pequeño de Retroville"
                  width={160}
                  height={107}
                  sizes="64px"
                  className={styles.topbarBrandLogo}
                />
                <div className={styles.topbarBrandText}>
                  <p className={styles.topbarEyebrow}>Serie animada original</p>
                  <p className={styles.topbarTitle}>Retroville</p>
                  <p className={styles.topbarMeta}>Creada por AdvancedRetro</p>
                </div>
              </div>

              <button
                type="button"
                className={styles.mobileMenuToggle}
                aria-expanded={mobileNavOpen}
                aria-controls="retroville-mobile-nav"
                aria-label={mobileNavOpen ? 'Cerrar navegación de Retroville' : 'Abrir navegación de Retroville'}
                onClick={() => setMobileNavOpen((current) => !current)}
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>

            <div
              id="retroville-mobile-nav"
              className={`${styles.topbarPanel} ${mobileNavOpen ? styles.topbarPanelOpen : ''}`}
            >
              <nav className={styles.topbarNav} aria-label="Secciones principales de Retroville">
                {topbarLinks.map((link) => (
                  <a key={link.href} href={link.href} onClick={closeMobileNav}>
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className={styles.topbarActions}>
                <Link href="/retroville/press" className={styles.secondaryButton} onClick={closeMobileNav}>
                  Press kit
                </Link>
                <a href="#community" className={styles.primaryButton} onClick={closeMobileNav}>
                  Registrarme al reveal
                </a>
              </div>
            </div>
          </header>

          <div className={styles.cinematicFrame}>
            <video
              ref={videoRef}
              className={styles.cinematicVideo}
              muted
              loop
              playsInline
              preload="none"
              poster="/videos/retroville/retroville-city-approach-poster.jpg"
              aria-label="Aproximación cinematográfica a la ciudad de Retroville"
              style={{
                transform: `scale(${videoScale}) translate3d(0, ${videoTranslateY}px, 0)`,
                filter: `blur(${videoBlur}px) saturate(${videoSaturation}) contrast(${videoContrast}) brightness(${videoBrightness})`,
              }}
            >
              {videoReady ? (
                <source src="/videos/retroville/retroville-city-approach.mp4" type="video/mp4" />
              ) : null}
            </video>
            <div className={styles.cinematicShade} aria-hidden="true" />
            <div
              className={styles.cinematicCopy}
              style={{
                transform: `translate3d(0, ${copyTranslateY}px, 0)`,
                opacity: copyOpacity,
              }}
            >
              <p className={styles.cinematicEyebrow}>Ciudad viva</p>
              <p className={`${displayFont.className} ${styles.cinematicTitle}`}>
                La entrada al universo empieza aquí.
              </p>
              <p className={styles.cinematicBody}>
                La ciudad aparece primero. Después llegan el reparto, la temporada, el material comercial y la comunidad
                que quieres activar alrededor de la serie.
              </p>
              <div className={styles.cinematicActions}>
                <a href="#community" className={styles.cinematicButton}>
                  Registrarme al primer reveal
                </a>
                <Link
                  href="/retroville/press"
                  className={styles.cinematicGhostButton}
                  onClick={() => trackStudioAction('open_press_kit', 'cinematic_hero')}
                >
                  Abrir press kit
                </Link>
              </div>
              <div className={styles.cinematicTimeline} aria-label="Progreso de entrada a la ciudad">
                {['Skyline', 'Descenso', 'Street level'].map((label, index) => (
                  <span
                    key={label}
                    className={`${styles.cinematicTimelineStep} ${cinematicStep >= index ? styles.cinematicTimelineStepActive : ''}`}
                  >
                    {String(index + 1).padStart(2, '0')} {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="universe" className={styles.presentationSection}>
          <div className={styles.presentationCopy}>
            <p className={`${styles.sectionEyebrow} ${styles.revealItem}`} data-reveal>
              Pitch claro
            </p>
            <h1 className={`${displayFont.className} ${styles.presentationTitle} ${styles.revealItem}`} data-reveal style={createRevealDelay(1)}>
              UNA IP CLARA EN
              <br />
              DIEZ SEGUNDOS
            </h1>
            <p className={`${styles.presentationBody} ${styles.revealItem}`} data-reveal style={createRevealDelay(2)}>
              Retroville es una serie de animación original ambientada en una ciudad donde el hardware olvidado sigue
              vivo. Humor negro, vida de barrio y un universo con protagonistas, distritos y temporada ya presentables
              para pitch.
            </p>

            <div className={`${styles.presentationPills} ${styles.revealItem}`} data-reveal style={createRevealDelay(3)}>
              <span>Humor negro</span>
              <span>Vida de barrio</span>
              <span>Pitch-ready IP</span>
            </div>

            <div className={`${styles.presentationActions} ${styles.revealItem}`} data-reveal style={createRevealDelay(4)}>
              <Link
                href="/retroville/personajes"
                className={styles.primaryButton}
                onClick={() => trackStudioAction('open_cast', 'presentation')}
              >
                Ver personajes
              </Link>
              <Link
                href="/retroville/episodios"
                className={styles.secondaryButton}
                onClick={() => trackStudioAction('open_episodes', 'presentation')}
              >
                Ver episodios
              </Link>
            </div>
          </div>
        </section>

        <section id="cast" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.revealItem} data-reveal>
              <p className={styles.sectionEyebrow}>Tres protagonistas</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                NOX, LUNA Y
                <br />
                BUTTON CREW
              </h2>
            </div>
            <p className={`${styles.sectionLead} ${styles.revealItem}`} data-reveal style={createRevealDelay(1)}>
              El home deja solo el núcleo del proyecto: tres renders claros, tres roles distintos y cero material de
              proceso compitiendo con la venta de la serie.
            </p>
          </div>

          <div className={styles.characterGrid}>
            {retrovilleMainCharacters.map((character, index) => (
              <article
                key={character.name}
                className={`${styles.characterCard} ${styles.revealItem}`}
                data-reveal
                style={createRevealDelay(index)}
              >
                <div className={styles.characterVisual}>
                  {character.image ? (
                    <Image
                      src={character.image}
                      alt={`Render principal de ${character.name}`}
                      fill
                      sizes="(max-width: 900px) 100vw, 32vw"
                      className={styles.characterImage}
                      priority
                    />
                  ) : null}
                </div>
                <div className={styles.characterCopy}>
                  <p className={styles.characterMeta}>{character.role}</p>
                  <h3 className={`${displayFont.className} ${styles.characterName}`}>{character.name}</h3>
                  <p className={styles.characterBody}>{character.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={`${styles.sectionFooterLink} ${styles.revealItem}`} data-reveal>
            <Link
              href="/retroville/personajes"
              className={styles.inlineLink}
              onClick={() => trackStudioAction('open_cast', 'cast_footer')}
            >
              Ver el reparto completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section id="episodes" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.revealItem} data-reveal>
              <p className={styles.sectionEyebrow}>Hook de temporada</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                TRES EPISODIOS PARA
                <br />
                ENTRAR EN LA T1
              </h2>
            </div>
            <p className={`${styles.sectionLead} ${styles.revealItem}`} data-reveal style={createRevealDelay(1)}>
              Lo justo para entender la serie sin soltar la temporada entera en la portada.
            </p>
          </div>

          <div className={styles.episodeList}>
            {showcaseEpisodes.map((episode, index) => (
              <article
                key={episode.number}
                className={`${styles.episodeRow} ${styles.revealItem}`}
                data-reveal
                style={createRevealDelay(index)}
              >
                <div className={styles.episodeCode}>EP {String(episode.number).padStart(2, '0')}</div>
                <div className={styles.episodeCopy}>
                  <h3 className={`${displayFont.className} ${styles.episodeTitle}`}>{episode.title}</h3>
                  <p className={styles.episodeBody}>{episode.description}</p>
                </div>
                <div className={styles.episodeCast}>
                  {episode.characters.map((character) => (
                    <span key={character}>{character}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className={`${styles.sectionFooterLink} ${styles.revealItem}`} data-reveal>
            <Link
              href="/retroville/episodios"
              className={styles.inlineLink}
              onClick={() => trackStudioAction('open_episodes', 'episodes_footer')}
            >
              Ver los 10 episodios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section id="world" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.revealItem} data-reveal>
              <p className={styles.sectionEyebrow}>Tres distritos</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                LA CIUDAD TAMBIÉN
                <br />
                VENDE LA SERIE
              </h2>
            </div>
            <p className={`${styles.sectionLead} ${styles.revealItem}`} data-reveal style={createRevealDelay(1)}>
              RAM District, Power Plaza y Bit Grave bastan para enseñar barrio, escala y amenaza sin convertir la home
              en un archivo de proceso.
            </p>
          </div>

          <div className={styles.worldGrid}>
            {districtCards.map((district, index) => (
              <article
                key={district.title}
                className={`${styles.worldCard} ${styles.revealItem}`}
                data-reveal
                style={createRevealDelay(index)}
              >
                <div className={styles.worldVisual}>
                  <Image
                    src={district.image}
                    alt={`Concept art de ${district.title} en Retroville`}
                    fill
                    sizes="(max-width: 900px) 100vw, 33vw"
                    className={styles.worldImage}
                    loading="lazy"
                  />
                </div>
                <div className={styles.worldCopy}>
                  <p className={styles.worldEyebrow}>Worldbuilding clave</p>
                  <h3 className={`${displayFont.className} ${styles.worldTitle}`}>{district.title}</h3>
                  <p className={styles.worldBody}>{district.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={`${styles.sectionFooterLink} ${styles.revealItem}`} data-reveal>
            <Link
              href="/retroville/press"
              className={styles.inlineLink}
              onClick={() => trackStudioAction('open_worldbuilding_dossier', 'world_footer')}
            >
              Abrir dossier del mundo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section id="buyer-brief" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.revealItem} data-reveal>
              <p className={styles.sectionEyebrow}>Buyer brief</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                QUÉ EXISTE,
                <br />
                QUÉ SE PIDE Y A QUIÉN
              </h2>
            </div>
            <p className={`${styles.sectionLead} ${styles.revealItem}`} data-reveal style={createRevealDelay(1)}>
              {launchCopy} El siguiente paso ya no depende de adivinar qué material hay o a qué correo escribir.
            </p>
          </div>

          <div className={styles.buyerBriefGrid}>
            {buyerBriefCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={`${styles.buyerBriefCard} ${styles.revealItem}`}
                  data-reveal
                  style={createRevealDelay(index)}
                >
                  <div className={styles.buyerBriefIcon}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className={styles.buyerBriefEyebrow}>{card.eyebrow}</p>
                  <h3 className={`${displayFont.className} ${styles.buyerBriefTitle}`}>{card.title}</h3>
                  <p className={styles.buyerBriefBody}>{card.body}</p>
                </article>
              );
            })}
          </div>

          <div className={`${styles.buyerBriefActions} ${styles.revealItem}`} data-reveal>
            <Link
              href="/retroville/press"
              className={styles.primaryButton}
              onClick={() => trackStudioAction('open_press_kit', 'buyer_brief')}
            >
              <FileText className="h-4 w-4" />
              Abrir press kit
            </Link>
            <RetrovillePrivateDocumentButton
              documentTitle="Biblia de serie · Visión general"
              buttonLabel="Solicitar biblia"
              className={styles.secondaryButton}
            />
            <a
              href={contactMailto}
              className={styles.mailLink}
              onClick={() => trackStudioAction('email_pitch_contact', 'buyer_brief')}
            >
              <Mail className="h-4 w-4" />
              {RETROVILLE_PITCH_EMAIL}
            </a>
          </div>
        </section>

        <section id="community" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.revealItem} data-reveal>
              <p className={styles.sectionEyebrow}>Comunidad, fandom y reveal</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                SEÑALES, FANDOM
                <br />
                Y SIGUIENTE DROP
              </h2>
            </div>
            <p className={`${styles.sectionLead} ${styles.revealItem}`} data-reveal style={createRevealDelay(1)}>
              La comunidad no debería limitarse a un formulario. Aquí dejamos visible el fandom que puede nacer del
              proyecto, las publicaciones que le dan color fuera de la home y el registro real al reveal del {launchLabel}.
            </p>
          </div>

          <div className={styles.revealItem} data-reveal>
            <RetrovilleFandomShowcase />
          </div>

          <div className={styles.revealItem} data-reveal style={createRevealDelay(1)}>
            <RetrovilleAudienceProof
              waitlistCount={waitlistCount}
              launchIso={launchIso}
              launchLabel={launchLabel}
            />
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={`${styles.footerIntro} ${styles.revealItem}`} data-reveal>
            <p className={styles.sectionEyebrow}>Canales oficiales</p>
            <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
              REDES Y RUTAS
              <br />
              BIEN ORDENADAS
            </h2>
            <p className={styles.sectionLead}>
              Solo canales oficiales y páginas útiles para seguir el proyecto sin perderse en enlaces personales o
              material fuera de contexto.
            </p>
          </div>

          <div className={styles.footerLayout}>
            <div className={`${styles.footerLinks} ${styles.revealItem}`} data-reveal>
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className={styles.footerGrid}>
              {RETROVILLE_SOCIAL_CHANNELS.map((channel, index) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={channel.ariaLabel}
                  className={`${styles.footerCard} ${styles.revealItem}`}
                  data-reveal
                  style={createRevealDelay(index)}
                >
                  <p className={styles.footerEyebrow}>{channel.eyebrow}</p>
                  <h3 className={styles.footerTitle}>{channel.label}</h3>
                  <p className={styles.footerBody}>{channel.description}</p>
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
