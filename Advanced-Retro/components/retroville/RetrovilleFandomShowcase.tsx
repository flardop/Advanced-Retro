'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, Hash, Radio, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RETROVILLE_SOCIAL_CHANNELS } from '@/app/retroville/shared';

type RetrovilleSocialMoment = {
  title: string;
  eyebrow: string;
  platform: string;
  href: string;
  image: string;
  caption: string;
  hashtags: readonly string[];
};

type FandomPrompt = {
  title: string;
  body: string;
  icon: typeof Sparkles;
};

const channelHrefMap = RETROVILLE_SOCIAL_CHANNELS.reduce<Record<string, string>>((acc, channel) => {
  acc[channel.label] = channel.href;
  return acc;
}, {});

const fandomHashtags = ['#Retroville', '#NOX', '#Luna', '#ButtonCrew', '#BitGrave', '#RetrovilleShow'] as const;

const fandomPrompts: readonly FandomPrompt[] = [
  {
    title: 'Publica con firma propia',
    body: 'Fan art, memes, edits, renders o clips: cualquier señal buena puede empujar el universo mucho más allá de la home.',
    icon: Sparkles,
  },
  {
    title: 'Agrupa la conversación',
    body: 'Usa siempre hashtags reconocibles para que las publicaciones no se pierdan y Retroville tenga un archivo vivo de comunidad.',
    icon: Hash,
  },
  {
    title: 'Mueve a la gente al canal',
    body: 'Las redes atraen; Discord y la newsletter convierten esa curiosidad en comunidad real y en seguimiento constante del proyecto.',
    icon: Radio,
  },
];

const posterHighlights = [
  {
    eyebrow: 'Póster de personaje',
    title: 'NOX también vende tono en formato editorial',
    body: 'Las piezas de personaje ayudan a que el universo se recuerde incluso fuera del trailer o de la sinopsis.',
    image: '/images/retroville/fandom/nox-inside-chaos-poster.png',
  },
  {
    eyebrow: 'Mood social',
    title: 'La serie ya tiene material para posts con personalidad',
    body: 'No todo tiene que ser pitch formal: también hace falta contenido con atmósfera, humor y cultura retro para enganchar comunidad.',
    image: '/images/retroville/fandom/nox-chill-game-stack.png',
  },
] as const;

const socialMoments: readonly RetrovilleSocialMoment[] = [
  {
    eyebrow: 'Post de arranque',
    title: 'Retroville vuelve con un frame que ya funciona como cartel',
    platform: 'Instagram',
    href: channelHrefMap.Instagram,
    image: '/images/retroville/fandom/retroville-returns-smoke.png',
    caption: 'Una pieza para abrir conversación rápido: identidad fuerte, personajes claros y un hook visual que se recuerda.',
    hashtags: ['#Retroville', '#ButtonCrew', '#Reveal'],
  },
  {
    eyebrow: 'Caos de oficina',
    title: 'Button Crew convierte cualquier idea en una escena compartible',
    platform: 'Threads',
    href: channelHrefMap.Threads,
    image: '/images/retroville/fandom/button-crew-chaos-board.png',
    caption: 'Este tipo de publicación sirve para enseñar humor, dinámica de grupo y tono de serie sin explicar demasiado.',
    hashtags: ['#Retroville', '#ButtonCrew', '#Caos'],
  },
  {
    eyebrow: 'Microhistoria',
    title: 'NOX funciona perfecto en posts pequeños y con remate',
    platform: 'X',
    href: channelHrefMap.X,
    image: '/images/retroville/fandom/nox-cafe-panic.png',
    caption: 'Las piezas centradas en NOX son ideales para frases, mini situaciones y contenido rápido que sí apetece compartir.',
    hashtags: ['#NOX', '#Retroville', '#Mood'],
  },
  {
    eyebrow: 'Mood de barrio',
    title: 'La pandilla reunida da sensación de universo y vida interna',
    platform: 'Instagram',
    href: channelHrefMap.Instagram,
    image: '/images/retroville/fandom/button-crew-war-room.png',
    caption: 'Cuando la publicación parece una escena de verdad, la IP se siente menos como idea y más como serie existente.',
    hashtags: ['#Retroville', '#ButtonCrew', '#Worldbuilding'],
  },
  {
    eyebrow: 'Contraste pop',
    title: 'Luna mete glamour, ironía y color en la mezcla',
    platform: 'Instagram',
    href: channelHrefMap.Instagram,
    image: '/images/retroville/fandom/luna-late-bites.png',
    caption: 'Sus publicaciones levantan el lado más pop y ayudan a que la identidad visual no se quede solo en oscuro y drama.',
    hashtags: ['#Luna', '#Retroville', '#PopDrop'],
  },
  {
    eyebrow: 'Ciudad viva',
    title: 'Incluso un día en el parque parece parte del lore',
    platform: 'Facebook',
    href: channelHrefMap.Facebook,
    image: '/images/retroville/fandom/button-crew-park-day.png',
    caption: 'No todo tiene que ser épico: también hay que enseñar ocio, barrio y costumbre para vender ciudad real.',
    hashtags: ['#Retroville', '#ParkDay', '#ButtonCrew'],
  },
  {
    eyebrow: 'Arcade drop',
    title: 'NOX aguanta piezas más intensas, sucias y con carácter',
    platform: 'Threads',
    href: channelHrefMap.Threads,
    image: '/images/retroville/fandom/nox-game-over-arcade.png',
    caption: 'Perfecto para publicaciones más densas, frases de personaje y todo el imaginario de decadencia que hace distinta a la serie.',
    hashtags: ['#NOX', '#GameOver', '#Retroville'],
  },
  {
    eyebrow: 'Feed social',
    title: 'La tensión entre NOX y Luna también vende sola',
    platform: 'Instagram',
    href: channelHrefMap.Instagram,
    image: '/images/retroville/fandom/luna-selfie-drop.png',
    caption: 'Las relaciones entre personajes también son contenido: dan pie a reacciones, clips, comentarios y conversación orgánica.',
    hashtags: ['#Luna', '#NOX', '#Retroville'],
  },
] as const;

function modIndex(index: number, length: number) {
  return (index + length) % length;
}

export default function RetrovilleFandomShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMoment = socialMoments[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => modIndex(current + 1, socialMoments.length));
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  function stepCarousel(direction: -1 | 1) {
    setActiveIndex((current) => modIndex(current + direction, socialMoments.length));
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,21,42,0.95),rgba(11,16,31,0.9)_48%,rgba(58,18,47,0.88))] p-5 shadow-[0_1.8rem_4.8rem_rgba(0,0,0,0.28)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-[28px] items-center rounded-full border border-[rgba(255,191,82,0.22)] bg-[rgba(255,191,82,0.1)] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Fandom activo
            </span>
            <span className="inline-flex min-h-[28px] items-center rounded-full border border-white/10 bg-white/[0.05] px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/72">
              Publicaciones vivas
            </span>
          </div>

          <h3 className="mt-4 text-[clamp(2.1rem,4.6vw,4rem)] font-semibold uppercase leading-[0.92] tracking-[0.02em] text-white">
            LA CONVERSACIÓN
            <br />
            TAMBIÉN CONSTRUYE
            <br />
            RETROVILLE
          </h3>

          <p className="mt-4 max-w-[42rem] text-sm leading-7 text-[var(--rv-text-muted)] sm:text-base">
            Aquí es donde el proyecto deja de ser solo una home y empieza a parecer una IP con vida propia. Todo lo
            que publiquemos en redes puede empujar comunidad, tono, personaje y recuerdo visual si lo ordenamos con
            hashtags claros y piezas que sí den ganas de compartir.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {fandomHashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex min-h-[2.5rem] items-center rounded-full border border-[rgba(138,215,255,0.22)] bg-[rgba(138,215,255,0.08)] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rv-text)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {fandomPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <article
                  key={prompt.title}
                  className="rounded-[1.35rem] border border-white/10 bg-[rgba(7,11,22,0.62)] p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--rv-gold)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="mt-4 text-lg font-semibold uppercase leading-tight tracking-[0.03em] text-white">
                    {prompt.title}
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-[var(--rv-text-muted)]">{prompt.body}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={channelHrefMap.Instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[rgba(255,191,82,0.28)] bg-[linear-gradient(135deg,rgba(255,191,82,0.2),rgba(192,57,43,0.2))] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[rgba(255,191,82,0.44)] hover:brightness-110"
            >
              Ver Instagram oficial
            </a>
            <a
              href={channelHrefMap.Threads}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82 transition hover:border-white/20 hover:text-white"
            >
              Abrir Threads
            </a>
            <a
              href={channelHrefMap.Discord}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[rgba(138,215,255,0.2)] bg-[rgba(138,215,255,0.08)] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/84 transition hover:border-[rgba(138,215,255,0.36)] hover:bg-[rgba(138,215,255,0.12)] hover:text-white"
            >
              Entrar en Discord
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {posterHighlights.map((highlight) => (
            <article
              key={highlight.title}
              className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[rgba(7,11,22,0.84)] shadow-[0_1.6rem_4rem_rgba(0,0,0,0.25)]"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={highlight.image}
                  alt={highlight.title}
                  fill
                  sizes="(max-width: 1279px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,10,0)_12%,rgba(3,4,10,0.2)_48%,rgba(3,4,10,0.82)_100%)]" />
              </div>
              <div className="grid gap-2 p-4 sm:p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">{highlight.eyebrow}</p>
                <h4 className="text-[1.45rem] font-semibold uppercase leading-[0.95] tracking-[0.03em] text-white">
                  {highlight.title}
                </h4>
                <p className="text-sm leading-7 text-[var(--rv-text-muted)]">{highlight.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(10,14,24,0.96),rgba(8,11,21,0.92)_48%,rgba(22,10,31,0.9))] shadow-[0_1.9rem_4.6rem_rgba(0,0,0,0.28)]">
        <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="relative min-h-[20rem]">
            <div className="relative aspect-[16/12] h-full min-h-[20rem] w-full lg:aspect-auto">
              <Image
                src={activeMoment.image}
                alt={activeMoment.title}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,10,0.08),rgba(3,4,10,0.18)_40%,rgba(3,4,10,0.82)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 grid gap-2 p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">{activeMoment.eyebrow}</p>
                <h4 className="max-w-[14ch] text-[clamp(2rem,4vw,3.5rem)] font-semibold uppercase leading-[0.92] tracking-[0.02em] text-white">
                  {activeMoment.title}
                </h4>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-green)]">Mini slider social</p>
                <span className="text-[11px] uppercase tracking-[0.22em] text-white/48">
                  {String(activeIndex + 1).padStart(2, '0')} / {String(socialMoments.length).padStart(2, '0')}
                </span>
              </div>

              <h4 className="mt-4 text-[clamp(1.8rem,3vw,2.6rem)] font-semibold uppercase leading-[0.94] tracking-[0.03em] text-white">
                NO TE PIERDAS
                <br />
                NINGUNA SEÑAL
              </h4>

              <p className="mt-4 text-sm leading-7 text-[var(--rv-text-muted)] sm:text-base">{activeMoment.caption}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {activeMoment.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex min-h-[2.25rem] items-center rounded-full border border-white/10 bg-white/[0.05] px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/78"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => stepCarousel(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition hover:border-white/20 hover:bg-white/[0.1]"
                aria-label="Ver publicación anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => stepCarousel(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition hover:border-white/20 hover:bg-white/[0.1]"
                aria-label="Ver siguiente publicación"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <a
                href={activeMoment.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[rgba(138,215,255,0.22)] bg-[rgba(138,215,255,0.08)] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/84 transition hover:border-[rgba(138,215,255,0.36)] hover:bg-[rgba(138,215,255,0.14)] hover:text-white"
              >
                Ver canal en {activeMoment.platform}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 p-4 sm:p-5">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {socialMoments.map((moment, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={moment.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  className={`group flex min-w-[14rem] items-center gap-3 rounded-[1.15rem] border p-2 text-left transition sm:min-w-[15rem] ${
                    isActive
                      ? 'border-[rgba(255,191,82,0.34)] bg-[rgba(255,191,82,0.1)]'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[0.9rem]">
                    <Image
                      src={moment.image}
                      alt={moment.title}
                      fill
                      sizes="64px"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] uppercase tracking-[0.22em] text-[var(--rv-gold)]">{moment.platform}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold uppercase leading-tight tracking-[0.03em] text-white">
                      {moment.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[1.55rem] border border-white/10 bg-[rgba(7,11,22,0.74)] p-4 sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--rv-gold)]">Cómo debería estar</p>
        <p className="mt-3 text-sm leading-7 text-[var(--rv-text-muted)] sm:text-base">
          La home ya tiene el pitch base donde debe: entrada cinematográfica, núcleo de cast, tres episodios, tres
          distritos y acceso privado claro. Lo que faltaba era esta capa de comunidad para que la IP no pareciera solo
          dossier, sino también conversación, cultura visual y señales compartibles.
        </p>
      </div>
    </div>
  );
}
