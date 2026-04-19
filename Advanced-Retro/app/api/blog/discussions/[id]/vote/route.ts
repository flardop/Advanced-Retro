import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { setBlogDiscussionVote } from '@/lib/blogDiscussions';
import { requireUserContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const discussionId = String(params?.id || '').trim();
    if (!discussionId) return badRequest('Discusión no válida');

    const { user } = await requireUserContext();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const rl = checkRateLimit({
      key: `blog-discussions:vote:${discussionId}:${user.id || ip}`,
      maxRequests: 40,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados votos en poco tiempo. Espera 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Payload inválido');

    const rawValue = Number((body as any).value);
    if (![ -1, 0, 1 ].includes(rawValue)) {
      return badRequest('El voto debe ser -1, 0 o 1');
    }

    const discussion = await setBlogDiscussionVote({
      discussionId,
      userId: user.id,
      value: rawValue as -1 | 0 | 1,
    });

    return NextResponse.json({ discussion });
  } catch (error: any) {
    const message = error?.message || 'No se pudo registrar el voto';
    const status = Number(error?.status) || (message.toLowerCase().includes('unauthorized') ? 401 : 500);
    return NextResponse.json({ error: message }, { status });
  }
}
