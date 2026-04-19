import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  getQuickAuctionReactions,
  getRetroStorageAuctionDetail,
  postRetroStorageChatMessage,
} from '@/lib/retroStorageAuctions';
import {
  auctionBadRequest,
  getOptionalAuctionRouteUser,
  guessAuctionAuthorName,
  handleAuctionRouteError,
} from '@/lib/retroStorageAuctionRouteUtils';
import { requireUserContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { slug: string };
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getOptionalAuctionRouteUser();
    const auction = await getRetroStorageAuctionDetail(params.slug, user?.id || null);
    if (!auction) {
      return NextResponse.json({ error: 'La subasta no existe' }, { status: 404 });
    }

    return NextResponse.json({
      chat: auction.chat,
      quickReactions: getQuickAuctionReactions(),
      reportsCount: auction.reportsCount,
      isAuthenticated: auction.isAuthenticated,
    });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo cargar el chat de la subasta');
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { user, profile } = await requireUserContext();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';

    const rl = checkRateLimit({
      key: `retro-auction:chat:${user.id || ip}`,
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados mensajes en poco tiempo. Espera un momento.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return auctionBadRequest('Payload invalido');

    const rawKind = String((body as any).kind || 'message').trim();
    const bodyText = String((body as any).body || '').trim();
    if (!bodyText) return auctionBadRequest('Escribe algo antes de enviar');

    const auction = await postRetroStorageChatMessage({
      slug: params.slug,
      userId: user.id,
      authorName: guessAuctionAuthorName(user, profile),
      authorAvatarUrl: profile.avatar_url,
      body: bodyText,
      kind: rawKind === 'reaction' ? 'reaction' : 'message',
    });

    return NextResponse.json({ auction });
  } catch (error: any) {
    return handleAuctionRouteError(error, 'No se pudo enviar el mensaje');
  }
}
