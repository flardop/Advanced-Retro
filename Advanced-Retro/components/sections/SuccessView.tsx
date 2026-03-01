import Link from 'next/link';

type SuccessViewProps = {
  orderId?: string | null;
  orderStatus?: string | null;
};

function statusMeta(status: string | null | undefined) {
  const normalized = String(status || '').toLowerCase();
  if (['paid', 'shipped', 'delivered'].includes(normalized)) {
    return {
      title: 'Pago confirmado',
      description: 'Tu pedido ya está confirmado y en preparación.',
    };
  }
  if (normalized === 'processing') {
    return {
      title: 'Pago en validación',
      description: 'Estamos validando la confirmación del pago. Te avisamos en cuanto quede marcado como pagado.',
    };
  }
  if (normalized === 'pending') {
    return {
      title: 'Pedido pendiente de pago',
      description: 'El pedido existe, pero todavía no se ha confirmado el pago.',
    };
  }
  return {
    title: 'Pago recibido',
    description: 'Gracias por confiar en ADVANCED RETRO.',
  };
}

export default function SuccessView({ orderId, orderStatus }: SuccessViewProps) {
  const copy = statusMeta(orderStatus);
  return (
    <section className="section">
      <div className="container">
        <div className="glass p-10 text-center">
          <h1 className="title-display text-3xl">{copy.title}</h1>
          <p className="text-textMuted mt-3">{copy.description}</p>
          {orderId ? (
            <p className="text-xs text-primary mt-2">
              Pedido: {orderId.slice(0, 8)} · Estado: {orderStatus || 'desconocido'}
            </p>
          ) : null}
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/perfil" className="button-primary">Ver pedidos</Link>
            <Link href="/tienda" className="button-secondary">Seguir comprando</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
