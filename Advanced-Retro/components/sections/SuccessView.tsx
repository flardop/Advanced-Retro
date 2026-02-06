import Link from 'next/link';

export default function SuccessView() {
  return (
    <section className="section">
      <div className="container">
        <div className="glass p-10 text-center">
          <h1 className="title-display text-3xl">Pago confirmado</h1>
          <p className="text-textMuted mt-3">
            Gracias por confiar en ADVANCED RETRO.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/perfil" className="button-primary">Ver pedidos</Link>
            <Link href="/tienda" className="button-secondary">Seguir comprando</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
