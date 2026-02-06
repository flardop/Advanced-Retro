export default function Benefits() {
  const benefits = [
    { title: 'Curación premium', text: 'Productos revisados y catalogados con precisión.' },
    { title: 'Envios protegidos', text: 'Empaque profesional para coleccionistas.' },
    { title: 'Pagos seguros', text: 'Stripe Checkout con Apple Pay y Google Pay.' },
  ];

  return (
    <section className="section">
      <div className="container grid gap-6 lg:grid-cols-3">
        {benefits.map((b) => (
          <div key={b.title} className="glass p-6">
            <p className="text-primary text-xs font-mono">ADVANCED RETRO</p>
            <h3 className="font-semibold text-text mt-2">{b.title}</h3>
            <p className="text-textMuted mt-2">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
