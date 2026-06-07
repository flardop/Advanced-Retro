import { NextRequest, NextResponse } from 'next/server';
import { buildFinanceCalendarIcs, getFinanceCalendarFeed } from '@/lib/financeHub';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const feed = await getFinanceCalendarFeed(params.token);
    if (!feed || !feed.settings.calendarFeedEnabled) {
      return new NextResponse('Calendario no disponible', { status: 404 });
    }

    const ics = buildFinanceCalendarIcs(
      'AdvancedRetro Finanzas',
      feed.tasks
    );

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition':
          'inline; filename="advancedretro-finanzas.ics"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : 'No se pudo generar el calendario',
      { status: 500 }
    );
  }
}
