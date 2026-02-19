import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: posts, error } = await supabaseAdmin
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(120);

    if (error) throw error;

    const userIds = [...new Set((posts || []).map((post) => String(post.user_id)).filter(Boolean))];
    const { data: users } = userIds.length
      ? await supabaseAdmin
          .from('users')
          .select('id,name,email,avatar_url')
          .in('id', userIds)
      : { data: [] as any[] };

    const userMap = new Map<string, any>((users || []).map((user) => [String(user.id), user]));

    const payload = (posts || []).map((post) => ({
      ...post,
      user: userMap.get(String(post.user_id)) || null,
    }));

    return NextResponse.json({ posts: payload });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { user, profile } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const title = String(body?.title || '').trim().slice(0, 140);
    const content = String(body?.content || '').trim().slice(0, 2500);
    const images = Array.isArray(body?.images)
      ? body.images
          .filter((item: unknown): item is string => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => /^https?:\/\//i.test(item) || item.startsWith('/'))
          .slice(0, 4)
      : [];

    if (title.length < 4) {
      return NextResponse.json({ error: 'El título debe tener al menos 4 caracteres' }, { status: 400 });
    }
    if (content.length < 20) {
      return NextResponse.json({ error: 'El contenido debe tener al menos 20 caracteres' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        user_id: user.id,
        title,
        content,
        images,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'No se pudo crear la publicación' }, { status: 400 });
    }

    return NextResponse.json({
      post: {
        ...data,
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url,
        },
      },
    });
  } catch (error: any) {
    return handleError(error);
  }
}
