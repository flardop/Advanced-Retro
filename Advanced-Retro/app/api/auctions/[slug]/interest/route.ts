import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { registerRetroStorageInterest } from '@/lib/retroStorageAuctions';
import { auctionBadRequest, guessAuctionAuthorName, handleAuctionRouteError } from '@/lib/retroStorageAuctionRouteUtils';
import { requireUserContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { slug: string };
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { user, profile } = await requireUserContext();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';

    const rl = checkRateLimit({
      key: `retro-auction:interest:${user.id || ip}`,
      maxRequests: 12,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas acciones en poco tiempo. Espera un momento.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return auctionBadRequest('Payload invalido');
    const action = String((body as any).action || '').trim();
    if (action !== 'buy' && action !== 'rent') {
      return auctionBadRequest('La accion debe ser buy o rent');
    }

    const auction = await registerRetroStorageInterest({
      slug: params.slug,
      userId: user.id,
      authorName: guessAuctionAuthorName(user, profile),
      action,
    });

    return NextResponse.json({ auction });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo registrar la solicitud');
  }
}
