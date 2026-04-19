import { NextRequest, NextResponse } from 'next/server';
import { getRetroStorageAuctionDetail } from '@/lib/retroStorageAuctions';
import { getOptionalAuctionRouteUser, handleAuctionRouteError } from '@/lib/retroStorageAuctionRouteUtils';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { slug: string };
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getOptionalAuctionRouteUser();
    const detail = await getRetroStorageAuctionDetail(params.slug, user?.id || null);
    if (!detail) {
      return NextResponse.json({ error: 'La subasta no existe' }, { status: 404 });
    }

    return NextResponse.json({ auction: detail });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo cargar la subasta');
  }
}
