import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createWalletTransaction } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: { id: string };
};

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'paid', 'cancelled'] as const;

function isMissingWithdrawalsTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('user_wallet_withdrawal_requests') && message.includes('does not exist');
}

function normalizeRequest(row: any) {
  return {
    id: String(row?.id || ''),
    user_id: String(row?.user_id || ''),
    amount_cents: Math.max(0, Math.round(Number(row?.amount_cents || 0))),
    status: String(row?.status || 'pending'),
    payout_method: typeof row?.payout_method === 'string' ? row.payout_method : 'manual_transfer',
    payout_details:
      row?.payout_details && typeof row.payout_details === 'object' && !Array.isArray(row.payout_details)
        ? row.payout_details
        : {},
    note: typeof row?.note === 'string' ? row.note : null,
    admin_note: typeof row?.admin_note === 'string' ? row.admin_note : null,
    wallet_transaction_id: typeof row?.wallet_transaction_id === 'string' ? row.wallet_transaction_id : null,
    reviewed_by: typeof row?.reviewed_by === 'string' ? row.reviewed_by : null,
    reviewed_at: typeof row?.reviewed_at === 'string' ? row.reviewed_at : null,
    paid_at: typeof row?.paid_at === 'string' ? row.paid_at : null,
    created_at: typeof row?.created_at === 'string' ? row.created_at : null,
    updated_at: typeof row?.updated_at === 'string' ? row.updated_at : null,
  };
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { user: adminUser } = await requireAdminContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const requestId = String(params?.id || '').trim();
    if (!requestId) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const nextStatus = String(body?.status || '').trim().toLowerCase();
    if (!ALLOWED_STATUSES.includes(nextStatus as any)) {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 });
    }

    const adminNote =
      typeof body?.admin_note === 'string' ? body.admin_note.trim().slice(0, 2000) : null;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('user_wallet_withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (existingError) {
      if (isMissingWithdrawalsTableError(existingError)) {
        return NextResponse.json(
          { error: 'Falta configurar retiradas. Ejecuta SQL: database/wallet_withdrawal_requests_mvp.sql' },
          { status: 503 }
        );
      }
      throw existingError;
    }

    if (!existing) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const currentStatus = String(existing.status || 'pending');
    if (currentStatus === 'paid' && nextStatus !== 'paid') {
      return NextResponse.json(
        { error: 'La solicitud ya está pagada. Usa una reversión manual si necesitas corregirla.' },
        { status: 400 }
      );
    }

    let walletTransactionId: string | null = typeof existing.wallet_transaction_id === 'string'
      ? existing.wallet_transaction_id
      : null;
    let paidAt: string | null = typeof existing.paid_at === 'string' ? existing.paid_at : null;

    if (nextStatus === 'paid' && !walletTransactionId) {
      const tx = await createWalletTransaction({
        userId: String(existing.user_id),
        amountCents: Math.max(0, Math.round(Number(existing.amount_cents || 0))),
        direction: 'debit',
        status: 'spent',
        kind: 'withdrawal_request',
        description: `Retirada aprobada/pagada (${requestId.slice(0, 8)})`,
        referenceType: 'wallet_withdrawal_request',
        referenceId: requestId,
        metadata: {
          payout_method: existing.payout_method || 'manual_transfer',
        },
        createdBy: adminUser.id,
      });
      walletTransactionId = String(tx.transaction.id);
      paidAt = new Date().toISOString();
    }

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    };

    if (adminNote !== null) updatePayload.admin_note = adminNote;
    if (walletTransactionId) updatePayload.wallet_transaction_id = walletTransactionId;
    if (nextStatus === 'paid') {
      updatePayload.paid_at = paidAt || new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('user_wallet_withdrawal_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError || !updated) throw updateError || new Error('No se pudo actualizar solicitud');

    return NextResponse.json({ success: true, request: normalizeRequest(updated) });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
