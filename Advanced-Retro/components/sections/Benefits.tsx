export default function Benefits() {
  const benefits = [
    {
      badge: '01',
      title: 'Inspección antes de publicar',
      text: 'Cada artículo entra con estado real, fotos claras y estructura de datos consistente para filtrar mejor.',
    },
    {
      badge: '02',
      title: 'Envío preparado para coleccionismo',
      text: 'Protección de piezas sensibles y trazabilidad de pedido para reducir incidencias en entrega.',
    },
    {
      badge: '03',
      title: 'Soporte humano en todo el flujo',
      text: 'Tickets privados para compras, encargos y comunidad con respuesta contextual.',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Por qué funciona</p>
            <h2 className="title-display mt-2 text-3xl sm:text-4xl">Confianza medible en cada compra</h2>
          </div>
          <span className="chip">Flujo pensado para convertir</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="glass p-5 sm:p-6">
              <p className="text-xs font-mono tracking-[0.14em] text-primary">ADVANCED RETRO · {benefit.badge}</p>
              <h3 className="mt-2 text-lg font-semibold text-text">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-textMuted">{benefit.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
