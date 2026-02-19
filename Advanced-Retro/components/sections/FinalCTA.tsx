import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="section">
      <div className="container">
        <div className="glass p-8 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Siguiente paso</p>
            <h2 className="title-display text-3xl mt-3">Construye tu colección con una tienda preparada para escalar.</h2>
            <p className="text-textMuted mt-3">
              Catálogo por plataformas, fichas de producto completas, compras seguras y soporte directo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/tienda" className="button-primary">Entrar a la tienda</Link>
            <Link href="/servicio-compra" className="button-secondary">Abrir encargo</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
