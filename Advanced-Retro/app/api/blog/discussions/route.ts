import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { checkRateLimit } from '@/lib/rateLimit';
import { createBlogDiscussion, listBlogDiscussions } from '@/lib/blogDiscussions';
import { requireUserContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

async function getOptionalAuthUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

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

export async function GET(req: NextRequest) {
  try {
    const user = await getOptionalAuthUser();
    const slug = String(req.nextUrl.searchParams.get('slug') || '').trim().toLowerCase();
    const sort = req.nextUrl.searchParams.get('sort') === 'new' ? 'new' : 'top';
    const limit = Number(req.nextUrl.searchParams.get('limit') || 12);

    const discussions = await listBlogDiscussions({
      blogSlug: slug || null,
      currentUserId: user?.id || null,
      sort,
      limit,
    });

    return NextResponse.json({
      discussions,
      currentUserId: user?.id || null,
      canCreate: Boolean(user?.id),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudieron cargar las discusiones del blog' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireUserContext();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const rl = checkRateLimit({
      key: `blog-discussions:create:${user.id || ip}`,
      maxRequests: 8,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas discusiones creadas en poco tiempo. Espera 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Payload inválido');

    const blogSlug = String((body as any).blogSlug || '').trim().toLowerCase();
    const title = String((body as any).title || '').trim();
    const content = String((body as any).content || '').trim();

    if (!blogSlug) return badRequest('blogSlug es requerido');
    if (title.length < 4) return badRequest('El título debe tener al menos 4 caracteres');
    if (content.length < 20) return badRequest('El contenido debe tener al menos 20 caracteres');

    const discussion = await createBlogDiscussion({
      blogSlug,
      userId: user.id,
      authorName: guessAuthorName(user, profile),
      authorAvatarUrl: profile.avatar_url,
      title,
      body: content,
    });

    return NextResponse.json({ discussion });
  } catch (error: any) {
    const message = error?.message || 'No se pudo crear la discusión';
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
