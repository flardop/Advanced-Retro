import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type ExportScope =
  | 'overview'
  | 'products'
  | 'users'
  | 'orders'
  | 'financial'
  | 'social'
  | 'tickets'
  | 'listings'
  | 'performance'
  | 'user'
  | 'all';

type ExportFormat = 'csv' | 'json' | 'pdf';

type FetchResult<T> = {
  rows: T[];
  missing: boolean;
  warning?: string;
};

function parseScope(raw: string | null): ExportScope {
  const value = String(raw || '').trim().toLowerCase();
  const allowed: ExportScope[] = [
    'overview',
    'products',
    'users',
    'orders',
    'financial',
    'social',
    'tickets',
    'listings',
    'performance',
    'user',
    'all',
  ];
  return allowed.includes(value as ExportScope) ? (value as ExportScope) : 'all';
}

function parseFormat(raw: string | null): ExportFormat {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'json' || value === 'pdf' || value === 'csv') return value;
  return 'csv';
}

function parseLimit(raw: string | null): number {
  const value = Number(raw || 0);
  if (!Number.isFinite(value)) return 3000;
  return Math.min(Math.max(Math.round(value), 100), 25000);
}

function parseHours(raw: string | null): number {
  const value = Number(raw || 0);
  if (!Number.isFinite(value) || value <= 0) return 24 * 7;
  return Math.min(Math.max(Math.round(value), 1), 24 * 90);
}

function isMissingTableError(error: any, tableHint: string): boolean {
  const text = String(error?.message || '').toLowerCase();
  return (
    text.includes(tableHint.toLowerCase()) &&
    (text.includes('does not exist') ||
      text.includes('relation') ||
      text.includes('schema cache') ||
      text.includes('could not find the table'))
  );
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",;\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>, delimiter = ';'): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((h) => csvEscape(h)).join(delimiter),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(delimiter)),
  ];
  return lines.join('\n');
}

function toIsoDate(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw;
  return date.toISOString();
}

function toCents(value: unknown): number {
  const amount = Math.round(Number(value || 0));
  if (!Number.isFinite(amount)) return 0;
  return amount;
}

function centsToEurString(cents: unknown): string {
  return (toCents(cents) / 100).toFixed(2);
}

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

function buildSimplePdf(lines: string[]): Buffer {
  const chunks: string[] = ['BT', '/F1 11 Tf'];
  let y = 800;
  for (const line of lines) {
    const safe = escapePdfText(toAscii(line));
    chunks.push(`1 0 0 1 40 ${y} Tm (${safe}) Tj`);
    y -= 16;
    if (y < 40) break;
  }
  chunks.push('ET');
  const content = `${chunks.join('\n')}\n`;

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

function nowFileSuffix() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

async function fetchUsers(limit: number, userId?: string): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  let query = supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }).limit(limit);
  if (userId) query = query.eq('id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

async function fetchProducts(limit: number): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error, 'products')) {
      return { rows: [], missing: true, warning: 'Tabla products no configurada' };
    }
    throw error;
  }
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

async function fetchOrders(limit: number, userId?: string): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

async function fetchWalletTransactions(limit: number, userId?: string): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  let query = supabaseAdmin
    .from('user_wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error, 'user_wallet_transactions')) {
      return { rows: [], missing: true, warning: 'Tabla user_wallet_transactions no configurada' };
    }
    throw error;
  }
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

async function fetchWithdrawals(limit: number, userId?: string): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  let query = supabaseAdmin
    .from('user_wallet_withdrawal_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error, 'user_wallet_withdrawal_requests')) {
      return { rows: [], missing: true, warning: 'Tabla user_wallet_withdrawal_requests no configurada' };
    }
    throw error;
  }
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

async function fetchListings(limit: number, userId?: string): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  let query = supabaseAdmin
    .from('user_product_listings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error, 'user_product_listings')) {
      return { rows: [], missing: true, warning: 'Tabla user_product_listings no configurada' };
    }
    throw error;
  }
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

async function fetchTickets(limit: number, userId?: string): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  let query = supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data: tickets, error } = await query;
  if (error) {
    if (isMissingTableError(error, 'support_tickets')) {
      return { rows: [], missing: true, warning: 'Tabla support_tickets no configurada' };
    }
    throw error;
  }

  const ticketRows = Array.isArray(tickets) ? tickets : [];
  const ticketIds = ticketRows.map((row: any) => String(row?.id || '')).filter(Boolean);
  if (!ticketIds.length) return { rows: [], missing: false };

  const { data: messages, error: messageError } = await supabaseAdmin
    .from('support_messages')
    .select('ticket_id,is_admin,created_at')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit * 6, 20000));

  let messagesByTicket = new Map<string, any[]>();
  if (!messageError && Array.isArray(messages)) {
    for (const row of messages) {
      const key = String((row as any)?.ticket_id || '');
      if (!key) continue;
      const list = messagesByTicket.get(key) || [];
      list.push(row);
      messagesByTicket.set(key, list);
    }
  }

  const normalized = ticketRows.map((ticket: any) => {
    const list = messagesByTicket.get(String(ticket?.id || '')) || [];
    const adminCount = list.filter((item) => Boolean((item as any)?.is_admin)).length;
    const userCount = list.length - adminCount;
    return {
      ...ticket,
      messages_count: list.length,
      admin_messages_count: adminCount,
      user_messages_count: userCount,
      last_message_at: list.length ? String((list[0] as any)?.created_at || '') : '',
    };
  });

  return { rows: normalized, missing: false };
}

async function fetchProductSocial(limit: number): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  const { data: summaryRows, error } = await supabaseAdmin
    .from('product_social_summary')
    .select('*')
    .order('visits', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error, 'product_social_summary')) {
      return { rows: [], missing: true, warning: 'Tabla product_social_summary no configurada' };
    }
    throw error;
  }

  const rows = Array.isArray(summaryRows) ? summaryRows : [];
  const productIds = rows.map((row: any) => String(row?.product_id || '')).filter(Boolean);
  const { data: products } = productIds.length
    ? await supabaseAdmin.from('products').select('id,name,slug,category,price,stock').in('id', productIds)
    : { data: [] as any[] };
  const productMap = new Map<string, any>((products || []).map((p: any) => [String(p.id), p]));

  return {
    rows: rows.map((row: any) => {
      const product = productMap.get(String(row?.product_id || ''));
      return {
        ...row,
        product_name: String(product?.name || ''),
        product_slug: String(product?.slug || ''),
        category: String(product?.category || ''),
        catalog_price_cents: toCents(product?.price),
        catalog_stock: Math.max(0, Math.round(Number(product?.stock || 0))),
      };
    }),
    missing: false,
  };
}

async function fetchPerformance(limit: number, hours: number): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('api_performance_events')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error, 'api_performance_events')) {
      return { rows: [], missing: true, warning: 'Tabla api_performance_events no configurada' };
    }
    throw error;
  }
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

async function fetchProductLikes(limit: number, userId?: string): Promise<FetchResult<any>> {
  if (!supabaseAdmin) return { rows: [], missing: true, warning: 'Supabase not configured' };
  let query = supabaseAdmin
    .from('product_likes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error, 'product_likes')) {
      return { rows: [], missing: true, warning: 'Tabla product_likes no configurada' };
    }
    throw error;
  }
  return { rows: Array.isArray(data) ? data : [], missing: false };
}

function buildOverviewFromData(input: {
  products: any[];
  users: any[];
  orders: any[];
  walletTx: any[];
  withdrawals: any[];
  social: any[];
  listings: any[];
  tickets: any[];
}) {
  const products = input.products || [];
  const users = input.users || [];
  const orders = input.orders || [];
  const walletTx = input.walletTx || [];
  const withdrawals = input.withdrawals || [];
  const social = input.social || [];
  const listings = input.listings || [];
  const tickets = input.tickets || [];

  const grossSalesCents = orders
    .filter((row: any) => String(row?.status || '').toLowerCase() !== 'cancelled')
    .reduce((sum: number, row: any) => sum + toCents(row?.total), 0);

  const walletDebitsCents = walletTx
    .filter((row: any) => String(row?.direction || '') === 'debit')
    .reduce((sum: number, row: any) => sum + toCents(row?.amount_cents), 0);

  const walletCreditsCents = walletTx
    .filter((row: any) => String(row?.direction || '') === 'credit')
    .reduce((sum: number, row: any) => sum + toCents(row?.amount_cents), 0);

  const withdrawalsRequestedCents = withdrawals.reduce(
    (sum: number, row: any) => sum + toCents(row?.amount_cents),
    0
  );
  const withdrawalsPaidCents = withdrawals
    .filter((row: any) => String(row?.status || '').toLowerCase() === 'paid')
    .reduce((sum: number, row: any) => sum + toCents(row?.amount_cents), 0);

  const topVisitedProducts = [...social]
    .sort((a: any, b: any) => Number(b?.visits || 0) - Number(a?.visits || 0))
    .slice(0, 20)
    .map((row: any) => ({
      product_id: String(row?.product_id || ''),
      product_name: String(row?.product_name || ''),
      visits: Number(row?.visits || 0),
      likes: Number(row?.likes_count || 0),
      reviews: Number(row?.reviews_count || 0),
      rating_average: Number(row?.rating_average || 0),
    }));

  return {
    products_count: products.length,
    users_count: users.length,
    orders_count: orders.length,
    listings_count: listings.length,
    tickets_count: tickets.length,
    wallet_transactions_count: walletTx.length,
    withdrawals_count: withdrawals.length,
    social_products_count: social.length,
    gross_sales_cents: grossSalesCents,
    gross_sales_eur: centsToEurString(grossSalesCents),
    wallet_debits_cents: walletDebitsCents,
    wallet_debits_eur: centsToEurString(walletDebitsCents),
    wallet_credits_cents: walletCreditsCents,
    wallet_credits_eur: centsToEurString(walletCreditsCents),
    withdrawals_requested_cents: withdrawalsRequestedCents,
    withdrawals_requested_eur: centsToEurString(withdrawalsRequestedCents),
    withdrawals_paid_cents: withdrawalsPaidCents,
    withdrawals_paid_eur: centsToEurString(withdrawalsPaidCents),
    top_visited_products: topVisitedProducts,
  };
}

export async function GET(req: Request) {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const url = new URL(req.url);
    const scope = parseScope(url.searchParams.get('scope'));
    const format = parseFormat(url.searchParams.get('format'));
    const limit = parseLimit(url.searchParams.get('limit'));
    const hours = parseHours(url.searchParams.get('hours'));
    const userId = String(url.searchParams.get('userId') || '').trim();

    if (scope === 'user' && !userId) {
      return NextResponse.json({ error: 'userId es obligatorio para scope=user' }, { status: 400 });
    }

    const warnings: string[] = [];

    const [
      usersResult,
      productsResult,
      ordersResult,
      walletTxResult,
      withdrawalsResult,
      socialResult,
      listingsResult,
      ticketsResult,
      perfResult,
      likesResult,
    ] =
      await Promise.all([
        scope === 'users' || scope === 'all' || scope === 'overview' || scope === 'user'
          ? fetchUsers(limit, scope === 'user' ? userId : undefined)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'products' || scope === 'all' || scope === 'overview'
          ? fetchProducts(limit)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'orders' || scope === 'all' || scope === 'overview' || scope === 'financial' || scope === 'user'
          ? fetchOrders(limit, scope === 'user' ? userId : undefined)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'financial' || scope === 'all' || scope === 'overview' || scope === 'user'
          ? fetchWalletTransactions(limit, scope === 'user' ? userId : undefined)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'financial' || scope === 'all' || scope === 'overview' || scope === 'user'
          ? fetchWithdrawals(limit, scope === 'user' ? userId : undefined)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'social' || scope === 'all' || scope === 'overview'
          ? fetchProductSocial(limit)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'listings' || scope === 'all' || scope === 'overview' || scope === 'user'
          ? fetchListings(limit, scope === 'user' ? userId : undefined)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'tickets' || scope === 'all' || scope === 'overview' || scope === 'user'
          ? fetchTickets(limit, scope === 'user' ? userId : undefined)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'performance' || scope === 'all'
          ? fetchPerformance(limit, hours)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
        scope === 'user' || scope === 'all' || scope === 'social'
          ? fetchProductLikes(limit, scope === 'user' ? userId : undefined)
          : Promise.resolve({ rows: [], missing: false } as FetchResult<any>),
      ]);

    for (const result of [
      usersResult,
      productsResult,
      ordersResult,
      walletTxResult,
      withdrawalsResult,
      socialResult,
      listingsResult,
      ticketsResult,
      perfResult,
      likesResult,
    ]) {
      if (result.warning) warnings.push(result.warning);
    }

    const users = usersResult.rows;
    const products = productsResult.rows;
    const orders = ordersResult.rows;
    const walletTx = walletTxResult.rows;
    const withdrawals = withdrawalsResult.rows;
    const social = socialResult.rows;
    const listings = listingsResult.rows;
    const tickets = ticketsResult.rows;
    const performance = perfResult.rows;
    const likes = likesResult.rows;

    const generatedAt = new Date().toISOString();
    const overview = buildOverviewFromData({
      products,
      users,
      orders,
      walletTx,
      withdrawals,
      social,
      listings,
      tickets,
    });

    const userProfile = scope === 'user' ? users.find((row: any) => String(row?.id || '') === userId) || null : null;

    const jsonPayload = {
      ok: true,
      generatedAt,
      scope,
      format,
      limit,
      hours,
      warnings,
      overview,
      data: {
        userProfile,
        users,
        products,
        orders,
        wallet_transactions: walletTx,
        wallet_withdrawals: withdrawals,
        product_social_summary: social,
        product_likes: likes,
        listings,
        tickets,
        performance_events: performance,
      },
    };

    const filenameBase = `admin-export-${scope}-${nowFileSuffix()}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(jsonPayload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filenameBase}.json"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'pdf') {
      const lines: string[] = [
        `ADVANCED RETRO - EXPORT ADMIN (${scope.toUpperCase()})`,
        `Generado: ${generatedAt}`,
        `Rango de rendimiento (horas): ${hours}`,
        '',
        `Productos catalogo: ${overview.products_count}`,
        `Usuarios: ${overview.users_count}`,
        `Pedidos: ${overview.orders_count}`,
        `Anuncios comunidad: ${overview.listings_count}`,
        `Tickets soporte: ${overview.tickets_count}`,
        `Movimientos cartera: ${overview.wallet_transactions_count}`,
        `Retiradas: ${overview.withdrawals_count}`,
        `Productos con actividad social: ${overview.social_products_count}`,
        '',
        `Ventas brutas (EUR): ${overview.gross_sales_eur}`,
        `Cartera creditos (EUR): ${overview.wallet_credits_eur}`,
        `Cartera debitos (EUR): ${overview.wallet_debits_eur}`,
        `Retiradas solicitadas (EUR): ${overview.withdrawals_requested_eur}`,
        `Retiradas pagadas (EUR): ${overview.withdrawals_paid_eur}`,
        '',
        'Top productos mas visitados:',
        ...overview.top_visited_products.slice(0, 10).map(
          (item: any, index: number) =>
            `${index + 1}. ${item.product_name || item.product_id} - visitas ${item.visits}, likes ${item.likes}`
        ),
      ];
      if (warnings.length) {
        lines.push('');
        lines.push('Avisos de setup:');
        for (const warning of warnings.slice(0, 8)) lines.push(`- ${warning}`);
      }
      const pdf = buildSimplePdf(lines);
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    let csvRows: Array<Record<string, unknown>> = [];
    if (scope === 'users') {
      csvRows = users.map((row: any) => ({
        id: String(row?.id || ''),
        email: String(row?.email || ''),
        name: String(row?.name || ''),
        role: String(row?.role || 'user'),
        is_verified_seller: Boolean(row?.is_verified_seller),
        created_at: toIsoDate(row?.created_at),
        updated_at: toIsoDate(row?.updated_at),
      }));
    } else if (scope === 'products') {
      csvRows = products.map((row: any) => ({
        id: String(row?.id || ''),
        name: String(row?.name || ''),
        slug: String(row?.slug || ''),
        category: String(row?.category || ''),
        platform: String(row?.platform || ''),
        status: String(row?.status || ''),
        edition: String(row?.edition || ''),
        component_type: String(row?.component_type || ''),
        price_cents: toCents(row?.price),
        price_eur: centsToEurString(row?.price),
        stock: Math.max(0, Math.round(Number(row?.stock || 0))),
        is_mystery_box: Boolean(row?.is_mystery_box),
        created_at: toIsoDate(row?.created_at),
        updated_at: toIsoDate(row?.updated_at),
      }));
    } else if (scope === 'orders') {
      csvRows = orders.map((row: any) => ({
        id: String(row?.id || ''),
        user_id: String(row?.user_id || ''),
        status: String(row?.status || ''),
        total_cents: toCents(row?.total),
        total_eur: centsToEurString(row?.total),
        coupon_discount_cents: toCents(row?.coupon_discount),
        shipping_cost_cents: toCents(row?.shipping_cost),
        shipping_tracking_code: String(row?.shipping_tracking_code || ''),
        paid_at: toIsoDate(row?.paid_at),
        created_at: toIsoDate(row?.created_at),
        updated_at: toIsoDate(row?.updated_at),
      }));
    } else if (scope === 'financial') {
      const txRows = walletTx.map((row: any) => ({
        dataset: 'wallet_transaction',
        id: String(row?.id || ''),
        user_id: String(row?.user_id || ''),
        direction: String(row?.direction || ''),
        status: String(row?.status || ''),
        kind: String(row?.kind || ''),
        amount_cents: toCents(row?.amount_cents),
        amount_eur: centsToEurString(row?.amount_cents),
        reference_type: String(row?.reference_type || ''),
        reference_id: String(row?.reference_id || ''),
        created_at: toIsoDate(row?.created_at),
      }));
      const wdRows = withdrawals.map((row: any) => ({
        dataset: 'wallet_withdrawal',
        id: String(row?.id || ''),
        user_id: String(row?.user_id || ''),
        direction: 'debit',
        status: String(row?.status || ''),
        kind: 'withdrawal_request',
        amount_cents: toCents(row?.amount_cents),
        amount_eur: centsToEurString(row?.amount_cents),
        reference_type: 'withdrawal',
        reference_id: String(row?.wallet_transaction_id || row?.id || ''),
        created_at: toIsoDate(row?.created_at),
      }));
      csvRows = [...txRows, ...wdRows];
    } else if (scope === 'social') {
      csvRows = social.map((row: any) => ({
        product_id: String(row?.product_id || ''),
        product_name: String(row?.product_name || ''),
        product_slug: String(row?.product_slug || ''),
        category: String(row?.category || ''),
        visits: Number(row?.visits || 0),
        likes_count: Number(row?.likes_count || 0),
        reviews_count: Number(row?.reviews_count || 0),
        rating_average: Number(row?.rating_average || 0),
        catalog_price_cents: toCents(row?.catalog_price_cents),
        catalog_stock: Math.max(0, Math.round(Number(row?.catalog_stock || 0))),
        updated_at: toIsoDate(row?.updated_at),
      }));
    } else if (scope === 'tickets') {
      csvRows = tickets.map((row: any) => ({
        id: String(row?.id || ''),
        user_id: String(row?.user_id || ''),
        order_id: String(row?.order_id || ''),
        subject: String(row?.subject || ''),
        status: String(row?.status || ''),
        messages_count: Number(row?.messages_count || 0),
        admin_messages_count: Number(row?.admin_messages_count || 0),
        user_messages_count: Number(row?.user_messages_count || 0),
        last_message_at: toIsoDate(row?.last_message_at),
        created_at: toIsoDate(row?.created_at),
        updated_at: toIsoDate(row?.updated_at),
      }));
    } else if (scope === 'listings') {
      csvRows = listings.map((row: any) => ({
        id: String(row?.id || ''),
        user_id: String(row?.user_id || ''),
        title: String(row?.title || ''),
        status: String(row?.status || ''),
        delivery_status: String(row?.delivery_status || ''),
        price_cents: toCents(row?.price),
        price_eur: centsToEurString(row?.price),
        commission_cents: toCents(row?.commission_cents),
        listing_fee_cents: toCents(row?.listing_fee_cents),
        seller_net_cents:
          toCents(row?.price) - toCents(row?.commission_cents) - toCents(row?.listing_fee_cents),
        created_at: toIsoDate(row?.created_at),
        updated_at: toIsoDate(row?.updated_at),
      }));
    } else if (scope === 'performance') {
      csvRows = performance.map((row: any) => ({
        id: String(row?.id || ''),
        endpoint: String(row?.endpoint || ''),
        method: String(row?.method || ''),
        status_code: Math.round(Number(row?.status_code || 0)),
        duration_ms: Math.round(Number(row?.duration_ms || 0)),
        cache_hit: typeof row?.cache_hit === 'boolean' ? row.cache_hit : '',
        created_at: toIsoDate(row?.created_at),
      }));
    } else if (scope === 'overview') {
      csvRows = [
        {
          generated_at: generatedAt,
          products_count: overview.products_count,
          users_count: overview.users_count,
          orders_count: overview.orders_count,
          listings_count: overview.listings_count,
          tickets_count: overview.tickets_count,
          wallet_transactions_count: overview.wallet_transactions_count,
          withdrawals_count: overview.withdrawals_count,
          gross_sales_eur: overview.gross_sales_eur,
          wallet_credits_eur: overview.wallet_credits_eur,
          wallet_debits_eur: overview.wallet_debits_eur,
          withdrawals_requested_eur: overview.withdrawals_requested_eur,
          withdrawals_paid_eur: overview.withdrawals_paid_eur,
        },
      ];
    } else if (scope === 'user') {
      const user = userProfile;
      const orderCount = orders.length;
      const listingCount = listings.length;
      const ticketCount = tickets.length;
      const walletTxCount = walletTx.length;
      const withdrawalCount = withdrawals.length;
      const likesCount = likes.length;
      const totalOrdersCents = orders.reduce((sum: number, row: any) => sum + toCents(row?.total), 0);
      const userRows: Array<Record<string, unknown>> = [
        {
          dataset: 'user_summary',
          id: String(user?.id || userId),
          user_id: String(user?.id || userId),
          status: String(user?.role || ''),
          amount_cents: totalOrdersCents,
          amount_eur: centsToEurString(totalOrdersCents),
          created_at: generatedAt,
          details_json: JSON.stringify({
            email: String(user?.email || ''),
            name: String(user?.name || ''),
            is_verified_seller: Boolean(user?.is_verified_seller),
            orders_count: orderCount,
            listings_count: listingCount,
            tickets_count: ticketCount,
            wallet_transactions_count: walletTxCount,
            withdrawals_count: withdrawalCount,
            likes_count: likesCount,
          }),
        },
      ];
      for (const row of orders) {
        userRows.push({
          dataset: 'orders',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.total),
          amount_eur: centsToEurString((row as any)?.total),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            shipping_method: (row as any)?.shipping_method || '',
            tracking: (row as any)?.shipping_tracking_code || '',
          }),
        });
      }
      for (const row of walletTx) {
        userRows.push({
          dataset: 'wallet_transactions',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.amount_cents),
          amount_eur: centsToEurString((row as any)?.amount_cents),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            direction: (row as any)?.direction || '',
            kind: (row as any)?.kind || '',
            reference_type: (row as any)?.reference_type || '',
            reference_id: (row as any)?.reference_id || '',
          }),
        });
      }
      for (const row of withdrawals) {
        userRows.push({
          dataset: 'wallet_withdrawals',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.amount_cents),
          amount_eur: centsToEurString((row as any)?.amount_cents),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            payout_method: (row as any)?.payout_method || '',
            wallet_transaction_id: (row as any)?.wallet_transaction_id || '',
          }),
        });
      }
      for (const row of listings) {
        userRows.push({
          dataset: 'listings',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.price),
          amount_eur: centsToEurString((row as any)?.price),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            title: (row as any)?.title || '',
            category: (row as any)?.category || '',
            delivery_status: (row as any)?.delivery_status || '',
          }),
        });
      }
      for (const row of tickets) {
        userRows.push({
          dataset: 'tickets',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: '',
          amount_eur: '',
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            subject: (row as any)?.subject || '',
            order_id: (row as any)?.order_id || '',
            messages_count: Number((row as any)?.messages_count || 0),
          }),
        });
      }
      for (const row of likes) {
        userRows.push({
          dataset: 'product_likes',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: '',
          amount_cents: '',
          amount_eur: '',
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            product_id: (row as any)?.product_id || '',
          }),
        });
      }
      csvRows = userRows;
    } else {
      const allRows: Array<Record<string, unknown>> = [];
      for (const row of products) {
        allRows.push({
          dataset: 'products',
          id: String((row as any)?.id || ''),
          user_id: '',
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.price),
          amount_eur: centsToEurString((row as any)?.price),
          created_at: toIsoDate((row as any)?.updated_at || (row as any)?.created_at),
          details_json: JSON.stringify({
            name: (row as any)?.name || '',
            slug: (row as any)?.slug || '',
            category: (row as any)?.category || '',
            platform: (row as any)?.platform || '',
            edition: (row as any)?.edition || '',
            component_type: (row as any)?.component_type || '',
            stock: Math.max(0, Math.round(Number((row as any)?.stock || 0))),
            is_mystery_box: Boolean((row as any)?.is_mystery_box),
          }),
        });
      }
      for (const row of users) {
        allRows.push({
          dataset: 'users',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.id || ''),
          status: String((row as any)?.role || ''),
          amount_cents: '',
          amount_eur: '',
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            email: (row as any)?.email || '',
            name: (row as any)?.name || '',
            verified: Boolean((row as any)?.is_verified_seller),
          }),
        });
      }
      for (const row of orders) {
        allRows.push({
          dataset: 'orders',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.total),
          amount_eur: centsToEurString((row as any)?.total),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            shipping_method: (row as any)?.shipping_method || '',
            tracking: (row as any)?.shipping_tracking_code || '',
          }),
        });
      }
      for (const row of walletTx) {
        allRows.push({
          dataset: 'wallet_transactions',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.amount_cents),
          amount_eur: centsToEurString((row as any)?.amount_cents),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            direction: (row as any)?.direction || '',
            kind: (row as any)?.kind || '',
            reference_type: (row as any)?.reference_type || '',
            reference_id: (row as any)?.reference_id || '',
          }),
        });
      }
      for (const row of withdrawals) {
        allRows.push({
          dataset: 'wallet_withdrawals',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.amount_cents),
          amount_eur: centsToEurString((row as any)?.amount_cents),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            payout_method: (row as any)?.payout_method || '',
            wallet_transaction_id: (row as any)?.wallet_transaction_id || '',
          }),
        });
      }
      for (const row of listings) {
        allRows.push({
          dataset: 'listings',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: toCents((row as any)?.price),
          amount_eur: centsToEurString((row as any)?.price),
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            title: (row as any)?.title || '',
            category: (row as any)?.category || '',
            delivery_status: (row as any)?.delivery_status || '',
          }),
        });
      }
      for (const row of tickets) {
        allRows.push({
          dataset: 'tickets',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: String((row as any)?.status || ''),
          amount_cents: '',
          amount_eur: '',
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            subject: (row as any)?.subject || '',
            order_id: (row as any)?.order_id || '',
            messages_count: Number((row as any)?.messages_count || 0),
          }),
        });
      }
      for (const row of social) {
        allRows.push({
          dataset: 'product_social',
          id: String((row as any)?.product_id || ''),
          user_id: '',
          status: '',
          amount_cents: toCents((row as any)?.catalog_price_cents),
          amount_eur: centsToEurString((row as any)?.catalog_price_cents),
          created_at: toIsoDate((row as any)?.updated_at),
          details_json: JSON.stringify({
            product_name: (row as any)?.product_name || '',
            visits: Number((row as any)?.visits || 0),
            likes: Number((row as any)?.likes_count || 0),
            reviews: Number((row as any)?.reviews_count || 0),
            rating_average: Number((row as any)?.rating_average || 0),
          }),
        });
      }
      for (const row of likes) {
        allRows.push({
          dataset: 'product_likes',
          id: String((row as any)?.id || ''),
          user_id: String((row as any)?.user_id || ''),
          status: '',
          amount_cents: '',
          amount_eur: '',
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            product_id: (row as any)?.product_id || '',
          }),
        });
      }
      for (const row of performance) {
        allRows.push({
          dataset: 'performance_events',
          id: String((row as any)?.id || ''),
          user_id: '',
          status: String((row as any)?.status_code || ''),
          amount_cents: '',
          amount_eur: '',
          created_at: toIsoDate((row as any)?.created_at),
          details_json: JSON.stringify({
            endpoint: (row as any)?.endpoint || '',
            method: (row as any)?.method || '',
            duration_ms: Number((row as any)?.duration_ms || 0),
            cache_hit: typeof (row as any)?.cache_hit === 'boolean' ? (row as any).cache_hit : null,
          }),
        });
      }
      csvRows = allRows;
    }

    const csv = toCsv(csvRows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
