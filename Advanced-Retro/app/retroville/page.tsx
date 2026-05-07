import Image from 'next/image';
import Link from 'next/link';
import { Camera, Globe, MessageCircle, Sparkles } from 'lucide-react';
import { RetrovilleWaitlistForm } from '@/components/admin/AdminForms';

const cityLocations = [
  {
    name: 'Memory Dump',
    description:
      'El vertedero donde terminan los recuerdos corruptos, las capturas borrosas y los tutoriales que nadie volvió a abrir.',
  },
  {
    name: 'Battery Hospital',
    description:
      'Una clínica nocturna para hardware agotado, consolas con ansiedad de carga y mandos que ya no aguantan otra actualización.',
  },
  {
    name: 'Save File Cemetery',
    description:
      'Un barrio silencioso lleno de partidas borradas, finales a medias y progresos que murieron antes de tiempo.',
  },
  {
    name: 'Arcade District',
    description:
      'Neón, ruido, humo sintético y demasiada dignidad para una ciudad construida con máquinas que nadie enchufa ya.',
  },
  {
    name: 'Glitch Alley',
    description:
      'La zona donde los errores visuales se vuelven arquitectura y la depresión digital se disfraza de estilo.',
  },
  {
    name: 'Loading Screen Prison',
    description:
      'La condena eterna de todo objeto olvidado: quedarse cargando mientras el resto del mundo sigue adelante.',
  },
];

const buttonCrew = [
  {
    name: 'A',
    subtitle: 'Impulsivo',
    quote: 'I’m always the first mistake.',
    color: 'from-[#ef4444]/85 to-[#fb7185]/40',
  },
  {
    name: 'B',
    subtitle: 'Pesimista',
    quote: 'Not my problem. Literally.',
    color: 'from-[#f59e0b]/85 to-[#fcd34d]/40',
  },
  {
    name: 'Y',
    subtitle: 'Caótico',
    quote: 'What if nothing even matters?',
    color: 'from-[#84cc16]/85 to-[#bef264]/35',
  },
  {
    name: 'X',
    subtitle: 'Analítico',
    quote: 'I analyze everything and it still makes no sense.',
    color: 'from-[#3b82f6]/85 to-[#60a5fa]/35',
  },
];

const episodeCards = [
  {
    label: 'Mini-episode 01',
    title: 'Low Battery Philosophy',
    copy:
      'NOX atraviesa la ciudad buscando carga emocional en un sitio donde ni las pilas duran ni las conversaciones tienen final feliz.',
  },
  {
    label: 'Mini-episode 02',
    title: 'Patch Notes for the Soul',
    copy:
      'The Button Crew intenta arreglar la existencia con lógica de menús, sarcasmo y cero estabilidad de sistema.',
  },
  {
    label: 'Mini-episode 03',
    title: 'Continue? Maybe Not.',
    copy:
      'Retroville plantea una sola pregunta seria: ¿qué pasa con todo lo digital cuando deja de importarle a alguien?',
  },
];

export default function RetrovillePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,100%_4px] opacity-70" />
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(2px 2px at 10% 20%, rgba(255,255,255,0.65), transparent), radial-gradient(2px 2px at 78% 14%, rgba(255,255,255,0.55), transparent), radial-gradient(3px 3px at 50% 68%, rgba(255,255,255,0.42), transparent), radial-gradient(2px 2px at 70% 52%, rgba(255,255,255,0.75), transparent)' }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16) 1px, transparent 1px, transparent 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative z-10 px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-[rgba(8,10,18,0.74)] px-5 py-4 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.38em] text-cyan-200/70">AdvancedRetro presenta</p>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-white drop-shadow-[0_0_26px_rgba(99,102,241,0.55)] sm:text-5xl">
                RETROVILLE
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="#personajes" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
                Personajes
              </Link>
              <Link href="#mapa" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
                Explorar ciudad
              </Link>
              <Link href="#waitlist" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110">
                Entrar en la waitlist
              </Link>
            </div>
          </header>

          <section className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200">
                <Sparkles className="h-4 w-4" />
                Universo original · dark comedy sci-fi
              </div>
              <div className="space-y-5">
                <p className="max-w-3xl text-sm uppercase tracking-[0.32em] text-cyan-200/72">
                  Every forgotten game ends up somewhere.
                </p>
                <h2 className="max-w-4xl text-4xl font-black leading-[0.92] text-white sm:text-6xl xl:text-7xl">
                  Una ciudad secreta para consolas olvidadas, mandos agotados y recuerdos digitales que nadie quiso guardar.
                </h2>
                <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
                  Retroville no es una tienda ni una parodia infantil. Es una IP original con humor oscuro, nostalgia rota y personajes que viven el abandono tecnológico como si fuese un drama existencial con neón encima.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-[rgba(14,16,28,0.72)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tono</p>
                  <p className="mt-2 text-sm font-semibold text-white">Cínico, extraño y emocional</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-[rgba(14,16,28,0.72)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Inspiración</p>
                  <p className="mt-2 text-sm font-semibold text-white">Retro hardware + dystopian neon</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-[rgba(14,16,28,0.72)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Formato</p>
                  <p className="mt-2 text-sm font-semibold text-white">Teaser cinematográfico / universo animado</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(255,110,180,0.22),transparent_32%),linear-gradient(180deg,rgba(35,14,25,0.86),rgba(12,7,15,0.96))]">
                <Image
                  src="/images/retroville/nox-styleguide.png"
                  alt="NOX, el controlador olvidado protagonista de Retroville"
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 40vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.2rem] border border-white/10 bg-[rgba(6,8,15,0.82)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/72">Main character</p>
                  <p className="mt-2 text-3xl font-black uppercase tracking-[0.12em] text-white">NOX</p>
                  <p className="mt-2 text-sm text-slate-300">
                    “I used to control games... now I can&apos;t even control myself.”
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="personajes" className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[rgba(10,12,20,0.74)] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/72">Character dossier</p>
              <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-white">NOX</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tipo</p>
                  <p className="mt-2 font-semibold text-white">Forgotten motion controller</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Estado</p>
                  <p className="mt-2 font-semibold text-white">Low battery · low morale</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Personalidad</p>
                  <p className="mt-2 font-semibold text-white">Sarcastic · exhausted · accidentally relatable</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Problema</p>
                  <p className="mt-2 font-semibold text-white">No supera haber sido sustituido por cosas “más inteligentes”</p>
                </div>
              </div>
              <p className="mt-6 text-base leading-relaxed text-slate-300">
                NOX es la cara perfecta de Retroville: un hardware que antes controlaba mundos enteros y ahora apenas puede sostener su propia motivación. No es heroico. No es épico. Solo sigue aquí.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[rgba(10,12,20,0.74)] p-4 backdrop-blur-xl sm:p-5">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,100,140,0.16),transparent_28%),linear-gradient(180deg,rgba(68,17,35,0.92),rgba(36,11,22,0.98))]">
                <Image
                  src="/images/retroville/button-crew-styleguide.png"
                  alt="Button Crew, personajes secundarios de Retroville"
                  fill
                  sizes="(max-width: 1024px) 92vw, 52vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {buttonCrew.map((member) => (
                  <div key={member.name} className={`rounded-[1.3rem] border border-white/10 bg-gradient-to-br ${member.color} p-[1px]`}>
                    <div className="h-full rounded-[1.25rem] bg-[rgba(11,14,24,0.92)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{member.subtitle}</p>
                      <p className="mt-2 text-2xl font-black text-white">{member.name}</p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{member.quote}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="mapa" className="space-y-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/72">Explore the city</p>
              <h3 className="mt-3 text-4xl font-black text-white">Lugares que solo existen cuando una máquina deja de importarle a alguien.</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-300">
                Retroville funciona como una ciudad-memoria: cada barrio es una metáfora jugable del abandono digital, el obsolescencia humorística y la nostalgia que ya no sabe si doler o reírse.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cityLocations.map((location) => (
                <article
                  key={location.name}
                  className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/70">District</p>
                  <h4 className="mt-2 text-2xl font-bold text-white">{location.name}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{location.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[rgba(10,12,20,0.74)] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/72">Lore</p>
              <h3 className="mt-3 text-3xl font-black text-white">¿Qué pasa cuando un dispositivo es olvidado?</h3>
              <div className="mt-6 space-y-5">
                <div className="border-l border-fuchsia-400/35 pl-4">
                  <p className="text-sm font-semibold text-white">1. Deja de ser útil.</p>
                  <p className="mt-2 text-sm text-slate-300">Una consola deja de conectarse. Un mando falla. Un save se corrompe. El vínculo humano se corta.</p>
                </div>
                <div className="border-l border-fuchsia-400/35 pl-4">
                  <p className="text-sm font-semibold text-white">2. No desaparece.</p>
                  <p className="mt-2 text-sm text-slate-300">Su residuo emocional y digital cae en Retroville, donde todo lo obsoleto adquiere identidad, traumas y sentido del humor.</p>
                </div>
                <div className="border-l border-fuchsia-400/35 pl-4">
                  <p className="text-sm font-semibold text-white">3. Aprende a seguir vivo.</p>
                  <p className="mt-2 text-sm text-slate-300">Retroville no trata de reparación técnica. Trata de cómo sobrevivir al abandono sin dejar de ser raro, cínico y profundamente reconocible.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[rgba(10,12,20,0.74)] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/72">Mini episodes</p>
              <div className="mt-5 grid gap-4">
                {episodeCards.map((episode) => (
                  <article key={episode.title} className="rounded-[1.4rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{episode.label}</p>
                    <h4 className="mt-2 text-2xl font-bold text-white">{episode.title}</h4>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{episode.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="waitlist" className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(94,31,98,0.35),rgba(15,22,48,0.88))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr,420px] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/72">Waitlist / community</p>
                <h3 className="mt-3 text-4xl font-black text-white">Entra en Retroville antes de que el resto recuerde que existía.</h3>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                  Si esta mezcla de hardware olvidado, humor negro y nostalgia cinematográfica te habla demasiado claro, apúntate. La primera comunidad de Retroville saldrá desde aquí.
                </p>
                <div className="mt-6 flex items-center gap-4 text-white/70">
                  <a href="#" aria-label="Twitter/X" className="rounded-full border border-white/15 p-3 transition hover:bg-white/10"><Globe className="h-5 w-5" /></a>
                  <a href="#" aria-label="Instagram" className="rounded-full border border-white/15 p-3 transition hover:bg-white/10"><Camera className="h-5 w-5" /></a>
                  <a href="#" aria-label="Discord" className="rounded-full border border-white/15 p-3 transition hover:bg-white/10"><MessageCircle className="h-5 w-5" /></a>
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(6,9,17,0.8)] p-5">
                <RetrovilleWaitlistForm />
              </div>
            </div>
          </section>

          <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-3 text-center text-xs uppercase tracking-[0.28em] text-white/45 sm:flex-row sm:text-left">
            <p>© AdvancedRetro</p>
            <p>Retroville is an original fictional universe about forgotten gaming hardware, corrupted memories and emotional digital leftovers.</p>
          </footer>
        </div>
      </div>

    </main>
  );
}
