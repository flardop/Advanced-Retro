import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import StructuredData from '@/components/StructuredData';
import RetrovillePrivateDocumentButton from '@/components/retroville/RetrovillePrivateDocumentButton';
import { buildRetrovilleSeriesJsonLd, RETROVILLE_PITCH_EMAIL } from '@/app/retroville/shared';
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildPageMetadata,
} from '@/lib/seo';
import {
  retrovilleBodyFont as bodyFont,
  retrovilleDisplayFont as displayFont,
  retrovilleMonoFont as monoFont,
} from '@/lib/retroville/fonts';
import styles from './episodios.module.css';

export const metadata: Metadata = buildPageMetadata({
  title: 'Episodios privados de Retroville | Acceso editorial',
  description:
    'Acceso editorial privado a los episodios de Retroville. La estructura completa de la temporada se solicita por correo para mantener la exclusividad del proyecto.',
  path: '/retroville/episodios',
  category: 'entertainment',
  noIndex: true,
  inheritBaseKeywords: false,
  keywords: [
    'episodios retroville',
    'acceso privado retroville',
    'temporada 1 retroville',
    'serie animada retroville',
    'dossier episodios retroville',
  ],
  image: '/images/retroville/retroville-street.png',
});

const lockedEpisodeSlots = Array.from({ length: 10 }, (_, index) => String(index + 1).padStart(2, '0'));

const privateHighlights = [
  'Sinopsis y beats por episodio',
  'Reparto implicado y continuidad',
  'Orden de escalada dramática de la temporada',
  'Notas de expansion y siguiente fase',
] as const;

export default function RetrovilleEpisodesPage() {
  const pageSchema = buildCollectionPageJsonLd({
    name: 'Acceso privado a episodios de Retroville',
    path: '/retroville/episodios',
    description:
      'Página oficial de acceso editorial privado a la estructura de episodios de Retroville.',
    image: '/images/retroville/retroville-street.png',
    about: ['Retroville', 'Acceso privado', 'Episodios', 'Serie original'],
  });

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Retroville', path: '/retroville' },
    { name: 'Episodios', path: '/retroville/episodios' },
  ]);

  const retrovilleSeriesSchema = buildRetrovilleSeriesJsonLd({
    path: '/retroville/episodios',
    description:
      'Acceso privado a la estructura de episodios de Retroville con solicitud directa por correo.',
    image: '/images/retroville/retroville-street.png',
    name: 'Acceso privado a episodios de Retroville',
  });

  return (
    <>
      <StructuredData
        id="retroville-episodes-schema"
        data={[pageSchema, retrovilleSeriesSchema, breadcrumbs]}
      />

      <main className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${styles.page}`}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <nav className={styles.nav} aria-label="Navegación episodios Retroville">
              <Link href="/retroville" className={styles.backLink}>
                <ArrowLeft className="h-4 w-4" />
                Volver a Retroville
              </Link>
              <div className={styles.heroLinks}>
                <Link href="/retroville/personajes">Personajes</Link>
                <Link href="/retroville/sketches">Sketchbook</Link>
              </div>
            </nav>

            <div className={styles.heroGrid}>
              <div>
                <p className={styles.eyebrow}>Acceso editorial</p>
                <h1 className={`${displayFont.className} ${styles.title}`}>
                  EPISODIOS
                  <br />
                  BAJO SOLICITUD
                </h1>
              </div>

              <div className={styles.heroPanel}>
                <p className={styles.heroLead}>
                  La estructura completa de la temporada ya no se muestra en abierto. La página funciona como acceso
                  exclusivo: enseña el tono, protege la informacion sensible y canaliza las solicitudes por correo.
                </p>
                <div className={styles.heroStatus}>
                  <LockKeyhole className="h-4 w-4" />
                  <span>Sinopsis, reparto y beats reservados para acceso privado</span>
                </div>
                <div className={styles.heroActions}>
                  <RetrovillePrivateDocumentButton
                    documentTitle="Dossier privado de episodios · Temporada 1"
                    buttonLabel="Pedir acceso"
                    className={styles.primaryAction}
                    eyebrowLabel="Acceso exclusivo"
                    dialogTitle="Solicitar acceso a episodios"
                    descriptionLead="La informacion completa de episodios ya no se comparte de forma pública."
                    mailButtonLabel="Solicitar acceso"
                  />
                  <Link href="/retroville/personajes" className={styles.inlineLink}>
                    Cruzar con el reparto
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <section className={styles.privateStage}>
            <div className={styles.timelineSection}>
              <div className={styles.sectionIntro}>
                <p className={styles.sectionEyebrow}>Season vault</p>
                <h2 className={`${displayFont.className} ${styles.sectionTitle}`}>TEMPORADA 1 CERRADA AL PUBLICO</h2>
                <p className={styles.sectionLead}>
                  La arquitectura sigue siendo visible como promesa de serie: diez episodios base, progresion real y un
                  avance de expansion. El detalle se desbloquea solo bajo solicitud.
                </p>
              </div>

              <div className={styles.timelineRail} aria-hidden="true">
                {lockedEpisodeSlots.map((slot) => (
                  <span key={slot}>{slot}</span>
                ))}
              </div>

              <div className={styles.lockedGrid}>
                {lockedEpisodeSlots.map((slot) => (
                  <article key={slot} className={styles.lockedCard}>
                    <div className={styles.cardHeader}>
                      <p className={styles.episodeCode}>EP {slot}</p>
                      <p className={styles.cardTag}>Reservado</p>
                    </div>
                    <h3 className={`${displayFont.className} ${styles.episodeTitle}`}>Contenido privado</h3>
                    <div className={styles.redactedStack} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className={styles.lockedBody}>
                      El titulo, la sinopsis y los personajes implicados se entregan solo dentro del dossier editorial.
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className={styles.accessPanel}>
              <p className={styles.accessEyebrow}>Solicitud privada</p>
              <h2 className={`${displayFont.className} ${styles.accessTitle}`}>EXCLUSIVIDAD QUE SE PIDE, NO QUE SE FILTRA</h2>
              <p className={styles.accessBody}>
                Si alguien quiere valorar la temporada con contexto real, se le comparte el material de forma directa.
                Asi mantienes control del universo, del tono y del momento en el que enseñas cada giro.
              </p>

              <div className={styles.infoList}>
                {privateHighlights.map((item) => (
                  <div key={item} className={styles.infoRow}>
                    <EyeOff className="h-4 w-4" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className={styles.requestCard}>
                <div className={styles.requestHeader}>
                  <Mail className="h-4 w-4" />
                  <span>Solicitud a {RETROVILLE_PITCH_EMAIL}</span>
                </div>
                <p className={styles.requestBody}>
                  El acceso sirve para presentar la temporada con orden, proteger la narrativa y decidir a quién se le
                  enseña el material completo.
                </p>
                <RetrovillePrivateDocumentButton
                  documentTitle="Dossier privado de episodios · Temporada 1"
                  buttonLabel="Solicitar dossier"
                  className={styles.secondaryAction}
                  eyebrowLabel="Acceso exclusivo"
                  dialogTitle="Solicitar dossier de episodios"
                  descriptionLead="La estructura de la temporada se comparte solo bajo peticion directa."
                  mailButtonLabel="Pedir dossier"
                />
              </div>
            </aside>
          </section>

          <section className={styles.incomingSection}>
            <div className={styles.incomingCard}>
              <p className={styles.incomingEyebrow}>Material incluido</p>
              <h2 className={`${displayFont.className} ${styles.incomingTitle}`}>
                TEMPORADA 1, HOOKS Y SIGUIENTE FASE EN UNA SOLA ENTREGA
              </h2>
              <p className={styles.incomingBody}>
                Quien pide acceso recibe una lectura más seria del proyecto: la base de la primera temporada, el reparto
                implicado por bloque y la forma en la que el universo puede seguir creciendo sin romper el misterio.
              </p>
              <div className={styles.highlightGrid}>
                {privateHighlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
