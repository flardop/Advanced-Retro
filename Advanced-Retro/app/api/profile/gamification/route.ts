import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { awardDailyLoginXpIfNeeded, getGamificationSnapshot, grantXpToUser } from '@/lib/gamificationServer';

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

    await grantXpToUser({
      userId: user.id,
      actionKey: 'account_created',
      dedupeKey: `account-created:${user.id}`,
      metadata: { source: 'profile_gamification_bootstrap' },
    });

    await awardDailyLoginXpIfNeeded(user.id);

    const gamification = await getGamificationSnapshot(user.id);
    return NextResponse.json({ gamification });
  } catch (error: any) {
    return handleError(error);
  }
}
