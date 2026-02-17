import Link from 'next/link';

export default function Collections() {
  const collections = [
    { title: 'Juegos', subtitle: 'Cartuchos y títulos principales', href: '/tienda?category=juegos-gameboy' },
    { title: 'Cajas', subtitle: 'Cajas para completar tu colección', href: '/tienda?category=cajas-gameboy' },
    { title: 'Juego Completo', subtitle: 'Opciones con caja + manual disponibles', href: '/tienda?category=juego-completo' },
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
