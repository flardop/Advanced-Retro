import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { isMissingWalletTableError, walletSetupErrorMessage } from '@/lib/wallet';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function toSafeCents(value: unknown) {
  return Math.max(0, Math.round(Number(value || 0)));
}

export async function GET(req: Request) {
  try {
    await requireAdminContext();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const url = new URL(req.url);
    const search = String(url.searchParams.get('q') || '')
      .trim()
      .toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 120), 1), 300);

    const { data: usersRows, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, avatar_url, is_verified_seller, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (usersError) throw usersError;

    const users = Array.isArray(usersRows) ? usersRows : [];
    const filteredUsers = search
      ? users.filter((row: any) => {
          const haystack = [
            String(row?.email || ''),
            String(row?.name || ''),
            String(row?.id || ''),
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(search);
        })
      : users;

    const userIds = filteredUsers
      .map((row: any) => String(row?.id || '').trim())
      .filter(Boolean);

    let accountRows: any[] = [];
    if (userIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('user_wallet_accounts')
        .select('*')
        .in('user_id', userIds);

      if (error) {
        if (isMissingWalletTableError(error)) {
          return NextResponse.json({
            wallets: [],
            setup_required: true,
            error: walletSetupErrorMessage(),
          });
        }
        throw error;
      }

      accountRows = Array.isArray(data) ? data : [];
    }

    const accountByUserId = new Map<string, any>(
      accountRows.map((row: any) => [String(row?.user_id || ''), row])
    );

    const wallets = filteredUsers.map((row: any) => {
      const userId = String(row?.id || '');
      const account = accountByUserId.get(userId);
      return {
        user: {
          id: userId,
          email: typeof row?.email === 'string' ? row.email : '',
          name: typeof row?.name === 'string' ? row.name : null,
          role: row?.role === 'admin' ? 'admin' : 'user',
          avatar_url: typeof row?.avatar_url === 'string' ? row.avatar_url : null,
          is_verified_seller: Boolean(row?.is_verified_seller),
          created_at: typeof row?.created_at === 'string' ? row.created_at : null,
        },
        account: {
          user_id: userId,
          balance_cents: toSafeCents(account?.balance_cents),
          pending_cents: toSafeCents(account?.pending_cents),
          total_earned_cents: toSafeCents(account?.total_earned_cents),
          total_withdrawn_cents: toSafeCents(account?.total_withdrawn_cents),
          created_at: typeof account?.created_at === 'string' ? account.created_at : null,
          updated_at: typeof account?.updated_at === 'string' ? account.updated_at : null,
          initialized: Boolean(account),
        },
      };
    });

    const summary = wallets.reduce(
      (acc, item) => {
        acc.users += 1;
        acc.initialized += item.account.initialized ? 1 : 0;
        acc.balance_cents += item.account.balance_cents;
        acc.pending_cents += item.account.pending_cents;
        acc.total_earned_cents += item.account.total_earned_cents;
        acc.total_withdrawn_cents += item.account.total_withdrawn_cents;
        return acc;
      },
      {
        users: 0,
        initialized: 0,
        balance_cents: 0,
        pending_cents: 0,
        total_earned_cents: 0,
        total_withdrawn_cents: 0,
      }
    );

    return NextResponse.json({
      wallets,
      summary,
      setup_required: false,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
