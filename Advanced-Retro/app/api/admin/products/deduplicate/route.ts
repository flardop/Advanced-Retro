import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { deduplicateProducts } from '@/lib/adminProductCleanup';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

async function runDedupe(apply: boolean, maxGroups: number) {
  await requireAdminContext();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const result = await deduplicateProducts(supabaseAdmin, {
    apply,
    maxGroups,
  });

  return NextResponse.json({
    success: true,
    apply,
    ...result,
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const maxGroups = Math.min(500, Math.max(1, Number(url.searchParams.get('maxGroups') || 100)));
    return await runDedupe(false, maxGroups);
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const apply = Boolean(body?.apply);
    const maxGroups = Math.min(500, Math.max(1, Number(body?.maxGroups || 200)));
    return await runDedupe(apply, maxGroups);
  } catch (error: any) {
    return handleError(error);
  }
}
