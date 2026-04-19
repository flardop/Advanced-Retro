import { NextRequest, NextResponse } from 'next/server';
import { buildRetroStorageAuctionCalendarIcs, getRetroStorageAuctionDetail, getRetroStorageAuctionSeed } from '@/lib/retroStorageAuctions';
import { handleAuctionRouteError } from '@/lib/retroStorageAuctionRouteUtils';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { slug: string };
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const seed = getRetroStorageAuctionSeed(params.slug);
    if (!seed) {
      return NextResponse.json({ error: 'La subasta no existe' }, { status: 404 });
    }

    const detail = await getRetroStorageAuctionDetail(params.slug, null);
    if (!detail) {
      return NextResponse.json({ error: 'La subasta no existe' }, { status: 404 });
    }

    const body = buildRetroStorageAuctionCalendarIcs(seed, detail);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename=\"${seed.slug}.ics\"`,
      },
    });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo generar el calendario');
  }
}
