import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { createWalletTransaction, getUserWalletSnapshot } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const { user } = await requireAdminContext();
    const body = await req.json().catch(() => null);

    const targetUserId = String(body?.user_id || '').trim();
    if (!targetUserId) return badRequest('user_id requerido');

    const amountCents = Math.round(Number(body?.amount_cents || 0));
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return badRequest('amount_cents debe ser > 0');
    }

    const direction = body?.direction === 'debit' ? 'debit' : 'credit';
    const status = body?.status === 'pending' ? 'pending' : body?.status === 'spent' ? 'spent' : 'available';
    const description =
      typeof body?.description === 'string' && body.description.trim()
        ? body.description.trim()
        : `Ajuste manual (${direction === 'credit' ? 'abono' : 'cargo'})`;

    const result = await createWalletTransaction({
      userId: targetUserId,
      amountCents,
      direction,
      status,
      kind: 'manual_adjustment',
      description,
      referenceType: null,
      referenceId: null,
      metadata:
        body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
          ? body.metadata
          : {},
      createdBy: user.id,
    });

    const wallet = await getUserWalletSnapshot(targetUserId, 20);
    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      wallet,
      transaction: result.transaction,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
