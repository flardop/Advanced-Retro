import Link from 'next/link';
import Image from 'next/image';

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="title-display text-3xl">Colecciones</h2>
            <p className="text-textMuted">Explora por categoría premium.</p>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {collections.map((c) => (
            <Link key={c.title} href={c.href} className="glass p-8 hover:shadow-glow transition-shadow">
              <p className="text-textMuted text-xs font-mono">Colección</p>
              <h3 className="title-display text-2xl mt-2">{c.title}</h3>
              <p className="text-textMuted mt-2">{c.subtitle}</p>
              <div className="mt-6 h-32 border border-line bg-surface relative overflow-hidden">
                <Image src={c.cover} alt={`${c.title} portada`} fill className="object-cover" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
