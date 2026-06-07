'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Bebas_Neue } from 'next/font/google';
import { useLocale } from '@/components/LocaleProvider';

const heroDisplay = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
});

const quickLinks = [
  { label: 'Game Boy', href: '/tienda?category=platform:game-boy' },
  { label: 'Game Boy Color', href: '/tienda?category=platform:game-boy-color' },
  { label: 'Game Boy Advance', href: '/tienda?category=platform:game-boy-advance' },
  { label: 'Super Nintendo', href: '/tienda?category=platform:super-nintendo' },
  { label: 'GameCube', href: '/tienda?category=platform:gamecube' },
];

const heroBoxes = [
  {
    tier: 'standard',
    name: 'Mystery Box Standard',
    href: '/mystery-boxes',
    image: '/images/mystery/mystery-standard.webp',
    accent: 'from-sky-400/50 to-fuchsia-500/50',
    className:
      'lg:left-0 lg:top-[16%] lg:-rotate-[9deg] lg:scale-[0.88] lg:opacity-80',
  },
  {
    tier: 'premium',
    name: 'Mystery Box Premium',
    href: '/mystery-boxes',
    image: '/images/mystery/mystery-premium.webp',
    accent: 'from-violet-400/55 to-cyan-400/55',
    className:
      'lg:right-[8%] lg:top-[11%] lg:rotate-[8deg] lg:scale-[0.94] lg:opacity-90',
  },
  {
    tier: 'vip',
    name: 'Mystery Box VIP',
    href: '/mystery-boxes',
    image: '/images/mystery/mystery-vip.webp',
    accent: 'from-amber-300/60 to-violet-500/60',
    className: 'lg:left-[22%] lg:top-[22%] lg:z-20 lg:scale-[1.04]',
  },
];

const statTargets = [
  { value: 2400, suffix: '+', es: 'productos', en: 'products' },
  { value: 1200, suffix: '+', es: 'clientes', en: 'customers' },
  { value: 98, suffix: '%', es: 'satisfacción', en: 'satisfaction' },
];

export default function Hero() {
  const { locale } = useLocale();
  const [counts] = useState(statTargets.map((stat) => stat.value));

  const copy = useMemo(
    () =>
      locale === 'en'
        ? {
            badge: 'The most exclusive retro store',
            title: 'ADVANCEDRETRO',
            subtitle:
              'Collectibles, consoles and retro video games with curated stock, sharp presentation and zero filler.',
            primaryCta: 'Explore store',
            secondaryCta: 'View Mystery Boxes',
            capsule: 'Exclusive drops',
            shelfTitle: 'Curated mystery stack',
            shelfBody:
              'Three tiers, three different moods. Click any box to jump into the mystery flow.',
          }
        : {
            badge: 'La tienda retro más exclusiva',
            title: 'ADVANCEDRETRO',
            subtitle:
              'Coleccionables, consolas y videojuegos retro. Calidad garantizada, stock curado y una experiencia de compra sin ruido.',
            primaryCta: 'Explorar tienda',
            secondaryCta: 'Ver Mystery Boxes',
            capsule: 'Drops exclusivos',
            shelfTitle: 'Stack Mystery curado',
            shelfBody:
              'Tres niveles, tres perfiles de drop. Pulsa cualquier caja para entrar al flujo mystery.',
          },
    [locale]
  );

  return (
    <section className="hero-section section relative overflow-hidden pt-4 sm:pt-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(44,193,255,0.16),transparent_28%),radial-gradient(circle_at_74%_24%,rgba(198,67,255,0.18),transparent_32%),linear-gradient(135deg,#0a0a0f_0%,#10142a_48%,#1a0a2e_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      <div className="hero-scanlines pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="hero-particles pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={`hero-particle-${index}`}
            className="hero-particle absolute rounded-full bg-white/70"
            style={{
              left: `${6 + index * 5.1}%`,
              top: `${10 + (index % 6) * 12}%`,
              width: `${index % 2 === 0 ? 3 : 2}px`,
              height: `${index % 2 === 0 ? 3 : 2}px`,
              animationDelay: `${index * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="container relative">
        <div className="content-rail">
          <div className="hero-shell overflow-hidden rounded-[1.7rem] border border-white/10 bg-[rgba(5,8,16,0.72)] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <div className="grid gap-0 xl:min-h-[clamp(40rem,72vh,48rem)] xl:grid-cols-[1.18fr,0.82fr] 2xl:grid-cols-[1.12fr,0.88fr]">
              <div className="hero-copy relative min-w-0 p-5 sm:p-8 lg:p-10 xl:flex xl:flex-col xl:justify-start xl:p-10 2xl:p-14">
                <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary shadow-[0_0_24px_rgba(75,228,214,0.15)] sm:text-xs sm:tracking-[0.18em]">
                  <span className="text-sm">🎮</span>
                  <span className="min-w-0">{copy.badge}</span>
                </div>

                <h1
                  aria-label={copy.title}
                  className={`${heroDisplay.className} title-display mt-5 max-w-[9.2ch] text-[clamp(3.25rem,15vw,4.7rem)] uppercase leading-[0.9] text-white sm:mt-6 lg:text-[clamp(4rem,5.8vw,5.25rem)] xl:max-w-[8.9ch] 2xl:max-w-none 2xl:text-[clamp(5.35rem,5vw,6.15rem)]`}
                >
                  <span className="block 2xl:inline">ADVANCED</span>
                  <span className="block 2xl:ml-[0.05em] 2xl:inline">RETRO</span>
                </h1>

                <p className="mobile-safe-wrap mt-4 max-w-full text-base leading-relaxed text-slate-300 sm:max-w-[38rem] sm:text-lg xl:max-w-[34rem]">
                  {copy.subtitle}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link href="/tienda" className="button-primary w-full min-w-0 text-center sm:w-auto">
                    {copy.primaryCta}
                  </Link>
                  <Link href="/mystery-boxes" className="button-secondary w-full min-w-0 text-center sm:w-auto">
                    {copy.secondaryCta}
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="chip min-w-0 justify-center px-2 text-center leading-tight hover:border-primary/50 hover:text-text sm:justify-start sm:px-3"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-8 grid max-w-[42rem] gap-3 sm:grid-cols-3">
                  {statTargets.map((stat, index) => (
                    <div
                      key={`hero-stat-${stat.es}`}
                      className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4"
                    >
                      <p className="text-[11px] uppercase tracking-[0.14em] text-textMuted">
                        {locale === 'en' ? stat.en : stat.es}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {counts[index].toLocaleString(locale === 'en' ? 'en-GB' : 'es-ES')}
                        {stat.suffix}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hero-media relative min-w-0 border-t border-white/10 bg-[radial-gradient(circle_at_50%_24%,rgba(105,74,255,0.24),transparent_30%),linear-gradient(160deg,#0d1323,#090d17)] p-4 sm:p-6 xl:border-l xl:border-t-0 xl:p-7 2xl:p-8">
                <div className="rounded-[1.55rem] border border-white/10 bg-[rgba(8,14,26,0.68)] p-4 sm:p-5 xl:flex xl:h-full xl:flex-col">
                  <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-primary">{copy.capsule}</p>
                      <h2 className="mt-1 text-xl font-semibold text-white">{copy.shelfTitle}</h2>
                    </div>
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      VIP FRONT
                    </span>
                  </div>

                  <p className="mobile-safe-wrap max-w-full text-sm leading-relaxed text-textMuted sm:max-w-[28rem]">
                    {copy.shelfBody}
                  </p>

                  <div className="relative mt-6 flex gap-4 overflow-x-auto pb-2 lg:min-h-[540px] lg:flex-1 lg:items-center lg:justify-center lg:overflow-visible">
                    {heroBoxes.map((box, index) => (
                      <Link
                        key={box.tier}
                        href={box.href}
                        className={`group relative min-w-[78vw] flex-1 rounded-[1.5rem] border border-white/10 bg-[rgba(10,16,28,0.88)] p-3 shadow-[0_24px_60px_rgba(2,6,18,0.3)] transition duration-500 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_24px_80px_rgba(109,71,255,0.35)] sm:min-w-[240px] lg:absolute lg:w-[58%] ${box.className}`}
                        style={{ animationDelay: `${index * 0.35}s` }}
                      >
                        <div className={`absolute inset-0 rounded-[1.4rem] bg-gradient-to-br ${box.accent} opacity-0 blur-2xl transition duration-500 group-hover:opacity-70`} />
                        <div className="relative">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                              {box.tier}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-textMuted">
                              AdvancedRetro
                            </span>
                          </div>
                          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(121,99,255,0.16),transparent_40%),rgba(5,10,18,0.9)]">
                            <Image
                              src={box.image}
                              alt={box.name}
                              fill
                              priority
                              sizes="(max-width: 1024px) 70vw, 30vw"
                              className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-scanlines {
          background-image: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.16),
            rgba(255, 255, 255, 0.16) 1px,
            transparent 1px,
            transparent 4px
          );
          background-size: 100% 4px;
        }

        .hero-particle {
          animation: heroParticleFloat 9s ease-in-out infinite;
          box-shadow: 0 0 14px rgba(125, 211, 252, 0.55);
        }

        @keyframes heroParticleFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.24;
          }
          50% {
            transform: translate3d(0, -18px, 0);
            opacity: 0.8;
          }
        }
      `}</style>
    </section>
  );
}
