import type { Metadata } from 'next';
import SuccessView from '@/components/sections/SuccessView';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Pedido confirmado',
  description: 'Resumen privado de confirmación de pedido en AdvancedRetro.es.',
  path: '/success',
  noIndex: true,
});

type SuccessPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = (await searchParams) || {};
  const orderIdRaw = params.orderId;
  const orderId = typeof orderIdRaw === 'string' ? orderIdRaw.trim() : '';
  let orderStatus: string | null = null;

  if (orderId && supabaseAdmin) {
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
      orderStatus = typeof data?.status === 'string' ? data.status : null;
    }
  }

  return <SuccessView orderId={orderId || null} orderStatus={orderStatus} />;
}
