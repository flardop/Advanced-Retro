import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  addCommunityListingComment,
  getCommunityListingSocialSummary,
  readCommunityListingSocialState,
  toggleCommunityListingLike,
  trackCommunityListingVisit,
  writeCommunityListingSocialState,
} from '@/lib/communityListingSocial';
import { normalizeVisitorId, toVisitorStorageKey } from '@/lib/productSocialStorage';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getOptionalAuthUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function resolveVisitorId(raw: unknown, authUserId?: string): string | null {
  if (authUserId) return `auth-${authUserId}`;
  return normalizeVisitorId(raw);
}

function guessAuthorNameFromAuth(user: any): string {
  const meta = user?.user_metadata || {};
  const candidates = [
    meta.full_name,
    meta.name,
    meta.user_name,
    meta.preferred_username,
    typeof user?.email === 'string' ? user.email.split('@')[0] : '',
  ];
  for (const item of candidates) {
    const value = typeof item === 'string' ? item.trim() : '';
    if (value) return value.slice(0, 60);
  }
  return 'Coleccionista';
}

async function loadAuthorProfile(userId: string) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('users')
    .select('name,avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return data || null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listingId = String(params?.id || '').trim();
    if (!listingId) return badRequest('Listing id requerido');

    const user = await getOptionalAuthUser();
    const visitorId = resolveVisitorId(req.nextUrl.searchParams.get('visitorId'), user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;

    const state = await readCommunityListingSocialState(listingId);

    return NextResponse.json({
      success: true,
      listingId,
      canComment: Boolean(user?.id),
      summary: getCommunityListingSocialSummary(state, visitorKey),
      comments: state.comments,
      updatedAt: state.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo cargar la actividad social del anuncio' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listingId = String(params?.id || '').trim();
    if (!listingId) return badRequest('Listing id requerido');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Payload inválido');

    const action = String((body as any).action || '').trim();
    if (!action) return badRequest('action es requerido');

    const user = await getOptionalAuthUser();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const rl = checkRateLimit({
      key: `community-listing-social:${listingId}:${action}:${user?.id || ip}`,
      maxRequests: action === 'visit' ? 120 : action === 'toggle_like' ? 40 : 15,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas acciones en poco tiempo. Inténtalo de nuevo en 1 minuto.' },
        { status: 429 }
      );
    }

    const visitorId = resolveVisitorId((body as any).visitorId, user?.id);
    const visitorKey = visitorId ? toVisitorStorageKey(visitorId) : null;
    const state = await readCommunityListingSocialState(listingId);

    if (action === 'visit') {
      if (!visitorKey) return badRequest('visitorId requerido');
      trackCommunityListingVisit(state, visitorKey);
      await writeCommunityListingSocialState(listingId, state);
      return NextResponse.json({
        success: true,
        summary: getCommunityListingSocialSummary(state, visitorKey),
      });
    }

    if (action === 'toggle_like') {
      if (!visitorKey) return badRequest('visitorId requerido');
      const liked = toggleCommunityListingLike(state, visitorKey);
      await writeCommunityListingSocialState(listingId, state);
      return NextResponse.json({
        success: true,
        liked,
        summary: getCommunityListingSocialSummary(state, visitorKey),
      });
    }

    if (action === 'add_comment') {
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Debes iniciar sesión para comentar anuncios de comunidad' },
          { status: 401 }
        );
      }
      if (!visitorKey) {
        return NextResponse.json({ error: 'No se pudo validar tu sesión' }, { status: 401 });
      }

      const rawComment = typeof (body as any).comment === 'string' ? (body as any).comment.trim() : '';
      if (rawComment.length < 2) return badRequest('El comentario debe tener al menos 2 caracteres');
      if (rawComment.length > 1200) return badRequest('El comentario no puede superar 1200 caracteres');

      const duplicate = state.comments.find(
        (item) => item.visitorId === visitorKey && item.comment === rawComment
      );
      if (duplicate) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          comment: duplicate,
          comments: state.comments,
          summary: getCommunityListingSocialSummary(state, visitorKey),
        });
      }

      const profile = await loadAuthorProfile(user.id);
      const authorName =
        typeof profile?.name === 'string' && profile.name.trim()
          ? profile.name.trim().slice(0, 60)
          : guessAuthorNameFromAuth(user);
      const authorAvatarUrl =
        typeof profile?.avatar_url === 'string' && profile.avatar_url.trim()
          ? profile.avatar_url.trim()
          : null;

      const comment = addCommunityListingComment(state, {
        visitorId: visitorKey,
        userId: user.id,
        authorName,
        authorAvatarUrl,
        comment: rawComment,
      });
      await writeCommunityListingSocialState(listingId, state);

      return NextResponse.json({
        success: true,
        comment,
        comments: state.comments,
        summary: getCommunityListingSocialSummary(state, visitorKey),
      });
    }

    return badRequest('Acción no soportada');
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo actualizar la actividad social del anuncio' },
      { status: 500 }
    );
  }
}

