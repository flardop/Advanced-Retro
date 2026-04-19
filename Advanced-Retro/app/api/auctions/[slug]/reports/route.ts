import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { reportRetroStorageChatMessage } from '@/lib/retroStorageAuctions';
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
      key: `retro-auction:report:${user.id || ip}`,
      maxRequests: 6,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados reportes en poco tiempo. Espera un poco.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return auctionBadRequest('Payload invalido');
    const messageId = String((body as any).messageId || '').trim();
    const reason = String((body as any).reason || '').trim();
    if (!messageId) return auctionBadRequest('messageId es obligatorio');

    const payload = await reportRetroStorageChatMessage({
      slug: params.slug,
      userId: user.id,
      authorName: guessAuctionAuthorName(user, profile),
      messageId,
      reason: reason || 'Mensaje marcado para revision',
    });

    return NextResponse.json(payload);
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo reportar el mensaje');
  }
}
