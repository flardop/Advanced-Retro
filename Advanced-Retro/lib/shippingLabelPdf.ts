function toAscii(input: unknown): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildContentLines(lines: string[]): string {
  const chunks: string[] = ['BT', '/F1 12 Tf'];
  let y = 790;

  for (const line of lines) {
    const safe = escapePdfText(toAscii(line));
    chunks.push(`1 0 0 1 50 ${y} Tm (${safe}) Tj`);
    y -= 18;
  }

  chunks.push('ET');
  return `${chunks.join('\n')}\n`;
}

function buildPdf(content: string): Buffer {
  const objects: string[] = [];

  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push(
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj'
  );
  objects.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');
  objects.push(`5 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}endstream endobj`);

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

export function buildShippingLabelPdf(payload: {
  orderId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  trackingCode?: string | null;
}) {
  const lines = [
    'ADVANCED RETRO - ETIQUETA DE ENVIO',
    `Pedido: ${payload.orderId}`,
    `Fecha: ${new Date().toLocaleString('es-ES')}`,
    '----------------------------------------',
    `Cliente: ${payload.customerName || 'Cliente'}`,
    `Email: ${payload.customerEmail || '-'}`,
    `Telefono: ${payload.phone || '-'}`,
    '----------------------------------------',
    `Direccion: ${payload.addressLine1 || '-'}`,
    payload.addressLine2 ? `Direccion 2: ${payload.addressLine2}` : '',
    `CP: ${payload.postalCode || '-'}`,
    `Ciudad: ${payload.city || '-'}`,
    `Provincia: ${payload.state || '-'}`,
    `Pais: ${payload.country || '-'}`,
    '----------------------------------------',
    `Tracking: ${payload.trackingCode || '(pendiente)'}`,
  ].filter(Boolean);

  const content = buildContentLines(lines);
  return buildPdf(content);
}
