import { NextResponse } from 'next/server';
import { ApiError, requireAdminContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

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

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>, delimiter = ';'): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((header) => csvEscape(header)).join(delimiter),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(delimiter)),
  ];
  return lines.join('\n');
}

export async function GET(req: Request) {
  try {
    await requireAdminContext();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const url = new URL(req.url);
    const launchKey = normalizeLaunchKey(url.searchParams.get('launchKey'));
    const status = String(url.searchParams.get('status') || 'active').trim().toLowerCase();
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 5000), 100), 25000);

    let query = supabaseAdmin
      .from('future_launch_reservations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (launchKey) query = query.eq('launch_key', launchKey);
    if (status === 'active' || status === 'cancelled') query = query.eq('status', status);

    const { data: reservations, error: reservationError } = await query;
    if (reservationError) {
      if (isMissingTableError(reservationError, 'future_launch_reservations')) {
        return NextResponse.json(
          {
            setupRequired: true,
            error: 'Falta configurar future_launch_reservations. Ejecuta database/hype_future_launches.sql',
          },
          { status: 503 }
        );
      }
      throw reservationError;
    }

    const reservationRows = Array.isArray(reservations) ? reservations : [];
    const userIds = [...new Set(reservationRows.map((row: any) => String(row?.user_id || '')).filter(Boolean))];
    const launchKeys = [...new Set(reservationRows.map((row: any) => String(row?.launch_key || '')).filter(Boolean))];

    const [usersResult, launchesResult] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from('users').select('id,email,name').in('id', userIds)
        : Promise.resolve({ data: [] as any[], error: null as any }),
      launchKeys.length
        ? supabaseAdmin.from('future_launches').select('launch_key,title,kind,lock_until').in('launch_key', launchKeys)
        : Promise.resolve({ data: [] as any[], error: null as any }),
    ]);

    const users = Array.isArray(usersResult.data) ? usersResult.data : [];
    const launches = Array.isArray(launchesResult.data) ? launchesResult.data : [];
    const userMap = new Map<string, any>(users.map((user: any) => [String(user.id), user]));
    const launchMap = new Map<string, any>(launches.map((launch: any) => [String(launch.launch_key), launch]));

    const filtered = q
      ? reservationRows.filter((row: any) => {
          const user = userMap.get(String(row?.user_id || ''));
          const launch = launchMap.get(String(row?.launch_key || ''));
          const haystack = [
            String(row?.id || ''),
            String(row?.launch_key || ''),
            String(row?.status || ''),
            String(user?.email || ''),
            String(user?.name || ''),
            String(launch?.title || ''),
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : reservationRows;

    const exportRows = filtered.map((row: any) => {
      const user = userMap.get(String(row?.user_id || ''));
      const launch = launchMap.get(String(row?.launch_key || ''));
      return {
        reservation_id: String(row?.id || ''),
        launch_key: String(row?.launch_key || ''),
        launch_title: String(launch?.title || ''),
        launch_kind: String(launch?.kind || ''),
        launch_lock_until: String(launch?.lock_until || ''),
        status: String(row?.status || ''),
        user_id: String(row?.user_id || ''),
        user_email: String(user?.email || ''),
        user_name: String(user?.name || ''),
        created_at: String(row?.created_at || ''),
        updated_at: String(row?.updated_at || ''),
      };
    });

    const csv = toCsv(exportRows);
    const suffix = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `hype-reservas-${launchKey || 'all'}-${suffix}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
