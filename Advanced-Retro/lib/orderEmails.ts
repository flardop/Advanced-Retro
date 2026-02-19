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

export async function sendOrderPaidEmail(options: {
  to: string;
  orderId: string;
  totalCents: number;
}) {
  const transporter = buildTransporter();
  if (!transporter) return { skipped: true };

  const subject = `Pago confirmado · Pedido ${options.orderId.slice(0, 8)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Pago confirmado</h2>
      <p>Hemos recibido tu pago correctamente.</p>
      <p><strong>Pedido:</strong> ${options.orderId}</p>
      <p><strong>Total:</strong> ${toEuro(options.totalCents)}</p>
      <p>Desde tu perfil puedes seguir el estado del pedido y contactar soporte.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
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
}) {
  const transporter = buildTransporter();
  if (!transporter) return { skipped: true };

  const subject = `Actualización de pedido ${options.orderId.slice(0, 8)}: ${options.status}`;
  const trackingBlock = options.trackingCode
    ? `<p><strong>Código de seguimiento:</strong> ${options.trackingCode}</p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Actualización de estado</h2>
      <p>Tu pedido ha cambiado de estado.</p>
      <p><strong>Pedido:</strong> ${options.orderId}</p>
      <p><strong>Nuevo estado:</strong> ${options.status}</p>
      ${trackingBlock}
      <p>Puedes revisar detalles y soporte desde tu perfil.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
    subject,
    html,
  });

  return { skipped: false };
}
