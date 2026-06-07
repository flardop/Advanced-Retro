import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { mutateFinanceHub } from '@/lib/financeHub';

export const dynamic = 'force-dynamic';

function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'No se pudo guardar el cambio' },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireUserContext();
    const body = await request.json().catch(() => null);
    const action = String(body?.action || '').trim();
    const payload =
      body?.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
        ? (body.payload as Record<string, unknown>)
        : {};
    const selectedDate =
      typeof body?.selectedDate === 'string' ? body.selectedDate : undefined;

    if (!action) {
      return NextResponse.json({ error: 'Falta la acción a ejecutar' }, { status: 400 });
    }

    const nextState = await mutateFinanceHub(user.id, action, payload, {
      selectedDate,
      userName: profile.name,
      email: profile.email,
    });

    return NextResponse.json(nextState);
  } catch (error) {
    return handleError(error);
  }
}
