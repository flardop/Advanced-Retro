import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type WalletTransactionKind =
  | 'manual_adjustment'
  | 'community_sale_credit'
  | 'commission_reward'
  | 'withdrawal_request'
  | 'wallet_spend'
  | 'reversal';

export type WalletTransactionDirection = 'credit' | 'debit';
export type WalletTransactionStatus = 'pending' | 'available' | 'spent' | 'cancelled';

export type UserWalletSnapshot = {
  account: {
    user_id: string;
    balance_cents: number;
    pending_cents: number;
    total_earned_cents: number;
    total_withdrawn_cents: number;
    created_at?: string;
    updated_at?: string;
  };
  transactions: Array<{
    id: string;
    amount_cents: number;
    direction: WalletTransactionDirection;
    status: WalletTransactionStatus;
    kind: WalletTransactionKind;
    description: string | null;
    reference_type: string | null;
    reference_id: string | null;
    metadata: Record<string, unknown>;
    created_by: string | null;
    created_at: string;
  }>;
};

type CreateWalletTransactionInput = {
  userId: string;
  amountCents: number;
  direction: WalletTransactionDirection;
  status: WalletTransactionStatus;
  kind: WalletTransactionKind;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
};

function getSupabaseAdminOrThrow() {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  return supabaseAdmin;
}

function isMissingWalletTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('user_wallet_') &&
    (message.includes('does not exist') || message.includes('relation'))
  );
}

function walletSetupErrorMessage() {
  return 'Falta configurar la cartera interna. Ejecuta SQL: database/internal_wallet_mvp.sql';
}

function toPositiveCents(value: unknown): number {
  const amount = Math.round(Number(value || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('El importe debe ser mayor que 0');
  }
  return amount;
}

function normalizeWalletAccount(row: any, userId: string) {
  return {
    user_id: userId,
    balance_cents: Math.max(0, Math.round(Number(row?.balance_cents || 0))),
    pending_cents: Math.max(0, Math.round(Number(row?.pending_cents || 0))),
    total_earned_cents: Math.max(0, Math.round(Number(row?.total_earned_cents || 0))),
    total_withdrawn_cents: Math.max(0, Math.round(Number(row?.total_withdrawn_cents || 0))),
    created_at: typeof row?.created_at === 'string' ? row.created_at : undefined,
    updated_at: typeof row?.updated_at === 'string' ? row.updated_at : undefined,
  };
}

function normalizeWalletTransaction(row: any) {
  return {
    id: String(row?.id || ''),
    amount_cents: Math.max(0, Math.round(Number(row?.amount_cents || 0))),
    direction: (row?.direction === 'debit' ? 'debit' : 'credit') as WalletTransactionDirection,
    status: (['pending', 'available', 'spent', 'cancelled'].includes(String(row?.status))
      ? row.status
      : 'pending') as WalletTransactionStatus,
    kind: ([
      'manual_adjustment',
      'community_sale_credit',
      'commission_reward',
      'withdrawal_request',
      'wallet_spend',
      'reversal',
    ].includes(String(row?.kind))
      ? row.kind
      : 'manual_adjustment') as WalletTransactionKind,
    description: typeof row?.description === 'string' ? row.description : null,
    reference_type: typeof row?.reference_type === 'string' ? row.reference_type : null,
    reference_id: typeof row?.reference_id === 'string' ? row.reference_id : null,
    metadata:
      row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata
        : {},
    created_by: typeof row?.created_by === 'string' ? row.created_by : null,
    created_at: typeof row?.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

export async function ensureUserWalletAccount(userId: string) {
  const admin = getSupabaseAdminOrThrow();
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) throw new Error('User id requerido');

  const { data, error } = await admin
    .from('user_wallet_accounts')
    .upsert(
      {
        user_id: safeUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (error || !data) {
    if (isMissingWalletTableError(error)) throw new Error(walletSetupErrorMessage());
    throw new Error(error?.message || 'No se pudo inicializar la cartera');
  }

  return normalizeWalletAccount(data, safeUserId);
}

export async function getUserWalletSnapshot(userId: string, txLimit = 25): Promise<UserWalletSnapshot> {
  const admin = getSupabaseAdminOrThrow();
  const account = await ensureUserWalletAccount(userId);

  const { data: txRows, error: txError } = await admin
    .from('user_wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Number(txLimit || 0), 1), 100));

  if (txError) {
    if (isMissingWalletTableError(txError)) throw new Error(walletSetupErrorMessage());
    throw new Error(txError.message || 'No se pudieron cargar movimientos');
  }

  return {
    account,
    transactions: (txRows || []).map((row) => normalizeWalletTransaction(row)),
  };
}

function applyAccountDelta(
  account: {
    balance_cents: number;
    pending_cents: number;
    total_earned_cents: number;
    total_withdrawn_cents: number;
  },
  input: CreateWalletTransactionInput
) {
  const amount = input.amountCents;

  if (input.direction === 'credit') {
    if (input.status === 'pending') {
      account.pending_cents += amount;
      return;
    }
    if (input.status === 'available') {
      account.balance_cents += amount;
      account.total_earned_cents += amount;
      return;
    }
    return;
  }

  if (input.direction === 'debit') {
    if (input.status === 'available' || input.status === 'spent') {
      if (account.balance_cents < amount) {
        throw new Error('Saldo insuficiente en cartera');
      }
      account.balance_cents -= amount;
      if (input.kind === 'withdrawal_request') {
        account.total_withdrawn_cents += amount;
      }
    }
  }
}

export async function createWalletTransaction(input: CreateWalletTransactionInput) {
  const admin = getSupabaseAdminOrThrow();

  const userId = String(input.userId || '').trim();
  if (!userId) throw new Error('User id requerido');
  const amountCents = toPositiveCents(input.amountCents);

  const direction: WalletTransactionDirection = input.direction === 'debit' ? 'debit' : 'credit';
  const status: WalletTransactionStatus = (['pending', 'available', 'spent', 'cancelled'].includes(
    String(input.status || '')
  )
    ? input.status
    : 'pending') as WalletTransactionStatus;

  const kind: WalletTransactionKind = input.kind;
  const description = typeof input.description === 'string' ? input.description.trim().slice(0, 500) : null;
  const referenceType =
    typeof input.referenceType === 'string' && input.referenceType.trim()
      ? input.referenceType.trim().slice(0, 80)
      : null;
  const referenceId =
    typeof input.referenceId === 'string' && input.referenceId.trim()
      ? input.referenceId.trim().slice(0, 160)
      : null;

  const metadata =
    input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? input.metadata
      : {};
  const createdBy =
    typeof input.createdBy === 'string' && input.createdBy.trim() ? input.createdBy.trim() : null;

  const account = await ensureUserWalletAccount(userId);

  if (referenceType && referenceId) {
    const { data: existingByRef, error: existingError } = await admin
      .from('user_wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('kind', kind)
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .maybeSingle();

    if (existingError && !String(existingError.message || '').toLowerCase().includes('multiple')) {
      if (isMissingWalletTableError(existingError)) throw new Error(walletSetupErrorMessage());
      throw new Error(existingError.message || 'No se pudo validar idempotencia de cartera');
    }
    if (existingByRef) {
      return {
        transaction: normalizeWalletTransaction(existingByRef),
        account,
        duplicate: true,
      };
    }
  }

  const nextAccount = { ...account };
  applyAccountDelta(nextAccount, { ...input, amountCents, direction, status, kind });

  const nowIso = new Date().toISOString();

  const { error: accountUpdateError } = await admin
    .from('user_wallet_accounts')
    .update({
      balance_cents: nextAccount.balance_cents,
      pending_cents: nextAccount.pending_cents,
      total_earned_cents: nextAccount.total_earned_cents,
      total_withdrawn_cents: nextAccount.total_withdrawn_cents,
      updated_at: nowIso,
    })
    .eq('user_id', userId);

  if (accountUpdateError) {
    if (isMissingWalletTableError(accountUpdateError)) throw new Error(walletSetupErrorMessage());
    throw new Error(accountUpdateError.message || 'No se pudo actualizar saldo');
  }

  const { data: txRow, error: txInsertError } = await admin
    .from('user_wallet_transactions')
    .insert({
      user_id: userId,
      amount_cents: amountCents,
      direction,
      status,
      kind,
      description,
      reference_type: referenceType,
      reference_id: referenceId,
      metadata,
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (txInsertError || !txRow) {
    // Compensating rollback in best effort if transaction insert fails after balance update.
    await admin
      .from('user_wallet_accounts')
      .update({
        balance_cents: account.balance_cents,
        pending_cents: account.pending_cents,
        total_earned_cents: account.total_earned_cents,
        total_withdrawn_cents: account.total_withdrawn_cents,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (isMissingWalletTableError(txInsertError)) throw new Error(walletSetupErrorMessage());
    throw new Error(txInsertError?.message || 'No se pudo registrar movimiento');
  }

  return {
    transaction: normalizeWalletTransaction(txRow),
    account: normalizeWalletAccount(
      {
        ...nextAccount,
        created_at: account.created_at,
        updated_at: nowIso,
      },
      userId
    ),
    duplicate: false,
  };
}

export function calculateCommunitySellerNetCents(listing: {
  price?: unknown;
  commission_cents?: unknown;
  listing_fee_cents?: unknown;
}): number {
  const price = Math.max(0, Math.round(Number(listing?.price || 0)));
  const commission = Math.max(0, Math.round(Number(listing?.commission_cents || 0)));
  const fee = Math.max(0, Math.round(Number(listing?.listing_fee_cents || 0)));
  return Math.max(0, price - commission - fee);
}

export async function creditCommunitySaleToSellerIfDelivered(options: {
  listing: any;
  adminId?: string | null;
}) {
  const listing = options.listing;
  if (!listing) throw new Error('Listing requerido');

  const status = String(listing?.delivery_status || '').trim().toLowerCase();
  if (status !== 'delivered') {
    return { credited: false, reason: 'not_delivered' as const };
  }

  const listingId = String(listing?.id || '').trim();
  const sellerUserId = String(listing?.user_id || '').trim();
  if (!listingId || !sellerUserId) {
    return { credited: false, reason: 'missing_reference' as const };
  }

  const netCents = calculateCommunitySellerNetCents(listing);
  if (netCents <= 0) {
    return { credited: false, reason: 'zero_net' as const };
  }

  const result = await createWalletTransaction({
    userId: sellerUserId,
    amountCents: netCents,
    direction: 'credit',
    status: 'available',
    kind: 'community_sale_credit',
    description: `Abono venta comunidad: ${String(listing?.title || 'Producto')}`.slice(0, 500),
    referenceType: 'user_product_listing',
    referenceId: listingId,
    metadata: {
      listing_title: String(listing?.title || ''),
      gross_price_cents: Math.max(0, Math.round(Number(listing?.price || 0))),
      commission_cents: Math.max(0, Math.round(Number(listing?.commission_cents || 0))),
      listing_fee_cents: Math.max(0, Math.round(Number(listing?.listing_fee_cents || 0))),
      delivery_status: String(listing?.delivery_status || ''),
    },
    createdBy: options.adminId || null,
  });

  return {
    credited: !result.duplicate,
    duplicate: result.duplicate,
    amount_cents: netCents,
    wallet: result.account,
    transaction: result.transaction,
  };
}

export { walletSetupErrorMessage, isMissingWalletTableError };
