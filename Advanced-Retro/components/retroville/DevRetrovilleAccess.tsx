'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LockKeyhole, Rocket, ShieldAlert, Sparkles } from 'lucide-react';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';

const ACCESS_KEY = 'retroville_dev_auth';
const REQUIRED_PASSWORD = 'test1';

function readAccessFlag() {
  if (typeof window === 'undefined') return false;
  const localValue = window.localStorage.getItem(ACCESS_KEY);
  if (localValue === '1') return true;
  const sessionValue = window.sessionStorage.getItem(ACCESS_KEY);
  if (sessionValue === '1') {
    window.localStorage.setItem(ACCESS_KEY, '1');
    return true;
  }
  return false;
}

const progressCards = [
  { label: 'Motor del mundo', state: 'En desarrollo', progress: 40, color: 'from-amber-400 to-orange-500' },
  { label: 'Sistema de personajes', state: 'En diseño', progress: 20, color: 'from-cyan-400 to-blue-500' },
  { label: 'Arcade engine', state: 'No iniciado', progress: 0, color: 'from-rose-400 to-fuchsia-500' },
  { label: 'Marketplace Retroville', state: 'Planificado', progress: 10, color: 'from-emerald-400 to-green-500' },
  { label: 'Sistema de torneos', state: 'No iniciado', progress: 0, color: 'from-violet-400 to-purple-500' },
];

export default function DevRetrovilleAccess() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUnlocked(readAccessFlag());
  }, []);

  const shellClass = useMemo(
    () =>
      error
        ? 'animate-[retroville-shake_420ms_ease-in-out]'
        : '',
    [error]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password === REQUIRED_PASSWORD) {
      window.sessionStorage.setItem(ACCESS_KEY, '1');
      window.localStorage.setItem(ACCESS_KEY, '1');
      setUnlocked(true);
      setPassword('');
      setError(false);
      return;
    }
    setError(true);
    window.setTimeout(() => setError(false), 500);
  }

  if (!unlocked) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060b] px-6 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.24),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:auto,100%_4px] opacity-80" />
        <div className={`relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-[rgba(7,10,18,0.88)] p-7 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl ${shellClass}`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <p className="mt-5 text-center text-xs uppercase tracking-[0.3em] text-fuchsia-200/70">Modo preview privado</p>
          <h1 className="mt-3 text-center text-3xl font-black uppercase tracking-[0.12em] text-white">dev.retroville</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
            Acceso restringido al equipo. Esta URL no está pensada para compartirse fuera del entorno de trabajo.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Introduce la clave"
              className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110">
              <ShieldAlert className="h-4 w-4" />
              Entrar en la preview
            </button>
            {error ? <p className="text-center text-sm text-red-300">Clave incorrecta. Usa la credencial compartida por el equipo.</p> : null}
          </form>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.22em] text-white/35">Password de preview: test1</p>
        </div>
        <style jsx global>{`
          @keyframes retroville-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(7px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(4px); }
          }
        `}</style>
      </section>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06070d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,100%_4px] opacity-75" />
      <div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'radial-gradient(2px 2px at 12% 18%, rgba(255,255,255,0.55), transparent), radial-gradient(3px 3px at 66% 24%, rgba(255,255,255,0.45), transparent), radial-gradient(2px 2px at 82% 72%, rgba(255,255,255,0.55), transparent), radial-gradient(2px 2px at 36% 66%, rgba(255,255,255,0.4), transparent)' }} />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 sm:px-8 lg:px-12">
        <header className="rounded-[2rem] border border-white/10 bg-[rgba(8,10,18,0.8)] px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/72">Preview interna</p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.16em] text-white sm:text-5xl">RETROVILLE</h1>
            </div>
            <Link href="/retroville" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
              Ver teaser público
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              <Sparkles className="h-4 w-4" />
              Modo preview · acceso restringido al equipo
            </div>
            <h2 className="text-4xl font-black leading-[0.95] text-white sm:text-6xl">El próximo gran proyecto del universo AdvancedRetro.</h2>
            <p className="max-w-2xl text-base leading-relaxed text-slate-300">
              Retroville será una plataforma retro nueva: una ciudad digital, un arcade online, un espacio de marketplace y un mundo narrativo donde la cultura gaming vintage deja de ser catálogo y se convierte en universo vivo.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                '🌍 Mundo virtual retro con zonas, tiendas y eventos.',
                '🎮 Arcade online multijugador accesible desde navegador.',
                '🏆 Torneos retro con premios y narrativa de progresión.',
                '🛒 Marketplace integrado dentro del propio mundo.',
                '👾 Personajes originales y avatar personalizable.',
                '📺 Retroville TV para streams, clips y unboxings.',
              ].map((item) => (
                <div key={item} className="rounded-[1.3rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(29,10,20,0.82)] p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-white/10">
                <Image src="/images/retroville/nox-styleguide.png" alt="PIXEL-X concept art" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 28vw" />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/72">PIXEL-X</p>
                <p className="mt-2 text-sm text-slate-300">ATK 61 · DEF 48 · SPD 34</p>
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(21,12,30,0.82)] p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-white/10">
                <Image src="/images/retroville/button-crew-styleguide.png" alt="BYTE-NOVA collective concept art" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 28vw" />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/72">BYTE-NOVA Collective</p>
                <p className="mt-2 text-sm text-slate-300">ATK 72 · DEF 39 · SPD 70</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {progressCards.map((card) => (
            <article key={card.label} className="rounded-[1.6rem] border border-white/10 bg-[rgba(8,10,18,0.76)] p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">{card.label}</p>
              <p className="mt-3 text-lg font-semibold text-white">{card.state}</p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className={`h-2 rounded-full bg-gradient-to-r ${card.color}`} style={{ width: `${card.progress}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-300">{card.progress}%</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[rgba(8,10,18,0.8)] p-6 backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1fr,420px] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/72">Newsletter de preview</p>
              <h3 className="mt-3 text-3xl font-black text-white">Únete al círculo interno antes del reveal completo.</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Si estás siguiendo el proyecto desde desarrollo, deja tu email y tu rol. Esto nos ayuda a segmentar feedback y futuras invitaciones privadas.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5">
              <RetrovilleWaitlistForm
                source="dev"
                showRole
                buttonLabel="Entrar en la preview"
                successMessage="Quedas dentro de la preview list de Retroville."
                darkMode
              />
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-4 text-center text-xs uppercase tracking-[0.24em] text-white/40">
          © AdvancedRetro — Retroville está en desarrollo. No compartir esta URL.
        </footer>
      </div>
      <style jsx global>{`
        @keyframes retroville-idle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </main>
  );
}
