'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Anton, Space_Mono } from 'next/font/google';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import styles from './retroville-experience.module.css';

const displayFont = Anton({ subsets: ['latin'], weight: '400' });
const monoFont = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

const characterFeatures = [
  {
    title: 'NOX',
    eyebrow: 'EL SOBREVIVIENTE CANSADO',
    body: 'Sarcasmo, batería baja y una dignidad muy discutible. NOX no lidera Retroville porque quiera. Lo hace porque nadie más sigue en pie a esa hora.',
    image: '/images/retroville/retroville-wave.png',
    alt: 'NOX saludando dentro del universo Retroville',
  },
  {
    title: 'BUTTON CREW',
    eyebrow: 'LOS QUE SIGUEN PULSANDO',
    body: 'A, B, Y y X son el ruido social de la ciudad: impulsivos, pesimistas, caóticos y analíticos al mismo tiempo. Siempre llegan juntos. Siempre empeoran algo.',
    image: '/images/retroville/retroville-button-crew-studio.png',
    alt: 'Button Crew en formación dentro del universo Retroville',
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
    body: 'La comedia oscura del universo también sabe convertirse en estatua, tragedia y caos absoluto a la vez.',
    image: '/images/retroville/retroville-marble.png',
    alt: 'Escultura de mármol con NOX y Button Crew atrapados por serpientes',
  },
  {
    title: 'The Last Save',
    eyebrow: 'ARCHIVO 04',
    body: 'Todo grupo termina reuniéndose alrededor de una mesa. En Retroville, esa cena siempre es una discusión sobre memoria, control y supervivencia.',
    image: '/images/retroville/retroville-last-supper.png',
    alt: 'Escena inspirada en la última cena con NOX y Button Crew',
  },
] as const;

const signalCards = [
  {
    title: 'WORLD BUILDING',
    body: 'Una ciudad hecha de arcades rotos, residuos de firmware y recuerdos guardados en cartuchos que nadie volvió a tocar.',
  },
  {
    title: 'DROPS NARRATIVOS',
    body: 'Cada reveal debe sentirse como un evento cultural: una imagen, una frase, un personaje, una señal que da ganas de quedarse.',
  },
  {
    title: 'RETRO SOCIAL CHAOS',
    body: 'Comunidad, personajes, torneos y humor existencial convivirán en la misma frecuencia visual y emocional.',
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
  const hypeGoal = 5000;
  const hypePct = waitlistCount > 0 ? clamp(waitlistCount / hypeGoal, 0, 1) : 0;

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => {
        node.dataset.visible = 'true';
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-visible', 'true');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <main className={`${monoFont.className} bg-[var(--rv-bg)] text-[var(--rv-text)]`}>
      <section className="relative overflow-hidden px-4 pb-14 pt-8 sm:px-8 lg:px-10">
        <div className={`absolute inset-0 ${styles.heroNoise}`} />
        <div className={styles.scanlines} />
        <div className="absolute left-[-8%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(155,107,255,0.18),transparent_68%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(138,215,255,0.15),transparent_70%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-[28rem] bg-[radial-gradient(circle_at_50%_100%,rgba(242,187,116,0.16),transparent_54%)]" />

        <div className="relative mx-auto max-w-[1540px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,16,0.9),rgba(5,6,10,0.98))] shadow-[0_40px_140px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(155,107,255,0.14),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(138,215,255,0.10),transparent_30%)]" />

          <div className="relative flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">
              Universo original de AdvancedRetro
            </p>
            <Link
              href="/"
              className="rounded-full border border-white/12 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/68 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              Volver a AdvancedRetro
            </Link>
          </div>

          <div className="relative grid gap-8 px-5 pb-8 pt-2 sm:px-8 lg:grid-cols-[minmax(0,0.28fr)_minmax(0,0.44fr)_minmax(0,0.28fr)] lg:items-end lg:gap-4 lg:px-10 lg:pb-10">
            <div className="hidden lg:block">
              <div className={`${styles.characterPanel} ${styles.characterPanelLeft}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_45%,rgba(138,215,255,0.20),transparent_38%),linear-gradient(180deg,rgba(10,16,30,0.25),rgba(3,4,8,0.88))]" />
                <div className={`${styles.floatSlow} absolute inset-0`}>
                  <Image
                    src="/images/retroville/retroville-wave.png"
                    alt="NOX saludando"
                    fill
                    priority
                    sizes="28vw"
                    className="object-contain object-bottom-left"
                  />
                </div>
              </div>
            </div>

            <div className="relative z-10 py-4 text-center lg:pb-8 lg:pt-12">
              <div
                data-reveal
                className={`${styles.reveal} mx-auto inline-flex rounded-full border border-[rgba(155,107,255,0.35)] bg-[rgba(155,107,255,0.10)] px-4 py-2 text-[11px] uppercase tracking-[0.34em] text-white/78`}
              >
                Dark comedy animated universe
              </div>

              <h1
                data-reveal
                className={`${displayFont.className} ${styles.reveal} ${styles.heroTitle} mt-6 text-[3.8rem] uppercase leading-[0.86] text-white sm:text-[5.4rem] lg:text-[7.4rem] xl:text-[8.4rem]`}
              >
                RETROVILLE
              </h1>

              <p
                data-reveal
                className={`${styles.reveal} mx-auto mt-5 max-w-[18ch] text-2xl font-semibold leading-tight text-white sm:text-[2rem] lg:text-[2.2rem]`}
              >
                Every forgotten game ends up somewhere.
              </p>

              <p
                data-reveal
                className={`${styles.reveal} mx-auto mt-5 max-w-[39rem] text-sm leading-8 text-white/62 sm:text-base`}
              >
                Una ciudad oculta donde mandos rotos, consolas olvidadas, partidas corruptas y
                memorias digitales aprenden a seguir existiendo cuando el mundo real las abandona.
              </p>

              <div
                data-reveal
                className={`${styles.reveal} mt-8 flex flex-wrap justify-center gap-3`}
              >
                <Link
                  href="#waitlist"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--rv-accent2),var(--rv-accent))] px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(138,215,255,0.18)] transition hover:brightness-110"
                >
                  Enter Retroville
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div data-reveal className={`${styles.reveal} mt-6`}>
                <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-white/42">
                  Ventana de lanzamiento objetivo · {launchLabel}
                </p>
                <RetrovilleCountdown targetIso={launchIso} className="mx-auto max-w-[38rem]" />
              </div>
            </div>

            <div className="hidden lg:block">
              <div className={`${styles.characterPanel} ${styles.characterPanelRight}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_38%,rgba(242,187,116,0.16),transparent_34%),linear-gradient(180deg,rgba(13,14,20,0.26),rgba(5,6,10,0.9))]" />
                <div className={`${styles.floatFast} absolute inset-0`}>
                  <Image
                    src="/images/retroville/retroville-button-crew-studio.png"
                    alt="Button Crew en estudio"
                    fill
                    priority
                    sizes="28vw"
                    className="object-contain object-bottom-right"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 pb-8 sm:grid-cols-2 sm:px-8 lg:hidden">
            <div className={`${styles.mobileCharacterCard} ${styles.floatSlow}`}>
              <Image
                src="/images/retroville/retroville-wave.png"
                alt="NOX saludando"
                fill
                priority
                sizes="(max-width: 640px) 92vw, 44vw"
                className="object-contain object-bottom-left"
              />
            </div>
            <div className={`${styles.mobileCharacterCard} ${styles.floatFast}`}>
              <Image
                src="/images/retroville/retroville-button-crew-studio.png"
                alt="Button Crew en estudio"
                fill
                priority
                sizes="(max-width: 640px) 92vw, 44vw"
                className="object-contain object-bottom-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1540px]">
          <article
            data-reveal
            className={`${styles.reveal} relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-black shadow-[0_28px_100px_rgba(0,0,0,0.28)]`}
          >
            <div className="absolute inset-0">
              <Image
                src="/images/retroville/retroville-street.png"
                alt="Calles de Retroville con NOX y Button Crew"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,10,0.94),rgba(4,6,10,0.54)_44%,rgba(4,6,10,0.78)),linear-gradient(180deg,rgba(4,6,10,0.04),rgba(4,6,10,0.72))]" />
            <div className="relative grid min-h-[34rem] items-end gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:px-10 lg:py-10">
              <div className="max-w-[34rem]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">
                  Signal from the city
                </p>
                <h2 className={`${displayFont.className} mt-5 text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl`}>
                  UNA CIUDAD QUE YA TIENE CARA, HUMOR Y MALA LECHE
                </h2>
                <p className="mt-5 text-sm leading-8 text-white/66 sm:text-base">
                  Retroville ya no necesita explicarse solo con texto. Las calles, las luces y los
                  personajes empiezan a sentirse como una propiedad narrativa con identidad propia.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:self-end">
                {[
                  ['Mood', 'Neón húmedo · comedia negra'],
                  ['Core', 'Hardware olvidado · memoria corrupta'],
                  ['Tone', 'Maduro · nostálgico · extraño'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.4rem] border border-white/12 bg-[rgba(255,255,255,0.06)] p-4 backdrop-blur-lg"
                  >
                    <p className="text-[10px] uppercase tracking-[0.26em] text-white/46">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/84">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1540px]">
          <div className="mb-8 max-w-[44rem]">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">
              Character dossier
            </p>
            <h2 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white sm:text-5xl`}>
              LOS PERSONAJES YA AGUANTAN LA PÁGINA ELLOS SOLOS
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {characterFeatures.map((feature) => (
              <article
                key={feature.title}
                data-reveal
                className={`${styles.reveal} overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,19,0.92),rgba(7,8,12,0.98))] shadow-[0_22px_80px_rgba(0,0,0,0.24)]`}
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(138,215,255,0.12),transparent_28%),rgba(8,10,16,0.95)]">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.18)_55%,rgba(6,7,10,0.82))]" />
                </div>
                <div className="p-6 sm:p-7">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">
                    {feature.eyebrow}
                  </p>
                  <h3 className={`${displayFont.className} mt-4 text-3xl uppercase leading-none text-white sm:text-4xl`}>
                    {feature.title}
                  </h3>
                  <p className="mt-5 text-sm leading-8 text-white/64 sm:text-base">
                    {feature.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1540px]">
          <div className="mb-8 max-w-[48rem]">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">
              Archive visions
            </p>
            <h2 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl`}>
              LOS APÓCRIFOS DE RETROVILLE
            </h2>
            <p className="mt-4 text-sm leading-8 text-white/62 sm:text-base">
              Estas piezas funcionan mejor como reliquias del universo: artefactos visuales,
              relecturas clásicas y mitología absurda alrededor de los personajes.
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
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent3)]">
                    {item.eyebrow}
                  </p>
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
        <div className="mx-auto max-w-[1540px]">
          <div className="grid gap-5 lg:grid-cols-3">
            {signalCards.map((card) => (
              <article
                key={card.title}
                data-reveal
                className={`${styles.reveal} rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,18,0.94),rgba(6,7,10,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]`}
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--rv-accent)]">
                  Signal
                </p>
                <h3 className={`${displayFont.className} mt-4 text-3xl uppercase leading-none text-white`}>
                  {card.title}
                </h3>
                <p className="mt-5 text-sm leading-8 text-white/62">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="px-4 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1540px]">
          <div className={`${styles.waitlistShell} overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,10,14,0.95),rgba(5,6,9,0.98))] shadow-[0_30px_100px_rgba(0,0,0,0.34)]`}>
            <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--rv-accent)]">
                  Waitlist
                </p>
                <h2 className={`${displayFont.className} mt-4 text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl`}>
                  ENTRA ANTES DE QUE EL RESTO DE INTERNET LO RECUERDE
                </h2>
                <p className="mt-5 max-w-[34rem] text-sm leading-8 text-white/64 sm:text-base">
                  Primer drop. Primer reveal. Primera señal jugable. Retroville debe sentirse como
                  un universo que se descubre, no como una página más de “próximamente”.
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
