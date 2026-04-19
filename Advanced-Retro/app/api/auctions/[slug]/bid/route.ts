import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { placeRetroStorageBid } from '@/lib/retroStorageAuctions';
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
      key: `retro-auction:bid:${user.id || ip}`,
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas pujas en muy poco tiempo. Espera un minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return auctionBadRequest('Payload invalido');
    const amountCents = Number((body as any).amountCents || 0);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return auctionBadRequest('Debes indicar una puja valida');
    }

    const auction = await placeRetroStorageBid({
      slug: params.slug,
      userId: user.id,
      authorName: guessAuctionAuthorName(user, profile),
      authorAvatarUrl: profile.avatar_url,
      amountCents,
    });

    return NextResponse.json({ auction });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo registrar la puja');
  }
}
