import nodemailer from 'nodemailer';

function isEmailEnabled(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

function buildTransporter() {
  if (!isEmailEnabled()) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function toEuro(cents: number): string {
  return `${(Math.max(0, Number(cents || 0)) / 100).toFixed(2)} €`;
}

function normalizeEmail(value: string): string {
  return String(value || '').trim();
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDeliveryStatusLabel(status: string): string {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'processing') return 'Preparando envio';
  if (normalized === 'shipped') return 'Enviado';
  if (normalized === 'delivered') return 'Entregado';
  if (normalized === 'cancelled') return 'Cancelado';
  return 'Pendiente';
}

export async function sendOrderPaidEmail(options: {
  to: string;
  orderId: string;
  totalCents: number;
}) {
  const transporter = buildTransporter();
  if (!transporter) return { skipped: true };
  const targetEmail = normalizeEmail(options.to);
  if (!targetEmail) return { skipped: true };

  const subject = `Pago confirmado · Pedido ${options.orderId.slice(0, 8)}`;
  const safeOrderId = escapeHtml(options.orderId);
  const safeTotal = escapeHtml(toEuro(options.totalCents));
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Pago confirmado</h2>
      <p>Hemos recibido tu pago correctamente.</p>
      <p><strong>Pedido:</strong> ${safeOrderId}</p>
      <p><strong>Total:</strong> ${safeTotal}</p>
      <p>Desde tu perfil puedes seguir el estado del pedido y contactar soporte.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: targetEmail,
    subject,
    html,
  });

  return { skipped: false };
}

export async function sendOrderStatusEmail(options: {
  to: string;
  orderId: string;
  status: string;
  trackingCode?: string | null;
  shippingMethod?: string | null;
  shippingCarrier?: string | null;
  shippingAddressSummary?: string | null;
}) {
  const transporter = buildTransporter();
  if (!transporter) return { skipped: true };
  const targetEmail = normalizeEmail(options.to);
  if (!targetEmail) return { skipped: true };

  const subject = `Actualización de pedido ${options.orderId.slice(0, 8)}: ${options.status}`;
  const safeOrderId = escapeHtml(options.orderId);
  const safeStatus = escapeHtml(options.status);
  const trackingBlock = options.trackingCode
    ? `<p><strong>Código de seguimiento:</strong> ${escapeHtml(options.trackingCode)}</p>`
    : '';
  const shippingMethodBlock = options.shippingMethod
    ? `<p><strong>Método de envío:</strong> ${escapeHtml(options.shippingMethod)}</p>`
    : '';
  const shippingCarrierBlock = options.shippingCarrier
    ? `<p><strong>Transportista:</strong> ${escapeHtml(options.shippingCarrier)}</p>`
    : '';
  const shippingAddressBlock = options.shippingAddressSummary
    ? `<p><strong>Dirección de entrega:</strong> ${escapeHtml(options.shippingAddressSummary)}</p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Actualización de estado</h2>
      <p>Tu pedido ha cambiado de estado.</p>
      <p><strong>Pedido:</strong> ${safeOrderId}</p>
      <p><strong>Nuevo estado:</strong> ${safeStatus}</p>
      ${shippingMethodBlock}
      ${shippingCarrierBlock}
      ${shippingAddressBlock}
      ${trackingBlock}
      <p>Puedes revisar detalles y soporte desde tu perfil.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: targetEmail,
    subject,
    html,
  });

  return { skipped: false };
}

export async function sendCommunityListingReviewEmail(options: {
  to: string;
  listingTitle: string;
  status: 'approved' | 'rejected' | 'pending_review';
  priceCents: number;
  commissionCents: number;
  listingFeeCents: number;
  adminNotes?: string | null;
}) {
  const transporter = buildTransporter();
  if (!transporter) return { skipped: true };
  const targetEmail = normalizeEmail(options.to);
  if (!targetEmail) return { skipped: true };

  const statusLabel =
    options.status === 'approved'
      ? 'Aprobada'
      : options.status === 'rejected'
        ? 'Rechazada'
        : 'Pendiente';
  const notesBlock = options.adminNotes
    ? `<p><strong>Notas del equipo:</strong> ${escapeHtml(options.adminNotes)}</p>`
    : '';

  const subject = `Marketplace comunidad: publicación ${statusLabel.toLowerCase()}`;
  const safeListingTitle = escapeHtml(options.listingTitle);
  const safeStatusLabel = escapeHtml(statusLabel);
  const safePrice = escapeHtml(toEuro(options.priceCents));
  const safeListingFee = escapeHtml(toEuro(options.listingFeeCents));
  const safeCommission = escapeHtml(toEuro(options.commissionCents));
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Actualización de tu publicación</h2>
      <p><strong>Producto:</strong> ${safeListingTitle}</p>
      <p><strong>Estado:</strong> ${safeStatusLabel}</p>
      <p><strong>Precio:</strong> ${safePrice}</p>
      <p><strong>Publicar:</strong> ${safeListingFee}</p>
      <p><strong>Comisión tienda al vender:</strong> ${safeCommission} (10%)</p>
      ${notesBlock}
      <p>Si necesitas ayuda, abre un ticket desde tu perfil.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: targetEmail,
    subject,
    html,
  });

  return { skipped: false };
}

export async function sendCommunityDeliveryEmail(options: {
  to: string;
  listingTitle: string;
  deliveryStatus: string;
  trackingCode?: string | null;
  shippingCarrier?: string | null;
  shippingNotes?: string | null;
}) {
  const transporter = buildTransporter();
  if (!transporter) return { skipped: true };
  const targetEmail = normalizeEmail(options.to);
  if (!targetEmail) return { skipped: true };

  const trackingBlock = options.trackingCode
    ? `<p><strong>Código de seguimiento:</strong> ${escapeHtml(options.trackingCode)}</p>`
    : '';
  const shippingCarrierBlock = options.shippingCarrier
    ? `<p><strong>Transportista:</strong> ${escapeHtml(options.shippingCarrier)}</p>`
    : '';
  const notesBlock = options.shippingNotes
    ? `<p><strong>Notas de entrega:</strong> ${escapeHtml(options.shippingNotes)}</p>`
    : '';

  const statusLabel = toDeliveryStatusLabel(options.deliveryStatus);
  const safeListingTitle = escapeHtml(options.listingTitle);
  const safeStatusLabel = escapeHtml(statusLabel);
  const subject = `Marketplace comunidad: ${statusLabel} · ${options.listingTitle}`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Actualización de entrega</h2>
      <p><strong>Producto:</strong> ${safeListingTitle}</p>
      <p><strong>Estado:</strong> ${safeStatusLabel}</p>
      ${shippingCarrierBlock}
      ${trackingBlock}
      ${notesBlock}
      <p>Te seguiremos informando por email cuando cambie el estado.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: targetEmail,
    subject,
    html,
  });

  return { skipped: false };
}
