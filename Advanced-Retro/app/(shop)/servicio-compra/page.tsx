import Link from 'next/link';

export default function ConciergeServicePage() {
  return (
    <section className="section">
      <div className="container max-w-5xl space-y-8">
        <div className="glass p-8">
          <p className="chip inline-flex">Servicio Premium</p>
          <h1 className="title-display text-4xl mt-4">Compra segura por encargo (5 €)</h1>
          <p className="text-textMuted mt-3 text-lg">
            Si buscas un juego concreto, nosotros lo localizamos al mejor precio de mercado, verificamos estado
            y autenticidad, y te acompañamos por chat privado hasta la entrega.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="border border-line p-4 bg-surface">
              <p className="text-sm text-textMuted">Tarifa de seguridad</p>
              <p className="text-2xl text-primary font-semibold mt-1">5,00 €</p>
              <p className="text-xs text-textMuted mt-2">Incluye gestion y seguimiento del encargo.</p>
            </div>
            <div className="border border-line p-4 bg-surface">
              <p className="text-sm text-textMuted">Asesoria privada</p>
              <p className="text-2xl text-text font-semibold mt-1">1:1 por chat</p>
              <p className="text-xs text-textMuted mt-2">Revision de ofertas y validacion antes de comprar.</p>
            </div>
            <div className="border border-line p-4 bg-surface">
              <p className="text-sm text-textMuted">Objetivo</p>
              <p className="text-2xl text-text font-semibold mt-1">Ahorro + seguridad</p>
              <p className="text-xs text-textMuted mt-2">Evitar copias malas y pagar precio justo.</p>
            </div>
          </div>
        </div>

        <div className="glass p-8">
          <h2 className="title-display text-2xl">Como funciona</h2>
          <div className="mt-4 grid gap-3">
            <div className="border border-line p-4">
              <p className="font-semibold">1. Nos dices que quieres conseguir</p>
              <p className="text-textMuted text-sm mt-1">
                Juego, edicion, estado esperado (solo cartucho, completo, caja+manual, etc.) y presupuesto.
              </p>
            </div>
            <div className="border border-line p-4">
              <p className="font-semibold">2. Pagas 5 € de reserva segura</p>
              <p className="text-textMuted text-sm mt-1">
                Activamos tu seguimiento por chat privado y empezamos la busqueda en mercado real.
              </p>
            </div>
            <div className="border border-line p-4">
              <p className="font-semibold">3. Te enviamos opciones verificadas</p>
              <p className="text-textMuted text-sm mt-1">
                Te proponemos alternativas con precio estimado, estado y recomendacion de compra.
              </p>
            </div>
            <div className="border border-line p-4">
              <p className="font-semibold">4. Confirmas y cerramos la compra</p>
              <p className="text-textMuted text-sm mt-1">
                Solo aprobamos la operacion contigo, y te mantenemos informado hasta la entrega final.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contacto" className="button-primary">
              Solicitar encargo
            </Link>
            <Link href="/tienda" className="button-secondary">
              Ver catalogo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
