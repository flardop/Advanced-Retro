'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  FileText,
  Mail,
  ShieldCheck,
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

export default function RetrovilleStudioExperience(props: RetrovilleStudioExperienceProps) {
  const { launchIso, launchLabel, waitlistCount } = props;
  const cinematicRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const launchCopy = buildRetrovilleLaunchCopy(launchLabel);
  const contactMailto = buildRetrovillePitchMailto({
    subject: 'Retroville · Pitch y materiales',
    body: 'Hola equipo de Retroville,\n\nMe interesa conocer más sobre Retroville y sus materiales de pitch.\n\nGracias.',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem('retroville-intro-seen') === '1') {
      setIntroDismissed(true);
    }
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
      window.sessionStorage.setItem('retroville-intro-seen', '1');
      window.retrovilleTrack?.('retroville_intro_enter', {
        location: 'intro_gate',
      });
    }
    setIntroLeaving(true);
    window.setTimeout(() => setIntroDismissed(true), 420);
  }

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
          <div className={styles.cinematicFrame}>
            <header className={styles.topbar}>
              <div className={styles.topbarBrand}>
                <div>
                  <p className={styles.topbarEyebrow}>Serie animada original</p>
                  <p className={styles.topbarTitle}>Retroville</p>
                </div>
                <p className={styles.topbarMeta}>Creada por AdvancedRetro</p>
              </div>

              <nav className={styles.topbarNav} aria-label="Secciones principales de Retroville">
                <a href="#universe">Visión</a>
                <a href="#cast">Cast</a>
                <a href="#episodes">Temporada</a>
                <a href="#world">Ciudad</a>
                <a href="#buyer-brief">Acceso</a>
                <a href="#community">Comunidad</a>
              </nav>

              <div className={styles.topbarActions}>
                <Link href="/retroville/press" className={styles.secondaryButton}>
                  Press kit
                </Link>
                <a href="#community" className={styles.primaryButton}>
                  Guardar reveal
                </a>
              </div>
            </header>

            <video
              ref={videoRef}
              className={styles.cinematicVideo}
              muted
              loop
              playsInline
              preload="none"
              poster="/videos/retroville/retroville-city-approach-poster.jpg"
              aria-label="Aproximación cinematográfica a la ciudad de Retroville"
            >
              {videoReady ? (
                <source src="/videos/retroville/retroville-city-approach.mp4" type="video/mp4" />
              ) : null}
            </video>
            <div className={styles.cinematicShade} aria-hidden="true" />
            <div className={styles.cinematicCopy}>
              <p className={styles.cinematicEyebrow}>Ciudad viva</p>
              <p className={`${displayFont.className} ${styles.cinematicTitle}`}>La entrada al universo empieza aquí.</p>
              <p className={styles.cinematicBody}>
                La ciudad aparece primero. Después llegan el reparto, la temporada, el material comercial y la comunidad
                que quieres activar alrededor de la serie.
              </p>
            </div>
          </div>
        </section>

        <section id="universe" className={`${styles.presentationSection} ${styles.revealItem}`} data-reveal>
          <div className={styles.presentationCopy}>
            <p className={styles.sectionEyebrow}>Pitch claro</p>
            <h1 className={`${displayFont.className} ${styles.presentationTitle}`}>
              UNA IP CLARA EN
              <br />
              DIEZ SEGUNDOS
            </h1>
            <p className={styles.presentationBody}>
              Retroville es una serie de animación original ambientada en una ciudad donde el hardware olvidado sigue
              vivo. Humor negro, vida de barrio y un universo con protagonistas, distritos y temporada ya presentables
              para pitch.
            </p>

            <div className={styles.presentationPills}>
              <span>Humor negro</span>
              <span>Vida de barrio</span>
              <span>Pitch-ready IP</span>
            </div>

            <div className={styles.presentationActions}>
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
          <div className={`${styles.sectionHeader} ${styles.revealItem}`} data-reveal>
            <div>
              <p className={styles.sectionEyebrow}>Tres protagonistas</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                NOX, LUNA Y
                <br />
                BUTTON CREW
              </h2>
            </div>
            <p className={styles.sectionLead}>
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
          <div className={`${styles.sectionHeader} ${styles.revealItem}`} data-reveal>
            <div>
              <p className={styles.sectionEyebrow}>Hook de temporada</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                TRES EPISODIOS PARA
                <br />
                ENTRAR EN LA T1
              </h2>
            </div>
            <p className={styles.sectionLead}>
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
          <div className={`${styles.sectionHeader} ${styles.revealItem}`} data-reveal>
            <div>
              <p className={styles.sectionEyebrow}>Tres distritos</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                LA CIUDAD TAMBIÉN
                <br />
                VENDE LA SERIE
              </h2>
            </div>
            <p className={styles.sectionLead}>
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
          <div className={`${styles.sectionHeader} ${styles.revealItem}`} data-reveal>
            <div>
              <p className={styles.sectionEyebrow}>Buyer brief</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                QUÉ EXISTE,
                <br />
                QUÉ SE PIDE Y A QUIÉN
              </h2>
            </div>
            <p className={styles.sectionLead}>
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
          <div className={`${styles.sectionHeader} ${styles.revealItem}`} data-reveal>
            <div>
              <p className={styles.sectionEyebrow}>Comunidad, fandom y reveal</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                SEÑALES, FANDOM
                <br />
                Y SIGUIENTE DROP
              </h2>
            </div>
            <p className={styles.sectionLead}>
              La comunidad no debería limitarse a un formulario. Aquí dejamos visible el fandom que puede nacer del
              proyecto, las publicaciones que le dan color fuera de la home y el acceso real al reveal del {launchLabel}.
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
