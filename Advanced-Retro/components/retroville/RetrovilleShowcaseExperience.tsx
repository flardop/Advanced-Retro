'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Map,
  Play,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react';
import RetrovilleAudienceProof from '@/components/retroville/RetrovilleAudienceProof';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovillePrivateDocumentButton from '@/components/retroville/RetrovillePrivateDocumentButton';
import RetrovilleProductionDesk from '@/components/retroville/RetrovilleProductionDesk';
import {
  RETROVILLE_NEWSLETTER_NAME,
  RETROVILLE_SOCIAL_CHANNELS,
  buildRetrovilleLaunchCopy,
  buildRetrovilleWaitlistBenefits,
  shouldShowRetrovilleSignupCount,
} from '@/app/retroville/shared';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './retroville-showcase.module.css';

const storySignals = [
  {
    icon: Sparkles,
    title: 'Tono con firma propia',
    body: 'Comedia negra, vida de barrio y una identidad visual que no parece un clon genérico de animación retro.',
  },
  {
    icon: Users,
    title: 'Reparto reconocible',
    body: 'NOX, Luna y Button Crew ya pueden vender conflicto, química y personalidad desde la primera imagen.',
  },
  {
    icon: Map,
    title: 'Ciudad con sistema',
    body: 'Distritos, transporte, lugares y reglas internas que convierten a Retroville en un mundo, no en un decorado.',
  },
] as const;

const featuredCast = [
  {
    name: 'NOX',
    label: 'Console Core',
    role: 'El núcleo se sostiene sobre alguien que ya no tiene paciencia para salvar nada.',
    body: 'NOX es el ancla emocional del universo: cansado, seco y perfecto para liderar una serie que mezcla ternura rara con humor oscuro.',
    image: '/images/retroville/nox-character-large.webp',
    accent: 'var(--rv-cyan)',
  },
  {
    name: 'LUNA',
    label: 'Top Slot',
    role: 'Encanto, sabotaje emocional y la clase de presencia que transforma cualquier escena.',
    body: 'Luna mete glamour tóxico, tensión y magnetismo. Es el tipo de personaje que da promos, clips y conversación inmediata.',
    image: '/images/retroville/luna-character-large.webp',
    accent: '#f38eb7',
  },
  {
    name: 'BUTTON CREW',
    label: 'Power Plaza',
    role: 'Caos colectivo con carisma, ruido y vocación de convertir cada frame en meme.',
    body: 'Button Crew hace que el universo respire como comunidad viva: disturbio, humor y energía social dentro de la ciudad.',
    image: '/images/retroville/button-crew-character-large.webp',
    accent: 'var(--rv-gold)',
  },
] as const;

const supportCast = ['Nora', 'Trimp', 'Mayor Tube', 'Pipo', 'Nano', 'Public Crew', 'Mia', 'Joy & Grump'] as const;

const worldHighlights = [
  {
    title: 'Power Plaza',
    eyebrow: 'Vida pública',
    body: 'Pantallas, cruces, ruido y anuncios. El centro civil donde la ciudad se comporta como un personaje más.',
    image: '/images/retroville/retroville-central-plaza-concept.webp',
  },
  {
    title: 'Bit Grave',
    eyebrow: 'Mito urbano',
    body: 'El cementerio de hardware olvidado: uno de los espacios con más personalidad visual para vender lore y tono.',
    image: '/images/retroville/retroville-bit-grave-concept.png',
  },
  {
    title: 'Top Slot',
    eyebrow: 'Noche y conflicto',
    body: 'Club, ruido social y decisiones malas después de medianoche. El lado elegante y peligroso del universo.',
    image: '/images/retroville/retroville-club-concept.png',
  },
] as const;

const quickNav = [
  { label: 'Serie', href: '#serie' },
  { label: 'Cast', href: '#cast' },
  { label: 'Mundo', href: '#mundo' },
  { label: 'Pitch', href: '#pitch' },
  { label: 'Comunidad', href: '#comunidad' },
] as const;

const heroInsidePoints = [
  '14+ personajes con renders y roles claros.',
  'Masterplan de ciudad con distritos y sistema social.',
  'Sketchbook activo con proceso y traduccion visual.',
] as const;

type RetrovilleShowcaseExperienceProps = {
  launchIso: string;
  launchLabel: string;
  waitlistCount: number;
};

export default function RetrovilleShowcaseExperience({
  launchIso,
  launchLabel,
  waitlistCount,
}: RetrovilleShowcaseExperienceProps) {
  const launchCopy = buildRetrovilleLaunchCopy(launchLabel);
  const waitlistBenefits = buildRetrovilleWaitlistBenefits(launchLabel);
  const showAudienceCount = shouldShowRetrovilleSignupCount(waitlistCount);
  const socialHighlights = RETROVILLE_SOCIAL_CHANNELS.slice(0, 4);

  return (
    <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}>
      <div className={styles.backdrop} aria-hidden="true" />

      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topbarLabel}>Universo original de AdvancedRetro</p>
            <p className={styles.topbarMeta}>Serie animada en desarrollo</p>
          </div>

          <nav className={styles.topbarNav} aria-label="Secciones de Retroville">
            {quickNav.map((item) => (
              <a key={item.href} href={item.href} className={styles.topbarLink}>
                {item.label}
              </a>
            ))}
          </nav>

          <Link href="/" className={styles.homeLink}>
            Volver a AdvancedRetro
          </Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroShowcase}>
            <div className={styles.heroScene} aria-hidden="true">
              <Image
                src="/images/retroville/retroville-hero-portal-bg.webp"
                alt=""
                fill
                sizes="100vw"
                className={styles.heroPortal}
                priority
              />
              <div className={styles.heroSceneOverlay} />
              <Image
                src="/images/retroville/nox-push.webp"
                alt=""
                width={720}
                height={960}
                sizes="(max-width: 959px) 52vw, 32vw"
                className={styles.heroNox}
                priority
              />
              <Image
                src="/images/retroville/button-crew-push.webp"
                alt=""
                width={720}
                height={960}
                sizes="(max-width: 959px) 60vw, 36vw"
                className={styles.heroCrew}
                priority
              />
            </div>

            <div className={styles.heroContent}>
              <div className={styles.heroEyebrowRow}>
                <span className={styles.eyebrow}>AdvancedRetro&apos;s original universe</span>
                <span className={styles.signalPill}>
                  <Radio className="h-3.5 w-3.5" />
                  Primer reveal {launchLabel}
                </span>
              </div>

              <div className={styles.heroLogoWrap}>
                <Image
                  src="/images/retroville/retroville-logo.webp"
                  alt="Logo de Retroville"
                  width={420}
                  height={246}
                  sizes="(max-width: 639px) 72vw, 320px"
                  className={styles.heroLogo}
                />
              </div>

              <p className={styles.heroTagline}>Every forgotten game ends up somewhere.</p>

              <h1 className={`${displayFont.className} ${styles.heroTitle}`}>
                Una serie original con barrio, caos y humor oscuro.
              </h1>

              <p className={styles.heroLead}>
                Retroville es una serie animada original ambientada en una ciudad construida con hardware abandonado.
                NOX, Luna y Button Crew viven en un universo con barrios, facciones y una personalidad visual que tiene
                que sentirse como serie, no como una web genérica.
              </p>

              <div className={styles.heroActions}>
                <a href="#serie" className={styles.primaryCta}>
                  <Play className="h-4 w-4" />
                  Entrar en Retroville
                </a>
                <a href="#comunidad" className={styles.secondaryCta}>
                  <CalendarDays className="h-4 w-4" />
                  Ir a la newsletter
                </a>
                <RetrovillePrivateDocumentButton
                  documentTitle="Biblia de serie · Vision general"
                  buttonLabel="Solicitar biblia"
                  className={styles.ghostCta}
                />
              </div>

              <div className={styles.socialRow}>
                {socialHighlights.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.ariaLabel}
                    className={styles.socialPill}
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>

            <div className={styles.heroCardDeck}>
              <article className={styles.heroInfoCard}>
                <p className={styles.cardEyebrow}>What&apos;s already inside</p>
                <h2 className={`${displayFont.className} ${styles.heroCardTitle}`}>UNIVERSO YA PRESENTABLE</h2>
                <div className={styles.heroCardList}>
                  {heroInsidePoints.map((point) => (
                    <p key={point} className={styles.heroCardBody}>
                      {point}
                    </p>
                  ))}
                </div>
              </article>

              <article className={styles.heroInfoCard}>
                <p className={styles.cardEyebrow}>{launchLabel}</p>
                <h2 className={`${displayFont.className} ${styles.heroCardTitle}`}>FIRST PUBLIC REVEAL</h2>
                <p className={styles.heroCardBody}>{launchCopy}</p>
                <div className={styles.heroCountdownWrap}>
                  <RetrovilleCountdown targetIso={launchIso} />
                </div>
              </article>

              <article className={styles.heroInfoCard}>
                <p className={styles.cardEyebrow}>Newsletter with real usefulness</p>
                <h2 className={`${displayFont.className} ${styles.heroCardTitle}`}>SEÑAL DIRECTA DE LA SERIE</h2>
                <p className={styles.heroCardBody}>
                  {showAudienceCount ? `${waitlistCount.toLocaleString('es-ES')} personas ya dentro.` : 'Newsletter activa para el primer drop.'}
                </p>
                <div className={styles.heroCardList}>
                  {waitlistBenefits.slice(0, 3).map((benefit) => (
                    <p key={benefit} className={styles.heroCardBody}>
                      {benefit}
                    </p>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="serie" className={styles.statementBand}>
          <p className={styles.statementEyebrow}>Every forgotten game ends up somewhere.</p>
          <p className={styles.statementText}>
            Retroville funciona mejor cuando se presenta como serie: un mundo vivo, personajes que se reconocen al instante
            y una estética con la que puedes lanzar reveal, dossier, vídeo, comunidad y materiales de venta sin pedir perdón.
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Qué estamos vendiendo</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>
                UNA PROPIEDAD CREATIVA, NO SOLO UNA LANDING
              </h2>
            </div>
            <p className={styles.sectionLead}>
              La clave era simplificar la experiencia para que el visitante entienda rápido qué hace especial a Retroville y por qué merece seguirlo.
            </p>
          </div>

          <div className={styles.signalGrid}>
            {storySignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <article key={signal.title} className={styles.signalCard}>
                  <div className={styles.signalIcon}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className={`${displayFont.className} ${styles.signalTitle}`}>{signal.title}</h3>
                  <p className={styles.signalBody}>{signal.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="cast" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Cast principal</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>PERSONAJES QUE YA PUEDEN LIDERAR LA SERIE</h2>
            </div>
            <div className={styles.sectionAside}>
              <p className={styles.sectionLead}>
                El reparto ya sostiene tono, promoción y conflicto. Aquí está la lectura rápida de las tres caras que mejor venden el universo.
              </p>
              <Link href="/retroville/personajes" className={styles.inlineLink}>
                Ver reparto completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className={styles.castGrid}>
            {featuredCast.map((character) => (
              <article key={character.name} className={styles.castCard} style={{ '--cast-accent': character.accent } as CSSProperties}>
                <div className={styles.castPortrait}>
                  <Image
                    src={character.image}
                    alt={`Render principal de ${character.name}`}
                    fill
                    sizes="(max-width: 960px) 100vw, 30vw"
                    className={styles.castImage}
                  />
                </div>
                <div className={styles.castCopy}>
                  <span className={styles.castLabel}>{character.label}</span>
                  <h3 className={`${displayFont.className} ${styles.castName}`}>{character.name}</h3>
                  <p className={styles.castRole}>{character.role}</p>
                  <p className={styles.castBody}>{character.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.supportStrip}>
            {supportCast.map((name) => (
              <span key={name} className={styles.supportPill}>
                {name}
              </span>
            ))}
          </div>
        </section>

        <section id="mundo" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Worldbuilding</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>UNA CIUDAD QUE TAMBIÉN VENDE LA SERIE</h2>
            </div>
            <p className={styles.sectionLead}>
              Retroville gana cuando enseña barrios, movilidad, ruido social y arquitectura. El mundo no acompaña: empuja el relato.
            </p>
          </div>

          <div className={styles.worldGrid}>
            <article className={styles.worldFeature}>
              <div className={styles.worldFeatureImage}>
                <Image
                  src="/images/retroville/retroville-street.png"
                  alt="Vista atmosférica de una calle principal de Retroville"
                  fill
                  sizes="(max-width: 960px) 100vw, 50vw"
                  className={styles.worldImage}
                />
              </div>
              <div className={styles.worldFeatureOverlay} />
              <div className={styles.worldFeatureCopy}>
                <p className={styles.worldEyebrow}>Ciudad en pantalla</p>
                <h3 className={`${displayFont.className} ${styles.worldTitle}`}>EL UNIVERSO YA TIENE POSTALES PROPIAS</h3>
                <p className={styles.worldBody}>
                  Calles, skyline, noche, transporte y cultura visual suficiente para que cada pieza de Retroville se reconozca sin explicación previa.
                </p>
                <Link href="/retroville/sketches" className={styles.inlineLink}>
                  Abrir sketchbook
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>

            <div className={styles.worldStack}>
              {worldHighlights.map((item) => (
                <article key={item.title} className={styles.worldCard}>
                  <div className={styles.worldThumb}>
                    <Image
                      src={item.image}
                      alt={`Concept art de ${item.title}`}
                      fill
                      sizes="(max-width: 960px) 100vw, 22vw"
                      className={styles.worldThumbImage}
                    />
                  </div>
                  <div className={styles.worldCardCopy}>
                    <p className={styles.worldEyebrow}>{item.eyebrow}</p>
                    <h3 className={`${displayFont.className} ${styles.worldCardTitle}`}>{item.title}</h3>
                    <p className={styles.worldCardBody}>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pitch" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Material de venta</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>UN DESK MÁS CLARO PARA ENSEÑAR EL PROYECTO</h2>
            </div>
            <p className={styles.sectionLead}>
              He mantenido la lógica útil del proyecto y la he puesto dentro de una estructura más limpia para pitch, partners y comunidad.
            </p>
          </div>

          <div className={styles.deskWrap}>
            <RetrovilleProductionDesk mode="desktop" />
          </div>
        </section>

        <section id="comunidad" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Comunidad y conversión</p>
              <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>LA SEÑAL DE RETROVILLE YA PUEDE CAPTAR GENTE</h2>
            </div>
            <p className={styles.sectionLead}>
              El cierre tenía que dejar de ser ruido y pasar a ser una invitación clara: seguir la serie, guardar el reveal y entrar en el siguiente drop.
            </p>
          </div>

          <div className={styles.communityWrap}>
            <RetrovilleAudienceProof waitlistCount={waitlistCount} launchIso={launchIso} launchLabel={launchLabel} />
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerIntro}>
            <p className={styles.eyebrow}>Canales oficiales</p>
            <h2 className={`${displayFont.className} ${styles.footerTitle}`}>DONDE SEGUIR RETROVILLE SIN PERDERTE</h2>
            <p className={styles.footerLead}>
              {RETROVILLE_NEWSLETTER_NAME}, redes, material de presentación y páginas de contenido ya están ordenadas para acompañar el crecimiento de la serie.
            </p>
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
                <p className={styles.footerCardEyebrow}>{channel.eyebrow}</p>
                <h3 className={styles.footerCardTitle}>{channel.label}</h3>
                <p className={styles.footerCardBody}>{channel.description}</p>
              </a>
            ))}

            <Link href="/retroville/press" className={styles.footerCard}>
              <p className={styles.footerCardEyebrow}>Medios</p>
              <h3 className={styles.footerCardTitle}>Press kit</h3>
              <p className={styles.footerCardBody}>Fact sheet, materiales oficiales y punto de entrada para partners o prensa.</p>
            </Link>

            <Link href="/retroville/presentaciones" className={styles.footerCard}>
              <p className={styles.footerCardEyebrow}>Pitch</p>
              <h3 className={styles.footerCardTitle}>Presentación</h3>
              <p className={styles.footerCardBody}>La versión rápida para enseñar el proyecto de un vistazo y sin fricción.</p>
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
