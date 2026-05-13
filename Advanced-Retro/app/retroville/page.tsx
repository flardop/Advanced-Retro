import Image from 'next/image';
import Link from 'next/link';
import { Press_Start_2P } from 'next/font/google';
import { ArrowRight, Play, Sparkles, Trophy, Tv, Wand2 } from 'lucide-react';
import RetrovilleCountdown from '@/components/retroville/RetrovilleCountdown';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import { supabaseService } from '@/lib/supabase/service';
import styles from './retroville.module.css';

export const dynamic = 'force-dynamic';

const pixelFont = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
});

const featureCards = [
  {
    icon: Wand2,
    title: 'World Building',
    copy:
      'A neon city of discarded hardware, corrupted memories and old devices that never really powered down.',
  },
  {
    icon: Tv,
    title: 'Arcade Signal',
    copy:
      'Short-form drops, interactive reveals and launch moments designed to feel like culture, not filler.',
  },
  {
    icon: Trophy,
    title: 'Retro Tournaments',
    copy:
      'Competitive chaos, community lore and collectible energy built around the emotional weight of old games.',
  },
];

const particles = [
  { left: '8%', top: '16%', size: 5, duration: '8.5s', delay: '0s' },
  { left: '18%', top: '64%', size: 3, duration: '11s', delay: '1.2s' },
  { left: '28%', top: '26%', size: 4, duration: '9.5s', delay: '0.6s' },
  { left: '36%', top: '74%', size: 2, duration: '10.5s', delay: '2s' },
  { left: '44%', top: '18%', size: 3, duration: '12s', delay: '0.8s' },
  { left: '52%', top: '58%', size: 5, duration: '8.8s', delay: '1.6s' },
  { left: '62%', top: '30%', size: 3, duration: '10.2s', delay: '0.4s' },
  { left: '70%', top: '68%', size: 4, duration: '9.2s', delay: '1.8s' },
  { left: '82%', top: '20%', size: 5, duration: '11.4s', delay: '0.2s' },
  { left: '88%', top: '56%', size: 3, duration: '12.4s', delay: '2.2s' },
  { left: '22%', top: '42%', size: 2, duration: '9.8s', delay: '1.1s' },
  { left: '58%', top: '12%', size: 2, duration: '13s', delay: '2.4s' },
];

async function getRetrovilleState() {
  const fallbackDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
  const fallbackIso = fallbackDate.toISOString();

  if (!supabaseService) {
    return {
      launchIso: fallbackIso,
      launchLabel: fallbackDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      waitlistCount: 0,
    };
  }

  const [settingsRes, waitlistRes] = await Promise.all([
    supabaseService
      .from('admin_settings')
      .select('value')
      .eq('key', 'retroville_launch_date')
      .maybeSingle(),
    supabaseService
      .from('retroville_waitlist')
      .select('id', { count: 'exact', head: true }),
  ]);

  const parsedDate = new Date(String(settingsRes.data?.value || fallbackIso));
  const launchDate = Number.isFinite(parsedDate.getTime())
    ? parsedDate
    : fallbackDate;

  return {
    launchIso: launchDate.toISOString(),
    launchLabel: launchDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    waitlistCount: Math.max(0, Number(waitlistRes.count || 0)),
  };
}

export default async function RetrovillePage() {
  const { launchIso, launchLabel, waitlistCount } = await getRetrovilleState();
  const hypeGoal = 5000;
  const hypePct =
    waitlistCount > 0
      ? Math.max(0, Math.min(100, Math.round((waitlistCount / hypeGoal) * 100)))
      : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(115,76,255,0.24),transparent_26%),radial-gradient(circle_at_18%_30%,rgba(45,212,255,0.12),transparent_28%),radial-gradient(circle_at_84%_28%,rgba(236,72,153,0.14),transparent_26%),linear-gradient(180deg,#050816_0%,#090f1f_45%,#050816_100%)]" />
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(127,140,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127,140,255,0.08) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0.18) 1px, transparent 1px, transparent 4px)', backgroundSize: '100% 4px' }} />
      <div className="absolute inset-x-0 bottom-0 h-[42vh] bg-[radial-gradient(circle_at_50%_100%,rgba(180,83,255,0.26),transparent_42%)]" />
      <div className="absolute inset-x-[18%] top-[18%] h-[44vh] rounded-full bg-[radial-gradient(circle,rgba(111,82,255,0.28),rgba(17,24,39,0.04)_46%,transparent_68%)] blur-3xl" />
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <span
            key={`${particle.left}-${particle.top}`}
            className={`absolute ${styles.particle}`}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: particle.duration,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-10 px-4 py-5 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between rounded-[1.7rem] border border-white/10 bg-[rgba(6,10,20,0.72)] px-4 py-3 backdrop-blur-2xl sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.34em] text-fuchsia-200/78 sm:text-xs">
              AdvancedRetro Original Universe
            </p>
            <p className="mt-2 text-xs text-white/45 sm:text-sm">
              Launch window target: {launchLabel}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:text-sm"
          >
            Back to AdvancedRetro
          </Link>
        </header>

        <section className="relative isolate overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.92),rgba(6,10,18,0.82))] px-5 pb-6 pt-8 shadow-[0_30px_120px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:px-8 sm:pt-10 lg:min-h-[calc(100svh-10rem)] lg:px-12 lg:pb-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.12),transparent_32%),radial-gradient(circle_at_50%_82%,rgba(45,212,255,0.09),transparent_26%)]" />
          <div className="pointer-events-none absolute left-1/2 top-[17%] hidden h-[48vh] w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-300/70 to-transparent blur-[2px] lg:block" />
          <div className="pointer-events-none absolute left-1/2 top-[22%] hidden h-[36vh] w-[34vw] max-w-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(68,211,255,0.16),rgba(126,87,255,0.10)_42%,transparent_68%)] blur-3xl lg:block" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34vh] bg-[linear-gradient(180deg,transparent,rgba(34,17,66,0.26)_50%,rgba(4,8,22,0.72))]" />
          <div className="pointer-events-none absolute left-[-8%] top-[14%] hidden h-[52vh] w-[34vw] max-w-[520px] rounded-full bg-[radial-gradient(circle,rgba(45,212,255,0.18),rgba(85,85,255,0.10)_42%,transparent_72%)] blur-3xl lg:block" />
          <div className="pointer-events-none absolute right-[-8%] top-[17%] hidden h-[54vh] w-[36vw] max-w-[560px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.16),rgba(45,212,255,0.08)_42%,transparent_72%)] blur-3xl lg:block" />

          <div className="pointer-events-none absolute inset-y-[18%] left-[-6%] hidden w-[34%] min-w-[340px] max-w-[520px] lg:block xl:left-[-3%] xl:w-[35%]">
            <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className={`relative h-full w-full ${styles.characterShellLeft}`}>
              <div className="absolute inset-[8%_2%_10%_-2%] rounded-full bg-[radial-gradient(circle_at_24%_56%,rgba(45,212,255,0.18),transparent_24%),radial-gradient(circle_at_62%_48%,rgba(111,82,255,0.14),transparent_34%)] blur-3xl" />
              <Image
                src="/images/retroville/nox-push.png"
                alt="NOX pushing toward the Retroville core"
                fill
                priority
                sizes="(max-width: 1279px) 34vw, 32vw"
                className={`select-none object-cover object-left-center [filter:drop-shadow(0_24px_60px_rgba(31,171,255,0.22))] ${styles.characterLeft} ${styles.characterImageLeft}`}
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-[20%] right-[-8%] hidden w-[38%] min-w-[390px] max-w-[600px] lg:block xl:right-[-4%] xl:w-[40%]">
            <div className="absolute inset-0 rounded-full bg-fuchsia-400/10 blur-3xl" />
            <div className={`relative h-full w-full ${styles.characterShellRight}`}>
              <div className="absolute inset-[8%_-2%_10%_2%] rounded-full bg-[radial-gradient(circle_at_76%_56%,rgba(236,72,153,0.18),transparent_24%),radial-gradient(circle_at_36%_50%,rgba(45,212,255,0.12),transparent_34%)] blur-3xl" />
              <Image
                src="/images/retroville/button-crew-push.png"
                alt="Button Crew pushing toward the Retroville core"
                fill
                priority
                sizes="(max-width: 1279px) 38vw, 36vw"
                className={`select-none object-cover object-right-center [filter:drop-shadow(0_24px_60px_rgba(216,72,255,0.2))] ${styles.characterRight} ${styles.characterImageRight}`}
              />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[68vh] flex-col justify-between lg:min-h-[calc(100svh-16rem)]">
            <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center justify-center px-2 text-center lg:pb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-fuchsia-100/90 backdrop-blur-lg sm:text-xs">
                <Sparkles className="h-4 w-4" />
                Cinematic universe reveal
              </div>

              <div className="mt-7 flex w-full justify-center">
                <h1
                  className={`max-w-fit text-center text-[2.05rem] font-black uppercase leading-[0.95] tracking-[-0.05em] text-white sm:text-[3.85rem] sm:tracking-normal xl:text-[5rem] ${pixelFont.className}`}
                >
                  <span
                    data-text="RETROVILLE"
                    className={styles.glitch}
                  >
                    RETROVILLE
                  </span>
                </h1>
              </div>

              <div className="mt-6 flex w-full max-w-[520px] flex-col items-center">
                <p className="max-w-[27ch] text-xl font-semibold text-slate-100 sm:text-2xl">
                  Every forgotten game ends up somewhere.
                </p>

                <p className="mt-4 max-w-[34ch] text-sm leading-7 text-slate-300 sm:text-base">
                  A darkly comic retro world where abandoned hardware, broken memories
                  and forgotten controllers keep living long after players move on.
                </p>

                <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
                  <Link
                    href="#waitlist"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#22d3ee)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_38px_rgba(52,211,255,0.24)] transition hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Enter Retroville
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#signal"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Trailer
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55 backdrop-blur-xl">
                  <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                  Launch sequence targeting {launchLabel}
                </div>

                <RetrovilleCountdown targetIso={launchIso} className="mt-6 w-full max-w-[430px]" />
              </div>
            </div>

            <div className="relative mt-8 h-[250px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,35,0.72),rgba(7,11,22,0.84))] lg:hidden sm:h-[320px]">
              <div className="absolute inset-x-[24%] bottom-[8%] top-[20%] rounded-full bg-[radial-gradient(circle,rgba(90,89,255,0.22),transparent_64%)] blur-3xl" />
              <div className={`absolute inset-y-[18%] left-[-12%] w-[58%] sm:left-[-4%] sm:w-[46%] ${styles.characterShellLeft}`}>
                <div className="absolute inset-[8%_0_12%_-4%] rounded-full bg-[radial-gradient(circle_at_26%_56%,rgba(45,212,255,0.18),transparent_28%),radial-gradient(circle_at_60%_50%,rgba(111,82,255,0.14),transparent_34%)] blur-3xl" />
                <Image
                  src="/images/retroville/nox-push.png"
                  alt="NOX pushing into Retroville"
                  fill
                  priority
                  sizes="(max-width: 640px) 54vw, 32vw"
                  className={`object-cover object-left-center [filter:drop-shadow(0_14px_30px_rgba(31,171,255,0.18))] ${styles.characterImageLeft}`}
                />
              </div>
              <div className={`absolute inset-y-[20%] right-[-14%] w-[66%] sm:right-[-4%] sm:w-[52%] ${styles.characterShellRight}`}>
                <div className="absolute inset-[8%_-4%_12%_0] rounded-full bg-[radial-gradient(circle_at_76%_56%,rgba(236,72,153,0.18),transparent_28%),radial-gradient(circle_at_38%_50%,rgba(45,212,255,0.12),transparent_34%)] blur-3xl" />
                <Image
                  src="/images/retroville/button-crew-push.png"
                  alt="Button Crew pushing into Retroville"
                  fill
                  priority
                  sizes="(max-width: 640px) 58vw, 36vw"
                  className={`object-cover object-right-center [filter:drop-shadow(0_14px_30px_rgba(216,72,255,0.16))] ${styles.characterImageRight}`}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="signal"
          className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]"
        >
          <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(18,27,54,0.9),rgba(27,11,42,0.88))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,255,0.12),transparent_24%),radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.16),transparent_26%)]" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-200/78">
                  Trailer Signal
                </p>
                <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                  The reveal has a pulse before it has a runtime.
                </h2>
                <p className="mt-4 max-w-[34rem] text-sm leading-7 text-slate-300 sm:text-base">
                  Retroville should feel like a universe leaking into the screen:
                  glitch light, low battery moods, displaced memories and characters
                  trying too hard to keep the city alive.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/70">
                    Netflix teaser energy
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/70">
                    AAA launch framing
                  </span>
                </div>
              </div>
              <div className="rounded-[1.7rem] border border-white/10 bg-[rgba(5,9,20,0.72)] p-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 text-center backdrop-blur-xl">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white">
                    <Play className="ml-1 h-5 w-5 fill-current" />
                  </div>
                  <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-white/55">
                    Premiere Window
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    First reveal drops with launch access.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded-[1.7rem] border border-white/10 bg-[rgba(7,12,24,0.82)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-fuchsia-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {card.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="waitlist"
          className="grid gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(84,31,108,0.36),rgba(10,17,40,0.92))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center sm:p-8"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-fuchsia-200/72">
              Waitlist
            </p>
            <h3 className="mt-3 text-4xl font-black text-white">
              Get in before the rest of the internet remembers this exists.
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Join the list for the first drop, the first reveal and the first
              playable signal from Retroville.
            </p>

            {waitlistCount > 0 ? (
              <div className="mt-6 max-w-xl rounded-[1.6rem] border border-white/10 bg-[rgba(5,9,18,0.58)] px-5 py-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>Signal strength</span>
                  <span>
                    {waitlistCount} / {hypeGoal} insiders
                  </span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-white/10">
                  <div
                    className="h-2.5 rounded-full bg-[linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)] transition-all"
                    style={{ width: `${hypePct}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-[rgba(5,9,17,0.78)] p-5">
            <RetrovilleWaitlistForm darkMode source="public" />
          </div>
        </section>

        <footer className="border-t border-white/10 pt-4 text-center text-xs uppercase tracking-[0.26em] text-white/40">
          © AdvancedRetro · Retroville is in development.
        </footer>
      </div>
    </main>
  );
}
