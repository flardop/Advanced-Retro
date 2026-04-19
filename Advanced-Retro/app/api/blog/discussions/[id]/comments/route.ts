import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { addBlogDiscussionComment } from '@/lib/blogDiscussions';
import { requireUserContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function guessAuthorName(user: any, profile: any): string {
  const candidates = [
    typeof profile?.name === 'string' ? profile.name : '',
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '',
    typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : '',
    typeof user?.email === 'string' ? user.email.split('@')[0] : '',
  ];

  for (const item of candidates) {
    const value = String(item || '').trim();
    if (value) return value.slice(0, 60);
  }

  return 'Coleccionista';
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const discussionId = String(params?.id || '').trim();
    if (!discussionId) return badRequest('Discusión no válida');

    const { user, profile } = await requireUserContext();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const rl = checkRateLimit({
      key: `blog-discussions:comment:${discussionId}:${user.id || ip}`,
      maxRequests: 18,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas respuestas en poco tiempo. Espera 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Payload inválido');

    const content = String((body as any).content || '').trim();
    const parentCommentId = String((body as any).parentCommentId || '').trim();
    if (content.length < 2) return badRequest('El comentario debe tener al menos 2 caracteres');
    if (content.length > (parentCommentId ? 1200 : 1800)) {
      return badRequest(parentCommentId ? 'La respuesta es demasiado larga' : 'El comentario es demasiado largo');
    }

    const discussion = await addBlogDiscussionComment({
      discussionId,
      userId: user.id,
      authorName: guessAuthorName(user, profile),
      authorAvatarUrl: profile.avatar_url,
      body: content,
      parentCommentId: parentCommentId || null,
    });

    return NextResponse.json({ discussion });
  } catch (error: any) {
    const message = error?.message || 'No se pudo publicar el comentario';
    const status = Number(error?.status) || (message.toLowerCase().includes('unauthorized') ? 401 : 500);
    return NextResponse.json({ error: message }, { status });
  }
}
