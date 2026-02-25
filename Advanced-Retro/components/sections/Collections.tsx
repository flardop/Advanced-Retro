import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

export default function Collections() {
  const collections = [
    {
      title: 'Game Boy',
      subtitle: 'Clásicos originales y edición coleccionista',
      href: '/tienda?category=platform:game-boy',
      cover: '/images/collections/game-boy.svg',
    },
    {
      title: 'Game Boy Color',
      subtitle: 'Catálogo dedicado para GBC',
      href: '/tienda?category=platform:game-boy-color',
      cover: '/images/collections/game-boy-color.svg',
    },
    {
      title: 'Game Boy Advance',
      subtitle: 'Juegos y variantes de GBA',
      href: '/tienda?category=platform:game-boy-advance',
      cover: '/images/collections/game-boy-advance.svg',
    },
    {
      title: 'Super Nintendo',
      subtitle: 'Selección SNES para coleccionismo',
      href: '/tienda?category=platform:super-nintendo',
      cover: '/images/collections/super-nintendo.svg',
    },
    {
      title: 'GameCube',
      subtitle: 'Catálogo GameCube en expansión',
      href: '/tienda?category=platform:gamecube',
      cover: '/images/collections/gamecube.svg',
    },
    {
      title: 'Consolas',
      subtitle: 'Consolas completas y cajas de consola',
      href: '/tienda?category=platform:consolas',
      cover: '/images/collections/consolas.svg',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Navegación por consola</p>
            <h2 className="title-display text-3xl mt-2">Colecciones principales</h2>
            <p className="text-textMuted">Acceso rápido al catálogo según plataforma y tipo de producto.</p>
          </div>
          <Link href="/tienda" className="button-secondary hidden sm:inline-flex">
            Ver toda la tienda
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="glass p-6 sm:p-7 hover:shadow-glow transition-all group hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-textMuted text-xs font-mono uppercase tracking-[0.12em]">Colección</p>
                <span className="text-primary text-sm transition-transform group-hover:translate-x-1">→</span>
              </div>
              <h3 className="title-display text-2xl mt-2">{c.title}</h3>
              <p className="text-textMuted mt-2 min-h-[48px]">{c.subtitle}</p>
              <div className="mt-5 h-36 rounded-xl border border-line bg-surface relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(75,228,214,.15),transparent_55%)]" />
                <SafeImage
                  src={c.cover}
                  fallbackSrc="/placeholder.svg"
                  alt={`${c.title} portada`}
                  fill
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07111b] to-transparent p-3">
                  <p className="text-xs text-textMuted">Entrar en {c.title}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-textMuted">Filtrado directo por plataforma</span>
                <span className="chip text-xs border-primary/40 text-primary">Abrir colección</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
