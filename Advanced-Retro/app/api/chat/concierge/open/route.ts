import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import {
  getConciergeSetupErrorMessage,
  getSupportSetupErrorMessage,
  isSupportSetupMissing,
  listOpenConciergeTickets,
} from '@/lib/supportTickets';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (isSupportSetupMissing(error)) {
    return NextResponse.json(
      {
        error: getSupportSetupErrorMessage(),
        setupRequired: true,
      },
      { status: 503 }
    );
  }
  const text = String(error?.message || '');
  if (text.includes('flujo de ayuda de encargos')) {
    return NextResponse.json(
      {
        error: getConciergeSetupErrorMessage(),
        setupRequired: true,
      },
      { status: 503 }
    );
  }
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'No se pudieron cargar encargos abiertos' }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const { user } = await requireUserContext();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || 30);

    const tickets = await listOpenConciergeTickets({
      helperUserId: user.id,
      limit,
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    return handleError(error);
  }
}

