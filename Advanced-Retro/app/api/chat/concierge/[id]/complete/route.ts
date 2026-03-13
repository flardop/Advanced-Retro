import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import {
  completeConciergeTicket,
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
  return NextResponse.json({ error: message || 'No se pudo completar el encargo' }, { status: 500 });
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
    const summary = String(body?.summary || '').trim().slice(0, 600);
    const resolutionForm =
      body?.resolutionForm && typeof body.resolutionForm === 'object' && !Array.isArray(body.resolutionForm)
        ? body.resolutionForm
        : null;

    const ticket = await completeConciergeTicket({
      ticketId,
      actorUserId: user.id,
      actorRole: profile.role,
      summary,
      resolutionForm,
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return handleError(error);
  }
}

