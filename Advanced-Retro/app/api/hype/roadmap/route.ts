import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type LaunchKind = 'mystery_drop' | 'auction_season';

type LaunchRow = {
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
};

function addDaysIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

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

function getFallbackLaunches(): LaunchRow[] {
  return [
    {
      launch_key: 'mystery-drop-s1',
      kind: 'mystery_drop',
      title: 'Drop bloqueado: Caja Sorpresa Retro',
      subtitle: 'Apertura en 30 días',
      description:
        'Caja sorpresa premium con selección oculta de juegos retro. Solo con plaza reservada y cupo limitado.',
      image_url: '/images/hype/mystery-drop.svg',
      lock_until: addDaysIso(30),
      is_active: true,
      pinned: true,
      priority: 10,
    },
    {
      launch_key: 'auctions-season-1',
      kind: 'auction_season',
      title: 'Subastas privadas: Temporada 1',
      subtitle: 'Apertura en 50 días',
      description:
        'Puja por piezas de colección y ediciones difíciles. Reserva plaza y entra antes al lanzamiento.',
      image_url: '/images/hype/auction-season.svg',
      lock_until: addDaysIso(50),
      is_active: true,
      pinned: true,
      priority: 20,
    },
  ];
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let setupRequired = false;
    let launches: LaunchRow[] = [];

    const { data: launchRows, error: launchError } = await supabaseAdmin
      .from('future_launches')
      .select('launch_key,kind,title,subtitle,description,image_url,lock_until,is_active,pinned,priority')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('lock_until', { ascending: true });

    if (launchError) {
      if (isMissingTableError(launchError, 'future_launches')) {
        setupRequired = true;
      } else {
        throw launchError;
      }
    } else {
      launches = (Array.isArray(launchRows) ? launchRows : []) as LaunchRow[];
    }

    if (launches.length === 0) {
      launches = getFallbackLaunches();
    }

    const activeKeys = launches.map((item) => String(item.launch_key || '')).filter(Boolean);
    const reservationCountByKey = new Map<string, number>();
    const reservedByUserSet = new Set<string>();

    if (activeKeys.length > 0 && !setupRequired) {
      const { data: reservationRows, error: reservationError } = await supabaseAdmin
        .from('future_launch_reservations')
        .select('launch_key,status')
        .in('launch_key', activeKeys)
        .eq('status', 'active');

      if (reservationError) {
        if (isMissingTableError(reservationError, 'future_launch_reservations')) {
          setupRequired = true;
        } else {
          throw reservationError;
        }
      } else {
        for (const row of reservationRows || []) {
          const key = String((row as any)?.launch_key || '');
          if (!key) continue;
          reservationCountByKey.set(key, Number(reservationCountByKey.get(key) || 0) + 1);
        }
      }
    }

    if (user?.id && activeKeys.length > 0 && !setupRequired) {
      const { data: ownReservations, error: ownError } = await supabaseAdmin
        .from('future_launch_reservations')
        .select('launch_key,status')
        .eq('user_id', user.id)
        .in('launch_key', activeKeys)
        .eq('status', 'active');

      if (!ownError) {
        for (const row of ownReservations || []) {
          const key = String((row as any)?.launch_key || '');
          if (key) reservedByUserSet.add(key);
        }
      }
    }

    const responseLaunches = launches.map((item) => ({
      ...item,
      reservations_count: Number(reservationCountByKey.get(String(item.launch_key || '')) || 0),
      reserved_by_current_user: reservedByUserSet.has(String(item.launch_key || '')),
    }));

    return NextResponse.json({
      ok: true,
      setupRequired,
      launches: responseLaunches,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'No se pudo cargar roadmap' }, { status: 500 });
  }
}

