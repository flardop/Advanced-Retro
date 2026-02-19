import type { SupabaseClient } from '@supabase/supabase-js';
import { createUserSingleUseCoupon } from '@/lib/coupons';

function safeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function pickWeightedPrize(prizes: any[]): any {
  const active = prizes
    .filter((prize) => Boolean(prize?.is_active))
    .filter((prize) => {
      if (prize?.stock == null) return true;
      return safeNumber(prize.stock) > 0;
    })
    .map((prize) => ({
      ...prize,
      weight: Math.max(0, Number(prize?.probability || 0)),
    }))
    .filter((prize) => prize.weight > 0);

  if (active.length === 0) {
    throw new Error('No hay premios activos en esta mystery box');
  }

  const totalWeight = active.reduce((sum, prize) => sum + prize.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Configuración de probabilidades inválida');
  }

  let roll = Math.random() * totalWeight;
  for (const prize of active) {
    roll -= prize.weight;
    if (roll <= 0) {
      return prize;
    }
  }

  return active[active.length - 1];
}

export async function listMysteryBoxes(options: {
  supabaseAdmin: SupabaseClient;
  userId?: string | null;
}) {
  const { data: boxes, error: boxesError } = await options.supabaseAdmin
    .from('mystery_boxes')
    .select('*')
    .eq('is_active', true)
    .order('ticket_price', { ascending: true })
    .limit(50);

  if (boxesError) throw new Error(boxesError.message);

  const boxIds = (boxes || []).map((box) => String(box.id));
  const { data: prizes, error: prizesError } = boxIds.length
    ? await options.supabaseAdmin
        .from('mystery_box_prizes')
        .select('*')
        .in('box_id', boxIds)
        .eq('is_active', true)
        .order('probability', { ascending: false })
    : { data: [] as any[], error: null as any };

  if (prizesError) throw new Error(prizesError.message);

  const ticketsByPrice = new Map<number, number>();
  if (options.userId) {
    const { data: tickets, error: ticketsError } = await options.supabaseAdmin
      .from('mystery_tickets')
      .select('box_id,quantity_total,quantity_used,status,mystery_boxes(ticket_price)')
      .eq('user_id', options.userId)
      .eq('status', 'active');

    if (ticketsError) throw new Error(ticketsError.message);

    for (const ticket of tickets || []) {
      const available = Math.max(0, safeNumber(ticket.quantity_total) - safeNumber(ticket.quantity_used));
      if (available <= 0) continue;
      const ticketPrice = Math.round(
        safeNumber(
          Array.isArray((ticket as any).mystery_boxes)
            ? (ticket as any).mystery_boxes[0]?.ticket_price
            : (ticket as any).mystery_boxes?.ticket_price
        )
      );
      if (ticketPrice <= 0) continue;
      ticketsByPrice.set(ticketPrice, (ticketsByPrice.get(ticketPrice) || 0) + available);
    }
  }

  return (boxes || []).map((box) => {
    const boxId = String(box.id);
    const boxPrizes = (prizes || []).filter((prize) => String(prize.box_id) === boxId);
    const boxPrice = Math.round(safeNumber(box.ticket_price));
    return {
      ...box,
      available_tickets: ticketsByPrice.get(boxPrice) || 0,
      prizes: boxPrizes,
    };
  });
}

export async function grantMysteryTicketsFromOrder(options: {
  supabaseAdmin: SupabaseClient;
  orderId: string;
  userId: string;
  boxId: string;
  units: number;
}) {
  const safeUnits = Math.max(0, Math.floor(Number(options.units || 0)));
  if (!options.userId || !options.boxId || safeUnits <= 0) return;

  const nowIso = new Date().toISOString();
  const { error } = await options.supabaseAdmin
    .from('mystery_tickets')
    .insert({
      user_id: options.userId,
      box_id: options.boxId,
      order_id: options.orderId,
      quantity_total: safeUnits,
      quantity_used: 0,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function spinMysteryBox(options: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  boxId: string;
}) {
  const userId = String(options.userId || '').trim();
  const boxId = String(options.boxId || '').trim();
  if (!userId || !boxId) {
    throw new Error('Datos de tirada incompletos');
  }

  const { data: box, error: boxError } = await options.supabaseAdmin
    .from('mystery_boxes')
    .select('*')
    .eq('id', boxId)
    .eq('is_active', true)
    .maybeSingle();

  if (boxError || !box) {
    throw new Error(boxError?.message || 'Mystery box no encontrada');
  }

  const { data: ticketRows, error: ticketError } = await options.supabaseAdmin
    .from('mystery_tickets')
    .select('*, mystery_boxes(ticket_price)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(200);

  if (ticketError) throw new Error(ticketError.message);

  const boxTicketPrice = Math.round(safeNumber(box.ticket_price));
  const compatibleTickets = (ticketRows || []).filter((row) => {
    const ticketPrice = Math.round(
      safeNumber(
        Array.isArray((row as any).mystery_boxes)
          ? (row as any).mystery_boxes[0]?.ticket_price
          : (row as any).mystery_boxes?.ticket_price
      )
    );
    const available = Math.max(0, safeNumber(row.quantity_total) - safeNumber(row.quantity_used));
    return ticketPrice === boxTicketPrice && available > 0;
  });

  const ticket = compatibleTickets[0];

  if (!ticket) {
    throw new Error('No tienes tiradas del mismo precio para esta mystery box');
  }

  const currentUsed = Math.max(0, Math.floor(safeNumber(ticket.quantity_used)));
  const quantityTotal = Math.max(0, Math.floor(safeNumber(ticket.quantity_total)));
  if (currentUsed >= quantityTotal) {
    throw new Error('No hay tickets disponibles');
  }

  const newUsed = currentUsed + 1;
  const nextStatus = newUsed >= quantityTotal ? 'used' : 'active';

  const { data: consumedTicket, error: consumeError } = await options.supabaseAdmin
    .from('mystery_tickets')
    .update({
      quantity_used: newUsed,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticket.id)
    .eq('quantity_used', currentUsed)
    .select('*')
    .maybeSingle();

  if (consumeError || !consumedTicket) {
    throw new Error(consumeError?.message || 'No se pudo consumir el ticket');
  }

  const { data: prizeRows, error: prizesError } = await options.supabaseAdmin
    .from('mystery_box_prizes')
    .select('*')
    .eq('box_id', boxId)
    .eq('is_active', true)
    .limit(200);

  if (prizesError) throw new Error(prizesError.message);

  const selectedPrize = pickWeightedPrize(prizeRows || []);

  if (selectedPrize.stock != null) {
    const currentStock = Math.max(0, Math.floor(safeNumber(selectedPrize.stock)));
    if (currentStock <= 0) {
      throw new Error('El premio seleccionado está sin stock');
    }

    const { data: updatedPrize, error: stockError } = await options.supabaseAdmin
      .from('mystery_box_prizes')
      .update({
        stock: currentStock - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedPrize.id)
      .eq('stock', currentStock)
      .select('id')
      .maybeSingle();

    if (stockError || !updatedPrize) {
      throw new Error(stockError?.message || 'No se pudo reservar el premio');
    }
  }

  let coupon: any = null;
  const metadata = selectedPrize.metadata && typeof selectedPrize.metadata === 'object'
    ? selectedPrize.metadata
    : {};

  if (safeText(selectedPrize.prize_type) === 'discount_coupon') {
    const couponType = safeText((metadata as any).coupon_type) === 'fixed' ? 'fixed' : 'percent';
    const couponValue = Math.max(0, Math.round(safeNumber((metadata as any).coupon_value)));

    coupon = await createUserSingleUseCoupon({
      supabaseAdmin: options.supabaseAdmin,
      userId,
      type: couponType === 'fixed' ? 'fixed' : 'percent',
      value: couponValue,
      metadata: {
        source: 'mystery_spin',
        boxId,
        prizeId: selectedPrize.id,
        prizeLabel: selectedPrize.label,
      },
      prefix: 'MYST',
    });
  }

  const spinPayload = {
    user_id: userId,
    box_id: boxId,
    ticket_id: consumedTicket.id,
    order_id: consumedTicket.order_id || null,
    prize_id: selectedPrize.id,
    prize_label: selectedPrize.label,
    coupon_id: coupon?.id || null,
    status: 'won',
    metadata: {
      prize_type: selectedPrize.prize_type,
      prize_metadata: metadata,
    },
    created_at: new Date().toISOString(),
  };

  const { data: spinRow, error: spinError } = await options.supabaseAdmin
    .from('mystery_spins')
    .insert(spinPayload)
    .select('*')
    .single();

  if (spinError || !spinRow) {
    throw new Error(spinError?.message || 'No se pudo guardar la tirada');
  }

  const { data: refreshedTickets } = await options.supabaseAdmin
    .from('mystery_tickets')
    .select('quantity_total,quantity_used,mystery_boxes(ticket_price)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(200);

  const remainingTickets = (refreshedTickets || []).reduce((sum, row) => {
    const ticketPrice = Math.round(
      safeNumber(
        Array.isArray((row as any).mystery_boxes)
          ? (row as any).mystery_boxes[0]?.ticket_price
          : (row as any).mystery_boxes?.ticket_price
      )
    );
    if (ticketPrice !== boxTicketPrice) return sum;
    return sum + Math.max(0, safeNumber(row.quantity_total) - safeNumber(row.quantity_used));
  }, 0);

  return {
    spin: spinRow,
    box,
    prize: selectedPrize,
    coupon,
    remainingTickets,
  };
}
