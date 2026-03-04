import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type LaunchKind = 'mystery_drop' | 'auction_season';

type LaunchRow = {
  id: string;
  launch_key: string;
  kind: LaunchKind;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  lock_until: string;
  is_active: boolean;
  pinned: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status: 500 });
}

function isMissingTableError(error: unknown, tableName: string): boolean {
  const message = String((error as any)?.message || '').toLowerCase();
  return (
    message.includes(tableName.toLowerCase()) &&
    (message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('schema cache') ||
      message.includes('could not find the table'))
  );
}

function normalizeLaunchKey(input: unknown): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '')
    .slice(0, 80);
}

function normalizeText(input: unknown, max = 255): string {
  return String(input || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);
}

function normalizeMultiline(input: unknown, max = 1800): string {
  return String(input || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, max);
}

function parseLockUntil(input: unknown): string | null {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function parsePriority(input: unknown): number | null {
  const value = Number(input);
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(Math.round(value), 0), 100000);
}

function parseKind(input: unknown): LaunchKind | null {
  const value = String(input || '').trim();
  if (value === 'mystery_drop' || value === 'auction_season') return value;
  return null;
}

async function buildLaunchesWithReservationCount(
  client: NonNullable<typeof supabaseAdmin>,
  launches: LaunchRow[]
) {
  const launchKeys = launches.map((item) => String(item.launch_key || '')).filter(Boolean);
  const reservationCountMap = new Map<string, number>();

  if (launchKeys.length > 0) {
    const { data: reservations, error: reservationError } = await client
      .from('future_launch_reservations')
      .select('launch_key,status')
      .in('launch_key', launchKeys)
      .eq('status', 'active');

    if (reservationError) {
      if (!isMissingTableError(reservationError, 'future_launch_reservations')) {
        throw reservationError;
      }
    } else {
      for (const row of reservations || []) {
        const launchKey = String((row as any)?.launch_key || '');
        if (!launchKey) continue;
        reservationCountMap.set(launchKey, Number(reservationCountMap.get(launchKey) || 0) + 1);
      }
    }
  }

  return launches.map((launch) => ({
    ...launch,
    reservations_count: Number(reservationCountMap.get(String(launch.launch_key || '')) || 0),
  }));
}

export async function GET() {
  try {
    await requireAdminContext();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data, error } = await supabaseAdmin
      .from('future_launches')
      .select('*')
      .order('pinned', { ascending: false })
      .order('priority', { ascending: true })
      .order('lock_until', { ascending: true })
      .limit(200);

    if (error) {
      if (isMissingTableError(error, 'future_launches')) {
        return NextResponse.json(
          {
            setupRequired: true,
            error: 'Falta configurar future_launches. Ejecuta database/hype_future_launches.sql',
            launches: [],
          },
          { status: 503 }
        );
      }
      throw error;
    }

    const launches = await buildLaunchesWithReservationCount(
      supabaseAdmin,
      Array.isArray(data) ? (data as LaunchRow[]) : []
    );
    return NextResponse.json({ launches, setupRequired: false });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminContext();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const launchKey = normalizeLaunchKey(body?.launch_key);
    const kind = parseKind(body?.kind);
    const title = normalizeText(body?.title, 160);
    const subtitle = normalizeText(body?.subtitle, 160);
    const description = normalizeMultiline(body?.description, 1800);
    const imageUrl = normalizeText(body?.image_url || '/placeholder.svg', 500);
    const lockUntil = parseLockUntil(body?.lock_until);
    const priority = parsePriority(body?.priority) ?? 100;
    const isActive = typeof body?.is_active === 'boolean' ? body.is_active : true;
    const pinned = typeof body?.pinned === 'boolean' ? body.pinned : false;

    if (!launchKey || !kind || !title || !lockUntil) {
      return NextResponse.json(
        { error: 'launch_key, kind, title y lock_until son obligatorios' },
        { status: 400 }
      );
    }

    const payload = {
      launch_key: launchKey,
      kind,
      title,
      subtitle,
      description,
      image_url: imageUrl,
      lock_until: lockUntil,
      is_active: Boolean(isActive),
      pinned: Boolean(pinned),
      priority,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('future_launches')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'future_launches')) {
        return NextResponse.json(
          { setupRequired: true, error: 'Falta configurar future_launches. Ejecuta database/hype_future_launches.sql' },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ launch: data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminContext();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const launchKey = normalizeLaunchKey(body?.launch_key);
    if (!launchKey) {
      return NextResponse.json({ error: 'launch_key requerido' }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.title !== 'undefined') update.title = normalizeText(body.title, 160);
    if (typeof body?.subtitle !== 'undefined') update.subtitle = normalizeText(body.subtitle, 160);
    if (typeof body?.description !== 'undefined') update.description = normalizeMultiline(body.description, 1800);
    if (typeof body?.image_url !== 'undefined') update.image_url = normalizeText(body.image_url, 500);
    if (typeof body?.is_active === 'boolean') update.is_active = body.is_active;
    if (typeof body?.pinned === 'boolean') update.pinned = body.pinned;
    if (typeof body?.kind !== 'undefined') {
      const nextKind = parseKind(body.kind);
      if (!nextKind) return NextResponse.json({ error: 'kind inválido' }, { status: 400 });
      update.kind = nextKind;
    }

    if (typeof body?.priority !== 'undefined') {
      const priority = parsePriority(body.priority);
      if (priority == null) return NextResponse.json({ error: 'priority inválido' }, { status: 400 });
      update.priority = priority;
    }

    if (typeof body?.lock_until !== 'undefined') {
      const lockUntil = parseLockUntil(body.lock_until);
      if (!lockUntil) return NextResponse.json({ error: 'lock_until inválido' }, { status: 400 });
      update.lock_until = lockUntil;
    }

    if (Object.keys(update).length <= 1) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('future_launches')
      .update(update)
      .eq('launch_key', launchKey)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error, 'future_launches')) {
        return NextResponse.json(
          { setupRequired: true, error: 'Falta configurar future_launches. Ejecuta database/hype_future_launches.sql' },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Lanzamiento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ launch: data });
  } catch (error) {
    return handleError(error);
  }
}
