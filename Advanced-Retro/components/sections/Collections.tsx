import Link from 'next/link';

export default function Collections() {
  const collections = [
    { title: 'Game Boy Clásica', subtitle: 'Cartuchos originales', href: '/tienda?category=gameboy-classic' },
    { title: 'Color Series', subtitle: 'Ediciones coloreadas', href: '/tienda?category=gameboy-color' },
    { title: 'Mystery Boxes', subtitle: 'Sorpresas premium', href: '/tienda?category=cajas-misteriosas' },
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
              <div className="mt-6 h-32 border border-line bg-surface" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
