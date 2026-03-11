/**
 * Ajusta el saldo de cartera interna de un usuario por email.
 *
 * Uso:
 *   npx tsx scripts/set-user-wallet-balance.ts --email=flardop66@gmail.com --amount=1000
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const paths = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '..', '.env.local'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1].trim();
      const val = m[2].trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
    return;
  }
}

function parseArg(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : null;
}

function eurosToCents(amount: string): number {
  const normalized = amount.replace(',', '.').trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Cantidad inválida: ${amount}`);
  }
  return Math.round(n * 100);
}

async function main() {
  loadEnvLocal();

  const email = (parseArg('email') || '').toLowerCase();
  const amountRaw = parseArg('amount') || '';
  if (!email || !amountRaw) {
    throw new Error('Uso: npx tsx scripts/set-user-wallet-balance.ts --email=<email> --amount=<euros>');
  }

  const balanceCents = eurosToCents(amountRaw);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userRes = await supabase.from('users').select('id,email').ilike('email', email).maybeSingle();
  if (userRes.error) throw new Error(userRes.error.message);
  if (!userRes.data?.id) throw new Error(`No existe el usuario en public.users: ${email}`);

  const userId = String(userRes.data.id);

  const currentWallet = await supabase
    .from('user_wallet_accounts')
    .select('total_earned_cents,total_withdrawn_cents')
    .eq('user_id', userId)
    .maybeSingle();
  if (currentWallet.error) throw new Error(currentWallet.error.message);

  const currentEarned = Math.max(0, Number(currentWallet.data?.total_earned_cents || 0));
  const currentWithdrawn = Math.max(0, Number(currentWallet.data?.total_withdrawn_cents || 0));

  const upsertWallet = await supabase.from('user_wallet_accounts').upsert(
    {
      user_id: userId,
      balance_cents: balanceCents,
      pending_cents: 0,
      total_earned_cents: Math.max(currentEarned, balanceCents),
      total_withdrawn_cents: currentWithdrawn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (upsertWallet.error) throw new Error(upsertWallet.error.message);

  const referenceId = `manual-balance-${balanceCents}-${Date.now()}`;
  const txInsert = await supabase.from('user_wallet_transactions').insert({
    user_id: userId,
    amount_cents: balanceCents,
    direction: 'credit',
    status: 'available',
    kind: 'manual_adjustment',
    description: `Ajuste manual de saldo a ${(balanceCents / 100).toFixed(2)} EUR`,
    reference_type: 'manual_script',
    reference_id: referenceId,
    metadata: { source: 'set-user-wallet-balance.ts' },
    created_by: userId,
  });
  if (txInsert.error) throw new Error(txInsert.error.message);

  console.log(`OK: saldo actualizado para ${email} => ${(balanceCents / 100).toFixed(2)} EUR`);
}

main().catch((error) => {
  console.error('ERROR:', error?.message || error);
  process.exit(1);
});
