import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingWithdrawalsTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('user_wallet_withdrawal_requests') && message.includes('does not exist');
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>, delimiter = ';'): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((h) => csvEscape(h)).join(delimiter),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(delimiter)),
  ];
  return lines.join('\n');
}

export async function GET(req: Request) {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const url = new URL(req.url);
    const status = String(url.searchParams.get('status') || 'all').trim().toLowerCase();
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 1000), 1), 5000);

    let query = supabaseAdmin
      .from('user_wallet_withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') query = query.eq('status', status);

    const { data: requests, error } = await query;
    if (error) {
      if (isMissingWithdrawalsTableError(error)) {
        return NextResponse.json(
          { error: 'Falta configurar retiradas. Ejecuta SQL: database/wallet_withdrawal_requests_mvp.sql' },
          { status: 503 }
        );
      }
      throw error;
    }

    const rows = Array.isArray(requests) ? requests : [];
    const userIds = [...new Set(rows.flatMap((row: any) => [row?.user_id, row?.reviewed_by]).filter(Boolean).map(String))];
    const { data: users } = userIds.length
      ? await supabaseAdmin.from('users').select('id,email,name').in('id', userIds)
      : { data: [] as any[] };
    const userMap = new Map<string, any>((users || []).map((u: any) => [String(u.id), u]));

    const filtered = q
      ? rows.filter((row: any) => {
          const user = userMap.get(String(row?.user_id || ''));
          const reviewer = userMap.get(String(row?.reviewed_by || ''));
          const haystack = [
            String(row?.id || ''),
            String(row?.status || ''),
            String(user?.email || ''),
            String(user?.name || ''),
            String(reviewer?.email || ''),
            String(row?.note || ''),
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : rows;

    const exportRows = filtered.map((row: any) => {
      const user = userMap.get(String(row?.user_id || ''));
      const reviewer = userMap.get(String(row?.reviewed_by || ''));
      const details =
        row?.payout_details && typeof row.payout_details === 'object' && !Array.isArray(row.payout_details)
          ? row.payout_details
          : {};
      return {
        id: String(row?.id || ''),
        created_at: String(row?.created_at || ''),
        updated_at: String(row?.updated_at || ''),
        status: String(row?.status || ''),
        amount_eur: (Math.round(Number(row?.amount_cents || 0)) / 100).toFixed(2),
        amount_cents: Math.round(Number(row?.amount_cents || 0)),
        user_id: String(row?.user_id || ''),
        user_email: String(user?.email || ''),
        user_name: String(user?.name || ''),
        payout_method: String(row?.payout_method || ''),
        account_holder: String((details as any)?.account_holder || ''),
        iban_masked: String((details as any)?.iban_masked || ''),
        bank_name: String((details as any)?.bank_name || ''),
        country: String((details as any)?.country || ''),
        note: String(row?.note || ''),
        admin_note: String(row?.admin_note || ''),
        reviewed_by: String(row?.reviewed_by || ''),
        reviewed_by_email: String(reviewer?.email || ''),
        reviewed_at: String(row?.reviewed_at || ''),
        paid_at: String(row?.paid_at || ''),
        wallet_transaction_id: String(row?.wallet_transaction_id || ''),
      };
    });

    const csv = toCsv(exportRows);
    const filename = `wallet-withdrawals-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
