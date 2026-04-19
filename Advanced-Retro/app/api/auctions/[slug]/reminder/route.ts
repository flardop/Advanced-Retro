import { NextRequest, NextResponse } from 'next/server';
import { toggleRetroStorageReminder } from '@/lib/retroStorageAuctions';
import { handleAuctionRouteError } from '@/lib/retroStorageAuctionRouteUtils';
import { requireUserContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { slug: string };
};

export async function POST(_req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await requireUserContext();
    const auction = await toggleRetroStorageReminder(params.slug, user.id);
    return NextResponse.json({ auction });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo actualizar el recordatorio');
  }
}
