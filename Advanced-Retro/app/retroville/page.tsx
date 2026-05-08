import Image from 'next/image';
import Link from 'next/link';
import { Press_Start_2P } from 'next/font/google';
import { Sparkles, Trophy, Tv, Wand2 } from 'lucide-react';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import { supabaseService } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const pixelFont = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
});

async function getRetrovilleState() {
  const fallbackDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
  const fallbackIso = fallbackDate.toISOString();

  if (!supabaseService) {
    return {
      launchIso: fallbackIso,
      launchLabel: fallbackDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
      waitlistCount: 0,
    };
  }

  const [settingsRes, waitlistRes] = await Promise.all([
    supabaseService.from('admin_settings').select('value').eq('key', 'retroville_launch_date').maybeSingle(),
    supabaseService.from('retroville_waitlist').select('id', { count: 'exact', head: true }),
  ]);

  const parsedDate = new Date(String(settingsRes.data?.value || fallbackIso));
  const launchDate = Number.isFinite(parsedDate.getTime()) ? parsedDate : fallbackDate;

  return {
    launchIso: launchDate.toISOString(),
    launchLabel: launchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
    waitlistCount: Math.max(0, Number(waitlistRes.count || 0)),
  };
}

const featureCards = [
  {
    icon: Wand2,
    title: 'Mundo Virtual',
    copy: 'Una ciudad digital retro construida con hardware olvidado, humor oscuro y arquitectura de glitch premium.',
  },
  {
    icon: Trophy,
    title: 'Arcade Online',
    copy: 'Minijuegos, desafíos y competiciones retro diseñadas para verse, compartirse y sobrevivir al algoritmo.',
  },
  {
    icon: Tv,
    title: 'Torneos Retro',
    copy: 'Eventos, ranking y narrativa de comunidad para convertir la nostalgia en cultura viva y no solo catálogo.',
  },
];

export default async function RetrovillePage() {
  const { launchIso, launchLabel, waitlistCount } = await getRetrovilleState();
  const hypeGoal = 5000;
  const hypePct = Math.max(0, Math.min(100, waitlistCount > 0 ? Math.round((waitlistCount / hypeGoal) * 100) : 0));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04050a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,0.18),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,100%_4px] opacity-75" />
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(2px 2px at 12% 18%, rgba(255,255,255,0.7), transparent), radial-gradient(3px 3px at 76% 16%, rgba(255,255,255,0.55), transparent), radial-gradient(2px 2px at 60% 78%, rgba(255,255,255,0.4), transparent), radial-gradient(2px 2px at 28% 70%, rgba(255,255,255,0.48), transparent)' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0.16) 1px, transparent 1px, transparent 4px)', backgroundSize: '100% 4px' }} />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-[rgba(8,10,18,0.78)] px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/75">AdvancedRetro presenta</p>
            <p className="mt-2 text-sm text-white/55">Fecha editorial objetivo: {launchLabel}</p>
          </div>
          <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
            Volver a AdvancedRetro
          </Link>
        </header>

        <section className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)_240px] lg:items-center">
          <div className="relative mx-auto w-full max-w-[260px] lg:max-w-none">
            <div className="absolute inset-0 rounded-[2rem] bg-fuchsia-500/10 blur-3xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(34,12,24,0.9)] shadow-[0_22px_80px_rgba(0,0,0,0.34)] transition-transform duration-700 ease-out hover:-translate-y-1 hover:scale-[1.01]">
              <Image
                src="/images/retroville/nox-styleguide.png"
                alt="NOX, personaje de Retroville"
                fill
                priority
                sizes="(max-width: 1024px) 72vw, 18vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200">
              <Sparkles className="h-4 w-4" />
              Universo original · teaser público
            </div>
            <h1 className={`mt-6 text-4xl font-black uppercase leading-[1.02] text-white sm:text-6xl xl:text-7xl ${pixelFont.className}`}>
              <span className="relative inline-block after:absolute after:inset-0 after:translate-x-[2px] after:text-cyan-300/35 after:content-[attr(data-text)] before:absolute before:inset-0 before:-translate-x-[2px] before:text-fuchsia-400/35 before:content-[attr(data-text)]" data-text="RETROVILLE">
                RETROVILLE
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 sm:text-xl">El universo retro que estás esperando.</p>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Un teaser cinematográfico sobre hardware olvidado, memorias corruptas, humor existencial y una ciudad digital donde las consolas que nadie usa siguen teniendo demasiado que decir.
            </p>

            <RetrovilleCountdown targetIso={launchIso} className="mt-8" />

            {waitlistCount > 0 ? (
              <div className="mx-auto mt-6 max-w-2xl rounded-[1.8rem] border border-white/10 bg-[rgba(7,10,18,0.82)] px-5 py-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>Hype actual</span>
                  <span>{waitlistCount} / {hypeGoal} insiders</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-white/10">
                  <div className="h-3 rounded-full bg-[linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6)] transition-all" style={{ width: `${hypePct}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[260px] lg:max-w-none">
            <div className="absolute inset-0 rounded-[2rem] bg-cyan-500/10 blur-3xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(18,15,40,0.9)] shadow-[0_22px_80px_rgba(0,0,0,0.34)] transition-transform duration-700 ease-out hover:-translate-y-1 hover:scale-[1.01]">
              <Image
                src="/images/retroville/button-crew-styleguide.png"
                alt="Button Crew, personajes de Retroville"
                fill
                priority
                sizes="(max-width: 1024px) 72vw, 18vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-[1.8rem] border border-white/10 bg-[rgba(8,10,18,0.78)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-fuchsia-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-2xl font-black text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.copy}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(94,31,98,0.35),rgba(15,22,48,0.88))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:grid-cols-[1fr,420px] lg:items-center sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/72">Waitlist</p>
            <h3 className="mt-3 text-4xl font-black text-white">Entra antes de que el resto se acuerde de que esto existe.</h3>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              Si te interesa seguir el proyecto desde el principio, deja tu email. El primer acceso, los reveals y la narrativa inicial de Retroville saldrán desde esta lista.
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(6,9,17,0.8)] p-5">
            <RetrovilleWaitlistForm darkMode source="public" />
          </div>
        </section>

        <footer className="border-t border-white/10 pt-4 text-center text-xs uppercase tracking-[0.26em] text-white/40">
          © AdvancedRetro · Retroville está en desarrollo.
        </footer>
      </div>
    </main>
  );
}
