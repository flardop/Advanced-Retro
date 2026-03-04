import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { runSocialStorageToSqlBackfill } from '@/lib/socialBackfill';

export const dynamic = 'force-dynamic';

function normalizeLimit(value: unknown, fallback = 250): number {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.max(parsed, 1), 1000);
}

export async function GET(req: Request) {
  try {
    await requireAdminContext();
    const url = new URL(req.url);
    const dryRunRaw = String(url.searchParams.get('dryRun') || '1').trim().toLowerCase();
    const dryRun = !(dryRunRaw === '0' || dryRunRaw === 'false' || dryRunRaw === 'off');
    const limit = normalizeLimit(url.searchParams.get('limit'), 120);

    const result = await runSocialStorageToSqlBackfill({
      dryRun,
      limit,
    });

    return NextResponse.json({
      success: true,
      result,
      hint: dryRun
        ? 'Es simulación (dryRun). Usa POST con dryRun=false para aplicar.'
        : 'Backfill aplicado correctamente.',
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = String(error?.message || 'No se pudo ejecutar backfill');
    const setupRequired = message.toLowerCase().includes('falta configurar tablas sociales');
    return NextResponse.json(
      {
        error: message,
        setupRequired,
      },
      { status: setupRequired ? 503 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminContext();
    const body = await req.json().catch(() => ({}));

    const dryRun = Boolean(body?.dryRun);
    const limit = normalizeLimit(body?.limit, 250);
    const productIds = Array.isArray(body?.productIds) ? body.productIds : undefined;

    const result = await runSocialStorageToSqlBackfill({
      dryRun,
      limit,
      productIds,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = String(error?.message || 'No se pudo ejecutar backfill');
    const setupRequired = message.toLowerCase().includes('falta configurar tablas sociales');
    return NextResponse.json(
      {
        error: message,
        setupRequired,
      },
      { status: setupRequired ? 503 : 500 }
    );
  }
}
