import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { getUserWalletSnapshot } from '@/lib/wallet';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: { userId: string };
};

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await requireAdminContext();

    const userId = String(params?.userId || '').trim();
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const url = new URL(req.url);
    const txLimit = Math.min(Math.max(Number(url.searchParams.get('tx_limit') || 40), 1), 100);

    const wallet = await getUserWalletSnapshot(userId, txLimit);

    let user: any = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, avatar_url, is_verified_seller, created_at')
        .eq('id', userId)
        .maybeSingle();
      user = data || null;
    }

    return NextResponse.json({ user, wallet });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
