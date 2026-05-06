import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="wide-content-rail">
          <div className="glass p-8 sm:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Ficha no disponible</p>
            <h1 className="title-display mt-3 text-3xl sm:text-4xl">Producto no disponible</h1>
            <p className="mt-3 max-w-2xl text-textMuted">
              No hemos podido cargar esta ficha o el producto ya no está disponible. Te llevamos de vuelta al catálogo para que puedas seguir mirando sin salirte de la tienda.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/tienda" className="button-primary">Volver a tienda</Link>
              <Link href="/contacto" className="button-secondary">Avisar de la incidencia</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
