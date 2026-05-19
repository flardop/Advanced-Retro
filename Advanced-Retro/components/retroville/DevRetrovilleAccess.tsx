'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LockKeyhole, Rocket, ShieldAlert, Sparkles } from 'lucide-react';
import RetrovilleWaitlistForm from '@/components/retroville/RetrovilleWaitlistForm';
import LunaDevGuide from '@/components/retroville/LunaDevGuide';

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

const devCharacterDossiers = [
  {
    name: 'JOY & GRUMP',
    role: 'Neighbor controllers',
    district: 'Bloques residenciales',
    tags: ['Vecindario', 'Humor negro', 'Dúo civil'],
    image: '/images/retroville/dev-characters/joy-grump-sheet.png',
    notes: 'Pareja de vecinos gruñones que mete tono de sitcom adulta y conflicto cotidiano en Retroville.',
  },
  {
    name: 'TRIMP',
    role: 'Motion controller alpha',
    district: 'Arena social',
    tags: ['Competitivo', 'Showboat', 'Presencia'],
    image: '/images/retroville/dev-characters/trimp-sheet.png',
    notes: 'Figura dominante y exhibicionista. Funciona como energía de ego, ranking y espectáculo.',
  },
  {
    name: 'PATROL CREW',
    role: 'Retroville patrol operators',
    district: 'Calles / control nocturno',
    tags: ['Orden', 'Patrulla', 'Noche'],
    image: '/images/retroville/dev-characters/patrol-chief-sheet.png',
    notes: 'Brazo visible del orden en la ciudad. Fatiga, burocracia y vigilancia con humor seco.',
  },
  {
    name: 'PUBLIC CREW',
    role: 'Transport operators',
    district: 'Rutas públicas',
    tags: ['Transporte', 'Rutina', 'Calle'],
    image: '/images/retroville/dev-characters/public-crew-sheet.png',
    notes: 'Operadores del sistema público. Dan identidad a la movilidad urbana del mundo.',
  },
  {
    name: 'SHIFT STICK',
    role: 'Transit operator',
    district: 'Infraestructura urbana',
    tags: ['Transporte', 'Burnout', 'Commuter'],
    image: '/images/retroville/dev-characters/shift-stick-sheet.png',
    notes: 'Personaje muy bueno para representar cansancio funcional, horarios y la vida repetitiva de la ciudad.',
  },
  {
    name: 'CRUX',
    role: 'City Hall clerk',
    district: 'Ayuntamiento',
    tags: ['Burocracia', 'Reglas', 'Papeles'],
    image: '/images/retroville/dev-characters/crux-sheet.png',
    notes: 'Ancla institucional de Retroville. Ideal para toda la capa administrativa del universo.',
  },
  {
    name: 'NORA',
    role: 'Senior resident',
    district: 'Riverside district',
    tags: ['Civil', 'Memoria del barrio', 'Observación'],
    image: '/images/retroville/dev-characters/nora-senior-sheet.png',
    notes: 'Figura vecinal con historia y autoridad pasiva. Añade textura social y memoria colectiva.',
  },
  {
    name: 'MAYOR TUBE',
    role: 'Mayor of Retroville',
    district: 'City Hall',
    tags: ['Política', 'Poder', 'Satira'],
    image: '/images/retroville/dev-characters/mayor-tube-sheet.png',
    notes: 'Perfecto para el eje cívico-político de la serie. Carisma falso, control y propaganda.',
  },
  {
    name: 'TOMO',
    role: 'Retroville kid',
    district: 'Playground district',
    tags: ['Infancia', 'Caos', 'Barrio'],
    image: '/images/retroville/dev-characters/tomo-sheet.png',
    notes: 'Niño callejero con energía de problema constante. Muy útil para el lado más gamberro de la serie.',
  },
  {
    name: 'PIPO',
    role: 'Retroville kid',
    district: 'Playground district',
    tags: ['Infancia', 'Mala leche', 'Travieso'],
    image: '/images/retroville/dev-characters/pipo-sheet.png',
    notes: 'Complementa a Tomo con otra energía infantil más descarada y provocadora.',
  },
  {
    name: 'NANO',
    role: 'Pocket MP3 kid',
    district: 'Playground district',
    tags: ['Música', 'Dreamy', 'Nueva generación'],
    image: '/images/retroville/dev-characters/nano-sheet.png',
    notes: 'Introduce sensibilidad más blanda y contemporánea. Muy útil para ampliar el rango emocional del reparto.',
  },
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
                '💗 Luna añade glamour tóxico, tensión social y caos emocional al núcleo narrativo.',
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
                <Image src="/images/retroville/nox-styleguide.png" alt="NOX concept art" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 28vw" />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/72">NOX</p>
                <p className="mt-2 text-sm text-slate-300">Caretaker of the night shift · sarcasm-driven lead</p>
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(21,12,30,0.82)] p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-white/10">
                <Image src="/images/retroville/button-crew-styleguide.png" alt="Button Crew collective concept art" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 28vw" />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/72">BUTTON CREW</p>
                <p className="mt-2 text-sm text-slate-300">Four-button social chaos · collective noise engine</p>
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-pink-300/20 bg-[rgba(63,20,40,0.82)] p-4 sm:col-span-2">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[1.4rem] border border-white/10">
                <Image src="/images/retroville/luna-nox-lounge.png" alt="Luna junto a NOX dentro de Retroville" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 56vw" />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-pink-200/72">LUNA</p>
                <p className="mt-2 text-sm text-slate-300">Complicated controller energy · flirty chaos · emotional hazard</p>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/72">Biblia de personajes</p>
              <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">Dossiers internos del reparto civil de Retroville</h3>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-slate-300">
              Ya no estamos solo con NOX, Luna y Button Crew. Aquí queda centralizado el resto del reparto que está construyendo la sociedad,
              la burocracia, la infancia, el transporte y el orden público del universo.
            </p>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {devCharacterDossiers.map((character) => (
              <article
                key={character.name}
                className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(41,10,19,0.94),rgba(22,8,16,0.98))] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
              >
                <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/72">{character.role}</p>
                    <h4 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl">{character.name}</h4>
                    <p className="mt-2 text-sm text-slate-300">{character.district}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {character.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-3 py-3 sm:px-4 sm:py-4">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.03)]">
                    <Image
                      src={character.image}
                      alt={`${character.name} character sheet`}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 1280px) 100vw, 46vw"
                    />
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <p className="text-sm leading-relaxed text-slate-300">{character.notes}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <LunaDevGuide />

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
