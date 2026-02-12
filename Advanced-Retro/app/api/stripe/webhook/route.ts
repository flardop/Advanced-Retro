import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import PDFDocument from 'pdfkit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

async function generateShippingLabelPdf(order: any) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text('Etiqueta de envío', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Order ID: ${order.id}`);
      doc.text(`Cliente: ${order.email || order.user_email || 'N/A'}`);
      doc.text(`Total: ${order.total}`);
      doc.moveDown();
      doc.text('Dirección de envío:', { underline: true });
      doc.text(order.shipping_address || 'No especificada');
      doc.moveDown();
      doc.text('Productos:', { underline: true });
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((it: any) => {
          doc.text(`- ${it.name} x ${it.quantity} @ ${it.unit_price}`);
        });
      }
      doc.moveDown(2);
      doc.text('Tracking:', { underline: true });
      doc.text(order.tracking_code || 'PENDIENTE');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId && supabaseAdmin) {
        // marcar como pagado
        await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId);

        // obtener datos de la orden y sus items (intenta joined query)
        const { data: orderData, error: orderErr } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (!orderData || orderErr) {
          console.warn('Order fetch failed for', orderId, orderErr?.message);
        } else {
          // preparar objeto para PDF
          const pdfPayload: any = {
            id: orderData.id,
            total: orderData.total,
            items: (orderData.order_items || []).map((it: any) => ({
              name: it.product_id || it.product_name || 'Producto',
              quantity: it.quantity,
              unit_price: it.unit_price,
            })),
            shipping_address: orderData.shipping_address || null,
            user_email: orderData.user_email || null,
            tracking_code: null,
          };

          // generar PDF
          try {
            const pdfBuffer = await generateShippingLabelPdf(pdfPayload);
            const filename = `labels/${orderId}.pdf`;
            // subir a Supabase Storage (bucket 'public' por defecto)
            const { error: upErr } = await supabaseAdmin.storage.from(process.env.SUPABASE_LABELS_BUCKET || 'public').upload(filename, pdfBuffer, { upsert: true });
            if (upErr) {
              console.warn('Failed to upload label for', orderId, upErr.message);
            } else {
              const { publicURL } = supabaseAdmin.storage.from(process.env.SUPABASE_LABELS_BUCKET || 'public').getPublicUrl(filename);
              // insertar en tabla shipments (si existe)
              await supabaseAdmin.from('shipments').insert({ order_id: orderId, label_url: publicURL, tracking_code: null }).maybeSingle();
            }
          } catch (pdfErr) {
            console.warn('PDF generation failed', pdfErr);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
