import { NextResponse } from 'next/server';
import { ApiError, requireUserContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function handleError(error: any) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    const { user, profile } = await requireUserContext();
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile,
      },
    });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await requireUserContext();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);

    const allowedThemes = new Set(['neon-grid', 'sunset-glow', 'arcade-purple', 'mint-wave']);
    const sanitizeBadges = (input: unknown): string[] => {
      if (!Array.isArray(input)) return [];
      const values = input
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
        .map((value) => value.slice(0, 40));
      return [...new Set(values)].slice(0, 8);
    };

    const payload: Record<string, unknown> = {};
    if (typeof body?.name === 'string') {
      const nextName = body.name.trim().slice(0, 80);
      payload.name = nextName || 'Coleccionista';
    }
    if (typeof body?.avatar_url === 'string') {
      const nextAvatar = body.avatar_url.trim().slice(0, 500);
      payload.avatar_url = nextAvatar || null;
    }
    if (typeof body?.banner_url === 'string') {
      const nextBanner = body.banner_url.trim().slice(0, 500);
      payload.banner_url = nextBanner || null;
    }
    if (typeof body?.bio === 'string') {
      const nextBio = body.bio.trim().slice(0, 1200);
      payload.bio = nextBio || null;
    }
    if (typeof body?.tagline === 'string') {
      const nextTagline = body.tagline.trim().slice(0, 120);
      payload.tagline = nextTagline || null;
    }
    if (typeof body?.favorite_console === 'string') {
      const nextFavorite = body.favorite_console.trim().slice(0, 120);
      payload.favorite_console = nextFavorite || null;
    }
    if (typeof body?.profile_theme === 'string') {
      const nextTheme = body.profile_theme.trim();
      if (allowedThemes.has(nextTheme)) {
        payload.profile_theme = nextTheme;
      }
    }
    if (Array.isArray(body?.badges)) payload.badges = sanitizeBadges(body.badges);

    const hasUserField = Object.keys(payload).length > 0;
    if (!hasUserField) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    payload.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', user.id)
      .select('id,email,role,name,avatar_url,banner_url,bio,tagline,favorite_console,profile_theme,badges,is_verified_seller,created_at,updated_at')
      .single();

    if (updateError || !updated) {
      const message = updateError?.message || 'Could not update profile';
      if (message.toLowerCase().includes('column')) {
        return NextResponse.json(
          {
            error:
              'Faltan columnas de personalización. Ejecuta SQL: database/admin_chat_seller_features.sql y database/profile_customization_upgrade.sql',
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    return handleError(error);
  }
}
