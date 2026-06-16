'use client';

import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';

const platformLinks = [
  { label: 'Game Boy', href: '/tienda/game-boy' },
  { label: 'Game Boy Color', href: '/tienda/game-boy-color' },
  { label: 'Game Boy Advance', href: '/tienda/game-boy-advance' },
  { label: 'Super Nintendo', href: '/tienda/super-nintendo' },
  { label: 'GameCube', href: '/tienda/gamecube' },
];

export default function StoreIdentitySplit() {
  const { locale } = useLocale();

  const copy =
    locale === 'en'
      ? {
          kicker: 'What is each thing',
          title: 'The store sells retro. Retroville expands the universe.',
          storeTitle: 'AdvancedRetro.es store',
          storeBody:
            'Buy retro games, consoles, boxes, manuals and inserts with real photos, visible condition and support from Spain.',
          storePoints: ['Platform-first browsing', 'Curated stock with real availability', 'Human support before and after purchase'],
          storeCta: 'Open store',
          aboutCta: 'About the project',
          universeTitle: 'Retroville universe',
          universeBody:
            'Retroville is the original narrative layer of the brand: characters, districts, pitch materials and worldbuilding. It does not replace the catalog.',
          universeCta: 'Visit Retroville',
          platformLabel: 'Most searched platforms',
        }
      : {
          kicker: 'Qué es cada cosa',
          title: 'La tienda vende retro. Retroville expande el universo.',
          storeTitle: 'Tienda AdvancedRetro.es',
          storeBody:
            'Compra juegos retro, consolas, cajas, manuales e inserts con fotos reales, estado visible y soporte desde España.',
          storePoints: ['Navegación por plataforma', 'Stock curado con disponibilidad real', 'Soporte humano antes y después de comprar'],
          storeCta: 'Abrir tienda',
          aboutCta: 'Quiénes somos',
          universeTitle: 'Universo Retroville',
          universeBody:
            'Retroville es la capa narrativa original de la marca: personajes, barrios, materiales de pitch y worldbuilding. No sustituye al catálogo.',
          universeCta: 'Entrar en Retroville',
          platformLabel: 'Plataformas más buscadas',
        };

  return (
    <section className="section pt-3">
      <div className="container">
        <div className="section-heading">
          <div className="section-copy">
            <p className="section-kicker">{copy.kicker}</p>
            <h2 className="title-display mt-3 text-3xl sm:text-4xl">{copy.title}</h2>
          </div>
        </div>

        <div className="content-rail grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
          <article className="glass p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary">STORE</p>
            <h3 className="mt-3 text-2xl font-semibold text-text">{copy.storeTitle}</h3>
            <p className="mt-3 max-w-[50rem] leading-relaxed text-textMuted">{copy.storeBody}</p>

            <ul className="mt-5 grid gap-2 text-sm text-textMuted sm:grid-cols-3">
              {copy.storePoints.map((point) => (
                <li
                  key={point}
                  className="rounded-xl border border-line bg-[rgba(10,18,30,0.58)] px-4 py-3"
                >
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.12em] text-textMuted">{copy.platformLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {platformLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="chip border-primary/40 text-primary">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link href="/tienda" className="button-primary w-full text-center sm:w-auto">
                {copy.storeCta}
              </Link>
              <Link href="/about" className="button-secondary w-full text-center sm:w-auto">
                {copy.aboutCta}
              </Link>
            </div>
          </article>

          <article className="glass flex flex-col justify-between p-6 sm:p-7">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary">UNIVERSE</p>
              <h3 className="mt-3 text-2xl font-semibold text-text">{copy.universeTitle}</h3>
              <p className="mt-3 leading-relaxed text-textMuted">{copy.universeBody}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip">Serie original</span>
              <span className="chip">Personajes</span>
              <span className="chip">Distritos</span>
              <span className="chip">Material de pitch</span>
            </div>

            <div className="mt-6">
              <Link href="/retroville" className="button-secondary w-full text-center sm:w-auto">
                {copy.universeCta}
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
