import type { Metadata } from 'next';
import Stripe from 'stripe';
import SuccessView from '@/components/sections/SuccessView';
import { buildPageMetadata } from '@/lib/seo';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export const metadata: Metadata = buildPageMetadata({
  title: 'Pedido confirmado',
  description: 'Confirmación privada del pedido completado en AdvancedRetro.es.',
  path: '/pedido-confirmado',
  noIndex: true,
});

type ConfirmedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || '').trim();
  return String(value || '').trim();
}

function fallbackMessage() {
  return (
    <section className="section">
      <div className="container">
        <div className="glass p-10 text-center">
          <h1 className="title-display text-3xl">Estamos terminando de confirmar tu pedido</h1>
          <p className="mt-3 text-textMuted">
            Si acabas de pagar, espera unos segundos y recarga esta página. Si el problema continúa, vuelve al carrito o revisa tu perfil.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a href="/carrito" className="button-secondary">Volver al carrito</a>
            <a href="/perfil#pedidos" className="button-primary">Ver mis pedidos</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function OrderConfirmedPage({ searchParams }: ConfirmedPageProps) {
  const params = (await searchParams) || {};
  const sessionId = readParam(params.session_id);
  const orderId = readParam(params.orderId);

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const metadataOrderId = String(session.metadata?.orderId || '').trim() || null;
      const orderStatus =
        session.payment_status === 'paid'
          ? 'paid'
          : session.status === 'complete'
            ? 'processing'
            : session.status || null;

      return <SuccessView orderId={metadataOrderId} orderStatus={orderStatus} />;
    } catch (error) {
      console.error('Order confirmation alias error:', error);
    }
  }

  if (orderId && supabaseAdmin) {
    try {
      const supabase = supabaseServer();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabaseAdmin
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .maybeSingle();

        return <SuccessView orderId={orderId} orderStatus={typeof data?.status === 'string' ? data.status : null} />;
      }
    } catch (error) {
      console.error('Order confirmation order lookup error:', error);
    }
  }

  return fallbackMessage();
}
