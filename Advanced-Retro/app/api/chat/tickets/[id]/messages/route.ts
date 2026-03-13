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
  return NextResponse.json(
    { error: error?.message || 'No se pudo procesar el mensaje del ticket' },
    { status: 500 }
  );
}

async function canAccessTicket(ticketId: string) {
  const ctx = await requireUserContext();
  const ticket = await getTicketById(ticketId);

  const isAdmin = ctx.profile.role === 'admin';
  const isOwner = String(ticket.user_id) === String(ctx.user.id);
  const isHelper = String((ticket as any).helper_user_id || '') === String(ctx.user.id);
  if (!isAdmin && !isOwner && !isHelper) {
    throw new ApiError(403, 'No autorizado para acceder a este ticket');
  }

  return { ctx, ticket, isAdmin, isHelper };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = String(params?.id || '').trim();
    if (!ticketId) return NextResponse.json({ error: 'ID de ticket requerido' }, { status: 400 });

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
    if (!ticketId) return NextResponse.json({ error: 'ID de ticket requerido' }, { status: 400 });

    const { ctx, ticket, isAdmin } = await canAccessTicket(ticketId);
    const body = await req.json().catch(() => null);
    const message = String(body?.message || '').trim().slice(0, 3000);
    const status = typeof body?.status === 'string' ? body.status : undefined;
    const attachments = Array.isArray(body?.attachments)
      ? body.attachments
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => ({
            type: item?.type === 'video' ? 'video' : 'image',
            url: String(item?.url || '').trim().slice(0, 600),
          }))
          .filter((item: any) => Boolean(item.url))
          .slice(0, 6)
      : [];

    if (message.length < 2 && attachments.length === 0) {
      return NextResponse.json({ error: 'Mensaje demasiado corto' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'El mensaje es demasiado largo (máximo 2000 caracteres)' },
        { status: 400 }
      );
    }

    const row = await postTicketMessage({
      ticketId: ticket.id,
      userId: ctx.user.id,
      isAdmin,
      message: message || 'Adjunto enviado',
      status: isAdmin ? (status as any) : undefined,
      attachments,
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
    if (!ticketId) return NextResponse.json({ error: 'ID de ticket requerido' }, { status: 400 });

    const { isAdmin } = await canAccessTicket(ticketId);
    if (!isAdmin) return NextResponse.json({ error: 'Solo un admin puede cambiar el estado del ticket' }, { status: 403 });

    const body = await req.json().catch(() => null);
    const status = String(body?.status || 'open').trim().toLowerCase();
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Estado de ticket no válido' }, { status: 400 });
    }

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
