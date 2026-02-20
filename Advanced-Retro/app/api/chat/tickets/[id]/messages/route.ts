import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import {
  getSupportSetupErrorMessage,
  getTicketById,
  getTicketMessages,
  isSupportSetupMissing,
  postTicketMessage,
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
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

async function canAccessTicket(ticketId: string) {
  const ctx = await requireUserContext();
  const ticket = await getTicketById(ticketId);

  const isAdmin = ctx.profile.role === 'admin';
  const isOwner = String(ticket.user_id) === String(ctx.user.id);
  if (!isAdmin && !isOwner) {
    throw new ApiError(403, 'Forbidden');
  }

  return { ctx, ticket, isAdmin };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = String(params?.id || '').trim();
    if (!ticketId) return NextResponse.json({ error: 'Ticket id required' }, { status: 400 });

    const { ticket } = await canAccessTicket(ticketId);
    const messages = await getTicketMessages(ticket.id);

    return NextResponse.json({ ticket, messages });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = String(params?.id || '').trim();
    if (!ticketId) return NextResponse.json({ error: 'Ticket id required' }, { status: 400 });

    const { ctx, ticket, isAdmin } = await canAccessTicket(ticketId);
    const body = await req.json().catch(() => null);
    const message = String(body?.message || '').trim();
    const status = typeof body?.status === 'string' ? body.status : undefined;

    if (message.length < 2) {
      return NextResponse.json({ error: 'Mensaje demasiado corto' }, { status: 400 });
    }

    const row = await postTicketMessage({
      ticketId: ticket.id,
      userId: ctx.user.id,
      isAdmin,
      message,
      status: isAdmin ? (status as any) : undefined,
    });

    return NextResponse.json({ message: row });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = String(params?.id || '').trim();
    if (!ticketId) return NextResponse.json({ error: 'Ticket id required' }, { status: 400 });

    const { isAdmin } = await canAccessTicket(ticketId);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => null);
    const status = String(body?.status || 'open').trim();

    await postTicketMessage({
      ticketId,
      userId: null,
      isAdmin: true,
      message: `Estado actualizado a: ${status}`,
      status: status as any,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleError(error);
  }
}
