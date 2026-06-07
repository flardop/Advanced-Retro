import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { loadFinanceHub } from '@/lib/financeHub';

export const dynamic = 'force-dynamic';

function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'No se pudo cargar el hub financiero' },
    { status: 500 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { user, profile } = await requireUserContext();
    const selectedDate =
      request.nextUrl.searchParams.get('date') || undefined;
    const payload = await loadFinanceHub(user.id, {
      selectedDate,
      userName: profile.name,
      email: profile.email,
    });
    return NextResponse.json(payload);
  } catch (error) {
    return handleError(error);
  }
}
