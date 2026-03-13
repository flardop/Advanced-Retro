import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import {
  claimConciergeTicket,
  getConciergeSetupErrorMessage,
  getSupportSetupErrorMessage,
  isSupportSetupMissing,
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
  const message = String(error?.message || '');
  if (message.includes('flujo de ayuda de encargos')) {
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
  return NextResponse.json({ error: message || 'No se pudo reclamar el encargo' }, { status: 500 });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = String(params?.id || '').trim();
    if (!ticketId) {
      return NextResponse.json({ error: 'ID de ticket requerido' }, { status: 400 });
    }

    const { user, profile } = await requireUserContext();
    const body = await req.json().catch(() => null);
    const termsAccepted = Boolean(body?.termsAccepted);

    const ticket = await claimConciergeTicket({
      ticketId,
      helperUserId: user.id,
      helperProfile: {
        id: user.id,
        email: user.email || null,
        name: profile.name,
      },
      termsAccepted,
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return handleError(error);
  }
}

