export default function Benefits() {
  const benefits = [
    {
      badge: '01',
      title: 'Inspección y catalogación',
      text: 'Cada producto se publica con estado, stock y detalle útil para compra real.',
    },
    {
      badge: '02',
      title: 'Logística para coleccionista',
      text: 'Preparación protegida y seguimiento de pedido para minimizar riesgos en piezas delicadas.',
    },
    {
      badge: '03',
      title: 'Soporte postcompra',
      text: 'Tickets privados comprador ↔ tienda para resolver incidencias y consultas rápidas.',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Por qué comprar aquí</p>
          <h2 className="title-display text-3xl mt-2">Diseñado para convertir visitas en confianza</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
        {benefits.map((b) => (
          <div key={b.title} className="glass p-6 sm:p-7">
            <p className="text-xs font-mono text-primary tracking-[0.12em]">ADVANCED RETRO · {b.badge}</p>
            <h3 className="font-semibold text-text text-lg mt-2">{b.title}</h3>
            <p className="text-textMuted mt-3">{b.text}</p>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
