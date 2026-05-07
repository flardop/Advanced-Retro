import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { loadProfileDashboard } from '@/lib/profileDashboard';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'No se pudieron exportar tus datos' }, { status: 500 });
}

export async function GET() {
  try {
    const { user, profile } = await requireUserContext();
    const dashboard = await loadProfileDashboard(user.id, profile);
    const payload = {
      exported_at: new Date().toISOString(),
      account_id: user.id,
      email: user.email || profile.email,
      data: dashboard,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="advancedretro-profile-${user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (error: any) {
    return handleError(error);
  }
}
