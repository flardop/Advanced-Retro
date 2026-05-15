import Image from 'next/image';
import { lunaProfile } from '@/lib/retroville-luna';

export default function LunaDevGuide() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(58,20,40,0.84),rgba(16,12,24,0.92))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-pink-200/72">Character dossier</p>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <h3 className="text-4xl font-black uppercase tracking-[0.12em] text-white sm:text-5xl">{lunaProfile.name}</h3>
            <span className="pb-1 text-sm uppercase tracking-[0.28em] text-pink-100/56">{lunaProfile.kana}</span>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/88">{lunaProfile.summary}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Ficha rápida</p>
              <dl className="mt-4 space-y-3 text-sm text-slate-200/88">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-white/48">Type</dt>
                  <dd>{lunaProfile.type}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-white/48">Status</dt>
                  <dd>{lunaProfile.status}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-white/48">Origin</dt>
                  <dd>{lunaProfile.origin}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-white/48">Mood</dt>
                  <dd>{lunaProfile.mood}%</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[1.5rem] border border-pink-300/20 bg-[rgba(248,168,205,0.08)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-100/72">Quote</p>
              <p className="mt-4 text-lg font-semibold leading-7 text-white">“{lunaProfile.quote}”</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Personalidad</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {lunaProfile.personality.map((trait) => (
                  <span key={trait} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-100/88">
                    {trait}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Expresiones clave</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {lunaProfile.expressions.map((expression) => (
                  <span key={expression} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-100/88">
                    {expression}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Likes</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200/84">
                {lunaProfile.likes.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Dislikes</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200/84">
                {lunaProfile.dislikes.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Notas visuales</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-200/84">
                {lunaProfile.designNotes.map((note) => (
                  <li key={note}>· {note}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Dirección de animación</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-200/84">
                {lunaProfile.animationNotes.map((note) => (
                  <li key={note}>· {note}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-pink-200/62">Paleta de Luna</p>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {lunaProfile.palette.map((swatch) => (
                <div key={swatch.hex} className="space-y-2">
                  <div className="h-16 rounded-2xl border border-white/10" style={{ backgroundColor: swatch.hex }} />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/56">{swatch.name}</p>
                    <p className="text-xs text-white/78">{swatch.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[rgba(255,255,255,0.03)]">
            <div className="relative aspect-[4/5]">
              <Image
                src="/images/retroville/luna-styleguide.png"
                alt="Guía de estilo de Luna para el equipo de desarrollo de Retroville"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[rgba(255,255,255,0.03)]">
            <div className="relative aspect-[5/4]">
              <Image
                src="/images/retroville/luna-nox-lounge.png"
                alt="Luna junto a NOX en una escena de lounge arcade dentro de Retroville"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

