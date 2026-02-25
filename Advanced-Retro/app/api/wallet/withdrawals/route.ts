import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { getUserWalletSnapshot, isMissingWalletTableError } from '@/lib/wallet';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function withdrawalsSetupErrorMessage() {
  return 'Falta configurar las retiradas. Ejecuta SQL: database/wallet_withdrawal_requests_mvp.sql';
}

function isMissingWithdrawalsTableError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('user_wallet_withdrawal_requests') && message.includes('does not exist');
}

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (isMissingWithdrawalsTableError(error)) {
    return NextResponse.json({ error: withdrawalsSetupErrorMessage(), setupRequired: true }, { status: 503 });
  }
  if (isMissingWalletTableError(error)) {
    return NextResponse.json({ error: error?.message || 'Wallet setup missing', setupRequired: true }, { status: 503 });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
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

function normalizeIban(input: unknown): string {
  return String(input || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function isValidIbanChecksum(iban: string): boolean {
  const value = normalizeIban(iban);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(value)) return false;
  const rearranged = `${value.slice(4)}${value.slice(0, 4)}`;
  const expanded = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of expanded) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

function maskIban(iban: string): string {
  const value = normalizeIban(iban);
  if (value.length < 8) return value;
  return `${value.slice(0, 4)} ${'*'.repeat(Math.max(0, value.length - 8))}${value.slice(-4)}`;
}

function sanitizePayoutDetails(payoutMethodInput: unknown, rawDetails: unknown) {
  const method = String(payoutMethodInput || 'bank_transfer')
    .trim()
    .toLowerCase();

  if (method !== 'bank_transfer' && method !== 'manual_transfer') {
    throw new Error('Método de retirada no válido');
  }

  const source = rawDetails && typeof rawDetails === 'object' && !Array.isArray(rawDetails) ? (rawDetails as any) : {};

  const accountHolder = String(source.account_holder || source.accountHolder || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 140);
  const iban = normalizeIban(source.iban);
  const bankName = String(source.bank_name || source.bankName || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 140);
  const country = String(source.country || 'ES')
    .trim()
    .toUpperCase()
    .slice(0, 2);

  if (accountHolder.length < 4) {
    throw new Error('Titular de la cuenta no válido');
  }
  if (!iban) {
    throw new Error('Debes indicar un IBAN');
  }
  if (!isValidIbanChecksum(iban)) {
    throw new Error('IBAN no válido');
  }

  return {
    payout_method: 'bank_transfer',
    payout_details: {
      account_holder: accountHolder,
      iban,
      iban_masked: maskIban(iban),
      bank_name: bankName || null,
      country: country || 'ES',
    },
  };
}

async function getOutstandingWithdrawalsCents(userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const { data, error } = await supabaseAdmin
    .from('user_wallet_withdrawal_requests')
    .select('amount_cents,status')
    .eq('user_id', userId)
    .in('status', ['pending', 'approved']);
  if (error) throw error;
  return (data || []).reduce((sum, row: any) => sum + Math.max(0, Math.round(Number(row?.amount_cents || 0))), 0);
}

export async function GET() {
  try {
    const { user } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const [wallet, outstanding] = await Promise.all([
      getUserWalletSnapshot(user.id, 30),
      getOutstandingWithdrawalsCents(user.id),
    ]);

    const { data, error } = await supabaseAdmin
      .from('user_wallet_withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    const normalizedRequests = (data || []).map((row: any) => normalizeRequest(row));
    const latestPayout =
      normalizedRequests.find(
        (request: any) =>
          request?.payout_details &&
          typeof request.payout_details === 'object' &&
          Object.keys(request.payout_details).length > 0
      )?.payout_details || null;

    return NextResponse.json({
      requests: normalizedRequests,
      last_payout_details: latestPayout,
      wallet: {
        available_cents: Math.max(0, Math.round(Number(wallet.account.balance_cents || 0))),
        outstanding_withdrawals_cents: outstanding,
        requestable_now_cents: Math.max(
          0,
          Math.round(Number(wallet.account.balance_cents || 0)) - Math.max(0, Math.round(Number(outstanding || 0)))
        ),
      },
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const amountCents = Math.round(Number(body?.amount_cents || 0));
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: 'amount_cents debe ser > 0' }, { status: 400 });
    }

    const payoutMethod =
      typeof body?.payout_method === 'string' && body.payout_method.trim()
        ? body.payout_method.trim().slice(0, 80)
        : 'bank_transfer';
    const note =
      typeof body?.note === 'string' && body.note.trim()
        ? body.note.trim().slice(0, 1000)
        : null;
    const payout = sanitizePayoutDetails(payoutMethod, body?.payout_details);

    const [wallet, outstanding] = await Promise.all([
      getUserWalletSnapshot(user.id, 20),
      getOutstandingWithdrawalsCents(user.id),
    ]);

    const available = Math.max(0, Math.round(Number(wallet.account.balance_cents || 0)));
    const requestableNow = Math.max(0, available - outstanding);
    if (amountCents > requestableNow) {
      return NextResponse.json(
        {
          error: `Saldo disponible para solicitar retirada insuficiente. Máximo ahora: ${requestableNow} céntimos`,
          requestable_now_cents: requestableNow,
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('user_wallet_withdrawal_requests')
      .insert({
        user_id: user.id,
        amount_cents: amountCents,
        status: 'pending',
        payout_method: payout.payout_method,
        payout_details: payout.payout_details,
        note,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select('*')
      .single();

    if (error || !data) throw error || new Error('No se pudo crear la solicitud');

    return NextResponse.json({
      success: true,
      request: normalizeRequest(data),
      wallet: {
        available_cents: available,
        outstanding_withdrawals_cents: outstanding + amountCents,
        requestable_now_cents: Math.max(0, requestableNow - amountCents),
      },
    });
  } catch (error: any) {
    return handleError(error);
  }
}
