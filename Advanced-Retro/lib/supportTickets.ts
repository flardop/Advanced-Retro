import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ConciergeState = 'open' | 'claimed' | 'needs_reassign' | 'completed' | 'cancelled';

const SUPPORT_SETUP_SQL = 'database/admin_chat_seller_features.sql';
const CONCIERGE_SETUP_SQL = 'database/supabase_archivos/24_concierge_helper_flow.sql';
const CONCIERGE_INACTIVITY_HOURS = 72;
const TICKET_SELECT_BASE = 'id,user_id,order_id,subject,status,created_at,updated_at';
const TICKET_SELECT_EXTENDED = [
  'id',
  'user_id',
  'order_id',
  'subject',
  'status',
  'ticket_type',
  'concierge_state',
  'helper_user_id',
  'helper_claimed_at',
  'helper_terms_accepted_at',
  'helper_inactive_deadline',
  'blocked_helper_ids',
  'preferred_helper_id',
  'completed_at',
  'resolution_payload',
  'created_at',
  'updated_at',
].join(',');

type TicketRow = {
  id: string;
  user_id: string;
  order_id?: string | null;
  subject: string;
  status: TicketStatus;
  ticket_type?: 'support' | 'concierge' | string | null;
  concierge_state?: ConciergeState | string | null;
  helper_user_id?: string | null;
  helper_claimed_at?: string | null;
  helper_terms_accepted_at?: string | null;
  helper_inactive_deadline?: string | null;
  blocked_helper_ids?: string[] | null;
  preferred_helper_id?: string | null;
  completed_at?: string | null;
  resolution_payload?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type UserSummary = {
  id: string;
  email?: string | null;
  name?: string | null;
};

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

function normalizeConciergeState(input: unknown): ConciergeState {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'claimed') return 'claimed';
  if (value === 'needs_reassign') return 'needs_reassign';
  if (value === 'completed') return 'completed';
  if (value === 'cancelled') return 'cancelled';
  return 'open';
}

function normalizeErrorText(error: any): string {
  return String(error?.message || error || '')
    .trim()
    .toLowerCase();
}

function hasMissingColumnError(error: any, columnName: string): boolean {
  const text = normalizeErrorText(error);
  return text.includes('column') && text.includes(columnName.toLowerCase());
}

function hasMissingConciergeColumns(error: any): boolean {
  const text = normalizeErrorText(error);
  if (!text) return false;
  const columns = [
    'ticket_type',
    'concierge_state',
    'helper_user_id',
    'helper_claimed_at',
    'helper_terms_accepted_at',
    'helper_inactive_deadline',
    'blocked_helper_ids',
    'preferred_helper_id',
    'resolution_payload',
  ];
  return columns.some((column) => text.includes(column));
}

function isConciergeTicketRow(ticket: Partial<TicketRow> | null | undefined): boolean {
  if (!ticket) return false;
  if (String(ticket.ticket_type || '').toLowerCase() === 'concierge') return true;
  return isConciergeTicketSubject(String(ticket.subject || ''));
}

function toSafeHelperList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))];
}

function computeInactivityDeadline(now: Date): string {
  return new Date(now.getTime() + CONCIERGE_INACTIVITY_HOURS * 60 * 60 * 1000).toISOString();
}

async function appendSystemTicketMessage(options: {
  ticketId: string;
  message: string;
  userId?: string | null;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  await supabaseAdmin.from('support_messages').insert({
    ticket_id: options.ticketId,
    user_id: options.userId || null,
    is_admin: true,
    message: sanitizeMessage(options.message),
  });
}

async function updateHelperCounters(options: {
  userId: string;
  activeDelta?: number;
  completedDelta?: number;
  reputationDelta?: number;
}) {
  if (!supabaseAdmin) return;
  const activeDelta = Math.trunc(Number(options.activeDelta || 0));
  const completedDelta = Math.trunc(Number(options.completedDelta || 0));
  const reputationDelta = Math.trunc(Number(options.reputationDelta || 0));
  if (!activeDelta && !completedDelta && !reputationDelta) return;

  try {
    const { data: current } = await supabaseAdmin
      .from('users')
      .select('helper_active_count,helper_completed_count,helper_reputation')
      .eq('id', options.userId)
      .maybeSingle();

    if (!current) return;

    const nextActive = Math.max(0, Number((current as any).helper_active_count || 0) + activeDelta);
    const nextCompleted = Math.max(0, Number((current as any).helper_completed_count || 0) + completedDelta);
    const nextReputation = Math.max(0, Number((current as any).helper_reputation || 0) + reputationDelta);

    await supabaseAdmin
      .from('users')
      .update({
        helper_active_count: nextActive,
        helper_completed_count: nextCompleted,
        helper_reputation: nextReputation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.userId);
  } catch {
    // Legacy schemas can miss helper columns. Ignore and keep workflow active.
  }
}

async function fetchTicketsWithFallback(queryBuilder: any) {
  const extendedQuery = queryBuilder.select(TICKET_SELECT_EXTENDED);
  const extendedResult = await extendedQuery;
  if (!extendedResult.error) return { data: extendedResult.data as TicketRow[], error: null };
  if (!hasMissingConciergeColumns(extendedResult.error)) {
    return { data: null, error: extendedResult.error };
  }

  const fallbackQuery = queryBuilder.select(TICKET_SELECT_BASE);
  const fallbackResult = await fallbackQuery;
  if (fallbackResult.error) return { data: null, error: fallbackResult.error };

  const fallbackData = (fallbackResult.data || []).map((ticket: any) => ({
    ...ticket,
    ticket_type: isConciergeTicketSubject(String(ticket.subject || '')) ? 'concierge' : 'support',
    concierge_state: isConciergeTicketSubject(String(ticket.subject || '')) ? 'open' : null,
    helper_user_id: null,
    helper_claimed_at: null,
    helper_terms_accepted_at: null,
    helper_inactive_deadline: null,
    blocked_helper_ids: [],
    preferred_helper_id: null,
    completed_at: null,
    resolution_payload: null,
  }));

  return { data: fallbackData as TicketRow[], error: null };
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

export function getConciergeSetupErrorMessage(): string {
  return `Falta configurar el flujo de ayuda de encargos en Supabase. Ejecuta ${CONCIERGE_SETUP_SQL} y recarga.`;
}

export async function reopenInactiveConciergeTickets() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: claimedTickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select(TICKET_SELECT_EXTENDED)
    .eq('ticket_type', 'concierge')
    .eq('concierge_state', 'claimed')
    .not('helper_user_id', 'is', null)
    .limit(120);

  if (error) {
    if (hasMissingConciergeColumns(error)) return 0;
    throw new Error(error.message);
  }

  let reopened = 0;
  const helperReleaseCounter = new Map<string, number>();

  const claimedList = (claimedTickets as unknown as TicketRow[]) || [];

  for (const ticket of claimedList) {
    const deadlineIso =
      ticket.helper_inactive_deadline ||
      computeInactivityDeadline(new Date(ticket.updated_at || ticket.created_at || nowIso));
    const deadlineMs = new Date(deadlineIso).getTime();
    if (!Number.isFinite(deadlineMs) || deadlineMs > now.getTime()) continue;

    const helperId = String(ticket.helper_user_id || '').trim();
    const blockedAfterTimeout = helperId
      ? [...new Set([...toSafeHelperList((ticket as any).blocked_helper_ids), helperId])]
      : toSafeHelperList((ticket as any).blocked_helper_ids);

    const { error: updateError } = await supabaseAdmin
      .from('support_tickets')
      .update({
        helper_user_id: null,
        helper_claimed_at: null,
        helper_terms_accepted_at: null,
        helper_inactive_deadline: null,
        concierge_state: 'needs_reassign',
        blocked_helper_ids: blockedAfterTimeout,
        status: 'open',
        updated_at: nowIso,
      })
      .eq('id', ticket.id)
      .eq('concierge_state', 'claimed');

    if (updateError) continue;

    reopened += 1;
    if (helperId) {
      helperReleaseCounter.set(helperId, (helperReleaseCounter.get(helperId) || 0) + 1);
    }

    await appendSystemTicketMessage({
      ticketId: ticket.id,
      message:
        'Se reabrió el encargo automáticamente por inactividad del ayudante. El ayudante anterior quedó bloqueado para esta solicitud.',
    });
  }

  if (reopened > 0) {
    for (const [helperId, count] of helperReleaseCounter.entries()) {
      await updateHelperCounters({ userId: helperId, activeDelta: -count });
    }
  }

  return reopened;
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
  const conciergeTicket = isConciergeTicketSubject(safeSubject);
  const insertPayload: Record<string, unknown> = {
    user_id: options.userId,
    order_id: options.orderId || null,
    subject: safeSubject,
    status: 'open',
    updated_at: nowIso,
  };

  if (conciergeTicket) {
    insertPayload.ticket_type = 'concierge';
    insertPayload.concierge_state = 'open';
    insertPayload.helper_user_id = null;
    insertPayload.helper_claimed_at = null;
    insertPayload.helper_terms_accepted_at = null;
    insertPayload.helper_inactive_deadline = null;
    insertPayload.blocked_helper_ids = [];
  }

  let { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .insert(insertPayload)
    .select('*')
    .single();

  // Fallback for legacy schemas where concierge columns do not exist yet.
  if (ticketError && conciergeTicket && hasMissingConciergeColumns(ticketError)) {
    const fallbackPayload = {
      user_id: options.userId,
      order_id: options.orderId || null,
      subject: safeSubject,
      status: 'open',
      updated_at: nowIso,
    };

    const fallbackInsert = await supabaseAdmin
      .from('support_tickets')
      .insert(fallbackPayload)
      .select('*')
      .single();

    ticket = fallbackInsert.data;
    ticketError = fallbackInsert.error;
  }

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

  const extended = await supabaseAdmin
    .from('support_tickets')
    .select(TICKET_SELECT_EXTENDED)
    .eq('id', ticketId)
    .limit(1)
    .maybeSingle();
  if (!extended.error && extended.data) return extended.data as unknown as TicketRow;

  if (extended.error && !hasMissingConciergeColumns(extended.error)) {
    throw new Error(extended.error.message || 'Ticket no encontrado');
  }

  const fallback = await supabaseAdmin
    .from('support_tickets')
    .select(TICKET_SELECT_BASE)
    .eq('id', ticketId)
    .limit(1)
    .maybeSingle();
  if (fallback.error || !fallback.data) {
    throw new Error(fallback.error?.message || 'Ticket no encontrado');
  }
  return {
    ...(fallback.data as any),
    ticket_type: isConciergeTicketSubject(String((fallback.data as any).subject || '')) ? 'concierge' : 'support',
    concierge_state: isConciergeTicketSubject(String((fallback.data as any).subject || '')) ? 'open' : null,
    helper_user_id: null,
    helper_claimed_at: null,
    helper_terms_accepted_at: null,
    helper_inactive_deadline: null,
    blocked_helper_ids: [],
    preferred_helper_id: null,
    completed_at: null,
    resolution_payload: null,
  } as TicketRow;
}

export async function getTicketMessages(ticketId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const extended = await supabaseAdmin
    .from('support_messages')
    .select('id,ticket_id,user_id,is_admin,message,attachments,expires_at,created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (!extended.error) return extended.data || [];
  if (!hasMissingColumnError(extended.error, 'attachments') && !hasMissingColumnError(extended.error, 'expires_at')) {
    throw new Error(extended.error.message);
  }

  const fallback = await supabaseAdmin
    .from('support_messages')
    .select('id,ticket_id,user_id,is_admin,message,created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (fallback.error) throw new Error(fallback.error.message);
  return (fallback.data || []).map((row: any) => ({
    ...row,
    attachments: [],
    expires_at: null,
  }));
}

export async function postTicketMessage(options: {
  ticketId: string;
  userId: string | null;
  isAdmin: boolean;
  message: string;
  status?: TicketStatus;
  attachments?: Array<{ type: 'image' | 'video'; url: string }>;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const ticket = await getTicketById(options.ticketId);
  const conciergeTicket = isConciergeTicketRow(ticket);
  const conciergeState = normalizeConciergeState(ticket.concierge_state);

  if (
    conciergeTicket &&
    !options.isAdmin &&
    (conciergeState === 'completed' || conciergeState === 'cancelled')
  ) {
    throw new Error('Este encargo ya está cerrado y no admite nuevos mensajes');
  }

  const ticketOwnerId = String(ticket.user_id || '').trim();
  const helperUserId = String((ticket as any).helper_user_id || '').trim();
  const actorUserId = String(options.userId || '').trim();
  const isMessageFromHelper =
    Boolean(actorUserId) &&
    actorUserId === helperUserId &&
    conciergeTicket &&
    conciergeState === 'claimed';
  const isMessageFromOwner = Boolean(actorUserId) && actorUserId === ticketOwnerId;

  const safeMessage = sanitizeMessage(options.message);
  if (safeMessage.length < 2) throw new Error('Mensaje demasiado corto');
  const attachments = Array.isArray(options.attachments)
    ? options.attachments
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          type: item.type === 'video' ? 'video' : 'image',
          url: String(item.url || '').trim().slice(0, 600),
        }))
        .filter((item) => Boolean(item.url))
        .slice(0, 6)
    : [];

  const nowIso = new Date().toISOString();
  const expiresAt = attachments.length
    ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  let { data: messageRow, error: messageError } = await supabaseAdmin
    .from('support_messages')
    .insert({
      ticket_id: options.ticketId,
      user_id: options.userId,
      is_admin: options.isAdmin,
      message: safeMessage,
      attachments,
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (messageError && (hasMissingColumnError(messageError, 'attachments') || hasMissingColumnError(messageError, 'expires_at'))) {
    const fallbackInsert = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: options.ticketId,
        user_id: options.userId,
        is_admin: options.isAdmin,
        message: safeMessage,
      })
      .select('*')
      .single();
    messageRow = fallbackInsert.data;
    messageError = fallbackInsert.error;
  }

  if (messageError || !messageRow) {
    throw new Error(messageError?.message || 'No se pudo enviar el mensaje del ticket');
  }

  const updatePayload: Record<string, unknown> = { updated_at: nowIso };
  if (options.status) {
    updatePayload.status = normalizeStatus(options.status);
  } else if (options.isAdmin || (conciergeTicket && (isMessageFromHelper || isMessageFromOwner))) {
    updatePayload.status = 'in_progress';
  }
  if (isMessageFromHelper) {
    updatePayload.helper_inactive_deadline = computeInactivityDeadline(new Date(nowIso));
    updatePayload.concierge_state = 'claimed';
  }

  await supabaseAdmin.from('support_tickets').update(updatePayload).eq('id', options.ticketId);

  return messageRow;
}

export async function listUserTickets(
  userId: string,
  options?: {
    includeHelping?: boolean;
  }
) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  await reopenInactiveConciergeTickets();

  let ownTickets: TicketRow[] = [];
  const ownExtended = await supabaseAdmin
    .from('support_tickets')
    .select(TICKET_SELECT_EXTENDED)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!ownExtended.error) {
    ownTickets = (ownExtended.data as unknown as TicketRow[]) || [];
  } else if (hasMissingConciergeColumns(ownExtended.error)) {
    const ownFallback = await supabaseAdmin
      .from('support_tickets')
      .select(TICKET_SELECT_BASE)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (ownFallback.error) throw new Error(ownFallback.error.message);
    ownTickets = ((ownFallback.data || []) as any[]).map((ticket) => ({
      ...ticket,
      ticket_type: isConciergeTicketSubject(String(ticket.subject || '')) ? 'concierge' : 'support',
      concierge_state: isConciergeTicketSubject(String(ticket.subject || '')) ? 'open' : null,
      helper_user_id: null,
      helper_claimed_at: null,
      helper_terms_accepted_at: null,
      helper_inactive_deadline: null,
      blocked_helper_ids: [],
      preferred_helper_id: null,
      completed_at: null,
      resolution_payload: null,
    })) as TicketRow[];
  } else {
    throw new Error(ownExtended.error.message);
  }

  const combined = new Map<string, any>();
  for (const ticket of ownTickets) {
    combined.set(ticket.id, {
      ...ticket,
      access_role: 'owner',
      is_concierge: isConciergeTicketRow(ticket),
    });
  }

  if (options?.includeHelping !== false) {
    const helperExtended = await supabaseAdmin
      .from('support_tickets')
      .select(TICKET_SELECT_EXTENDED)
      .eq('helper_user_id', userId)
      .in('concierge_state', ['claimed'])
      .order('updated_at', { ascending: false });

    if (helperExtended.error && !hasMissingConciergeColumns(helperExtended.error)) {
      throw new Error(helperExtended.error.message);
    }

    const helperTickets = helperExtended.error
      ? ([] as TicketRow[])
      : (((helperExtended.data || []) as unknown) as TicketRow[]);

    for (const ticket of helperTickets) {
      if (!combined.has(ticket.id)) {
        combined.set(ticket.id, {
          ...ticket,
          access_role: 'helper',
          is_concierge: true,
        });
      }
    }
  }

  const tickets = [...combined.values()].sort(
    (a, b) =>
      new Date(String(b.updated_at || b.created_at || 0)).getTime() -
      new Date(String(a.updated_at || a.created_at || 0)).getTime()
  );

  const ticketIds = tickets.map((ticket) => ticket.id);
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

  return tickets.map((ticket) => ({
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

export async function listOpenConciergeTickets(options: {
  helperUserId: string;
  limit?: number;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  await reopenInactiveConciergeTickets();

  const limit = Math.max(1, Math.min(120, Number(options.limit || 40)));
  const query = supabaseAdmin
    .from('support_tickets')
    .select(TICKET_SELECT_EXTENDED)
    .eq('ticket_type', 'concierge')
    .is('helper_user_id', null)
    .in('concierge_state', ['open', 'needs_reassign'])
    .neq('user_id', options.helperUserId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  const { data: tickets, error } = await query;
  if (error) {
    if (hasMissingConciergeColumns(error)) {
      throw new Error(getConciergeSetupErrorMessage());
    }
    throw new Error(error.message);
  }

  const ticketRows = (tickets as unknown as TicketRow[]) || [];

  const filtered = ticketRows.filter((ticket) => {
    const blockedHelperIds = toSafeHelperList((ticket as any).blocked_helper_ids);
    if (blockedHelperIds.includes(options.helperUserId)) return false;
    const preferredHelper = String((ticket as any).preferred_helper_id || '').trim();
    if (preferredHelper && preferredHelper !== options.helperUserId) return false;
    return true;
  });

  const ticketIds = filtered.map((ticket) => ticket.id);
  const requesterIds = [...new Set(filtered.map((ticket) => ticket.user_id).filter(Boolean))];

  const { data: users } = requesterIds.length
    ? await supabaseAdmin
        .from('users')
        .select('id,name,avatar_url,helper_completed_count,helper_reputation')
        .in('id', requesterIds)
    : { data: [] as any[] };

  const userMap = new Map<string, any>((users || []).map((user) => [String(user.id), user]));

  const { data: messages } = ticketIds.length
    ? await supabaseAdmin
        .from('support_messages')
        .select('ticket_id,message,created_at,is_admin')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] };

  const lastByTicket = new Map<string, any>();
  for (const message of messages || []) {
    if (!lastByTicket.has(message.ticket_id)) {
      lastByTicket.set(message.ticket_id, message);
    }
  }

  return filtered.map((ticket) => ({
    ...ticket,
    is_concierge: true,
    requester: userMap.get(String(ticket.user_id)) || null,
    last_message: lastByTicket.get(ticket.id) || null,
  }));
}

export async function claimConciergeTicket(options: {
  ticketId: string;
  helperUserId: string;
  helperProfile?: UserSummary | null;
  termsAccepted: boolean;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  if (!options.termsAccepted) throw new Error('Debes aceptar las condiciones para ayudar en un encargo');

  const ticket = await getTicketById(options.ticketId);
  if (!isConciergeTicketRow(ticket)) {
    throw new Error('Este ticket no es de tipo encargo');
  }
  if (String(ticket.user_id) === String(options.helperUserId)) {
    throw new Error('No puedes ayudarte a ti mismo en tu propio encargo');
  }
  if (String(ticket.helper_user_id || '').trim()) {
    throw new Error('Este encargo ya está siendo gestionado por otro usuario');
  }

  const blocked = toSafeHelperList((ticket as any).blocked_helper_ids);
  if (blocked.includes(options.helperUserId)) {
    throw new Error('No puedes ayudar en este encargo porque el comprador te ha bloqueado');
  }
  const preferredHelper = String((ticket as any).preferred_helper_id || '').trim();
  if (preferredHelper && preferredHelper !== options.helperUserId) {
    throw new Error('Este encargo está reservado para otro ayudante');
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const updatePayload = {
    helper_user_id: options.helperUserId,
    helper_claimed_at: nowIso,
    helper_terms_accepted_at: nowIso,
    helper_inactive_deadline: computeInactivityDeadline(now),
    concierge_state: 'claimed',
    status: 'in_progress',
    updated_at: nowIso,
  };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('support_tickets')
    .update(updatePayload)
    .eq('id', options.ticketId)
    .is('helper_user_id', null)
    .in('concierge_state', ['open', 'needs_reassign'])
    .select(TICKET_SELECT_EXTENDED)
    .maybeSingle();

  if (updateError) {
    if (hasMissingConciergeColumns(updateError)) {
      throw new Error(getConciergeSetupErrorMessage());
    }
    throw new Error(updateError.message);
  }
  if (!updated) {
    throw new Error('No se pudo reclamar este encargo (puede que ya esté en curso)');
  }

  await updateHelperCounters({
    userId: options.helperUserId,
    activeDelta: 1,
  });

  const helperName =
    String(options.helperProfile?.name || '').trim() ||
    String(options.helperProfile?.email || '').trim() ||
    'Ayudante comunidad';

  await appendSystemTicketMessage({
    ticketId: options.ticketId,
    message:
      `Encargo reclamado por ${helperName}. ` +
      'El ticket queda bloqueado para este ayudante hasta resolver la búsqueda o liberar la solicitud.',
  });

  return updated;
}

export async function releaseConciergeTicket(options: {
  ticketId: string;
  actorUserId: string;
  actorRole: 'admin' | 'user';
  reason?: string;
  blockCurrentHelper?: boolean;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const ticket = await getTicketById(options.ticketId);
  if (!isConciergeTicketRow(ticket)) {
    throw new Error('Este ticket no es de tipo encargo');
  }

  const helperId = String(ticket.helper_user_id || '').trim();
  if (!helperId) {
    throw new Error('Este encargo no tiene ayudante asignado');
  }

  const actorId = String(options.actorUserId || '').trim();
  const isAdmin = options.actorRole === 'admin';
  const isOwner = String(ticket.user_id) === actorId;
  const isHelper = helperId === actorId;
  if (!isAdmin && !isOwner && !isHelper) {
    throw new Error('No autorizado para liberar este encargo');
  }

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    helper_user_id: null,
    helper_claimed_at: null,
    helper_terms_accepted_at: null,
    helper_inactive_deadline: null,
    concierge_state: 'needs_reassign',
    status: 'open',
    updated_at: nowIso,
  };

  if (isOwner && options.blockCurrentHelper) {
    const currentBlocked = toSafeHelperList((ticket as any).blocked_helper_ids);
    updatePayload.blocked_helper_ids = [...new Set([...currentBlocked, helperId])];
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('support_tickets')
    .update(updatePayload)
    .eq('id', ticket.id)
    .eq('helper_user_id', helperId)
    .select(TICKET_SELECT_EXTENDED)
    .maybeSingle();

  if (updateError) {
    if (hasMissingConciergeColumns(updateError)) {
      throw new Error(getConciergeSetupErrorMessage());
    }
    throw new Error(updateError.message);
  }

  if (!updated) {
    throw new Error('No se pudo liberar el encargo');
  }

  await updateHelperCounters({ userId: helperId, activeDelta: -1 });

  const reason = sanitizeMessage(String(options.reason || '').slice(0, 280));
  const actorLabel = isAdmin ? 'admin' : isOwner ? 'comprador' : 'ayudante';
  await appendSystemTicketMessage({
    ticketId: ticket.id,
    message:
      `Encargo liberado por ${actorLabel}.` +
      (reason ? ` Motivo: ${reason}.` : '') +
      ' La solicitud vuelve a la cola pública de ayuda.',
  });

  return updated;
}

export async function completeConciergeTicket(options: {
  ticketId: string;
  actorUserId: string;
  actorRole: 'admin' | 'user';
  summary?: string;
  resolutionForm?: Record<string, unknown> | null;
}) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const ticket = await getTicketById(options.ticketId);
  if (!isConciergeTicketRow(ticket)) {
    throw new Error('Este ticket no es de tipo encargo');
  }

  const helperId = String(ticket.helper_user_id || '').trim();
  if (!helperId) {
    throw new Error('No se puede completar sin ayudante asignado');
  }

  const isAdmin = options.actorRole === 'admin';
  const isOwner = String(ticket.user_id) === String(options.actorUserId || '');
  const isHelper = helperId === String(options.actorUserId || '');
  if (!isAdmin && !isOwner && !isHelper) {
    throw new Error('Solo comprador, ayudante asignado o admin pueden actualizar este encargo');
  }

  const nowIso = new Date().toISOString();
  const safeSummary = sanitizeMessage(String(options.summary || '').slice(0, 600));
  if (isHelper && !isOwner && !isAdmin) {
    const helperForm =
      options.resolutionForm && typeof options.resolutionForm === 'object' && !Array.isArray(options.resolutionForm)
        ? options.resolutionForm
        : {};
    const platform = String((helperForm as any).platform || '').trim();
    const finalPrice = String((helperForm as any).final_price_eur || '').trim();
    const originality = String((helperForm as any).originality || '').trim();
    const deliveryMode = String((helperForm as any).delivery_mode || '').trim();
    if (!platform || !finalPrice || !originality || !deliveryMode) {
      throw new Error('La propuesta requiere plataforma, precio final, originalidad y modo de entrega');
    }

    const previousPayload =
      ticket.resolution_payload && typeof ticket.resolution_payload === 'object' && !Array.isArray(ticket.resolution_payload)
        ? (ticket.resolution_payload as Record<string, unknown>)
        : {};
    const proposalPayload: Record<string, unknown> = {
      ...previousPayload,
      helper_submitted_at: nowIso,
      helper_summary: safeSummary || null,
    };
    proposalPayload.helper_resolution_form = helperForm;

    const { data: proposalUpdated, error: proposalError } = await supabaseAdmin
      .from('support_tickets')
      .update({
        resolution_payload: proposalPayload,
        status: 'in_progress',
        concierge_state: 'claimed',
        helper_inactive_deadline: computeInactivityDeadline(new Date(nowIso)),
        updated_at: nowIso,
      })
      .eq('id', ticket.id)
      .eq('helper_user_id', helperId)
      .select(TICKET_SELECT_EXTENDED)
      .maybeSingle();

    if (proposalError) {
      if (hasMissingConciergeColumns(proposalError)) {
        throw new Error(getConciergeSetupErrorMessage());
      }
      throw new Error(proposalError.message);
    }
    if (!proposalUpdated) {
      throw new Error('No se pudo enviar la propuesta del ayudante');
    }

    await appendSystemTicketMessage({
      ticketId: ticket.id,
      message:
        'El ayudante ha enviado una propuesta final. El comprador debe confirmarla para cerrar el encargo.',
    });

    return proposalUpdated;
  }

  const previousPayload =
    ticket.resolution_payload && typeof ticket.resolution_payload === 'object' && !Array.isArray(ticket.resolution_payload)
      ? (ticket.resolution_payload as Record<string, unknown>)
      : {};
  const finalResolutionPayload: Record<string, unknown> = { ...previousPayload };
  if (options.resolutionForm && typeof options.resolutionForm === 'object') {
    Object.assign(finalResolutionPayload, options.resolutionForm);
  }
  if (safeSummary) {
    finalResolutionPayload.summary = safeSummary;
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('support_tickets')
    .update({
      concierge_state: 'completed',
      status: 'resolved',
      completed_at: nowIso,
      helper_inactive_deadline: null,
      resolution_payload: finalResolutionPayload,
      updated_at: nowIso,
    })
    .eq('id', ticket.id)
    .eq('helper_user_id', helperId)
    .select(TICKET_SELECT_EXTENDED)
    .maybeSingle();

  if (updateError) {
    if (hasMissingConciergeColumns(updateError)) {
      throw new Error(getConciergeSetupErrorMessage());
    }
    throw new Error(updateError.message);
  }
  if (!updated) {
    throw new Error('No se pudo cerrar este encargo');
  }

  await updateHelperCounters({
    userId: helperId,
    activeDelta: -1,
    completedDelta: 1,
    reputationDelta: 2,
  });

  await appendSystemTicketMessage({
    ticketId: ticket.id,
    message:
      'Encargo marcado como completado. Se bloquea para nuevos ayudantes y pasa a revisión final de tienda.',
  });

  return updated;
}
