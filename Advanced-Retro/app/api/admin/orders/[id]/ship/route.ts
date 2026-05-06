import { NextRequest } from 'next/server';
import { withAdminRoute } from '@/lib/admin/api';
import { listAdminOrders } from '@/lib/admin/data';
import { sendEmailFromTemplate } from '@/lib/admin/emailService';
import { supabaseService } from '@/lib/supabase/service';

function buildTrackingUrl(company: string, trackingNumber: string) {
  const number = encodeURIComponent(trackingNumber);
  const normalized = company.toLowerCase();
  if (normalized.includes('correos')) return `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${number}`;
  if (normalized.includes('dhl')) return `https://www.dhl.com/es-es/home/tracking/tracking-express.html?submit=1&tracking-id=${number}`;
  if (normalized.includes('ups')) return `https://www.ups.com/track?tracknum=${number}`;
  if (normalized.includes('fedex')) return `https://www.fedex.com/fedextrack/?tracknumbers=${number}`;
  if (normalized.includes('gls')) return `https://gls-group.com/ES/es/seguimiento-paquete?match=${number}`;
  if (normalized.includes('seur')) return `https://www.seur.com/livetracking/?segOnlineIdentificador=${number}`;
  return '';
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminRoute(async (session) => {
    if (!supabaseService) throw new Error('Supabase service role no configurado');
    const payload = await request.json();
    const status = String(payload.status || 'shipped');
    const company = String(payload.shipping_company || 'Correos');
    const trackingNumber = String(payload.tracking_number || '').trim();
    const trackingUrl = String(payload.tracking_url || buildTrackingUrl(company, trackingNumber) || '');
    const estimatedDelivery = payload.estimated_delivery_date || null;

    await supabaseService.from('orders').update({
      status,
      shipping_tracking_code: trackingNumber || null,
      updated_at: new Date().toISOString(),
    }).eq('id', params.id);

    await supabaseService.from('admin_order_meta').upsert({
      order_id: params.id,
      shipping_company: company,
      tracking_url: trackingUrl || null,
      estimated_delivery_date: estimatedDelivery,
      fulfillment_status: status,
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'order_id' });

    await supabaseService.from('admin_order_status_events').insert({
      order_id: params.id,
      status,
      note: `Cambio administrativo a ${status}`,
      changed_by: session.user.id,
    });

    const orders = await listAdminOrders();
    const order = orders.find((row: any) => String(row.id) === params.id);
    if (order?.user?.email) {
      await sendEmailFromTemplate({
        templateIdOrName: 'shipping_notification',
        to: String(order.user.email),
        recipientUserId: String(order.user.id || ''),
        variables: {
          name: order.user.name || order.user.full_name || order.user.email,
          order_id: String(order.id).slice(0, 8).toUpperCase(),
          carrier: company,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          estimated_delivery: estimatedDelivery || '',
        },
      });
    }

    return { shipped: true };
  });
}
