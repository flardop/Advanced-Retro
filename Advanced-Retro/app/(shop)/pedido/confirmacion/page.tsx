import type { Metadata } from 'next';
import Stripe from 'stripe';
import SuccessView from '@/components/sections/SuccessView';
import { buildPageMetadata } from '@/lib/seo';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export const metadata: Metadata = buildPageMetadata({
  title: 'Confirmación de pedido',
  description: 'Confirmación privada del pago completado en AdvancedRetro.es.',
  path: '/pedido/confirmacion',
  noIndex: true,
});

type ConfirmationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSessionId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || '').trim();
  return String(value || '').trim();
}

function fallbackMessage() {
  return (
    <section className="section">
      <div className="container">
        <div className="glass p-10 text-center">
          <h1 className="title-display text-3xl">No pudimos validar tu pago todavía</h1>
          <p className="mt-3 text-textMuted">
            Si acabas de pagar, espera unos segundos y recarga esta página. Si el problema continúa, vuelve al carrito o revisa tu perfil.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a href="/carrito" className="button-secondary">Volver al carrito</a>
            <a href="/perfil" className="button-primary">Ver pedidos</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function OrderConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = (await searchParams) || {};
  const sessionId = readSessionId(params.session_id);

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return fallbackMessage();
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = String(session.metadata?.orderId || '').trim() || null;
    const orderStatus =
      session.payment_status === 'paid'
        ? 'paid'
        : session.status === 'complete'
          ? 'processing'
          : session.status || null;

    return <SuccessView orderId={orderId} orderStatus={orderStatus} />;
  } catch (error) {
    console.error('Embedded checkout confirmation error:', error);
    return fallbackMessage();
  }
}
