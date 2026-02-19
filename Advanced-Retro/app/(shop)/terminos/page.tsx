export default function TermsPage() {
  return (
    <section className="section">
      <div className="container glass p-10 max-w-4xl space-y-6">
        <h1 className="title-display text-3xl">Términos y condiciones</h1>
        <p className="text-textMuted">
          Estos términos regulan la compra, venta y uso del servicio en ADVANCED RETRO.
        </p>

        <div>
          <h2 className="text-xl font-semibold">1. Productos</h2>
          <p className="text-textMuted mt-2">
            Cada ficha debe indicar el estado y tipo de artículo (original, repro 1:1 o mixto).
            El comprador debe revisar descripción, fotos y condiciones antes de pagar.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Pagos y pedidos</h2>
          <p className="text-textMuted mt-2">
            El pedido queda confirmado tras la validación del pago. Si hay incidencia de stock o pago,
            se contactará al cliente con alternativas o reembolso según proceda.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Servicio de encargo</h2>
          <p className="text-textMuted mt-2">
            El servicio de compra segura por encargo incluye gestión y soporte por chat. La tarifa del servicio
            cubre la intermediación y no garantiza disponibilidad inmediata de un producto concreto.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Publicaciones de usuarios</h2>
          <p className="text-textMuted mt-2">
            Solo usuarios verificados pueden publicar. Las publicaciones pasan por revisión y pueden ser
            rechazadas por información incompleta, sospecha de falsedad o incumplimiento de normas.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Contacto y soporte</h2>
          <p className="text-textMuted mt-2">
            La vía oficial de soporte es el sistema de tickets dentro de la cuenta del usuario.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">6. Envíos y seguimiento</h2>
          <p className="text-textMuted mt-2">
            Los pedidos enviados incluyen código de seguimiento cuando esté disponible.
            El estado de envío se actualiza en la cuenta del cliente.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">7. Devoluciones e incidencias</h2>
          <p className="text-textMuted mt-2">
            Cualquier incidencia debe comunicarse por ticket de soporte para su revisión.
            Se gestionará devolución o solución conforme a la normativa aplicable.
          </p>
        </div>
      </div>
    </section>
  );
}
