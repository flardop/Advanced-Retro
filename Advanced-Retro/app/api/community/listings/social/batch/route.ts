import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import {
  getCommunityListingSocialSummary,
  readCommunityListingSocialState,
} from '@/lib/communityListingSocial';
import { normalizeVisitorId } from '@/lib/productSocialStorage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rawIds = Array.isArray(body?.listingIds) ? body.listingIds : [];

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const visitorId = user?.id ? `auth-${user.id}` : normalizeVisitorId(body?.visitorId);

    const listingIds = rawIds
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id: string) => id.trim())
      .slice(0, 200);

    if (listingIds.length === 0) {
      return NextResponse.json({ success: true, metrics: {} });
    }

    const uniqueIds = [...new Set<string>(listingIds)];
    const metrics: Record<string, ReturnType<typeof getCommunityListingSocialSummary>> = {};

    await Promise.all(
      uniqueIds.map(async (listingId) => {
        const state = await readCommunityListingSocialState(listingId);
        metrics[listingId] = getCommunityListingSocialSummary(state, visitorId);
      })
    );

    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudieron cargar las métricas sociales de anuncios' },
      { status: 500 }
    );
  }
}

