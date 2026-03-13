import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import {
  getConciergeSetupErrorMessage,
  getSupportSetupErrorMessage,
  isSupportSetupMissing,
  releaseConciergeTicket,
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
  return NextResponse.json({ error: message || 'No se pudo liberar el encargo' }, { status: 500 });
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
    const reason = String(body?.reason || '').trim().slice(0, 280);
    const blockCurrentHelper = Boolean(body?.blockCurrentHelper);

    const ticket = await releaseConciergeTicket({
      ticketId,
      actorUserId: user.id,
      actorRole: profile.role,
      reason,
      blockCurrentHelper,
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return handleError(error);
  }
}

