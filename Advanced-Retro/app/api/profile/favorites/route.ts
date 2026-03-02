import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getFavoriteProductsForUser,
  normalizeFavoritesVisibility,
  type FavoritesVisibility,
} from '@/lib/profileFavorites';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
}

async function persistFavoritesVisibility(options: {
  userId: string;
  visibility: FavoritesVisibility;
  currentMetadata: Record<string, unknown>;
}) {
  if (!supabaseAdmin) {
    throw new ApiError(503, 'Supabase not configured');
  }

  const nowIso = new Date().toISOString();
  const updateUsersRes = await supabaseAdmin
    .from('users')
    .update({
      favorites_visibility: options.visibility,
      updated_at: nowIso,
    })
    .eq('id', options.userId);

  if (updateUsersRes.error) {
    const message = String(updateUsersRes.error.message || '').toLowerCase();
    if (!(message.includes('column') && message.includes('does not exist'))) {
      throw new Error(updateUsersRes.error.message || 'No se pudo guardar la privacidad de favoritos');
    }
  }

  const nextMetadata = {
    ...options.currentMetadata,
    favorites_visibility: options.visibility,
  };

  const authUpdateRes = await supabaseAdmin.auth.admin.updateUserById(options.userId, {
    user_metadata: nextMetadata,
  });

  if (authUpdateRes.error) {
    throw new Error(authUpdateRes.error.message || 'No se pudo sincronizar la privacidad de favoritos');
  }
}

export async function GET() {
  try {
    const { user, profile } = await requireUserContext();
    const favorites = await getFavoriteProductsForUser(user.id, 120);

    return NextResponse.json({
      favorites: {
        available: favorites.available,
        visibility: normalizeFavoritesVisibility((profile as any).favorites_visibility),
        items: favorites.items,
        total: favorites.total,
      },
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await requireUserContext();
    const body = await req.json().catch(() => null);
    const visibility = normalizeFavoritesVisibility((body as any)?.favorites_visibility);

    await persistFavoritesVisibility({
      userId: user.id,
      visibility,
      currentMetadata:
        user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {},
    });

    return NextResponse.json({
      success: true,
      favorites_visibility: visibility,
    });
  } catch (error: any) {
    return handleError(error);
  }
}
