import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { getUserWalletSnapshot } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function GET() {
  try {
    const { user } = await requireUserContext();
    const wallet = await getUserWalletSnapshot(user.id, 30);
    return NextResponse.json({ wallet });
  } catch (error: any) {
    return handleError(error);
  }
}
