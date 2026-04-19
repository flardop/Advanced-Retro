import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getBlogDiscussionById } from '@/lib/blogDiscussions';

export const dynamic = 'force-dynamic';

async function getOptionalAuthUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const discussionId = String(params?.id || '').trim();
    if (!discussionId) {
      return NextResponse.json({ error: 'Discusión no válida' }, { status: 400 });
    }

    const user = await getOptionalAuthUser();
    const discussion = await getBlogDiscussionById(discussionId, user?.id || null);
    if (!discussion) {
      return NextResponse.json({ error: 'Discusión no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      discussion,
      currentUserId: user?.id || null,
      canComment: Boolean(user?.id),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo cargar la discusión' },
      { status: 500 }
    );
  }
}
