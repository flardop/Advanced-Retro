import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function withdrawalsSetupErrorMessage() {
  return 'Falta configurar retiradas de cartera. Ejecuta SQL: database/wallet_withdrawal_requests_mvp.sql';
}

function isMissingWithdrawalsTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('user_wallet_withdrawal_requests') && message.includes('does not exist');
}

export async function GET(req: Request) {
  try {
    await requireAdminContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const url = new URL(req.url);
    const statusParam = String(url.searchParams.get('status') || 'all').trim().toLowerCase();
    const search = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 150), 1), 300);

    let query = supabaseAdmin
      .from('user_wallet_withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    const { data: rows, error } = await query;
    if (error) {
      if (isMissingWithdrawalsTableError(error)) {
        return NextResponse.json(
          { requests: [], setupRequired: true, error: withdrawalsSetupErrorMessage() },
          { status: 503 }
        );
      }
      throw error;
    }

    const requests = Array.isArray(rows) ? rows : [];
    const userIds = [...new Set(requests.map((row: any) => String(row?.user_id || '')).filter(Boolean))];
    const reviewedByIds = [...new Set(requests.map((row: any) => String(row?.reviewed_by || '')).filter(Boolean))];
    const allUserIds = [...new Set([...userIds, ...reviewedByIds])];

    const { data: usersRows } = allUserIds.length
      ? await supabaseAdmin
          .from('users')
          .select('id,email,name,avatar_url')
          .in('id', allUserIds)
      : { data: [] as any[] };

    const userMap = new Map<string, any>((usersRows || []).map((row: any) => [String(row.id), row]));

    const filtered = search
      ? requests.filter((row: any) => {
          const seller = userMap.get(String(row.user_id));
          const reviewer = userMap.get(String(row.reviewed_by));
          const haystack = [
            String(row?.id || ''),
            String(row?.status || ''),
            String(seller?.email || ''),
            String(seller?.name || ''),
            String(reviewer?.email || ''),
            String(row?.note || ''),
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(search);
        })
      : requests;

    const normalized = filtered.map((row: any) => ({
      id: String(row?.id || ''),
      user_id: String(row?.user_id || ''),
      amount_cents: Math.max(0, Math.round(Number(row?.amount_cents || 0))),
      status: String(row?.status || 'pending'),
      payout_method: typeof row?.payout_method === 'string' ? row.payout_method : 'manual_transfer',
      payout_details:
        row?.payout_details && typeof row.payout_details === 'object' && !Array.isArray(row.payout_details)
          ? row.payout_details
          : {},
      note: typeof row?.note === 'string' ? row.note : null,
      admin_note: typeof row?.admin_note === 'string' ? row.admin_note : null,
      wallet_transaction_id: typeof row?.wallet_transaction_id === 'string' ? row.wallet_transaction_id : null,
      reviewed_by: typeof row?.reviewed_by === 'string' ? row.reviewed_by : null,
      reviewed_at: typeof row?.reviewed_at === 'string' ? row.reviewed_at : null,
      paid_at: typeof row?.paid_at === 'string' ? row.paid_at : null,
      created_at: typeof row?.created_at === 'string' ? row.created_at : null,
      updated_at: typeof row?.updated_at === 'string' ? row.updated_at : null,
      user: row?.user_id ? userMap.get(String(row.user_id)) || null : null,
      reviewer: row?.reviewed_by ? userMap.get(String(row.reviewed_by)) || null : null,
    }));

    const summary = normalized.reduce(
      (acc, row) => {
        acc.total += 1;
        acc.amount_cents += row.amount_cents;
        acc.by_status[row.status] = (acc.by_status[row.status] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        amount_cents: 0,
        by_status: {} as Record<string, number>,
      }
    );

    return NextResponse.json({
      requests: normalized,
      summary,
      setupRequired: false,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
