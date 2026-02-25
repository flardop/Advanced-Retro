import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

const SUPPORT_SETUP_SQL = 'database/admin_chat_seller_features.sql';

function isConciergeTicketSubject(subject: string): boolean {
  const normalized = String(subject || '').trim().toLowerCase();
  return normalized.includes('encargo');
}

export function sanitizeMessage(input: unknown): string {
  if (typeof input !== 'string') return '';
  const value = input.trim().replace(/\s+/g, ' ');
  if (!value) return '';
  return value.slice(0, 2000);
}

function normalizeStatus(input: unknown): TicketStatus {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'in_progress') return 'in_progress';
  if (value === 'resolved') return 'resolved';
  if (value === 'closed') return 'closed';
  return 'open';
}

function normalizeErrorText(error: any): string {
  return String(error?.message || error || '')
    .trim()
    .toLowerCase();
}

export function isSupportSetupMissing(error: any): boolean {
  const text = normalizeErrorText(error);
  if (!text) return false;

  const tableMentioned =
    text.includes('support_tickets') ||
    text.includes('support_messages') ||
    text.includes('public.support_tickets') ||
    text.includes('public.support_messages');

  const missingHint =
    text.includes('schema cache') ||
    text.includes('does not exist') ||
    text.includes('relation') ||
    text.includes('could not find the table');

  return tableMentioned && missingHint;
}

export function getSupportSetupErrorMessage(): string {
  return `Falta configurar el sistema de tickets en Supabase. Ejecuta ${SUPPORT_SETUP_SQL} en SQL Editor y recarga.`;
}

export async function ensureTicketForOrder(options: {
  orderId: string;
  userId: string;
  orderTotalCents?: number;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { orderId, userId, orderTotalCents } = options;
  const nowIso = new Date().toISOString();

  const { data: existingTicket } = await supabaseAdmin
    .from('support_tickets')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existingTicket?.id) return existingTicket;

  const subject = `Pedido ${orderId.slice(0, 8)} · ${(Number(orderTotalCents || 0) / 100).toFixed(2)} €`;

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      user_id: userId,
      order_id: orderId,
      subject,
      status: 'open',
      updated_at: nowIso,
    })
    .select('*')
    .single();

  if (ticketError || !ticket) {
    throw new Error(ticketError?.message || 'No se pudo crear el ticket de soporte');
  }

  const { error: messageError } = await supabaseAdmin.from('support_messages').insert({
    ticket_id: ticket.id,
    user_id: null,
    is_admin: true,
    message: 'Pedido registrado. Puedes usar este chat para dudas de envío, autenticidad y estado.',
  });

  if (messageError) {
    throw new Error(messageError.message);
  }

  return ticket;
}

export async function createUserTicket(options: {
  userId: string;
  subject: string;
  orderId?: string | null;
  firstMessage: string;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const safeSubject = String(options.subject || '').trim().slice(0, 140) || 'Consulta general';
  const safeMessage = sanitizeMessage(options.firstMessage);
  if (safeMessage.length < 2) throw new Error('Mensaje demasiado corto');

  const nowIso = new Date().toISOString();

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      user_id: options.userId,
      order_id: options.orderId || null,
      subject: safeSubject,
      status: 'open',
      updated_at: nowIso,
    })
    .select('*')
    .single();

  if (ticketError || !ticket) {
    throw new Error(ticketError?.message || 'No se pudo crear el ticket');
  }

  const { error: messageError } = await supabaseAdmin.from('support_messages').insert({
    ticket_id: ticket.id,
    user_id: options.userId,
    is_admin: false,
    message: safeMessage,
  });

  if (messageError) throw new Error(messageError.message);

  if (isConciergeTicketSubject(safeSubject)) {
    await supabaseAdmin.from('support_messages').insert({
      ticket_id: ticket.id,
      user_id: null,
      is_admin: true,
      message:
        'Canal verificado de encargo activo. Este chat conecta comprador y tienda para seguimiento 1:1.',
    });
  }

  return ticket;
}

export async function getTicketById(ticketId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error || !data) throw new Error(error?.message || 'Ticket no encontrado');
  return data;
}

export async function getTicketMessages(ticketId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data, error } = await supabaseAdmin
    .from('support_messages')
    .select('id,ticket_id,user_id,is_admin,message,created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function postTicketMessage(options: {
  ticketId: string;
  userId: string | null;
  isAdmin: boolean;
  message: string;
  status?: TicketStatus;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const safeMessage = sanitizeMessage(options.message);
  if (safeMessage.length < 2) throw new Error('Mensaje demasiado corto');

  const nowIso = new Date().toISOString();

  const { data: messageRow, error: messageError } = await supabaseAdmin
    .from('support_messages')
    .insert({
      ticket_id: options.ticketId,
      user_id: options.userId,
      is_admin: options.isAdmin,
      message: safeMessage,
    })
    .select('*')
    .single();

  if (messageError || !messageRow) {
    throw new Error(messageError?.message || 'No se pudo enviar el mensaje del ticket');
  }

  const updatePayload: Record<string, unknown> = { updated_at: nowIso };
  if (options.status) {
    updatePayload.status = normalizeStatus(options.status);
  } else if (options.isAdmin) {
    updatePayload.status = 'in_progress';
  }

  await supabaseAdmin.from('support_tickets').update(updatePayload).eq('id', options.ticketId);

  return messageRow;
}

export async function listUserTickets(userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data: tickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select('id,user_id,order_id,subject,status,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  const ticketIds = (tickets || []).map((ticket) => ticket.id);
  if (ticketIds.length === 0) return [];

  const { data: messages } = await supabaseAdmin
    .from('support_messages')
    .select('ticket_id,message,created_at,is_admin')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false });

  const lastByTicket = new Map<string, any>();
  for (const message of messages || []) {
    if (!lastByTicket.has(message.ticket_id)) {
      lastByTicket.set(message.ticket_id, message);
    }
  }

  return (tickets || []).map((ticket) => ({
    ...ticket,
    last_message: lastByTicket.get(ticket.id) || null,
  }));
}

export async function listAdminTickets() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data: tickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select('id,user_id,order_id,subject,status,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(400);

  if (error) throw new Error(error.message);

  const userIds = [...new Set((tickets || []).map((ticket) => ticket.user_id).filter(Boolean))];
  const ticketIds = (tickets || []).map((ticket) => ticket.id);

  const { data: users } = userIds.length
    ? await supabaseAdmin
        .from('users')
        .select('id,email,name')
        .in('id', userIds)
    : { data: [] as any[] };

  const { data: messages } = ticketIds.length
    ? await supabaseAdmin
        .from('support_messages')
        .select('ticket_id,message,created_at,is_admin')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] };

  const userMap = new Map<string, any>((users || []).map((user) => [user.id, user]));
  const lastByTicket = new Map<string, any>();
  for (const message of messages || []) {
    if (!lastByTicket.has(message.ticket_id)) {
      lastByTicket.set(message.ticket_id, message);
    }
  }

  return (tickets || []).map((ticket) => ({
    ...ticket,
    user: userMap.get(ticket.user_id) || null,
    last_message: lastByTicket.get(ticket.id) || null,
  }));
}
