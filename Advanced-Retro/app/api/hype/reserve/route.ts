import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function isMissingTableError(error: any, tableName: string): boolean {
  const text = String(error?.message || '').toLowerCase();
  return (
    text.includes(tableName.toLowerCase()) &&
    (text.includes('does not exist') ||
      text.includes('relation') ||
      text.includes('schema cache') ||
      text.includes('could not find the table'))
  );
}

function normalizeLaunchKey(input: unknown): string {
  const raw = String(input || '')
    .trim()
    .toLowerCase();
  if (!raw) return '';
  return raw.replace(/[^a-z0-9-_.]/g, '');
}

export async function POST(req: Request) {
  try {
    const { profile } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const launchKey = normalizeLaunchKey(body?.launchKey);
    if (!launchKey) {
      return NextResponse.json({ error: 'launchKey requerido' }, { status: 400 });
    }

    const { data: launch, error: launchError } = await supabaseAdmin
      .from('future_launches')
      .select('launch_key,is_active,lock_until')
      .eq('launch_key', launchKey)
      .maybeSingle();

    if (launchError) {
      if (isMissingTableError(launchError, 'future_launches')) {
        return NextResponse.json(
          {
            error: 'Falta configurar tabla future_launches. Ejecuta database/hype_future_launches.sql',
            setupRequired: true,
          },
          { status: 409 }
        );
      }
      throw launchError;
    }

    if (!launch || !launch.is_active) {
      return NextResponse.json({ error: 'Lanzamiento no disponible para reserva' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const { error: reserveError } = await supabaseAdmin
      .from('future_launch_reservations')
      .upsert(
        {
          user_id: profile.id,
          launch_key: launchKey,
          status: 'active',
          updated_at: nowIso,
        },
        { onConflict: 'launch_key,user_id' }
      );

    if (reserveError) {
      if (isMissingTableError(reserveError, 'future_launch_reservations')) {
        return NextResponse.json(
          {
            error: 'Falta configurar tabla future_launch_reservations. Ejecuta database/hype_future_launches.sql',
            setupRequired: true,
          },
          { status: 409 }
        );
      }
      throw reserveError;
    }

    const { count } = await supabaseAdmin
      .from('future_launch_reservations')
      .select('id', { count: 'exact', head: true })
      .eq('launch_key', launchKey)
      .eq('status', 'active');

    return NextResponse.json({
      ok: true,
      launchKey,
      reserved: true,
      reservationsCount: Number(count || 0),
      lockedUntil: String(launch.lock_until || ''),
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'No se pudo reservar plaza' }, { status: 500 });
  }
}

